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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

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

// Cache em memória para respostas instantâneas
const STATUS_CACHE = new Map();
let lastCacheUpdate = null;

// Função para atualizar o status de todas as impressoras em background
async function updateAllPrintersCache() {
  const printers = await loadPrinters();
  if (printers.length === 0) return [];

  const queries = printers.map(p => 
    queryPrinterStatus(p.ip, p.community)
      .then(data => {
        const entry = { id: p.id, ip: p.ip, name: p.name, location: p.location, unitId: p.unitId || '', unitName: p.unitName || 'Sem Unidade', ...data, cachedAt: new Date().toISOString() };
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
  console.log('\x1b[32m%s\x1b[0m', `====================================================`);
  console.log('\x1b[32m%s\x1b[0m', ` PAINEL DE IMPRESSORAS INICIADO COM SUCESSO!`);
  console.log('\x1b[36m%s\x1b[0m', ` -> Acesso nesta máquina:     http://localhost:${PORT}/`);
  console.log('\x1b[36m%s\x1b[0m', ` -> Acesso na Rede (Ethernet): http://10.1.159.240:${PORT}/`);
  console.log('\x1b[36m%s\x1b[0m', ` -> Acesso na Rede (Wi-Fi):    http://10.1.148.114:${PORT}/`);
  console.log('\x1b[32m%s\x1b[0m', `====================================================`);

  // Popula o cache inicial assim que o servidor liga
  updateAllPrintersCache().then(results => {
    recordTelemetrySnapshot(results).catch(() => {});
    console.log('\x1b[32m%s\x1b[0m', '[Cache] Dados iniciais das impressoras pré-carregados na memória!');
  }).catch(() => {});
});
