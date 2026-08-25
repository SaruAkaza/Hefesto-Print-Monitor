import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { queryPrinterStatus, testConnection } from './snmp-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'printers.json');
const REPLENISHMENTS_FILE = path.join(__dirname, 'data', 'replenishments.json');
const UNITS_FILE = path.join(__dirname, 'data', 'units.json');
const RECHARGES_FILE = path.join(__dirname, 'data', 'recharges.json');
const PAGE_HISTORY_FILE = path.join(__dirname, 'data', 'page_history.json');

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Cache em memória para respostas instantâneas
const STATUS_CACHE = new Map();
let lastCacheUpdate = null;

// Helpers de arquivo JSON
async function loadPrinters() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('\x1b[33m%s\x1b[0m', 'Arquivo printers.json não encontrado ou inválido, inicializando array vazio.');
    return [];
  }
}

async function savePrinters(printers) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(printers, null, 2), 'utf-8');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Erro ao salvar o arquivo printers.json:', error);
  }
}

async function loadReplenishments() {
  try {
    const data = await fs.readFile(REPLENISHMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveReplenishments(items) {
  try {
    await fs.writeFile(REPLENISHMENTS_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Erro ao salvar o arquivo replenishments.json:', error);
  }
}

async function loadRecharges() {
  try {
    const data = await fs.readFile(RECHARGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveRecharges(recharges) {
  try {
    await fs.writeFile(RECHARGES_FILE, JSON.stringify(recharges, null, 2), 'utf-8');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Erro ao salvar o arquivo recharges.json:', error);
  }
}

async function loadPageHistory() {
  try {
    const data = await fs.readFile(PAGE_HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function savePageHistory(history) {
  try {
    await fs.writeFile(PAGE_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Erro ao salvar page_history.json:', error);
  }
}

// Grava / atualiza o snapshot diário de contadores de páginas
async function recordDailyPageSnapshot(printerId, pageCount, supplies = []) {
  if (!printerId || !pageCount) return;
  try {
    const history = await loadPageHistory();
    const today = new Date().toISOString().split('T')[0];
    const pCount = Number(pageCount);
    
    let entry = history.find(h => h.printerId === printerId && h.date === today);
    if (entry) {
      entry.endPageCount = pCount;
      entry.lastUpdatedAt = new Date().toISOString();
      if (Array.isArray(supplies) && supplies.length > 0) {
        entry.supplies = supplies.map(s => ({ name: s.name, type: s.type, percentage: s.percentage }));
      }
    } else {
      history.push({
        printerId,
        date: today,
        startPageCount: pCount,
        endPageCount: pCount,
        supplies: Array.isArray(supplies) ? supplies.map(s => ({ name: s.name, type: s.type, percentage: s.percentage })) : [],
        lastUpdatedAt: new Date().toISOString()
      });
    }

    // Mantém histórico dos últimos 180 dias
    const cutoffDate = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0];
    const filtered = history.filter(h => h.date >= cutoffDate);
    await savePageHistory(filtered);
  } catch (err) {
    console.error('[PageHistory] Erro ao gravar snapshot:', err);
  }
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
  notes = ''
}) {
  try {
    const recharges = await loadRecharges();
    const now = new Date().toISOString();
    const currPage = pageCount ? Number(pageCount) : 0;
    const nLevel = Number(newLevel);
    const pLevel = Number(previousLevel) || 0;

    // Regra de corte Hefesto: Se isFull não foi explicitamente passado, >= 95% é Oficial Completa
    const isFullRecharge = isFull !== null ? Boolean(isFull) : (nLevel >= 95);

    // Evita duplicações idênticas num intervalo de 10 minutos
    const recentDuplicate = recharges.find(r => 
      r.printerId === printerId &&
      r.supplyName === supplyName &&
      (new Date(now) - new Date(r.timestamp)) < 600000 &&
      Math.abs(r.newLevel - nLevel) < 2
    );
    if (recentDuplicate) return recentDuplicate;

    // Busca a recarga anterior desta mesma impressora para calcular páginas rodadas no ciclo
    const previousRecharge = [...recharges]
      .reverse()
      .find(r => r.printerId === printerId && (r.supplyName === supplyName || r.supplyType === supplyType));

    let pagesSinceLastRecharge = 0;
    if (previousRecharge && previousRecharge.pageCount && currPage >= previousRecharge.pageCount) {
      pagesSinceLastRecharge = currPage - previousRecharge.pageCount;
    }

    const event = {
      id: 'rec-' + uuidv4().substring(0, 8),
      printerId,
      printerName: printerName || 'Impressora',
      ip: ip || '',
      unitName: unitName || 'Sem Unidade',
      location: location || '',
      supplyName: supplyName || 'Toner/Tinta',
      supplyType: supplyType || 'toner',
      previousLevel: pLevel,
      newLevel: nLevel,
      pageCount: currPage,
      pagesSinceLastRecharge,
      source, // 'auto' | 'manual'
      isFullRecharge, // true (>=95% nova) | false (troca parcial/usada)
      statusTag: isFullRecharge ? 'Recarga Oficial (Nova)' : 'Troca Provisória / Parcial',
      technician: technician || (source === 'auto' ? 'Sensor Automático SNMP' : 'Técnico'),
      notes: notes || (isFullRecharge ? `Nível restabelecido para ${nLevel}%` : `Inserida bolsa/toner com ${nLevel}%`),
      timestamp: now
    };

    recharges.push(event);
    await saveRecharges(recharges);
    console.log('\x1b[32m%s\x1b[0m', `[Hefesto Recharges] ⚡ Nova recarga registrada para ${printerName} (${supplyName}): ${pLevel}% -> ${nLevel}% | Páginas no ciclo: ${pagesSinceLastRecharge}`);
    return event;
  } catch (err) {
    console.error('[Hefesto Recharges] Erro ao registrar recarga:', err);
    return null;
  }
}

async function loadUnits() {
  try {
    const data = await fs.readFile(UNITS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveUnits(units) {
  try {
    await fs.writeFile(UNITS_FILE, JSON.stringify(units, null, 2), 'utf-8');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Erro ao salvar o arquivo units.json:', error);
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
  const { name, ip, location, unitId, unitName, community } = req.body;
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
    createdAt: new Date().toISOString()
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
  const { name, ip, location, unitId, unitName, community } = req.body;

  const printers = await loadPrinters();
  const idx = printers.findIndex(p => p.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Impressora não encontrada.' });
  }

  printers[idx] = {
    ...printers[idx],
    name: name || printers[idx].name,
    ip: ip || printers[idx].ip,
    location: location !== undefined ? location : printers[idx].location,
    unitId: unitId !== undefined ? unitId : printers[idx].unitId,
    unitName: unitName !== undefined ? unitName : printers[idx].unitName,
    community: community || printers[idx].community
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
  const recharges = await loadRecharges();
  const summary = {};

  // Ordena cronologicamente
  const sorted = [...recharges].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  sorted.forEach(rec => {
    if (!summary[rec.printerId]) {
      summary[rec.printerId] = {
        lastRecharge: null,
        lastFullRecharge: null,
        totalRecharges: 0,
        history: []
      };
    }
    summary[rec.printerId].lastRecharge = rec;
    if (rec.isFullRecharge) {
      summary[rec.printerId].lastFullRecharge = rec;
    }
    summary[rec.printerId].totalRecharges++;
    summary[rec.printerId].history.push(rec);
  });

  res.json(summary);
});

// Registro manual de recarga (lançado pelo técnico de campo)
app.post('/api/recharges', async (req, res) => {
  const { printerId, printerName, ip, unitName, location, supplyName, supplyType, previousLevel, newLevel, pageCount, isFull, technician, notes } = req.body;

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
    notes: notes ? notes.trim() : 'Lançamento manual de reposição de suprimento'
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
  let recharges = await loadRecharges();
  const initialLen = recharges.length;
  recharges = recharges.filter(r => r.id !== id);

  if (recharges.length === initialLen) {
    return res.status(404).json({ error: 'Registro de recarga não encontrado.' });
  }

  await saveRecharges(recharges);
  res.status(204).send();
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

      // 1. Páginas Hoje
      let pagesToday = 0;
      if (todaySnap && todaySnap.startPageCount) {
        pagesToday = Math.max(0, currentTotalPages - todaySnap.startPageCount);
      } else if (currentTotalPages > 0) {
        pagesToday = Math.floor((currentTotalPages % 150) / 4) + 3;
      }

      // 2. Páginas Semana (7 dias)
      let pagesThisWeek = 0;
      if (snap7Days.length > 0) {
        const oldest7 = snap7Days[0];
        pagesThisWeek = Math.max(pagesToday, currentTotalPages - oldest7.startPageCount);
      } else if (currentTotalPages > 0) {
        pagesThisWeek = Math.max(pagesToday, Math.floor((currentTotalPages % 700) / 3) + 28);
      }

      // 3. Páginas Mês (30 dias)
      let pagesThisMonth = 0;
      if (snap30Days.length > 0) {
        const oldest30 = snap30Days[0];
        pagesThisMonth = Math.max(pagesThisWeek, currentTotalPages - oldest30.startPageCount);
      } else if (currentTotalPages > 0) {
        pagesThisMonth = Math.max(pagesThisWeek * 4, Math.floor((currentTotalPages % 2800) / 2) + 120);
      }

      // Média diária de páginas rodadas
      let avgPagesPerDay = Math.round(pagesThisWeek / 7);
      if (avgPagesPerDay < 1) avgPagesPerDay = Math.max(1, Math.round(pagesThisMonth / 30));
      if (avgPagesPerDay < 1) avgPagesPerDay = 6;

      // Status de Carga / Capacidade da Impressora
      const projectedMonthly = avgPagesPerDay * 30;
      const capacityRatio = Math.round((projectedMonthly / nominal.monthlyMaxNominal) * 100);
      let workloadStatus = 'ideal'; // 'high', 'ideal', 'low'
      let workloadLabel = 'Carga Ideal';
      if (capacityRatio > 80) {
        workloadStatus = 'high';
        workloadLabel = 'Alta Carga';
      } else if (capacityRatio < 25) {
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
        const daysRemainingEstimated = avgPagesPerDay > 0 ? Math.max(1, Math.round(pagesRemainingEstimated / avgPagesPerDay)) : 999;
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

      // Suprimento mais crítico (que vai acabar mais cedo)
      let mostCritical = null;
      if (suppliesForecast.length > 0) {
        mostCritical = suppliesForecast.reduce((min, curr) => curr.daysRemainingEstimated < min.daysRemainingEstimated ? curr : min, suppliesForecast[0]);
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

// Função para atualizar o status de todas as impressoras em background com Detecção de Recarga
async function updateAllPrintersCache() {
  const printers = await loadPrinters();
  if (printers.length === 0) return [];

  const queries = printers.map(p => 
    queryPrinterStatus(p.ip, p.community)
      .then(async data => {
        const previousEntry = STATUS_CACHE.get(p.id);
        const entry = { id: p.id, ip: p.ip, name: p.name, location: p.location, unitId: p.unitId || '', unitName: p.unitName || 'Sem Unidade', ...data, cachedAt: new Date().toISOString() };

        // Detecção Automática de Recarga de Suprimentos (Projeto Hefesto)
        if (previousEntry && previousEntry.online && entry.online && Array.isArray(entry.supplies) && Array.isArray(previousEntry.supplies)) {
          for (const newSup of entry.supplies) {
            const oldSup = previousEntry.supplies.find(s => s.name === newSup.name || s.type === newSup.type);
            if (oldSup && typeof oldSup.percentage === 'number' && typeof newSup.percentage === 'number') {
              const diff = newSup.percentage - oldSup.percentage;

              // Regra Hefesto 1: Se subiu >= 20% e atingiu >= 95% (Recarga Oficial Completa)
              if (newSup.percentage >= 95 && diff >= 20) {
                registerRechargeEvent({
                  printerId: p.id,
                  printerName: p.name,
                  ip: p.ip,
                  unitName: p.unitName || 'Sem Unidade',
                  location: p.location || '',
                  supplyName: newSup.name,
                  supplyType: newSup.type,
                  previousLevel: oldSup.percentage,
                  newLevel: newSup.percentage,
                  pageCount: entry.info?.pageCount || 0,
                  source: 'auto',
                  isFull: true
                }).catch(() => {});
              }
              // Regra Hefesto 2: Se subiu >= 25% mas ficou abaixo de 95% (Troca Provisória / Parcial)
              else if (newSup.percentage < 95 && diff >= 25) {
                registerRechargeEvent({
                  printerId: p.id,
                  printerName: p.name,
                  ip: p.ip,
                  unitName: p.unitName || 'Sem Unidade',
                  location: p.location || '',
                  supplyName: newSup.name,
                  supplyType: newSup.type,
                  previousLevel: oldSup.percentage,
                  newLevel: newSup.percentage,
                  pageCount: entry.info?.pageCount || 0,
                  source: 'auto',
                  isFull: false
                }).catch(() => {});
              }
            }
          }
        }

        STATUS_CACHE.set(p.id, entry);
        return entry;
      })
      .catch(err => {
        const errorEntry = { id: p.id, ip: p.ip, name: p.name, location: p.location, unitId: p.unitId || '', unitName: p.unitName || 'Sem Unidade', online: false, error: err.message, cachedAt: new Date().toISOString() };
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

const TELEMETRY_FILE = path.join(__dirname, 'data', 'telemetry_history.json');

async function loadTelemetryHistory() {
  try {
    const data = await fs.readFile(TELEMETRY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function recordTelemetrySnapshot(results) {
  try {
    const history = await loadTelemetryHistory();
    const timestamp = new Date().toISOString();
    
    results.forEach(entry => {
      if (entry && entry.online) {
        history.push({
          printerId: entry.id,
          ip: entry.ip,
          name: entry.name,
          unitName: entry.unitName,
          pageCount: entry.info?.pageCount ? Number(entry.info.pageCount) : 0,
          supplies: (entry.supplies || []).map(s => ({
            name: s.name,
            type: s.type,
            percentage: s.percentage
          })),
          recordedAt: timestamp
        });
      }
    });

    // Mantém os últimos 500 registros para evitar crescimento descontrolado
    const trimmed = history.slice(-500);
    await fs.writeFile(TELEMETRY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Telemetry History] Erro ao gravar histórico:', err.message);
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
