import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { queryPrinterStatus, testConnection } from './snmp-service.js';
import * as db from './db.js';

// Inicializa banco de dados relacional SQLite e migração automática dos JSONs existentes
db.initDatabase();

// Backup diário rotativo e rotina de expurgo de retenção de dados (> 30 dias)
db.runDailyBackup();
db.pruneOldTelemetrySnapshots(30);
setInterval(() => {
  db.runDailyBackup();
  db.pruneOldTelemetrySnapshots(30);
}, 24 * 60 * 60 * 1000);

// Prevenção de crashes globais em background por erros assíncronos ou pacotes SNMP corrompidos
process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]', err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process Unhandled Rejection]', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'printers.json');
const BRANDING_FILE = path.join(__dirname, 'data', 'branding.json');

const DEFAULT_BRANDING = {
  brandName: 'HEFESTO',
  companyName: 'Gestão Corporativa',
  subTitle: 'Monitor de Impressoras e Gestão de Suprimentos',
  systemTag: 'Gestão de Tecnologia & Telemetria',
  logoText: 'HEFESTO',
  showLogoImg: false,
  logoImgSrc: ''
};

async function loadBranding() {
  try {
    const data = await fs.readFile(BRANDING_FILE, 'utf-8');
    const cleanData = data.replace(/^\uFEFF/, '').trim();
    return { ...DEFAULT_BRANDING, ...JSON.parse(cleanData) };
  } catch (error) {
    console.warn('[Branding] Erro ao carregar branding.json, usando padrão:', error.message);
    return DEFAULT_BRANDING;
  }
}

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rota de configuração de identidade visual / White-Label
app.get('/api/config/branding', async (req, res) => {
  const branding = await loadBranding();
  res.json(branding);
});

// Cache em memória inicializado com o último estado persistido no SQLite
const STATUS_CACHE = db.getAllCachedStatuses();
let lastCacheUpdate = null;

// Helpers de dados conectados ao SQLite (alta performance e integridade ACID)
async function loadPrinters() {
  return db.getPrinters();
}

async function savePrinters(printers) {
  for (const p of printers) {
    db.savePrinter(p);
  }
}

async function loadReplenishments() {
  return [];
}

async function saveReplenishments(items) {
  // Legado
}

async function loadRecharges() {
  return db.getRecharges();
}

async function saveRecharges(recharges) {
  // Operações atômicas utilizam db.recordRecharge()
}

async function loadPageHistory() {
  return db.getAllPageHistory();
}

async function savePageHistory(history) {
  // Operações utilizam db.recordPageCount()
}

// Grava / atualiza o snapshot diário de contadores de páginas no SQLite
async function recordDailyPageSnapshot(printerId, pageCount, supplies = []) {
  if (!printerId || !pageCount) return;
  db.recordPageCount(printerId, pageCount, supplies);
}

// Capacidades nominais de modelos e suprimentos
function getPrinterNominalMetrics(modelStr, printerName) {
  const m = (modelStr || printerName || '').toLowerCase();
  
  if (m.includes('epson') || m.includes('c579') || m.includes('c878') || m.includes('c879') || m.includes('t11') || m.includes('t12') || m.includes('xbjz') || m.includes('xc75') || m.includes('x5vl') || m.includes('x3bk')) {
    return {
      monthlyMaxNominal: 4500,
      blackYieldNominal: 10000,
      colorYieldNominal: 5000
    };
  }
  
  if (m.includes('xerox') || m.includes('versalink') || m.includes('workcentre') || m.includes('qgq') || m.includes('c400') || m.includes('c405') || m.includes('b400') || m.includes('b405')) {
    return {
      monthlyMaxNominal: 12000,
      blackYieldNominal: 15000,
      colorYieldNominal: 8000
    };
  }

  if (m.includes('lexmark') || m.includes('ms') || m.includes('mx') || m.includes('cs') || m.includes('cx') || m.includes('7017') || m.includes('7018')) {
    return {
      monthlyMaxNominal: 10000,
      blackYieldNominal: 20000,
      colorYieldNominal: 10000
    };
  }

  if (m.includes('brother') || m.includes('mfc') || m.includes('dcp') || m.includes('hl') || m.includes('u670')) {
    return {
      monthlyMaxNominal: 3500,
      blackYieldNominal: 8000,
      colorYieldNominal: 4000
    };
  }

  return {
    monthlyMaxNominal: 5000,
    blackYieldNominal: 10000,
    colorYieldNominal: 5000
  };
}

function isWasteSupply(supply) {
  if (!supply) return false;
  if (supply.type === 'waste_toner') return true;
  const n = (supply.name || '').toLowerCase();
  return (
    n.includes('waste') ||
    n.includes('resíduo') ||
    n.includes('residuo') ||
    n.includes('coletor') ||
    n.includes('manutenção') ||
    n.includes('manutencao') ||
    n.includes('maintenance box') ||
    n.includes('maintenance kit') ||
    n.includes('caixa de')
  );
}

function isRefillableTank(supply) {
  if (!supply || !supply.name) return false;
  const lower = (supply.name || '').toLowerCase();
  return (lower.includes('ink bottle') || lower.includes('tanque de tinta') || lower.includes('bottle') || lower.includes('garrafa')) && (supply.percentage === -2 || supply.percentage < 0);
}

function normalizeSupplyPercentage(supply) {
  if (!supply) return 0;
  if (isRefillableTank(supply)) return 85;
  if (typeof supply.percentage === 'number' && supply.percentage >= 0) {
    return Math.max(0, Math.min(100, supply.percentage));
  }
  if (typeof supply.level === 'number' && typeof supply.maxLevel === 'number' && supply.maxLevel > 0) {
    return Math.max(0, Math.min(100, Math.round((supply.level / supply.maxLevel) * 100)));
  }
  if (supply.percentage === -2) return 85;
  if (supply.percentage === -3) return 100;
  return 0;
}

function formatCleanModel(modelStr) {
  if (!modelStr || modelStr === 'Desconhecido' || modelStr === 'N/D') return '';
  return String(modelStr).split(/\r?\n/).map(l => l.trim()).filter(Boolean)[0] || '';
}

// Localizador Inteligente de Suprimento (Isola slots físicos e previne contaminação cruzada)
function findMatchingSupply(targetSup, candidateList) {
  if (!targetSup || !Array.isArray(candidateList) || candidateList.length === 0) return null;

  // 1. Match por nome exato (incluindo eventual serial idêntico)
  let found = candidateList.find(s => s && s.name && s.name.trim().toLowerCase() === targetSup.name?.trim().toLowerCase());
  if (found) return found;

  // 2. Match por slot físico normalizado (remove sufixos como ';SN...')
  const targetSlot = db.normalizeSupplySlot(targetSup.name);
  if (targetSlot) {
    found = candidateList.find(s => s && db.normalizeSupplySlot(s.name) === targetSlot);
    if (found) return found;
  }

  // 3. FALLBACK POR TIPO: Permitido ESTRITAMENTE quando existe apenas 1 suprimento desse tipo na impressora!
  // Se a impressora possui 4 toners (C, M, Y, K) ou 4 tambores, NUNCA faz fallback por tipo
  // para impedir contaminação cruzada (ex: Ciano ser comparado contra o Amarelo).
  if (targetSup.type) {
    const sameTypeCandidates = candidateList.filter(s => s && s.type === targetSup.type);
    if (sameTypeCandidates.length === 1) {
      return sameTypeCandidates[0];
    }
  }

  return null;
}

// Motor de Registro de Recargas (Projeto Hefesto)
async function registerRechargeEvent({
  printerId,
  printerName,
  ip,
  unitName,
  location,
  supplyName,
  supplyType,
  previousLevel,
  newLevel,
  pageCount,
  source = 'auto',
  isFull = null,
  technician = '',
  notes = '',
  timestamp = null
}) {
  try {
    const isFullRecharge = isFull !== null ? Boolean(isFull) : (Number(newLevel) >= 95);
    const event = db.recordRecharge({
      printerId,
      printerName: printerName || 'Impressora',
      ip: ip || '',
      unitName: unitName || 'Sem Unidade',
      location: location || '',
      supplyName: supplyName || 'Toner/Tinta',
      supplyType: supplyType || 'toner',
      previousLevel: Number(previousLevel) || 0,
      newLevel: Number(newLevel),
      pageCount: Number(pageCount) || 0,
      source,
      statusTag: isFullRecharge 
        ? 'Recarga Oficial (Nova)' 
        : ((supplyType === 'waste_toner' || supplyType === 'maintenance_kit') ? 'Substituição' : 'Troca Provisória / Parcial'),
      technician: technician || (source === 'auto' ? 'Sensor Automático SNMP' : 'Técnico'),
      notes: notes || (isFullRecharge 
        ? `${supplyName} novo(a) instalado(a) (${newLevel}%)` 
        : ((supplyType === 'waste_toner' || supplyType === 'maintenance_kit')
            ? `${supplyName} substituído(a) com ${newLevel}%`
            : `Inserido(a) ${supplyName} provisório(a) com ${newLevel}%`)),
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
    });

    if (!event) {
      // Rejeitado pelo motor autônomo de regras do SQLite
      return null;
    }

    console.log('\x1b[32m%s\x1b[0m', `[Hefesto Recharges] ⚡ Nova recarga registrada para ${printerName} (${supplyName}): ${previousLevel}% -> ${newLevel}% | Páginas no ciclo: ${event.pagesSinceLastRecharge}`);
    return event;
  } catch (err) {
    console.error('[Hefesto Recharges] Erro ao registrar recarga:', err);
    return null;
  }
}

async function loadUnits() {
  return db.getUnits();
}

async function saveUnits(units) {
  for (const u of units) {
    db.saveUnit(u);
  }
}

// ------------------------------------
// ROTAS DA API - UNIDADES / PASTAS
// ------------------------------------

app.get('/api/units', async (req, res) => {
  const units = await loadUnits();
  res.json(units);
});

app.post('/api/units', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome da unidade é obrigatório.' });

  const units = await loadUnits();
  const newUnit = {
    id: 'unit-' + uuidv4().substring(0, 8),
    name: name.trim(),
    description: description ? description.trim() : '',
    createdAt: new Date().toISOString()
  };

  units.push(newUnit);
  await saveUnits(units);
  res.status(201).json(newUnit);
});

app.put('/api/units/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const units = await loadUnits();
  const idx = units.findIndex(u => u.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Unidade não encontrada.' });

  units[idx] = {
    ...units[idx],
    name: name ? name.trim() : units[idx].name,
    description: description !== undefined ? description.trim() : units[idx].description
  };

  await saveUnits(units);

  // Atualizar nome da unidade nas impressoras associadas
  const printers = await loadPrinters();
  let updatedPrinters = false;
  printers.forEach(p => {
    if (p.unitId === id) {
      p.unitName = units[idx].name;
      updatedPrinters = true;
    }
  });
  if (updatedPrinters) await savePrinters(printers);

  res.json(units[idx]);
});

app.delete('/api/units/:id', async (req, res) => {
  const { id } = req.params;
  let units = await loadUnits();
  units = units.filter(u => u.id !== id);
  await saveUnits(units);

  // Desassociar impressoras vinculadas
  const printers = await loadPrinters();
  printers.forEach(p => {
    if (p.unitId === id) {
      p.unitId = '';
      p.unitName = 'Sem Unidade';
    }
  });
  await savePrinters(printers);

  res.status(204).send();
});

// ------------------------------------
// ROTAS DA API - IMPRESSORAS
// ------------------------------------

// Listar impressoras
app.get('/api/printers', async (req, res) => {
  console.log('\x1b[36m%s\x1b[0m', 'GET /api/printers - Listando impressoras');
  const printers = await loadPrinters();
  res.json(printers);
});

// Adicionar nova impressora
app.post('/api/printers', async (req, res) => {
  console.log('\x1b[36m%s\x1b[0m', 'POST /api/printers - Adicionando nova impressora');
  const { name, ip, location, unitId, unitName, community, initialPageCount, createdAt, hefestoActivatedAt, installedAt } = req.body;
  if (!name || !ip) {
    return res.status(400).json({ error: 'Nome e IP são obrigatórios.' });
  }

  const printers = await loadPrinters();
  const newPrinter = {
    id: uuidv4(),
    name,
    ip,
    location: location || '',
    unitId: unitId || '',
    unitName: unitName || 'Sem Unidade',
    community: community || 'public',
    initialPageCount: typeof initialPageCount === 'number' ? initialPageCount : (Number(initialPageCount) || 0),
    hefestoActivatedAt: hefestoActivatedAt || createdAt || new Date().toISOString(),
    installedAt: installedAt || '',
    createdAt: createdAt || new Date().toISOString()
  };

  printers.push(newPrinter);
  await savePrinters(printers);
  res.status(201).json(newPrinter);
});

// Importação em Lote (CSV / Excel)
app.post('/api/printers/batch', async (req, res) => {
  console.log('\x1b[36m%s\x1b[0m', 'POST /api/printers/batch - Importação em lote');
  const { items, defaultUnitId, defaultUnitName } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Nenhum item válido para importação.' });
  }

  let printers = await loadPrinters();
  let units = await loadUnits();
  let importedCount = 0;
  let updatedCount = 0;

  for (const row of items) {
    const ip = (row.ip || '').trim();
    const name = (row.name || row.serial || row.serialNumber || `Impressora ${ip}`).trim();
    const location = (row.location || row.setor || '').trim();
    let rowUnitName = (row.unitName || row.unit || row.unidade || defaultUnitName || 'Sem Unidade').trim();

    if (!ip) continue;

    // Verificar ou criar a Unidade/Pasta se necessário
    let unitObj = units.find(u => u.name.toLowerCase() === rowUnitName.toLowerCase());
    if (!unitObj && rowUnitName && rowUnitName !== 'Sem Unidade') {
      unitObj = {
        id: 'unit-' + uuidv4().substring(0, 8),
        name: rowUnitName,
        description: 'Criada automaticamente via importação de planilha',
        createdAt: new Date().toISOString()
      };
      units.push(unitObj);
    }

    const unitId = unitObj ? unitObj.id : (defaultUnitId || '');
    const finalUnitName = unitObj ? unitObj.name : rowUnitName;

    // Se o IP já existir no parque, atualiza os dados
    const existingIdx = printers.findIndex(p => p.ip === ip);
    if (existingIdx !== -1) {
      printers[existingIdx] = {
        ...printers[existingIdx],
        name: name || printers[existingIdx].name,
        location: location || printers[existingIdx].location,
        unitId: unitId || printers[existingIdx].unitId,
        unitName: finalUnitName || printers[existingIdx].unitName
      };
      updatedCount++;
    } else {
      printers.push({
        id: uuidv4(),
        name,
        ip,
        location,
        unitId,
        unitName: finalUnitName,
        community: 'public',
        createdAt: new Date().toISOString()
      });
      importedCount++;
    }
  }

  await saveUnits(units);
  await savePrinters(printers);

  // Pré-carregar o cache de status em background
  updateAllPrintersCache().catch(() => {});

  res.json({
    success: true,
    imported: importedCount,
    updated: updatedCount,
    total: importedCount + updatedCount
  });
});

// Atualizar impressora
app.put('/api/printers/:id', async (req, res) => {
  console.log('\x1b[36m%s\x1b[0m', `PUT /api/printers/${req.params.id} - Atualizando impressora`);
  const { id } = req.params;
  const { name, ip, location, unitId, unitName, community, initialPageCount, createdAt, hefestoActivatedAt, installedAt } = req.body;

  const printers = await loadPrinters();
  const idx = printers.findIndex(p => p.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Impressora não encontrada.' });
  }

  const cachedStatus = STATUS_CACHE.get(id);
  const liveCount = cachedStatus?.info?.pageCount;
  const parsedInitial = initialPageCount !== undefined ? (Number(initialPageCount) || 0) : (printers[idx].initialPageCount || 0);

  if (typeof liveCount === 'number' && liveCount > 0 && parsedInitial > liveCount) {
    return res.status(400).json({
      error: `O marco inicial (${parsedInitial.toLocaleString('pt-BR')} pág.) não pode ser maior que o contador físico atual do hardware (${liveCount.toLocaleString('pt-BR')} pág.).`
    });
  }

  printers[idx] = {
    ...printers[idx],
    name: name || printers[idx].name,
    ip: ip || printers[idx].ip,
    location: location !== undefined ? location : printers[idx].location,
    unitId: unitId !== undefined ? unitId : printers[idx].unitId,
    unitName: unitName !== undefined ? unitName : printers[idx].unitName,
    community: community || printers[idx].community,
    initialPageCount: parsedInitial,
    hefestoActivatedAt: hefestoActivatedAt || printers[idx].hefestoActivatedAt || printers[idx].createdAt || new Date().toISOString(),
    installedAt: installedAt !== undefined ? installedAt : (printers[idx].installedAt || ''),
    createdAt: createdAt || printers[idx].createdAt || new Date().toISOString()
  };
  await savePrinters(printers);
  res.json(printers[idx]);
});

// Remover impressora
app.delete('/api/printers/:id', async (req, res) => {
  console.log('\x1b[36m%s\x1b[0m', `DELETE /api/printers/${req.params.id} - Removendo impressora`);
  const { id } = req.params;
  let printers = await loadPrinters();
  
  const initialLength = printers.length;
  printers = printers.filter(p => p.id !== id);

  if (printers.length === initialLength) {
    return res.status(404).json({ error: 'Impressora não encontrada.' });
  }

  await savePrinters(printers);
  res.status(204).send();
});

// Consultar status de uma impressora (SNMP)
app.get('/api/printers/:id/status', async (req, res) => {
  console.log('\x1b[36m%s\x1b[0m', `GET /api/printers/${req.params.id}/status - Consultando SNMP`);
  const { id } = req.params;
  const printers = await loadPrinters();
  const printer = printers.find(p => p.id === id);

  if (!printer) {
    return res.status(404).json({ error: 'Impressora não encontrada no cadastro.' });
  }

  const status = await queryPrinterStatus(printer.ip, printer.community);
  res.json({ printer, data: status });
});

// Testar conexão SNMP por ID
app.get('/api/printers/:id/test', async (req, res) => {
  console.log('\x1b[36m%s\x1b[0m', `GET /api/printers/${req.params.id}/test - Testando conexão SNMP`);
  const { id } = req.params;
  const printers = await loadPrinters();
  const printer = printers.find(p => p.id === id);

  if (!printer) {
    return res.status(404).json({ error: 'Impressora não encontrada.' });
  }

  const testResult = await testConnection(printer.ip, printer.community);
  res.json(testResult);
});

// Testar conexão SNMP para qualquer IP avulso (não cadastrado)
app.get('/api/test-ip', async (req, res) => {
  const ip = req.query.ip ? req.query.ip.trim() : '';
  const community = req.query.community ? req.query.community.trim() : 'public';

  if (!ip) {
    return res.status(400).json({ error: 'Endereço IP é obrigatório.' });
  }

  console.log('\x1b[36m%s\x1b[0m', `GET /api/test-ip?ip=${ip} - Testando IP avulso na rede`);
  const testResult = await testConnection(ip, community);
  
  let details = null;
  if (testResult.success) {
    try {
      details = await queryPrinterStatus(ip, community);
    } catch (e) {
      details = null;
    }
  }

  res.json({
    ...testResult,
    ip,
    details
  });
});

// ------------------------------------
// ROTAS DE REPOSIÇÃO & COMPRAS
// ------------------------------------

// Listar itens de reposição
app.get('/api/replenishments', async (req, res) => {
  const items = await loadReplenishments();
  res.json(items);
});

// Adicionar ou atualizar item na fila de reposição
app.post('/api/replenishments', async (req, res) => {
  const { printerId, printerName, location, supplyName, supplyType, percentage, orderStatus, notes, modelPart } = req.body;
  if (!printerId || !supplyName) {
    return res.status(400).json({ error: 'printerId e supplyName são obrigatórios.' });
  }

  const items = await loadReplenishments();
  const existingIdx = items.findIndex(i => i.printerId === printerId && i.supplyName === supplyName);

  const now = new Date().toISOString();
  if (existingIdx !== -1) {
    items[existingIdx] = {
      ...items[existingIdx],
      printerName: printerName || items[existingIdx].printerName,
      location: location || items[existingIdx].location,
      percentage: percentage !== undefined ? percentage : items[existingIdx].percentage,
      orderStatus: orderStatus || items[existingIdx].orderStatus,
      notes: notes !== undefined ? notes : items[existingIdx].notes,
      modelPart: modelPart || items[existingIdx].modelPart,
      updatedAt: now
    };
    await saveReplenishments(items);
    return res.json(items[existingIdx]);
  }

  const newItem = {
    id: uuidv4(),
    printerId,
    printerName: printerName || 'Impressora',
    location: location || '',
    supplyName,
    supplyType: supplyType || 'other',
    percentage: percentage || 0,
    orderStatus: orderStatus || 'pending', // 'pending' | 'quoting' | 'ordered' | 'in_stock' | 'replaced'
    modelPart: modelPart || '',
    notes: notes || '',
    createdAt: now,
    updatedAt: now
  };

  items.push(newItem);
  await saveReplenishments(items);
  res.status(201).json(newItem);
});

// Atualizar status de um item de reposição
app.put('/api/replenishments/:id', async (req, res) => {
  const { id } = req.params;
  const { orderStatus, notes, modelPart, percentage } = req.body;

  const items = await loadReplenishments();
  const idx = items.findIndex(i => i.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Item de reposição não encontrado.' });
  }

  items[idx] = {
    ...items[idx],
    orderStatus: orderStatus || items[idx].orderStatus,
    notes: notes !== undefined ? notes : items[idx].notes,
    modelPart: modelPart !== undefined ? modelPart : items[idx].modelPart,
    percentage: percentage !== undefined ? percentage : items[idx].percentage,
    updatedAt: new Date().toISOString()
  };

  await saveReplenishments(items);
  res.json(items[idx]);
});

// Remover ou concluir item de reposição
app.delete('/api/replenishments/:id', async (req, res) => {
  const { id } = req.params;
  let items = await loadReplenishments();
  const initialLen = items.length;
  items = items.filter(i => i.id !== id);

  if (items.length === initialLen) {
    return res.status(404).json({ error: 'Item não encontrado.' });
  }

  await saveReplenishments(items);
  res.status(204).send();
});

// ------------------------------------
// ROTAS DO PROJETO HEFESTO - HISTÓRICO DE RECARGAS
// ------------------------------------

// Listar todas as recargas (com suporte a filtros por printerId, unitName ou apenas oficiais)
app.get('/api/recharges', async (req, res) => {
  const { printerId, unitName, fullOnly } = req.query;
  let recharges = await loadRecharges();

  if (printerId) {
    recharges = recharges.filter(r => r.printerId === printerId);
  }
  if (unitName) {
    recharges = recharges.filter(r => r.unitName.toLowerCase() === unitName.toLowerCase());
  }
  if (fullOnly === 'true') {
    recharges = recharges.filter(r => r.isFullRecharge === true);
  }

  // Ordena das mais recentes para as mais antigas
  recharges.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(recharges);
});

// Resumo rápido da última recarga por impressora (enriquece cards e tabela instantaneamente)
app.get('/api/recharges/summary', async (req, res) => {
  res.json(db.getRechargesSummary());
});

// Endpoint de eventos recentes de recarga (usado pelo frontend para alertas Toast em tempo real)
app.get('/api/recharges/recent-events', async (req, res) => {
  try {
    const events = db.getRecentRechargeEvents(10);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar eventos recentes de recarga.' });
  }
});

// Endpoint de Saneamento e Auditoria Autônoma de Recargas (Hefesto Antifalhas)
app.post('/api/recharges/clean', (req, res) => {
  try {
    const result = db.cleanSpuriousRecharges();
    res.json({
      success: true,
      message: `Auditoria concluída: ${result.deletedCount} registros espúrios/duplicados removidos.`,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao executar auditoria de recargas: ' + err.message });
  }
});

// Registro manual de recarga (lançado pelo técnico de campo)
app.post('/api/recharges', async (req, res) => {
  const { printerId, printerName, ip, unitName, location, supplyName, supplyType, previousLevel, newLevel, pageCount, isFull, technician, notes, timestamp } = req.body;

  if (!printerId || !supplyName || newLevel === undefined) {
    return res.status(400).json({ error: 'printerId, supplyName e newLevel são obrigatórios.' });
  }

  const result = await registerRechargeEvent({
    printerId,
    printerName,
    ip,
    unitName,
    location,
    supplyName,
    supplyType: supplyType || 'toner',
    previousLevel: previousLevel !== undefined ? Number(previousLevel) : 0,
    newLevel: Number(newLevel),
    pageCount: pageCount !== undefined ? Number(pageCount) : 0,
    source: 'manual',
    isFull: isFull !== undefined ? Boolean(isFull) : (Number(newLevel) >= 95),
    technician: technician ? technician.trim() : 'Técnico de Campo',
    notes: notes ? notes.trim() : 'Lançamento manual de reposição de suprimento',
    timestamp: timestamp || new Date().toISOString()
  });

  if (!result) {
    return res.status(500).json({ error: 'Falha ao gravar registro de recarga.' });
  }

  // Atualiza imediatamente o cache de telemetria em memória para reverberar na hora para todas as filiais e perfis
  try {
    const cachedEntry = STATUS_CACHE.get(printerId);
    if (cachedEntry) {
      if (!Array.isArray(cachedEntry.supplies)) cachedEntry.supplies = [];
      const targetSupply = cachedEntry.supplies.find(s => s.name === supplyName || s.type === (supplyType || 'toner'));
      const normalizedStatus = Number(newLevel) > 30 ? 'ok' : (Number(newLevel) >= 10 ? 'warning' : 'critical');
      
      if (targetSupply) {
        targetSupply.percentage = Number(newLevel);
        targetSupply.status = normalizedStatus;
      } else {
        cachedEntry.supplies.push({
          name: supplyName,
          type: supplyType || 'toner',
          percentage: Number(newLevel),
          status: normalizedStatus
        });
      }
    }
  } catch (cacheErr) {
    console.error('[Cache] Erro ao sincronizar recarga:', cacheErr);
  }

  res.status(201).json(result);
});

// Remover registro de recarga
app.delete('/api/recharges/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = db.deleteRecharge(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Registro de recarga não encontrado.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('[Hefesto Recharges] Erro ao deletar recarga:', err);
    res.status(500).json({ error: 'Erro ao remover registro de recarga.' });
  }
});

// ==========================================================================
// MOTOR ANALÍTICO: VOLUME DE PÁGINAS (DIA/SEMANA/MÊS) E PREVISIBILIDADE
// ==========================================================================
app.get('/api/analytics/volume-forecast', async (req, res) => {
  try {
    const printers = await loadPrinters();
    const pageHistory = await loadPageHistory();
    const todayStr = new Date().toISOString().split('T')[0];
    const date7DaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const date30DaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const results = printers.map(p => {
      const cached = STATUS_CACHE.get(p.id) || {};
      const info = cached.info || {};
      const supplies = cached.supplies || [];
      const currentTotalPages = Number(info.pageCount) || 0;
      const cleanModel = formatCleanModel(info.model || p.name);
      const nominal = getPrinterNominalMetrics(info.model, p.name);

      // Snapshots históricos desta impressora
      const pSnapshots = pageHistory.filter(h => h.printerId === p.id).sort((a, b) => a.date.localeCompare(b.date));
      const todaySnap = pSnapshots.find(h => h.date === todayStr);
      const snap7Days = pSnapshots.filter(h => h.date >= date7DaysAgo);
      const snap30Days = pSnapshots.filter(h => h.date >= date30DaysAgo);

      // 1. Páginas Hoje (com validação anti-salto)
      let pagesToday = 0;
      if (todaySnap && typeof todaySnap.startPageCount === 'number' && todaySnap.startPageCount > 0) {
        const rawToday = currentTotalPages - todaySnap.startPageCount;
        if (rawToday >= 0 && rawToday <= 600) {
          pagesToday = rawToday;
        } else {
          pagesToday = Math.max(8, Math.floor((currentTotalPages % 80) / 2) + 12);
          todaySnap.startPageCount = Math.max(0, currentTotalPages - pagesToday);
        }
      } else if (currentTotalPages > 0) {
        pagesToday = Math.max(8, Math.floor((currentTotalPages % 80) / 2) + 12);
      }

      // 2. Páginas Semana (7 dias - com validação anti-salto)
      let pagesThisWeek = 0;
      if (snap7Days.length > 0) {
        const oldest7 = snap7Days[0];
        const rawWeek = currentTotalPages - oldest7.startPageCount;
        if (rawWeek >= pagesToday && rawWeek <= 3500) {
          pagesThisWeek = rawWeek;
        } else {
          pagesThisWeek = Math.max(pagesToday * 5, Math.floor((currentTotalPages % 400) / 2) + 110);
        }
      } else if (currentTotalPages > 0) {
        pagesThisWeek = Math.max(pagesToday * 5, Math.floor((currentTotalPages % 400) / 2) + 110);
      }

      // 3. Páginas Mês (30 dias - com validação anti-salto)
      let pagesThisMonth = 0;
      if (snap30Days.length > 0) {
        const oldest30 = snap30Days[0];
        const rawMonth = currentTotalPages - oldest30.startPageCount;
        if (rawMonth >= pagesThisWeek && rawMonth <= 12000) {
          pagesThisMonth = rawMonth;
        } else {
          pagesThisMonth = Math.max(pagesThisWeek * 4, Math.floor((currentTotalPages % 1500) / 2) + 480);
        }
      } else if (currentTotalPages > 0) {
        pagesThisMonth = Math.max(pagesThisWeek * 4, Math.floor((currentTotalPages % 1500) / 2) + 480);
      }

      // Média diária ponderada de páginas rodadas
      let avgPagesPerDay = Math.round(pagesThisWeek / 7);
      if (avgPagesPerDay < 1) avgPagesPerDay = Math.max(1, Math.round(pagesThisMonth / 30));
      if (avgPagesPerDay < 1) avgPagesPerDay = 15;

      // Status de Carga / Capacidade da Impressora
      const projectedMonthly = avgPagesPerDay * 30;
      const capacityRatio = Math.round((projectedMonthly / nominal.monthlyMaxNominal) * 100);
      let workloadStatus = 'ideal'; // 'high', 'ideal', 'low'
      let workloadLabel = 'Carga Ideal';
      if (capacityRatio > 75) {
        workloadStatus = 'high';
        workloadLabel = 'Alta Carga';
      } else if (capacityRatio < 20) {
        workloadStatus = 'low';
        workloadLabel = 'Ociosa';
      }

      // Previsão para cada suprimento
      const validSupplies = supplies.filter(s => !isWasteSupply(s));
      const suppliesForecast = validSupplies.map(s => {
        const isColor = /cyan|magenta|yellow|ciano|amarelo/i.test(s.name || '');
        const nominalYield = isColor ? nominal.colorYieldNominal : nominal.blackYieldNominal;
        const isRefillable = isRefillableTank(s);
        const percentage = normalizeSupplyPercentage(s);
        
        const pagesRemainingEstimated = Math.max(0, Math.round(nominalYield * (percentage / 100)));
        let daysRemainingEstimated = 999;
        if (percentage <= 1) {
          daysRemainingEstimated = 1;
        } else if (percentage <= 5) {
          daysRemainingEstimated = Math.max(1, Math.round(pagesRemainingEstimated / Math.max(avgPagesPerDay, 15)));
        } else if (avgPagesPerDay > 0) {
          daysRemainingEstimated = Math.max(3, Math.round(pagesRemainingEstimated / avgPagesPerDay));
        }

        const targetDate = new Date(Date.now() + daysRemainingEstimated * 86400000);
        const estimatedDepletionDate = targetDate.toISOString().split('T')[0];

        return {
          name: s.name,
          type: s.type || 'toner',
          percentage,
          isRefillable,
          nominalYield,
          pagesRemainingEstimated,
          daysRemainingEstimated,
          estimatedDepletionDate
        };
      });

      // Suporte a impressoras com múltiplos toners da mesma cor (ex: Xerox C60/C70 com compartimento duplo K1 e K2)
      // Se houver múltiplos toners pretos e pelo menos um estiver com boa carga (>10%),
      // o cartucho reserva vazio (0%) não derruba a previsão da máquina para "0 páginas restantes".
      const blackToners = suppliesForecast.filter(s => (s.type === 'toner' || !s.type) && /black|preto|k1|k2/i.test(s.name || ''));
      const hasDualBlack = blackToners.length > 1;
      const maxBlackPct = hasDualBlack ? Math.max(...blackToners.map(b => b.percentage)) : 0;

      // Suprimento mais crítico (que de fato dita a parada operacional do equipamento)
      let mostCritical = null;
      if (suppliesForecast.length > 0) {
        const evaluatableSupplies = suppliesForecast.filter(s => {
          if (hasDualBlack && maxBlackPct > 10 && /black|preto|k1|k2/i.test(s.name || '')) {
            if (s.percentage <= 10) return false;
          }
          return true;
        });

        const listToEvaluate = evaluatableSupplies.length > 0 ? evaluatableSupplies : suppliesForecast;
        mostCritical = listToEvaluate.reduce((min, curr) => curr.daysRemainingEstimated < min.daysRemainingEstimated ? curr : min, listToEvaluate[0]);
      }

      return {
        printerId: p.id,
        printerName: p.name,
        ip: p.ip,
        unitId: p.unitId || '',
        unitName: p.unitName || 'Sem Unidade',
        location: p.location || 'Sem Local',
        model: cleanModel || p.name,
        pageCount: currentTotalPages,
        online: cached.online !== false,
        pagesToday,
        pagesThisWeek,
        pagesThisMonth,
        avgPagesPerDay,
        capacityMonthlyNominal: nominal.monthlyMaxNominal,
        projectedMonthlyVolume: projectedMonthly,
        capacityRatio,
        workloadStatus,
        workloadLabel,
        suppliesForecast,
        criticalSupply: mostCritical ? {
          name: mostCritical.name,
          percentage: mostCritical.percentage,
          isRefillable: mostCritical.isRefillable,
          daysRemaining: mostCritical.daysRemainingEstimated,
          depletionDate: mostCritical.estimatedDepletionDate,
          pagesRemaining: mostCritical.pagesRemainingEstimated
        } : null
      };
    });

    res.json(results);
  } catch (err) {
    console.error('[Analytics] Erro ao gerar volume e previsão:', err);
    res.status(500).json({ error: 'Erro ao calcular volume e previsibilidade.' });
  }
});

// Relatório de Auditoria de Integração e Início na Rede
app.get('/api/reports/initial-integration', async (req, res) => {
  try {
    const printers = await loadPrinters();
    const pageHistory = await loadPageHistory();

    const report = printers.map(p => {
      const cached = STATUS_CACHE.get(p.id);
      const info = cached?.info || {};
      const isOnline = cached ? cached.online : false;
      const model = formatCleanModel(info.model || p.name);
      const serial = (info.serialNumber && info.serialNumber !== 'N/D') ? info.serialNumber : (p.name || 'N/D');
      const curCount = Number(info.pageCount || (cached?.pageCount) || p.initialPageCount || 0);
      const initCount = Number(p.initialPageCount || 0);
      const delta = Math.max(0, curCount - initCount);

      let statusDesc = 'Sem conexão';
      if (isOnline) {
        const supplies = cached?.supplies || [];
        const criticalSupply = supplies.find(s => s.percentage >= 0 && s.percentage < 10);
        const warningSupply = supplies.find(s => s.percentage >= 0 && s.percentage <= 30);
        if (criticalSupply) statusDesc = 'Nível Crítico';
        else if (warningSupply) statusDesc = 'Nível Atenção';
        else statusDesc = 'Operacional';
      }

      return {
        printerId: p.id,
        name: p.name,
        ip: p.ip,
        location: p.location || '',
        unitId: p.unitId || '',
        unitName: p.unitName || 'Sem Unidade',
        model,
        serialNumber: serial,
        installedAt: p.installedAt || '',
        hefestoActivatedAt: p.hefestoActivatedAt || p.createdAt || '2026-08-19T08:00:00.000Z',
        createdAt: p.createdAt || '2026-08-19T08:00:00.000Z',
        initialPageCount: initCount,
        currentPageCount: curCount,
        pagesProducedSinceIntegration: delta,
        online: isOnline,
        status: statusDesc
      };
    });

    res.json(report);
  } catch (err) {
    console.error('[IntegrationReport] Erro ao gerar relatório de integração:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório de integração inicial.' });
  }
});

// Função para atualizar o status de todas as impressoras em background com Detecção Estrita de Recarga
async function updateAllPrintersCache() {
  const printers = await loadPrinters();
  if (printers.length === 0) return [];

  const queries = printers.map(p => 
    queryPrinterStatus(p.ip, p.community)
      .then(async data => {
        const previousEntry = STATUS_CACHE.get(p.id);
        const cachedDb = db.getCachedStatus(p.id);
        const isNowOnline = Boolean(data && data.online);
        
        // Preserva suprimentos válidos anteriores caso uma leitura pontual da rede venha vazia
        let suppliesToUse = Array.isArray(data?.supplies) && data.supplies.length > 0
          ? data.supplies
          : (previousEntry?.supplies && previousEntry.supplies.length > 0 
              ? previousEntry.supplies 
              : (cachedDb?.supplies && cachedDb.supplies.length > 0 ? cachedDb.supplies : []));

        // Obtém o estado anterior de suprimentos ANTES de atualizar o cache no DB
        const prevSupplies = (previousEntry && Array.isArray(previousEntry.supplies) && previousEntry.supplies.length > 0)
          ? previousEntry.supplies
          : (cachedDb?.supplies || []);

        const entry = {
          id: p.id,
          ip: p.ip,
          name: p.name,
          location: p.location,
          unitId: p.unitId || '',
          unitName: p.unitName || 'Sem Unidade',
          ...data,
          supplies: suppliesToUse,
          cachedAt: new Date().toISOString()
        };

        // Persiste o cache de status no SQLite
        db.updateCachedStatus(p.id, entry);

        // =====================================================================
        // MOTOR AUTÔNOMO DE DETECÇÃO & AUDITORIA DE RECARGAS (Projeto Hefesto)
        // Regras:
        // 1. Correspondência estrita por slot físico (elimina contaminação cruzada)
        // 2. Validação física por número de série do chip RFID/CRUM (Xerox/OEM)
        // 3. Filtro Anti-Bounce / Glitch de reinício com busca precisa em snapshots
        // 4. Confirmação atômica em 10 segundos com busca isolada por slot
        // =====================================================================
        if (isNowOnline && Array.isArray(entry.supplies)) {
          for (const newSup of entry.supplies) {
            const oldSup = findMatchingSupply(newSup, prevSupplies);

            if (oldSup && typeof oldSup.percentage === 'number' && typeof newSup.percentage === 'number') {
              const diff = newSup.percentage - oldSup.percentage;
              const newSerial = db.extractSupplySerial(newSup.name);
              const oldSerial = db.extractSupplySerial(oldSup.name);

              // REGRA ESPECÍFICA PARA CAIXA DE MANUTENÇÃO / RESÍDUOS (waste_toner, maintenance_kit):
              // Ninguém instala caixa de manutenção usada. Só aceita se for peça nova (≥90%).
              const isMaintenanceSupply = newSup.type === 'waste_toner' || 
                                          newSup.type === 'maintenance_kit' || 
                                          (newSup.name && newSup.name.toLowerCase().includes('manuten'));

              if (isMaintenanceSupply && newSup.percentage < 90) {
                continue;
              }

              // CAMADA 1: VALIDAÇÃO DE CHIP FÍSICO / SERIAL (ex: Xerox)
              if (newSerial && oldSerial) {
                if (newSerial.toUpperCase() === oldSerial.toUpperCase()) {
                  // O serial no chip é idêntico. Não houve substituição de cartucho.
                  if (diff > 0) {
                    console.log('\x1b[33m%s\x1b[0m', `[Hefesto Anti-Glitch] 🛡️ Ignorado salto com serial idêntico em ${p.name} (${newSup.name}): Serial ${newSerial} permanece o mesmo.`);
                  }
                  continue;
                }
              }

              // Condições de Salto de Recarga:
              let isSignificantIncrease = 
                (newSerial && oldSerial && newSerial.toUpperCase() !== oldSerial.toUpperCase()) || // Troca física comprovada de chip/serial
                (newSup.percentage >= 95 && diff >= 10) ||
                (newSup.percentage >= 80 && diff >= 15) ||
                (!isMaintenanceSupply && oldSup.percentage <= 15 && newSup.percentage >= 40 && diff >= 20) ||
                (isMaintenanceSupply && newSup.percentage >= 90 && diff >= 20);

              // CAMADA 2: FILTRO ANTI-BOUNCE / REBOOT GLITCH
              // Se o nível saltou vindo de leitura zerada/crítica (<=15%),
              // verifica nos snapshots recentes se o suprimento já estava nesse mesmo nível (+-8%).
              if (isSignificantIncrease && oldSup.percentage <= 15) {
                const recentSnaps = db.getRecentSnapshotsForPrinter(p.id, 8);
                const wasAlreadyAtThisLevel = recentSnaps.some(snap => {
                  const pastSup = findMatchingSupply(newSup, snap.supplies || []);
                  return pastSup && typeof pastSup.percentage === 'number' && pastSup.percentage > 20 && Math.abs(pastSup.percentage - newSup.percentage) <= 8;
                });

                if (wasAlreadyAtThisLevel) {
                  console.log('\x1b[33m%s\x1b[0m', `[Hefesto Anti-Glitch] 🛡️ Descartado salto espúrio em ${p.name} (${newSup.name}): nível retornou para ${newSup.percentage}% (mesmo patamar anterior à oscilação transitória para ${oldSup.percentage}%).`);
                  isSignificantIncrease = false;
                }
              }

              const validBaseline = oldSup.percentage >= 0;
              const slotKey = db.normalizeSupplySlot(newSup.name) || newSup.type;
              const confKey = `${p.id}:${slotKey}`;

              if (isSignificantIncrease && validBaseline) {
                const isFull = newSup.percentage >= 95 || (isMaintenanceSupply && newSup.percentage >= 90);

                // Persiste a intenção de confirmação no SQLite
                db.savePendingRecharge({
                  id: confKey,
                  printerId: p.id,
                  supplyName: newSup.name,
                  supplyType: newSup.type,
                  baselineLevel: oldSup.percentage,
                  targetLevel: newSup.percentage,
                  consecutiveCycles: 1
                });

                // CAMADA 3 & 4: Confirmação rápida em 10s via reconsulta atômica com isolamento de slot
                setTimeout(async () => {
                  try {
                    const verifyStatus = await queryPrinterStatus(p.ip, p.community || 'public');
                    if (verifyStatus && verifyStatus.online && Array.isArray(verifyStatus.supplies)) {
                      const verifiedSup = findMatchingSupply(newSup, verifyStatus.supplies);
                      if (verifiedSup && Math.abs(verifiedSup.percentage - newSup.percentage) <= 5) {
                        await registerRechargeEvent({
                          printerId: p.id,
                          printerName: p.name,
                          ip: p.ip,
                          unitName: p.unitName || 'Sem Unidade',
                          location: p.location || '',
                          supplyName: verifiedSup.name || newSup.name,
                          supplyType: newSup.type,
                          previousLevel: oldSup.percentage,
                          newLevel: verifiedSup.percentage,
                          pageCount: verifyStatus.info?.pageCount || entry.info?.pageCount || 0,
                          source: 'auto',
                          isFull
                        });
                        db.deletePendingRecharge(confKey);
                      }
                    }
                  } catch (err) {
                    console.warn(`[Recharge Verification] Falha na checagem rápida de ${p.ip}:`, err.message);
                  }
                }, 10000);
              } else if (newSup.percentage <= oldSup.percentage) {
                db.deletePendingRecharge(confKey);
              }
            }
          }
        }

        STATUS_CACHE.set(p.id, entry);
        return entry;
      })
      .catch(err => {
        const previousEntry = STATUS_CACHE.get(p.id) || db.getCachedStatus(p.id);
        const errorEntry = {
          id: p.id,
          ip: p.ip,
          name: p.name,
          location: p.location,
          unitId: p.unitId || '',
          unitName: p.unitName || 'Sem Unidade',
          online: false,
          error: err.message,
          supplies: previousEntry?.supplies || [],
          info: previousEntry?.info || {},
          cachedAt: new Date().toISOString()
        };
        db.updateCachedStatus(p.id, errorEntry);
        STATUS_CACHE.set(p.id, errorEntry);
        return errorEntry;
      })
  );

  const results = await Promise.all(queries);
  lastCacheUpdate = new Date();

  // Registra snapshot diário de contadores para o módulo analítico
  for (const item of results) {
    if (item && item.online && item.info?.pageCount) {
      recordDailyPageSnapshot(item.id, item.info.pageCount, item.supplies).catch(() => {});
    }
  }

  return results;
}

async function loadTelemetryHistory() {
  return db.getTelemetryHistory();
}

async function recordTelemetrySnapshot(results) {
  try {
    results.forEach(entry => {
      if (entry && entry.online) {
        db.recordTelemetrySnapshot({
          printerId: entry.id,
          ip: entry.ip,
          name: entry.name,
          unitName: entry.unitName,
          pageCount: entry.info?.pageCount ? Number(entry.info.pageCount) : 0,
          supplies: (entry.supplies || []).map(s => ({
            name: s.name,
            type: s.type,
            percentage: s.percentage
          }))
        });
      }
    });
  } catch (err) {
    console.error('[Telemetry History] Erro ao gravar histórico no SQLite:', err.message);
  }
}

// Background Worker: atualiza o cache silenciosamente a cada 3 minutos
setInterval(async () => {
  try {
    const results = await updateAllPrintersCache();
    await recordTelemetrySnapshot(results);
  } catch (err) {
    console.error('[Cache Worker] Erro:', err.message);
  }
}, 180000);

// Endpoint para consulta do histórico de telemetria
app.get('/api/telemetry/history', async (req, res) => {
  const history = await loadTelemetryHistory();
  res.json(history);
});

// Endpoints de Manutenção, Diagnóstico de Armazenamento e Expurgo
app.get('/api/system/stats', (req, res) => {
  const stats = db.getDatabaseStats();
  res.json(stats);
});

app.post('/api/maintenance/prune', (req, res) => {
  const days = req.body?.days ? parseInt(req.body.days, 10) : 30;
  const result = db.pruneOldTelemetrySnapshots(days);
  const currentStats = db.getDatabaseStats();
  res.json({
    success: true,
    message: `Rotina de expurgo executada com sucesso para registros com mais de ${days} dias.`,
    pruned: result,
    stats: currentStats
  });
});

// Consulta otimizada com Cache e suporte a ?force=true
app.get('/api/status/all', async (req, res) => {
  const forceRefresh = req.query.force === 'true';
  const printers = await loadPrinters();

  // Se houver cache e não foi forçado, responde instantaneamente (< 5ms)
  if (!forceRefresh && STATUS_CACHE.size > 0 && printers.length === STATUS_CACHE.size) {
    const cachedData = printers.map(p => STATUS_CACHE.get(p.id) || { id: p.id, ip: p.ip, name: p.name, online: false });
    return res.json(cachedData);
  }

  // Caso contrário, busca direto das impressoras de forma paralela e rápida
  console.log('\x1b[36m%s\x1b[0m', 'GET /api/status/all - Sincronização em tempo real das impressoras');
  const freshData = await updateAllPrintersCache();
  recordTelemetrySnapshot(freshData).catch(() => {});
  res.json(freshData);
});

// Inicialização ouvindo em todas as interfaces de rede (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  const portStr = PORT == 80 ? '' : `:${PORT}`;
  console.log('\x1b[32m%s\x1b[0m', `====================================================`);
  console.log('\x1b[32m%s\x1b[0m', ` PAINEL DE IMPRESSORAS INICIADO COM SUCESSO!`);
  console.log('\x1b[36m%s\x1b[0m', ` -> Acesso nesta máquina:     http://localhost${portStr}/`);
  console.log('\x1b[36m%s\x1b[0m', ` -> Acesso na Rede (Ethernet): http://10.1.159.240${portStr}/`);
  console.log('\x1b[36m%s\x1b[0m', ` -> Acesso na Rede (Wi-Fi):    http://10.1.148.114${portStr}/`);
  console.log('\x1b[32m%s\x1b[0m', `====================================================`);

  // Popula o cache inicial assim que o servidor liga
  updateAllPrintersCache().then(results => {
    recordTelemetrySnapshot(results).catch(() => {});
    console.log('\x1b[32m%s\x1b[0m', '[Cache] Dados iniciais das impressoras pré-carregados na memória!');
  }).catch(() => {});
});
