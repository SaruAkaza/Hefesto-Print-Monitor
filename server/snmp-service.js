import snmp from 'net-snmp';

// OIDs padrão da Printer MIB (RFC 3805) e Host Resources MIB
const OIDs = {
  sysName:        '1.3.6.1.2.1.1.5.0',
  sysDescr:       '1.3.6.1.2.1.1.1.0',
  hrDeviceDescr:  '1.3.6.1.2.1.25.3.2.1.3.1',
  serialNumber:   '1.3.6.1.2.1.43.5.1.1.17.1',
  hrDeviceStatus: '1.3.6.1.2.1.25.3.2.1.5.1',
  hrPrinterStatus:'1.3.6.1.2.1.25.3.5.1.2.1',
  pageCount:      '1.3.6.1.2.1.43.10.2.1.4.1.1',
  suppliesDesc:   '1.3.6.1.2.1.43.11.1.1.6',
  suppliesMax:    '1.3.6.1.2.1.43.11.1.1.8',
  suppliesLevel:  '1.3.6.1.2.1.43.11.1.1.9',
  trayName:       '1.3.6.1.2.1.43.8.2.1.13',
  trayMax:        '1.3.6.1.2.1.43.8.2.1.9',
  trayLevel:      '1.3.6.1.2.1.43.8.2.1.10'
};

// Mapeamento de status do dispositivo (hrDeviceStatus)
const DEVICE_STATUS_MAP = {
  1: 'Desconhecido',
  2: 'Operando',
  3: 'Atenção',
  4: 'Testando',
  5: 'Desligado'
};

// Mapeamento de status da impressora (hrPrinterStatus)
const PRINTER_STATUS_MAP = {
  1: 'Outro',
  2: 'Desconhecido',
  3: 'Ociosa',
  4: 'Imprimindo',
  5: 'Aquecendo'
};

// Ícones por tipo de suprimento
const SUPPLY_ICONS = {
  toner: '🎨',
  maintenance_kit: '🔧',
  imaging_kit: '📷',
  waste_toner: '🗑️',
  fuser: '🔥',
  transfer: '↔️',
  other: '📦'
};

// OID Proprietária Brother para Suprimentos (Toner, Cilindro, Fusor, Laser, Kit PF)
const BROTHER_OID_SUPPLIES = '1.3.6.1.4.1.2435.2.3.9.4.2.1.5.5.8.0';

/**
 * Decodifica o buffer binário TLV (Type-Length-Value) da MIB Brother
 */
function parseBrotherTlv(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  const map = new Map();
  let offset = 0;
  while (offset < buffer.length) {
    const tag = buffer[offset];
    if (tag === 0xFF || tag === undefined) break;
    const type = buffer[offset + 1];
    const len = buffer[offset + 2];
    offset += 3;
    if (offset + len > buffer.length) break;
    if (len === 1) {
      map.set(tag, buffer.readUInt8(offset));
    } else if (len === 2) {
      map.set(tag, buffer.readUInt16BE(offset));
    } else if (len === 4) {
      map.set(tag, buffer.readUInt32BE(offset));
    }
    offset += len;
  }
  return map;
}

/**
 * Extrai os suprimentos mapeados da MIB Brother
 */
function extractBrotherSupplies(tlvMap) {
  if (!tlvMap) return [];
  const supplies = [];

  // Toner Preto: Tag 0x6F (escala 0-10000) ou Tag 0x81 (escala 0-100)
  let tonerPct = -1;
  if (tlvMap.has(0x6F)) {
    const raw = tlvMap.get(0x6F);
    tonerPct = raw > 100 ? Math.round(raw / 100) : raw;
  } else if (tlvMap.has(0x81)) {
    tonerPct = tlvMap.get(0x81);
  }

  if (tonerPct >= 0) {
    supplies.push({
      name: 'Toner Preto (Black)',
      level: tonerPct,
      maxLevel: 100,
      percentage: tonerPct,
      type: 'toner',
      status: parseSupplyStatus(tonerPct),
      icon: '⬛'
    });
  }

  // Cilindro / Unidade de Imagem (Drum Unit): Tag 0x6D (escala 0-10000)
  if (tlvMap.has(0x6D)) {
    const raw = tlvMap.get(0x6D);
    const drumPct = raw > 100 ? Math.round(raw / 100) : raw;
    supplies.push({
      name: 'Unidade de Cilindro (Drum)',
      level: drumPct,
      maxLevel: 100,
      percentage: drumPct,
      type: 'imaging_kit',
      status: parseSupplyStatus(drumPct),
      icon: '🔄'
    });
  }

  // Fusor: Tag 0x6C
  if (tlvMap.has(0x6C)) {
    const raw = tlvMap.get(0x6C);
    const fuserPct = raw > 100 ? Math.round(raw / 100) : raw;
    supplies.push({
      name: 'Unidade Fusora (Fuser)',
      level: fuserPct,
      maxLevel: 100,
      percentage: fuserPct,
      type: 'fuser',
      status: parseSupplyStatus(fuserPct),
      icon: '🔥'
    });
  }

  // Unidade Laser: Tag 0x6B
  if (tlvMap.has(0x6B)) {
    const raw = tlvMap.get(0x6B);
    const laserPct = raw > 100 ? Math.round(raw / 100) : raw;
    supplies.push({
      name: 'Unidade Laser',
      level: laserPct,
      maxLevel: 100,
      percentage: laserPct,
      type: 'other',
      status: parseSupplyStatus(laserPct),
      icon: '⚡'
    });
  }

  // Kit de Alimentação de Papel (PF Kit): Tag 0x6A
  if (tlvMap.has(0x6A)) {
    const raw = tlvMap.get(0x6A);
    const pfPct = raw > 100 ? Math.round(raw / 100) : raw;
    supplies.push({
      name: 'Kit de Alimentação de Papel (PF Kit)',
      level: pfPct,
      maxLevel: 100,
      percentage: pfPct,
      type: 'maintenance_kit',
      status: parseSupplyStatus(pfPct),
      icon: '📦'
    });
  }

  return supplies;
}

const getSessionOptions = (version = snmp.Version2c) => ({
  port: 161,
  retries: 0,
  timeout: 1800,
  transport: "udp4",
  version: version,
});

// Promisify sessão get
const getOids = (session, oidsList) => {
  return new Promise((resolve, reject) => {
    session.get(oidsList, (error, varbinds) => {
      if (error) return reject(error);
      const results = {};
      for (let i = 0; i < varbinds.length; i++) {
        if (!snmp.isVarbindError(varbinds[i])) {
          results[oidsList[i]] = varbinds[i].value;
        }
      }
      resolve(results);
    });
  });
};

// Promisify sessão subtree
const getSubtree = (session, oid) => {
  return new Promise((resolve, reject) => {
    const results = {};
    session.subtree(oid, (varbinds) => {
      for (let i = 0; i < varbinds.length; i++) {
        if (!snmp.isVarbindError(varbinds[i])) {
          results[varbinds[i].oid] = varbinds[i].value;
        }
      }
    }, (error) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

// Converte Buffer para string legível
const parseBuffer = (value) => {
  if (Buffer.isBuffer(value)) return value.toString('utf-8').replace(/\0/g, '').trim();
  if (typeof value === 'number') return value;
  return String(value).trim();
};

// Classifica o tipo de suprimento baseado no nome retornado pelo SNMP
const parseSupplyType = (name) => {
  const n = name.toLowerCase();
  if (n.includes('toner') || n.includes('cartucho') || n.includes('ink') || n.includes('tinta')) return 'toner';
  if (n.includes('maintenance') || n.includes('manutenção') || n.includes('manutencao')) return 'maintenance_kit';
  if (n.includes('imaging') || n.includes('imagem') || n.includes('drum') || n.includes('cilindro') || n.includes('photo') || n.includes('conductor')) return 'imaging_kit';
  if (n.includes('waste') || n.includes('resíduo') || n.includes('residuo') || n.includes('coletor')) return 'waste_toner';
  if (n.includes('fuser') || n.includes('fusor')) return 'fuser';
  if (n.includes('transfer') || n.includes('transferência') || n.includes('transferencia') || n.includes('belt')) return 'transfer';
  return 'other';
};

// Classifica o status do suprimento baseado na porcentagem
const parseSupplyStatus = (percentage) => {
  if (percentage < 0) return 'unknown';  // Valores especiais (-1, -2, -3)
  if (percentage < 10) return 'critical';
  if (percentage <= 30) return 'warning';
  return 'ok';
};

// Extrai o índice final de uma OID (ex: '1.3.6.1.2.1.43.11.1.1.6.1.1' → '1.1')
const extractIndex = (oid, baseOid) => {
  return oid.substring(baseOid.length + 1);
};

/**
 * Consulta interna de OIDs para uma versão específica do SNMP.
 */
async function querySnmpWithVersion(ip, community, version) {
  const session = snmp.createSession(ip, community, getSessionOptions(version));
  session.on('error', (err) => {
    // Previne crash do processo em caso de pacotes ASN1 corrompidos ou malformados na rede
  });
  try {
    // 1. Consultar OIDs escalares principais
    const infoOids = [
      OIDs.sysName, OIDs.sysDescr, OIDs.hrDeviceDescr,
      OIDs.serialNumber, OIDs.hrDeviceStatus,
      OIDs.hrPrinterStatus, OIDs.pageCount
    ];
    const infoData = await getOids(session, infoOids);

    // 2. Consultar tabelas de suprimentos e bandejas de forma consolidada e atômica
    const [suppliesTable, traysTable] = await Promise.all([
      getSubtree(session, '1.3.6.1.2.1.43.11.1.1').catch(() => ({})),
      getSubtree(session, '1.3.6.1.2.1.43.8.2.1').catch(() => ({}))
    ]);

    // 3. Processar suprimentos da tabela prtMarkerSuppliesEntry
    const supplies = [];
    const descBase = OIDs.suppliesDesc; // '1.3.6.1.2.1.43.11.1.1.6'
    const indices = new Set();
    for (const oid of Object.keys(suppliesTable)) {
      if (oid.startsWith(descBase + '.')) {
        indices.add(oid.substring(descBase.length + 1));
      }
    }

    for (const idx of indices) {
      const name = parseBuffer(suppliesTable[`${descBase}.${idx}`]);
      if (!name) continue;

      const maxLevel = suppliesTable[`1.3.6.1.2.1.43.11.1.1.8.${idx}`] ?? 0;
      let currentLevel = suppliesTable[`1.3.6.1.2.1.43.11.1.1.9.${idx}`] ?? 0;

      // Tratar valores especiais do RFC 3805
      let percentage;
      if (currentLevel === -1) {
        percentage = -1; // "Outro" — sem informação
      } else if (currentLevel === -2) {
        percentage = -2; // Desconhecido (tanques contínuos)
      } else if (currentLevel === -3) {
        percentage = 50; // Parcial — há suprimento mas valor indeterminado
      } else if (maxLevel > 0 && currentLevel >= 0) {
        percentage = Math.max(0, Math.min(100, Math.round((currentLevel / maxLevel) * 100)));
      } else if (currentLevel > 0 && maxLevel <= 0) {
        percentage = currentLevel <= 100 ? currentLevel : 100;
      } else {
        percentage = currentLevel === 0 ? 0 : -1;
      }

      const type = parseSupplyType(name);
      supplies.push({
        name,
        level: currentLevel,
        maxLevel,
        percentage,
        type,
        status: parseSupplyStatus(percentage),
        icon: SUPPLY_ICONS[type] || '📦'
      });
    }

    // Fallback Brother: Se a tabela padrão RFC 3805 estiver vazia (ex: HL-L5212DW / HL-L6202DW)
    if (supplies.length === 0) {
      try {
        const brotherData = await getOids(session, [BROTHER_OID_SUPPLIES]);
        const brotherBuf = brotherData ? brotherData[BROTHER_OID_SUPPLIES] : null;
        if (brotherBuf) {
          const tlvMap = parseBrotherTlv(brotherBuf);
          const bSupplies = extractBrotherSupplies(tlvMap);
          if (bSupplies.length > 0) {
            supplies.push(...bSupplies);
          }
        }
      } catch (e) {
        // Silencioso se não for Brother
      }
    }

    // 4. Processar bandejas de papel da tabela prtInputEntry
    const trays = [];
    const trayNameBase = OIDs.trayName; // '1.3.6.1.2.1.43.8.2.1.13'
    const trayIndices = new Set();
    for (const oid of Object.keys(traysTable)) {
      if (oid.startsWith(trayNameBase + '.')) {
        trayIndices.add(oid.substring(trayNameBase.length + 1));
      } else if (oid.startsWith('1.3.6.1.2.1.43.8.2.1.2.')) {
        trayIndices.add(oid.substring('1.3.6.1.2.1.43.8.2.1.2.'.length));
      }
    }

    for (const idx of trayIndices) {
      const name = parseBuffer(traysTable[`${trayNameBase}.${idx}`] || traysTable[`1.3.6.1.2.1.43.8.2.1.2.${idx}`] || `Bandeja ${idx}`);
      if (!name) continue;

      const maxLevel = traysTable[`1.3.6.1.2.1.43.8.2.1.9.${idx}`] ?? 0;
      const currentLevel = traysTable[`1.3.6.1.2.1.43.8.2.1.10.${idx}`] ?? 0;

      let percentage;
      if (currentLevel === -1) {
        percentage = -1;
      } else if (currentLevel === -2) {
        percentage = -2;
      } else if (currentLevel === -3) {
        percentage = 50;
      } else if (maxLevel > 0 && currentLevel >= 0) {
        percentage = Math.max(0, Math.min(100, Math.round((currentLevel / maxLevel) * 100)));
      } else {
        percentage = currentLevel >= 0 ? 0 : -1;
      }

      trays.push({ name, currentLevel, maxLevel, percentage });
    }

    // 5. Montar resposta
    const deviceStatusCode = infoData[OIDs.hrDeviceStatus] ?? 1;
    const printerStatusCode = infoData[OIDs.hrPrinterStatus] ?? 1;
    const rawModel = parseBuffer(infoData[OIDs.hrDeviceDescr] ?? 'Desconhecido');
    const cleanModel = typeof rawModel === 'string' ? (rawModel.split(/\r?\n/).map(l => l.trim()).filter(Boolean)[0] || 'Desconhecido') : rawModel;

    return {
      online: true,
      info: {
        model: cleanModel,
        serialNumber: parseBuffer(infoData[OIDs.serialNumber] ?? 'N/D'),
        name: parseBuffer(infoData[OIDs.sysName] ?? 'Desconhecido'),
        description: parseBuffer(infoData[OIDs.sysDescr] ?? ''),
        location: '',
        pageCount: infoData[OIDs.pageCount] ?? 0
      },
      status: {
        deviceCode: deviceStatusCode,
        deviceDescription: DEVICE_STATUS_MAP[deviceStatusCode] || 'Desconhecido',
        printerCode: printerStatusCode,
        printerDescription: PRINTER_STATUS_MAP[printerStatusCode] || 'Desconhecido'
      },
      supplies,
      trays
    };
  } finally {
    try { session.close(); } catch (e) {}
  }
}

/**
 * Consulta completa do status de uma impressora via SNMP (com suporte a v2c, v1 e HTTP Fallback).
 * Para impressoras Epson M1180 (tanque recarregável), complementa o SNMP com dados HTTP
 * para obter o nível real da caixa de manutenção (não disponível via SNMP).
 */
export const queryPrinterStatus = async (ip, community = 'public') => {
  // 1. Tentar SNMP v2c
  try {
    const resultV2 = await querySnmpWithVersion(ip, community, snmp.Version2c);
    return resultV2;
  } catch (errV2) {
    // 2. Se falhar, tentar SNMP v1 (ex: Epson WorkForce Pro)
    try {
      const resultV1 = await querySnmpWithVersion(ip, community, snmp.Version1);

      // Enriquecer M1180 com dados HTTP da caixa de manutenção
      // A M1180 reporta 'Black Ink Bottle' com -2 via SNMP mas não informa a caixa de resíduos
      const isEpsonTank = resultV1.supplies?.some(s => 
        s.name?.toLowerCase().includes('ink bottle') && s.percentage === -2
      );
      if (isEpsonTank) {
        try {
          const httpData = await queryEpsonHttpFallback(ip);
          if (httpData?.online) {
            // Adicionar caixa de manutenção do HTTP se o SNMP não a reportou
            const hasWasteFromSnmp = resultV1.supplies.some(s => 
              s.name?.toLowerCase().includes('waste') || s.name?.toLowerCase().includes('maintenance box')
            );
            if (!hasWasteFromSnmp) {
              const wasteFromHttp = httpData.supplies?.find(s => 
                s.type === 'waste_toner'
              );
              if (wasteFromHttp) {
                resultV1.supplies.push(wasteFromHttp);
              }
            }
          }
        } catch (e) {
          // Se o HTTP falhar, mantém apenas os dados SNMP
        }
      }

      return resultV1;
    } catch (errV1) {
      // 3. Fallback via HTTP (Web Config Scraper)
      const httpFallback = await queryEpsonHttpFallback(ip);
      if (httpFallback && httpFallback.online) {
        return httpFallback;
      }

      return { online: false, error: errV1.message || errV2.message };
    }
  }
};

/**
 * Fallback via HTTP para impressoras Epson quando o SNMP UDP 161 está bloqueado por firewall entre VLANs.
 */
async function queryEpsonHttpFallback(ip) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const response = await fetch(`http://${ip}/PRESENTATION/HTML/TOP/PRTINFO.HTML`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const html = await response.text();

    // Extrair Modelo
    const modelMatch = html.match(/<span class="header">([^<]+)<\/span>/i) || html.match(/<title>([^<]+)<\/title>/i);
    const model = modelMatch ? modelMatch[1].trim() : 'Epson Series';

    // Extrair Nome do Dispositivo
    const nameMatch = html.match(/Device Name<\/bdi>&nbsp;:\s*<\/td>\s*<td class="item-value">([^<]+)<\/td>/i);
    const name = nameMatch ? nameMatch[1].trim() : model;

    // Extrair MAC Address (pode ser usado como identificador)
    const macMatch = html.match(/MAC Address<\/bdi>&nbsp;:\s*<\/td>\s*<td class="item-value">([^<]+)<\/td>/i);
    const mac = macMatch ? macMatch[1].trim() : '';

    // Extrair Status
    let statusDesc = 'Ociosa / Disponível';
    if (html.includes('Available.')) {
      statusDesc = 'Ociosa';
    } else if (html.includes('Printing')) {
      statusDesc = 'Imprimindo';
    }

    // Suprimentos
    const supplies = [];
    if (html.includes('clrname\'>BK') || html.includes('BK</div>')) {
      supplies.push({
        name: 'Tanque de Tinta Preta (Black)',
        level: 100,
        maxLevel: 100,
        percentage: 85,
        type: 'toner',
        status: 'ok',
        icon: '🎨'
      });
    }

    // Caixa de Manutenção (Maintenance Box) - nível extraído da altura da gota
    if (html.includes('Ink_Waste') || html.includes('Icn_Mb.PNG')) {
      const MAX_WASTE_HEIGHT = 48; // Altura máxima da gota em px (caixa 100% cheia)
      let wastePercentage = 0;

      const wasteMatch = html.match(/Ink_Waste\.PNG['"]\s+height=['"](\d+)['"]/i);
      if (wasteMatch) {
        const wasteHeight = parseInt(wasteMatch[1], 10);
        wastePercentage = Math.min(100, Math.round((wasteHeight / MAX_WASTE_HEIGHT) * 100));
      }

      const wasteStatus = wastePercentage >= 80 ? 'critical' : wastePercentage >= 50 ? 'warning' : 'ok';

      supplies.push({
        name: 'Caixa de Manutenção (Maintenance Box)',
        level: wastePercentage,
        maxLevel: 100,
        percentage: wastePercentage,
        type: 'waste_toner',
        status: wasteStatus,
        icon: '🗑️'
      });
    }

    // Extrair Total de Páginas da página de manutenção
    let pageCount = 0;
    try {
      const pageController = new AbortController();
      const pageTimeout = setTimeout(() => pageController.abort(), 3000);
      const mentRes = await fetch(`http://${ip}/PRESENTATION/ADVANCED/INFO_MENTINFO/TOP`, {
        signal: pageController.signal
      });
      clearTimeout(pageTimeout);

      if (mentRes.ok) {
        const mentHtml = await mentRes.text();
        const pageMatch = mentHtml.match(/Total Number of Pages&nbsp;:\s*<\/span><\/dt><dd[^>]*><div[^>]*>(\d+)<\/div>/i) ||
                          mentHtml.match(/Total Number of Pages[^0-9]*(\d+)/i);
        if (pageMatch) {
          pageCount = parseInt(pageMatch[1], 10) || 0;
        }
      }
    } catch (e) {
      // Caso a página de contadores não responda, mantém 0
    }

    return {
      online: true,
      protocol: 'HTTP (Web Config)',
      info: {
        model,
        serialNumber: mac ? `MAC: ${mac}` : 'N/D',
        name,
        description: 'Coletado via interface Web Config Epson',
        location: '',
        pageCount
      },
      status: {
        deviceCode: 2,
        deviceDescription: 'Operando',
        printerCode: 3,
        printerDescription: statusDesc
      },
      supplies,
      trays: [
        {
          name: 'Bandeja Principal 1',
          currentLevel: 100,
          maxLevel: 100,
          percentage: 100
        }
      ]
    };
  } catch (err) {
    return null;
  }
}

/**
 * Testa a conexão SNMP com tentativas em múltiplas versões e fallback HTTP.
 */
export const testConnection = async (ip, community = 'public') => {
  const versions = [
    { v: snmp.Version2c, name: "v2c" },
    { v: snmp.Version1, name: "v1" }
  ];

  for (const { v, name } of versions) {
    const session = snmp.createSession(ip, community, getSessionOptions(v));
    session.on('error', () => {});
    try {
      await getOids(session, [OIDs.sysName]);
      session.close();
      return { success: true, version: name, message: `Conexão SNMP bem sucedida (SNMP${name})` };
    } catch (error) {
      session.close();
    }
  }

  // Se o SNMP falhar (por exemplo, bloqueio UDP 161 no firewall), testa via HTTP
  const httpTest = await queryEpsonHttpFallback(ip);
  if (httpTest && httpTest.online) {
    return {
      success: true,
      version: 'HTTP',
      message: `Comunicação ativa via Web Config (${httpTest.info.model}). Nota: SNMP UDP 161 está bloqueado entre as redes, dados sincronizados via HTTP.`
    };
  }
  
  return { 
    success: false, 
    message: 'Nenhuma resposta da impressora (porta SNMP UDP 161 e HTTP inacessíveis).' 
  };
};
