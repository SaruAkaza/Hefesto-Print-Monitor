import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_PATH = path.join(DATA_DIR, 'hefesto.db');

let db = null;

// Garante que os diretórios existam
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

export function initDatabase() {
  if (db) return db;

  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');

  createSchema();
  migrateFromJsonIfNeeded();
  return db;
}

export function getDb() {
  if (!db) return initDatabase();
  return db;
}

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS printers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ip TEXT NOT NULL UNIQUE,
      location TEXT,
      unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
      unit_name TEXT,
      community TEXT DEFAULT 'public',
      initial_page_count INTEGER DEFAULT 0,
      hefesto_activated_at TEXT,
      installed_at TEXT,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_printers_unit ON printers(unit_id);
    CREATE INDEX IF NOT EXISTS idx_printers_ip ON printers(ip);

    CREATE TABLE IF NOT EXISTS printer_status_cache (
      printer_id TEXT PRIMARY KEY REFERENCES printers(id) ON DELETE CASCADE,
      online INTEGER DEFAULT 0,
      status_code INTEGER DEFAULT 0,
      status_description TEXT,
      page_count INTEGER DEFAULT 0,
      model TEXT,
      serial_number TEXT,
      supplies_json TEXT,
      trays_json TEXT,
      cached_at TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_recharges (
      id TEXT PRIMARY KEY,
      printer_id TEXT REFERENCES printers(id) ON DELETE CASCADE,
      supply_name TEXT NOT NULL,
      supply_type TEXT,
      baseline_level REAL NOT NULL,
      target_level REAL NOT NULL,
      consecutive_cycles INTEGER DEFAULT 1,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pending_recharges_printer ON pending_recharges(printer_id);

    CREATE TABLE IF NOT EXISTS recharges (
      id TEXT PRIMARY KEY,
      printer_id TEXT,
      printer_name TEXT,
      ip TEXT,
      unit_name TEXT,
      location TEXT,
      supply_name TEXT NOT NULL,
      supply_type TEXT,
      previous_level REAL,
      new_level REAL,
      page_count INTEGER,
      pages_since_last_recharge INTEGER DEFAULT 0,
      source TEXT DEFAULT 'auto',
      is_full_recharge INTEGER DEFAULT 1,
      status_tag TEXT,
      technician TEXT,
      notes TEXT,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_recharges_printer ON recharges(printer_id);
    CREATE INDEX IF NOT EXISTS idx_recharges_timestamp ON recharges(timestamp);

    CREATE TABLE IF NOT EXISTS page_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_page_count INTEGER,
      end_page_count INTEGER,
      supplies_json TEXT,
      last_updated_at TEXT,
      UNIQUE(printer_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_page_history_printer_date ON page_history(printer_id, date);

    CREATE TABLE IF NOT EXISTS telemetry_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      ip TEXT,
      name TEXT,
      unit_name TEXT,
      page_count INTEGER,
      supplies_json TEXT,
      recorded_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_telemetry_printer_rec ON telemetry_snapshots(printer_id, recorded_at);

    -- Vistas (Views) com rótulos amigáveis em português para navegação visual no DB Browser:
    DROP VIEW IF EXISTS Vista_Impressoras_e_Contadores;
    CREATE VIEW Vista_Impressoras_e_Contadores AS
    SELECT 
      p.name AS "Nome da Impressora",
      p.ip AS "Endereço IP",
      p.unit_name AS "Unidade / Filial",
      p.location AS "Setor / Consultório",
      p.initial_page_count AS "Páginas Iniciais (Marco Zero Hefesto)",
      COALESCE(c.page_count, p.initial_page_count) AS "Contador Vitalício Atual",
      (COALESCE(c.page_count, p.initial_page_count) - p.initial_page_count) AS "Páginas Rodadas Sob Gestão",
      CASE WHEN c.online = 1 THEN '🟢 ONLINE' ELSE '🔴 OFFLINE' END AS "Status de Conexão",
      p.hefesto_activated_at AS "Data Início no Hefesto",
      p.installed_at AS "Data Instalação Física"
    FROM printers p
    LEFT JOIN printer_status_cache c ON p.id = c.printer_id
    ORDER BY p.unit_name, p.name;

    DROP VIEW IF EXISTS Vista_Historico_Recargas;
    CREATE VIEW Vista_Historico_Recargas AS
    SELECT 
      r.printer_name AS "Impressora",
      r.unit_name AS "Unidade / Filial",
      r.location AS "Setor / Sala",
      r.supply_name AS "Suprimento Trocado",
      r.previous_level || '%' AS "Nível Antes",
      r.new_level || '%' AS "Nível Depois",
      (r.new_level - r.previous_level) || '%' AS "Salto de Nível",
      r.pages_since_last_recharge AS "Páginas Rodadas no Ciclo",
      r.status_tag AS "Tipo de Recarga (Oficial vs Provisória)",
      r.technician AS "Origem / Técnico",
      r.timestamp AS "Data e Hora da Troca"
    FROM recharges r
    ORDER BY r.timestamp DESC;

    DROP VIEW IF EXISTS Vista_Contadores_Diarios;
    DROP VIEW IF EXISTS Vista_Historico_Diario_Por_Data;
    CREATE VIEW Vista_Historico_Diario_Por_Data AS
    SELECT 
      strftime('%d/%m/%Y', h.date) AS "📅 Data do Registro (Dia a Dia)",
      p.name AS "Nome da Impressora",
      p.unit_name AS "Unidade / Filial",
      p.location AS "Setor / Consultório",
      CASE 
        WHEN h.end_page_count >= h.start_page_count THEN (h.end_page_count - h.start_page_count)
        ELSE 0 
      END AS "Páginas Impressas Nesta Data",
      h.start_page_count AS "Contador Início do Dia",
      h.end_page_count AS "Contador Fim do Dia"
    FROM page_history h
    JOIN printers p ON h.printer_id = p.id
    ORDER BY h.date DESC, p.unit_name, p.name;
  `);
}

function migrateFromJsonIfNeeded() {
  const countRow = db.prepare('SELECT COUNT(*) AS total FROM printers').get();
  if (countRow && countRow.total > 0) {
    return; // Já existem dados no SQLite
  }

  const printersJsonPath = path.join(DATA_DIR, 'printers.json');
  if (!fs.existsSync(printersJsonPath)) {
    return;
  }

  console.log('\x1b[36m%s\x1b[0m', '[SQLite] Nova base detectada. Iniciando migração automática de dados JSON -> SQLite...');

  try {
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupSubdir = path.join(BACKUPS_DIR, `json_pre_sqlite_${timestampStr}`);
    fs.mkdirSync(backupSubdir, { recursive: true });

    db.exec('BEGIN TRANSACTION');

    // 1. Unidades
    const unitsPath = path.join(DATA_DIR, 'units.json');
    if (fs.existsSync(unitsPath)) {
      fs.copyFileSync(unitsPath, path.join(backupSubdir, 'units.json'));
      const units = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));
      const insertUnit = db.prepare('INSERT INTO units (id, name, description, created_at) VALUES (?, ?, ?, ?)');
      for (const u of units) {
        insertUnit.run(u.id, u.name, u.description || '', u.createdAt || new Date().toISOString());
      }
      console.log(`[SQLite] Migradas ${units.length} unidades.`);
    }

    // 2. Impressoras
    fs.copyFileSync(printersJsonPath, path.join(backupSubdir, 'printers.json'));
    const printers = JSON.parse(fs.readFileSync(printersJsonPath, 'utf8'));
    const insertPrinter = db.prepare(`
      INSERT INTO printers (id, name, ip, location, unit_id, unit_name, community, initial_page_count, hefesto_activated_at, installed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of printers) {
      insertPrinter.run(
        p.id,
        p.name,
        p.ip,
        p.location || '',
        p.unitId || null,
        p.unitName || 'Sem Unidade',
        p.community || 'public',
        p.initialPageCount || 0,
        p.hefestoActivatedAt || p.createdAt || new Date().toISOString(),
        p.installedAt || null,
        p.createdAt || new Date().toISOString(),
        new Date().toISOString()
      );
    }
    console.log(`[SQLite] Migradas ${printers.length} impressoras.`);

    // 3. Recargas
    const rechargesPath = path.join(DATA_DIR, 'recharges.json');
    if (fs.existsSync(rechargesPath)) {
      fs.copyFileSync(rechargesPath, path.join(backupSubdir, 'recharges.json'));
      try {
        const recharges = JSON.parse(fs.readFileSync(rechargesPath, 'utf8'));
        const insertRecharge = db.prepare(`
          INSERT INTO recharges (id, printer_id, printer_name, ip, unit_name, location, supply_name, supply_type, previous_level, new_level, page_count, pages_since_last_recharge, source, is_full_recharge, status_tag, technician, notes, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const r of recharges) {
          insertRecharge.run(
            r.id,
            r.printerId || null,
            r.printerName || '',
            r.ip || '',
            r.unitName || '',
            r.location || '',
            r.supplyName || 'Toner',
            r.supplyType || 'toner',
            r.previousLevel || 0,
            r.newLevel || 0,
            r.pageCount || 0,
            r.pagesSinceLastRecharge || 0,
            r.source || 'auto',
            r.isFullRecharge ? 1 : 0,
            r.statusTag || '',
            r.technician || '',
            r.notes || '',
            r.timestamp || new Date().toISOString()
          );
        }
        console.log(`[SQLite] Migradas ${recharges.length} recargas históricas.`);
      } catch (e) {
        console.warn('[SQLite] Aviso ao migrar recharges.json:', e.message);
      }
    }

    // 4. Histórico diário de páginas
    const pageHistoryPath = path.join(DATA_DIR, 'page_history.json');
    if (fs.existsSync(pageHistoryPath)) {
      fs.copyFileSync(pageHistoryPath, path.join(backupSubdir, 'page_history.json'));
      try {
        const pageHistory = JSON.parse(fs.readFileSync(pageHistoryPath, 'utf8'));
        const insertPage = db.prepare(`
          INSERT OR IGNORE INTO page_history (printer_id, date, start_page_count, end_page_count, supplies_json, last_updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const ph of pageHistory) {
          insertPage.run(
            ph.printerId,
            ph.date,
            ph.startPageCount || 0,
            ph.endPageCount || ph.startPageCount || 0,
            JSON.stringify(ph.supplies || []),
            ph.lastUpdatedAt || new Date().toISOString()
          );
        }
        console.log(`[SQLite] Migrados ${pageHistory.length} registros diários de contadores.`);
      } catch (e) {
        console.warn('[SQLite] Aviso ao migrar page_history.json:', e.message);
      }
    }

    // 5. Histórico de telemetria
    const telemetryPath = path.join(DATA_DIR, 'telemetry_history.json');
    if (fs.existsSync(telemetryPath)) {
      fs.copyFileSync(telemetryPath, path.join(backupSubdir, 'telemetry_history.json'));
      try {
        const telemetry = JSON.parse(fs.readFileSync(telemetryPath, 'utf8'));
        const insertTelem = db.prepare(`
          INSERT INTO telemetry_snapshots (printer_id, ip, name, unit_name, page_count, supplies_json, recorded_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const t of telemetry) {
          insertTelem.run(
            t.printerId,
            t.ip || '',
            t.name || '',
            t.unitName || '',
            t.pageCount || 0,
            JSON.stringify(t.supplies || []),
            t.recordedAt || new Date().toISOString()
          );
        }
        console.log(`[SQLite] Migrados ${telemetry.length} snapshots de telemetria.`);
      } catch (e) {
        console.warn('[SQLite] Aviso ao migrar telemetry_history.json:', e.message);
      }
    }

    db.exec('COMMIT');
    console.log('\x1b[32m%s\x1b[0m', `[SQLite] ✅ Migração concluída com sucesso! Backup dos JSONs salvo em: ${backupSubdir}`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('\x1b[31m%s\x1b[0m', '[SQLite] Falha crítica na migração JSON -> SQLite:', err);
    throw err;
  }
}

// ============================================================================
// OPERAÇÕES: UNIDADES
// ============================================================================
export function getUnits() {
  const rows = getDb().prepare('SELECT * FROM units ORDER BY name ASC').all();
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    createdAt: r.created_at
  }));
}

export function getUnitById(id) {
  const r = getDb().prepare('SELECT * FROM units WHERE id = ?').get(id);
  if (!r) return null;
  return { id: r.id, name: r.name, description: r.description, createdAt: r.created_at };
}

export function saveUnit(unit) {
  const existing = getUnitById(unit.id);
  if (existing) {
    getDb().prepare('UPDATE units SET name = ?, description = ? WHERE id = ?')
      .run(unit.name, unit.description || '', unit.id);
  } else {
    getDb().prepare('INSERT INTO units (id, name, description, created_at) VALUES (?, ?, ?, ?)')
      .run(unit.id, unit.name, unit.description || '', unit.createdAt || new Date().toISOString());
  }
  return getUnitById(unit.id);
}

export function deleteUnit(id) {
  getDb().prepare('DELETE FROM units WHERE id = ?').run(id);
}

// ============================================================================
// OPERAÇÕES: IMPRESSORAS
// ============================================================================
export function getPrinters() {
  const rows = getDb().prepare('SELECT * FROM printers ORDER BY location ASC, name ASC').all();
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    ip: r.ip,
    location: r.location,
    unitId: r.unit_id,
    unitName: r.unit_name,
    community: r.community,
    initialPageCount: r.initial_page_count,
    hefestoActivatedAt: r.hefesto_activated_at,
    installedAt: r.installed_at,
    createdAt: r.created_at
  }));
}

export function getPrinterById(id) {
  const r = getDb().prepare('SELECT * FROM printers WHERE id = ?').get(id);
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    ip: r.ip,
    location: r.location,
    unitId: r.unit_id,
    unitName: r.unit_name,
    community: r.community,
    initialPageCount: r.initial_page_count,
    hefestoActivatedAt: r.hefesto_activated_at,
    installedAt: r.installed_at,
    createdAt: r.created_at
  };
}

export function getPrinterByIp(ip) {
  const r = getDb().prepare('SELECT * FROM printers WHERE ip = ?').get(ip);
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    ip: r.ip,
    location: r.location,
    unitId: r.unit_id,
    unitName: r.unit_name,
    community: r.community,
    initialPageCount: r.initial_page_count,
    hefestoActivatedAt: r.hefesto_activated_at,
    installedAt: r.installed_at,
    createdAt: r.created_at
  };
}

export function savePrinter(printer) {
  const existing = getPrinterById(printer.id);
  const now = new Date().toISOString();
  if (existing) {
    getDb().prepare(`
      UPDATE printers SET
        name = ?,
        ip = ?,
        location = ?,
        unit_id = ?,
        unit_name = ?,
        community = ?,
        initial_page_count = ?,
        installed_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      printer.name,
      printer.ip,
      printer.location !== undefined ? printer.location : existing.location,
      printer.unitId !== undefined ? printer.unitId : existing.unitId,
      printer.unitName !== undefined ? printer.unitName : existing.unitName,
      printer.community !== undefined ? printer.community : existing.community,
      printer.initialPageCount !== undefined ? printer.initialPageCount : existing.initialPageCount,
      printer.installedAt !== undefined ? printer.installedAt : existing.installedAt,
      now,
      printer.id
    );
  } else {
    getDb().prepare(`
      INSERT INTO printers (id, name, ip, location, unit_id, unit_name, community, initial_page_count, hefesto_activated_at, installed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      printer.id,
      printer.name,
      printer.ip,
      printer.location || '',
      printer.unitId || null,
      printer.unitName || 'Sem Unidade',
      printer.community || 'public',
      printer.initialPageCount || 0,
      printer.hefestoActivatedAt || now,
      printer.installedAt || null,
      printer.createdAt || now,
      now
    );
  }
  return getPrinterById(printer.id);
}

export function deletePrinter(id) {
  getDb().prepare('DELETE FROM printers WHERE id = ?').run(id);
}

// ============================================================================
// OPERAÇÕES: CACHE PERSISTIDO DE STATUS (Tolerante a reinicializações)
// ============================================================================
export function getAllCachedStatuses() {
  const rows = getDb().prepare('SELECT * FROM printer_status_cache').all();
  const map = new Map();
  for (const r of rows) {
    map.set(r.printer_id, {
      id: r.printer_id,
      online: Boolean(r.online),
      info: {
        model: r.model,
        serialNumber: r.serial_number,
        pageCount: r.page_count
      },
      status: {
        code: r.status_code,
        description: r.status_description
      },
      supplies: r.supplies_json ? JSON.parse(r.supplies_json) : [],
      trays: r.trays_json ? JSON.parse(r.trays_json) : [],
      cachedAt: r.cached_at
    });
  }
  return map;
}

export function getCachedStatus(printerId) {
  const r = getDb().prepare('SELECT * FROM printer_status_cache WHERE printer_id = ?').get(printerId);
  if (!r) return null;
  return {
    id: r.printer_id,
    online: Boolean(r.online),
    info: {
      model: r.model,
      serialNumber: r.serial_number,
      pageCount: r.page_count
    },
    status: {
      code: r.status_code,
      description: r.status_description
    },
    supplies: r.supplies_json ? JSON.parse(r.supplies_json) : [],
    trays: r.trays_json ? JSON.parse(r.trays_json) : [],
    cachedAt: r.cached_at
  };
}

export function updateCachedStatus(printerId, data) {
  const now = new Date().toISOString();
  const info = data.info || {};
  const status = data.status || {};
  const suppliesJson = JSON.stringify(data.supplies || []);
  const traysJson = JSON.stringify(data.trays || []);

  getDb().prepare(`
    INSERT INTO printer_status_cache (printer_id, online, status_code, status_description, page_count, model, serial_number, supplies_json, trays_json, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(printer_id) DO UPDATE SET
      online = excluded.online,
      status_code = excluded.status_code,
      status_description = excluded.status_description,
      page_count = excluded.page_count,
      model = excluded.model,
      serial_number = excluded.serial_number,
      supplies_json = excluded.supplies_json,
      trays_json = excluded.trays_json,
      cached_at = excluded.cached_at
  `).run(
    printerId,
    data.online ? 1 : 0,
    status.code || 0,
    status.description || '',
    Number(info.pageCount) || 0,
    info.model || '',
    info.serialNumber || '',
    suppliesJson,
    traysJson,
    now
  );
}

// ============================================================================
// OPERAÇÕES: CONFIRMAÇÃO DE RECARGAS PENDENTES (PERSISTIDAS NO BANCO)
// ============================================================================
export function getPendingRecharge(id) {
  const r = getDb().prepare('SELECT * FROM pending_recharges WHERE id = ?').get(id);
  if (!r) return null;
  return {
    id: r.id,
    printerId: r.printer_id,
    supplyName: r.supply_name,
    supplyType: r.supply_type,
    baselineLevel: r.baseline_level,
    targetLevel: r.target_level,
    consecutiveCycles: r.consecutive_cycles,
    firstSeen: r.first_seen,
    lastSeen: r.last_seen
  };
}

export function getAllPendingRecharges() {
  const rows = getDb().prepare('SELECT * FROM pending_recharges').all();
  return rows.map(r => ({
    id: r.id,
    printerId: r.printer_id,
    supplyName: r.supply_name,
    supplyType: r.supply_type,
    baselineLevel: r.baseline_level,
    targetLevel: r.target_level,
    consecutiveCycles: r.consecutive_cycles,
    firstSeen: r.first_seen,
    lastSeen: r.last_seen
  }));
}

export function savePendingRecharge(item) {
  getDb().prepare(`
    INSERT INTO pending_recharges (id, printer_id, supply_name, supply_type, baseline_level, target_level, consecutive_cycles, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      target_level = excluded.target_level,
      consecutive_cycles = excluded.consecutive_cycles,
      last_seen = excluded.last_seen
  `).run(
    item.id,
    item.printerId,
    item.supplyName,
    item.supplyType || 'toner',
    item.baselineLevel,
    item.targetLevel,
    item.consecutiveCycles || 1,
    item.firstSeen || new Date().toISOString(),
    item.lastSeen || new Date().toISOString()
  );
}

export function deletePendingRecharge(id) {
  getDb().prepare('DELETE FROM pending_recharges WHERE id = ?').run(id);
}

// ============================================================================
// OPERAÇÕES: RECARGAS & REPOSIÇÕES AUDITÁVEIS
// ============================================================================
export function getRecharges(filterOptions = {}) {
  const { printerId, unitName, fullOnly, timeRange, q } = filterOptions;
  let sql = 'SELECT * FROM recharges WHERE 1=1';
  const params = [];

  if (printerId) {
    sql += ' AND printer_id = ?';
    params.push(printerId);
  }
  if (unitName) {
    sql += ' AND LOWER(unit_name) = LOWER(?)';
    params.push(unitName);
  }
  if (fullOnly === true || fullOnly === 'true') {
    sql += ' AND is_full_recharge = 1';
  }

  if (timeRange && timeRange !== 'all') {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (timeRange === 'today') {
      sql += ' AND timestamp >= ?';
      params.push(today.toISOString());
    } else if (timeRange === '7days') {
      const cut7 = new Date(now - 7 * 86400000).toISOString();
      sql += ' AND timestamp >= ?';
      params.push(cut7);
    } else if (timeRange === '30days') {
      const cut30 = new Date(now - 30 * 86400000).toISOString();
      sql += ' AND timestamp >= ?';
      params.push(cut30);
    } else if (timeRange === 'month') {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      sql += ' AND timestamp >= ?';
      params.push(monthStart);
    }
  }

  if (q) {
    sql += ' AND (LOWER(printer_name) LIKE ? OR LOWER(location) LIKE ? OR LOWER(supply_name) LIKE ? OR LOWER(unit_name) LIKE ? OR LOWER(ip) LIKE ? OR LOWER(technician) LIKE ?)';
    const searchParam = `%${q.toLowerCase().trim()}%`;
    params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  sql += ' ORDER BY timestamp DESC';
  const rows = getDb().prepare(sql).all(...params);

  return rows.map(r => ({
    id: r.id,
    printerId: r.printer_id,
    printerName: r.printer_name,
    ip: r.ip,
    unitName: r.unit_name,
    location: r.location,
    supplyName: r.supply_name,
    supplyType: r.supply_type,
    previousLevel: r.previous_level,
    newLevel: r.new_level,
    pageCount: r.page_count,
    pagesSinceLastRecharge: r.pages_since_last_recharge,
    source: r.source,
    isFullRecharge: Boolean(r.is_full_recharge),
    statusTag: r.status_tag,
    technician: r.technician,
    notes: r.notes,
    timestamp: r.timestamp
  }));
}

export function recordRecharge(event) {
  const id = event.id || `rec-${Math.random().toString(36).substring(2, 10)}`;
  const now = event.timestamp || new Date().toISOString();
  const isFull = event.isFullRecharge !== undefined ? (event.isFullRecharge ? 1 : 0) : ((event.newLevel >= 95) ? 1 : 0);

  // Calcula páginas rodadas desde a última recarga caso não informado
  let pagesCycle = event.pagesSinceLastRecharge || 0;
  if (!pagesCycle && event.pageCount && event.printerId) {
    const last = getDb().prepare(`
      SELECT page_count FROM recharges 
      WHERE printer_id = ? AND page_count > 0 
      ORDER BY timestamp DESC LIMIT 1
    `).get(event.printerId);
    if (last && event.pageCount >= last.page_count) {
      pagesCycle = event.pageCount - last.page_count;
    }
  }

  getDb().prepare(`
    INSERT INTO recharges (id, printer_id, printer_name, ip, unit_name, location, supply_name, supply_type, previous_level, new_level, page_count, pages_since_last_recharge, source, is_full_recharge, status_tag, technician, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    event.printerId,
    event.printerName || '',
    event.ip || '',
    event.unitName || '',
    event.location || '',
    event.supplyName,
    event.supplyType || 'toner',
    event.previousLevel || 0,
    event.newLevel,
    event.pageCount || 0,
    pagesCycle,
    event.source || 'auto',
    isFull,
    event.statusTag || (isFull ? 'Recarga Oficial (Nova)' : 'Troca Provisória / Parcial'),
    event.technician || (event.source === 'auto' ? 'Sensor Automático SNMP' : 'Técnico'),
    event.notes || '',
    now
  );

  return {
    ...event,
    id,
    isFullRecharge: Boolean(isFull),
    pagesSinceLastRecharge: pagesCycle,
    timestamp: now
  };
}

export function deleteRecharge(id) {
  const res = getDb().prepare('DELETE FROM recharges WHERE id = ?').run(id);
  return res.changes > 0;
}

export function getRechargesSummary() {
  const printers = getPrinters();
  const summary = {};
  for (const p of printers) {
    summary[p.id] = {
      printerId: p.id,
      lastRecharge: null,
      lastFullRecharge: null,
      totalRecharges: 0
    };
  }

  const allRecharges = getDb().prepare('SELECT * FROM recharges ORDER BY timestamp ASC').all();
  for (const r of allRecharges) {
    const pid = r.printer_id;
    if (!summary[pid]) {
      summary[pid] = { printerId: pid, lastRecharge: null, lastFullRecharge: null, totalRecharges: 0 };
    }
    const item = {
      id: r.id,
      printerId: r.printer_id,
      printerName: r.printer_name,
      supplyName: r.supply_name,
      supplyType: r.supply_type,
      previousLevel: r.previous_level,
      newLevel: r.new_level,
      pageCount: r.page_count,
      pagesSinceLastRecharge: r.pages_since_last_recharge,
      source: r.source,
      isFullRecharge: Boolean(r.is_full_recharge),
      statusTag: r.status_tag,
      technician: r.technician,
      notes: r.notes,
      timestamp: r.timestamp
    };
    summary[pid].lastRecharge = item;
    if (item.isFullRecharge) {
      summary[pid].lastFullRecharge = item;
    }
    summary[pid].totalRecharges++;
  }

  return summary;
}

export function getRecentRechargeEvents(limit = 10) {
  const rows = getDb().prepare(`
    SELECT * FROM recharges 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(limit);

  return rows.map(r => ({
    id: r.id,
    printerId: r.printer_id,
    printerName: r.printer_name,
    ip: r.ip,
    unitName: r.unit_name,
    location: r.location,
    supplyName: r.supply_name,
    previousLevel: r.previous_level,
    newLevel: r.new_level,
    isFullRecharge: Boolean(r.is_full_recharge),
    technician: r.technician,
    timestamp: r.timestamp
  }));
}

// ============================================================================
// OPERAÇÕES: CONTADORES DE PÁGINAS & TELEMETRIA DIÁRIA
// ============================================================================
export function recordPageCount(printerId, pageCount, supplies = []) {
  if (!printerId || !pageCount || pageCount <= 0) return;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  const suppliesJson = JSON.stringify(supplies || []);

  getDb().prepare(`
    INSERT INTO page_history (printer_id, date, start_page_count, end_page_count, supplies_json, last_updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(printer_id, date) DO UPDATE SET
      end_page_count = excluded.end_page_count,
      supplies_json = excluded.supplies_json,
      last_updated_at = excluded.last_updated_at
  `).run(printerId, today, pageCount, pageCount, suppliesJson, now);
}

export function getAllPageHistory() {
  const rows = getDb().prepare('SELECT * FROM page_history ORDER BY date ASC').all();
  return rows.map(r => ({
    printerId: r.printer_id,
    date: r.date,
    startPageCount: r.start_page_count,
    endPageCount: r.end_page_count,
    supplies: r.supplies_json ? JSON.parse(r.supplies_json) : [],
    lastUpdatedAt: r.last_updated_at
  }));
}

export function recordTelemetrySnapshot({ printerId, ip, name, unitName, pageCount, supplies }) {
  if (!printerId) return;
  const now = new Date().toISOString();
  getDb().prepare(`
    INSERT INTO telemetry_snapshots (printer_id, ip, name, unit_name, page_count, supplies_json, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    printerId,
    ip || '',
    name || '',
    unitName || '',
    Number(pageCount) || 0,
    JSON.stringify(supplies || []),
    now
  );
}

export function getTelemetryHistory(limit = 500) {
  const rows = getDb().prepare('SELECT * FROM telemetry_snapshots ORDER BY recorded_at DESC LIMIT ?').all(limit);
  return rows.map(r => ({
    printerId: r.printer_id,
    ip: r.ip,
    name: r.name,
    unitName: r.unit_name,
    pageCount: r.page_count,
    supplies: r.supplies_json ? JSON.parse(r.supplies_json) : [],
    recordedAt: r.recorded_at
  }));
}

// ============================================================================
// OPERAÇÕES: BACKUP AUTOMÁTICO ROTATIVO (ÚLTIMOS 7 DIAS)
// ============================================================================
export function runDailyBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `hefesto_backup_${timestamp}.db`;
    const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

    // Usa VACUUM INTO nativo do SQLite (snapshot atômico sem pausar writes)
    const escapedPath = backupFilePath.replace(/'/g, "''");
    getDb().exec(`VACUUM INTO '${escapedPath}'`);
    console.log('\x1b[32m%s\x1b[0m', `[SQLite Backup] Snapshot gerado com sucesso: ${backupFileName}`);

    // Limpeza de backups com mais de 7 dias
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('hefesto_backup_') && f.endsWith('.db'))
      .sort();

    if (files.length > 7) {
      const toDelete = files.slice(0, files.length - 7);
      for (const f of toDelete) {
        try {
          fs.unlinkSync(path.join(BACKUPS_DIR, f));
          console.log(`[SQLite Backup] Removido backup rotativo antigo: ${f}`);
        } catch {}
      }
    }
    return backupFilePath;
  } catch (err) {
    console.error('[SQLite Backup] Erro ao realizar backup diário:', err);
    return null;
  }
}
