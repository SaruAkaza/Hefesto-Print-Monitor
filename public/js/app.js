/**
 * ==========================================================================
 * MONITOR DE IMPRESSORAS - PAINEL OPERACIONAL E GERENCIAL
 * ==========================================================================
 */

// ==========================================================================
// 1. DICIONÁRIO DE ÍCONES VETORIAIS SVG
// ==========================================================================
const Icons = {
  printer: `<svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
  eye: `<svg class="icon icon-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/></svg>`,
  refresh: `<svg class="icon icon-xs" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  edit: `<svg class="icon icon-xs" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  trash: `<svg class="icon icon-xs" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  zap: `<svg class="icon icon-xs" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  alertTriangle: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
  checkCircle: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  alertOctagon: `<svg class="icon icon-sm" viewBox="0 0 24 24"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
  wifiOff: `<svg class="icon icon-sm" viewBox="0 0 24 24"><line x1="1" x2="23" y1="1" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>`,
  toner: `<svg class="icon icon-xs" viewBox="0 0 24 24"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/></svg>`,
  paper: `<svg class="icon icon-xs" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  crown: `<svg class="icon icon-xs" viewBox="0 0 24 24"><path d="M5 16 3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5Z"/><path d="M5 19h14v2H5z"/></svg>`,
  folder: `<svg class="icon icon-xs" viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  plus: `<svg class="icon icon-xs" viewBox="0 0 24 24"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>`
};

// ==========================================================================
// 2. ESTADO GLOBAL DA APLICAÇÃO (PROJETO HEFESTO)
// ==========================================================================
const AppState = {
  theme: 'dark',
  userRole: 'operator',       // 'operator' | 'admin'
  units: [],
  printers: [],
  statusData: new Map(),
  rechargesSummary: {},       // Resumo de última recarga por impressora
  rechargesList: [],          // Histórico completo de recargas
  activeUnitFilter: '',
  overviewFilter: 'all',
  locationFilter: '',
  sortBy: 'lowest-supply',
  searchQuery: '',
  testedPrinterIp: '',
  // Módulo de Volume e Previsibilidade (Projeto Hefesto)
  activeAdminTab: 'printers', // 'printers' | 'forecast'
  forecastData: [],
  forecastSearch: '',
  forecastUnitFilter: '',
  forecastWorkloadFilter: '',
  forecastTimeFilter: '',
  isRefreshing: false,
  autoRefreshInterval: null,
  lastUpdated: null,
  refreshIntervalMs: 1800000 // 30 minutos
};

// ==========================================================================
// 3. SELETORES DO DOM
// ==========================================================================
const DOM = {
  // Tela de Login / Seleção Inicial
  loginOverlay: document.getElementById('login-overlay'),
  tabLoginOperator: document.getElementById('tab-login-operator'),
  tabLoginAdmin: document.getElementById('tab-login-admin'),
  formLoginUnit: document.getElementById('form-login-unit'),
  formLoginAdmin: document.getElementById('form-login-admin'),
  loginUnitSelect: document.getElementById('login-unit-select'),
  adminUserInput: document.getElementById('admin-user-input'),
  adminPasswordInput: document.getElementById('admin-password-input'),

  // Cabeçalho
  currentUnitBadge: document.getElementById('current-unit-badge'),
  adminRoleBadge: document.getElementById('admin-role-badge'),
  headerUnitDesc: document.getElementById('header-unit-desc'),
  btnLogout: document.getElementById('btn-logout'),
  btnOpenDiagnoseIp: document.getElementById('btn-open-diagnose-ip'),
  lastUpdatedText: document.getElementById('last-updated-text'),
  btnRefreshAll: document.getElementById('btn-refresh-all'),
  refreshIcon: document.getElementById('refresh-icon'),
  btnAddPrinterHeader: document.getElementById('btn-add-printer-header'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  themeIconMoon: document.getElementById('theme-icon-moon'),
  themeIconSun: document.getElementById('theme-icon-sun'),

  // Bloco "Status Agora" & Banner de Conectadas
  statusNowSummaryText: document.getElementById('status-now-summary-text'),
  countConnectedBanner: document.getElementById('count-connected-banner'),
  overviewUnitSelectorBox: document.getElementById('overview-unit-selector-box'),
  overviewUnitFilter: document.getElementById('overview-unit-filter'),
  countCritical: document.getElementById('count-critical'),
  countWarning: document.getElementById('count-warning'),
  countOffline: document.getElementById('count-offline'),

  // Seção "Minhas Impressoras"
  overviewFilterPills: document.getElementById('overview-filter-pills'),
  countAll: document.getElementById('count-all'),
  pillCountCritical: document.getElementById('pill-count-critical'),
  pillCountWarning: document.getElementById('pill-count-warning'),
  pillCountOffline: document.getElementById('pill-count-offline'),
  searchInput: document.getElementById('search-input'),
  filterLocationSelect: document.getElementById('filter-location-select'),
  sortFleetSelect: document.getElementById('sort-fleet-select'),
  myPrintersListBody: document.getElementById('my-printers-list-body'),

  // Exportar Relatórios (Cabeçalho ADM)
  btnExportInkCsvHeader: document.getElementById('btn-export-ink-csv-header'),
  btnExportRechargesCsvHeader: document.getElementById('btn-export-recharges-csv-header'),

  // Modal Testar Conexão por IP
  modalTestIp: document.getElementById('modal-test-ip'),
  formTestIpModal: document.getElementById('form-test-ip-modal'),
  inputTestIp: document.getElementById('input-test-ip'),
  testIpResultBox: document.getElementById('test-ip-result-box'),
  btnSubmitTestIp: document.getElementById('btn-submit-test-ip'),
  btnQuickAddFromTest: document.getElementById('btn-quick-add-from-test'),
  btnCloseModalTestIp: document.getElementById('btn-close-modal-test-ip'),
  btnCancelModalTestIp: document.getElementById('btn-cancel-modal-test-ip'),

  // Modais Formulários Impressora
  modalPrinterForm: document.getElementById('modal-printer-form'),
  modalFormTitleText: document.getElementById('modal-form-title-text'),
  printerForm: document.getElementById('printer-form'),
  formId: document.getElementById('printer-form-id'),
  formUnitSelect: document.getElementById('printer-unit-select'),
  formName: document.getElementById('printer-name'),
  formIp: document.getElementById('printer-ip'),
  formLocation: document.getElementById('printer-location'),
  formCommunity: document.getElementById('printer-community'),
  btnCloseModalForm: document.getElementById('btn-close-modal-form'),
  btnCancelModalForm: document.getElementById('btn-cancel-modal-form'),
  btnQuickNewUnit: document.getElementById('btn-quick-new-unit'),

  // Modal Unidade
  modalUnitForm: document.getElementById('modal-unit-form'),
  modalUnitFormTitleText: document.getElementById('modal-unit-form-title-text'),
  unitForm: document.getElementById('unit-form'),
  unitFormId: document.getElementById('unit-form-id'),
  unitNameInput: document.getElementById('unit-name'),
  unitDescInput: document.getElementById('unit-description'),
  btnCloseModalUnit: document.getElementById('btn-close-modal-unit'),
  btnCancelModalUnit: document.getElementById('btn-cancel-modal-unit'),

  // Modal Gerenciador de Pastas (Unidades)
  btnManageUnitsHeader: document.getElementById('btn-manage-units-header'),
  modalManageUnits: document.getElementById('modal-manage-units'),
  manageUnitsListBody: document.getElementById('manage-units-list-body'),
  btnOpenCreateUnitInsideManage: document.getElementById('btn-open-create-unit-inside-manage'),
  btnCloseModalManageUnits: document.getElementById('btn-close-modal-manage-units'),
  btnCloseModalManageUnitsBtn: document.getElementById('btn-close-modal-manage-units-btn'),

  // Modal Registro Manual de Recarga (Projeto Hefesto)
  modalManualRecharge: document.getElementById('modal-manual-recharge'),
  formManualRecharge: document.getElementById('form-manual-recharge'),
  rechargeModalPrinterInfo: document.getElementById('recharge-modal-printer-info'),
  rechargePrinterId: document.getElementById('recharge-printer-id'),
  rechargePrinterName: document.getElementById('recharge-printer-name'),
  rechargePrinterIp: document.getElementById('recharge-printer-ip'),
  rechargeUnitName: document.getElementById('recharge-unit-name'),
  rechargeLocation: document.getElementById('recharge-location'),
  rechargePageCount: document.getElementById('recharge-page-count'),
  rechargeSupplySelect: document.getElementById('recharge-supply-select'),
  optRechargeFullCard: document.getElementById('opt-recharge-full-card'),
  optRechargePartialCard: document.getElementById('opt-recharge-partial-card'),
  optRechargeFullInput: document.getElementById('opt-recharge-full-input'),
  optRechargePartialInput: document.getElementById('opt-recharge-partial-input'),
  rechargeNewLevel: document.getElementById('recharge-new-level'),
  rechargeCustomDate: document.getElementById('recharge-custom-date'),
  rechargeTechnician: document.getElementById('recharge-technician'),
  rechargeNotes: document.getElementById('recharge-notes'),
  btnCloseModalRecharge: document.getElementById('btn-close-modal-recharge'),
  btnCancelModalRecharge: document.getElementById('btn-cancel-modal-recharge'),

  // Side Drawer Raio-X
  drawerPrinterDetail: document.getElementById('drawer-printer-detail'),
  detailPrinterName: document.getElementById('detail-printer-name'),
  detailModalBody: document.getElementById('detail-modal-body'),
  btnDetailClose: document.getElementById('btn-detail-close'),
  btnDetailRefresh: document.getElementById('btn-detail-refresh'),
  btnDetailEdit: document.getElementById('btn-detail-edit'),
  btnDetailDelete: document.getElementById('btn-detail-delete'),
  btnCloseDrawerDetail: document.getElementById('btn-close-drawer-detail'),

  // Histórico Recente de Trocas da Unidade
  unitRecentRechargesSection: document.getElementById('unit-recent-recharges-section'),
  unitRecentRechargesList: document.getElementById('unit-recent-recharges-list'),
  unitRechargesCountBadge: document.getElementById('unit-recharges-count-badge'),
  toggleUnitRechargesBtn: document.getElementById('toggle-unit-recharges-btn'),
  btnToggleUnitRechargesText: document.getElementById('btn-toggle-unit-recharges-text'),

  // Abas Administrativas & Previsibilidade
  adminMainTabs: document.getElementById('admin-main-tabs'),
  btnTabPrinters: document.getElementById('btn-tab-printers'),
  btnTabForecast: document.getElementById('btn-tab-forecast'),
  tabViewPrinters: document.getElementById('tab-view-printers'),
  tabViewForecast: document.getElementById('tab-view-forecast'),
  kpiPagesToday: document.getElementById('kpi-pages-today'),
  kpiPagesWeek: document.getElementById('kpi-pages-week'),
  kpiPagesMonth: document.getElementById('kpi-pages-month'),
  kpiCriticalSwapsCount: document.getElementById('kpi-critical-swaps-count'),
  kpiPeriodToday: document.getElementById('kpi-period-today'),
  kpiPeriodWeek: document.getElementById('kpi-period-week'),
  kpiPeriodMonth: document.getElementById('kpi-period-month'),
  kpiPeriodSwaps: document.getElementById('kpi-period-swaps'),
  kpiSubPagesToday: document.getElementById('kpi-sub-pages-today'),
  kpiSubPagesWeek: document.getElementById('kpi-sub-pages-week'),
  kpiSubPagesMonth: document.getElementById('kpi-sub-pages-month'),
  kpiSubCriticalSwaps: document.getElementById('kpi-sub-critical-swaps'),
  btnExportForecastCsv: document.getElementById('btn-export-forecast-csv'),
  forecastSearchInput: document.getElementById('forecast-search-input'),
  forecastUnitSelect: document.getElementById('forecast-unit-select'),
  forecastWorkloadSelect: document.getElementById('forecast-workload-select'),
  forecastTimeFilter: document.getElementById('forecast-time-filter'),
  forecastTableBody: document.getElementById('forecast-table-body'),

  // Botão Voltar ao Topo
  btnScrollTop: document.getElementById('btn-scroll-top'),

  toastContainer: document.getElementById('toast-container')
};

// ==========================================================================
// 4. API CLIENT
// ==========================================================================
const API = {
  async getUnits() {
    const res = await fetch('/api/units');
    return res.ok ? await res.json() : [];
  },
  async addUnit(data) {
    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao salvar unidade');
    return await res.json();
  },
  async updateUnit(id, data) {
    const res = await fetch(`/api/units/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao atualizar unidade');
    return await res.json();
  },
  async deleteUnit(id) {
    const res = await fetch(`/api/units/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir unidade');
  },
  async getPrinters() {
    const res = await fetch('/api/printers');
    return res.ok ? await res.json() : [];
  },
  async addPrinter(data) {
    const res = await fetch('/api/printers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao cadastrar impressora');
    }
    return await res.json();
  },
  async updatePrinter(id, data) {
    const res = await fetch(`/api/printers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao atualizar impressora');
    return await res.json();
  },
  async deletePrinter(id) {
    const res = await fetch(`/api/printers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir impressora');
  },
  async getPrinterStatus(id) {
    const res = await fetch(`/api/printers/${id}/status`);
    if (!res.ok) throw new Error('Erro ao consultar status da impressora');
    const json = await res.json();
    return json.data || json;
  },
  async testAnyIp(ip) {
    const res = await fetch(`/api/test-ip?ip=${encodeURIComponent(ip)}`);
    return res.ok ? await res.json() : { success: false, message: 'Falha na resposta do servidor' };
  },
  async getAllStatus(force = false) {
    const res = await fetch(`/api/status/all${force ? '?force=true' : ''}`);
    return res.ok ? await res.json() : [];
  },

  // Projeto Hefesto: Métodos de Recargas
  async getRechargesSummary() {
    const res = await fetch('/api/recharges/summary');
    return res.ok ? await res.json() : {};
  },
  async getRecharges(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/recharges${query ? '?' + query : ''}`);
    return res.ok ? await res.json() : [];
  },
  async addRecharge(data) {
    const res = await fetch('/api/recharges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao registrar recarga');
    }
    return await res.json();
  },
  async deleteRecharge(id) {
    const res = await fetch(`/api/recharges/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir registro de recarga');
  },

  // Motor Analítico de Volume e Previsibilidade (Projeto Hefesto)
  async getVolumeForecast() {
    const res = await fetch('/api/analytics/volume-forecast');
    return res.ok ? await res.json() : [];
  }
};

// ==========================================================================
// 5. TRADUÇÃO DE SUPRIMENTOS E CORES PARA PORTUGUÊS
// ==========================================================================
function translateSupplyName(name, type = '') {
  if (!name) return 'Suprimento';
  const lower = name.toLowerCase();

  // 1. Caixas de Resíduos
  if (lower.includes('waste') || lower.includes('resíduo') || lower.includes('residuo')) {
    return 'Garrafa de Resíduo de Toner';
  }
  if (lower.includes('maintenance box') || lower.includes('caixa de manutenção') || lower.includes('caixa de manutencao')) {
    return 'Caixa de Manutenção';
  }

  // 2. Fotocondutores / Cilindros (Drums)
  if (lower.includes('drum') || lower.includes('imaging') || lower.includes('fotocondutor') || lower.includes('cilindro') || type === 'imaging_kit') {
    if (lower.includes('black') || lower.includes('preto') || lower.includes('[r1]')) return 'Cilindro Preto';
    if (lower.includes('cyan') || lower.includes('ciano') || lower.includes('[r2]')) return 'Cilindro Ciano';
    if (lower.includes('magenta') || lower.includes('[r3]')) return 'Cilindro Magenta';
    if (lower.includes('yellow') || lower.includes('amarel') || lower.includes('[r4]')) return 'Cilindro Amarelo';
    return 'Kit Fotocondutor / Cilindro';
  }

  // 3. Fusores e Transferência
  if (lower.includes('fuser') || lower.includes('fusor') || type === 'fuser') {
    return 'Unidade Fusora';
  }
  if (lower.includes('transfer') || type === 'transfer') {
    return 'Módulo de Transferência';
  }
  if (lower.includes('maintenance kit') || lower.includes('kit de manutenção')) {
    return 'Kit de Manutenção Preventiva';
  }

  // 4. Toners e Tintas com slots múltiplos (K1, K2, etc.)
  if (lower.includes('k1') || lower.includes('[k1]')) return 'Toner Preto (K1)';
  if (lower.includes('k2') || lower.includes('[k2]')) return 'Toner Preto (K2)';
  if (lower.includes('black') || lower.includes('preto') || lower.includes('preta') || lower.includes('k cartridge') || lower.includes('bk') || lower.includes('t11a1')) {
    return 'Toner / Tinta Preta';
  }
  if (lower.includes('cyan') || lower.includes('ciano') || lower.includes('c cartridge') || lower.includes('[c]') || lower.includes('t11a2')) {
    return 'Toner / Tinta Ciano';
  }
  if (lower.includes('magenta') || lower.includes('m cartridge') || lower.includes('[m]') || lower.includes('t11a3')) {
    return 'Toner / Tinta Magenta';
  }
  if (lower.includes('yellow') || lower.includes('amarelo') || lower.includes('amarela') || lower.includes('y cartridge') || lower.includes('[y]') || lower.includes('t11a4')) {
    return 'Toner / Tinta Amarela';
  }

  return name;
}

function getSupplyColorByName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('cyan') || n.includes('ciano') || n.includes('[c]') || n.includes('[r2]') || n.includes('t11a2')) return '#06b6d4'; // Cyan
  if (n.includes('magenta') || n.includes('[m]') || n.includes('[r3]') || n.includes('t11a3')) return '#ec4899'; // Magenta
  if (n.includes('yellow') || n.includes('amarel') || n.includes('[y]') || n.includes('[r4]') || n.includes('t11a4')) return '#eab308'; // Yellow
  if (n.includes('black') || n.includes('preto') || n.includes('preta') || n.includes('[k') || n.includes('[r1]') || n.includes('t11a1')) return '#334155'; // Black
  return 'var(--color-primary)';
}

function isRefillableTank(supply) {
  if (!supply || !supply.name) return false;
  const lower = supply.name.toLowerCase();
  return (lower.includes('ink bottle') || lower.includes('tanque de tinta')) && supply.percentage === -2;
}

function normalizeSupplyPercentage(supply) {
  if (isRefillableTank(supply)) return 85;
  return supply.percentage;
}

function isWasteSupply(supply) {
  if (!supply || !supply.name) return false;
  const lower = supply.name.toLowerCase();
  return lower.includes('waste') || lower.includes('resíduo') || lower.includes('residuo');
}

function getWasteStatus(percentage) {
  if (percentage < 0) return 'ok';
  if (percentage >= 80) return 'critical';
  if (percentage >= 50) return 'warning';
  return 'ok';
}

function getSupplyStatusByPercentage(pct, isRefillable = false) {
  if (isRefillable) return 'ok';
  if (pct === null || pct === undefined || pct < 0) return 'ok';
  if (pct === 0 || pct < 10) return 'critical';
  if (pct <= 30) return 'warning';
  return 'ok';
}

function extractInkLevels(supplies = []) {
  const result = { black: null, cyan: null, magenta: null, yellow: null };

  supplies.forEach(s => {
    const pct = normalizeSupplyPercentage(s);
    if (pct < 0) return;
    const lower = s.name.toLowerCase();

    if (lower.includes('black') || lower.includes('preto') || lower.includes('preta') || lower.includes('bk') || lower.includes('k cartridge') || lower.includes('tanque de tinta preta')) {
      if (result.black === null || pct < result.black) result.black = pct;
    } else if (lower.includes('cyan') || lower.includes('ciano') || lower.includes('c cartridge')) {
      if (result.cyan === null || pct < result.cyan) result.cyan = pct;
    } else if (lower.includes('magenta') || lower.includes('m cartridge')) {
      if (result.magenta === null || pct < result.magenta) result.magenta = pct;
    } else if (lower.includes('yellow') || lower.includes('amarelo') || lower.includes('y cartridge')) {
      if (result.yellow === null || pct < result.yellow) result.yellow = pct;
    }
  });

  return result;
}

// ==========================================================================
// 6. FORMATAÇÃO DE DATAS E TEMPO RELATIVO (PROJETO HEFESTO)
// ==========================================================================
function formatFullDateTime(iso) {
  if (!iso) return 'N/D';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'N/D';
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/D';
  }
}

function formatRelativeTime(iso) {
  if (!iso) return 'Sem registro';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Sem registro';
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 2) return 'Agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} min`;
    if (diffHours < 24) {
      if (d.getDate() === now.getDate()) {
        return `Hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return `Há ${diffHours}h`;
    }
    if (diffDays === 1) {
      return `Ontem às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays < 7) {
      return `Há ${diffDays} dias`;
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return 'Sem registro';
  }
}

// ==========================================================================
// 7. TEMA (DARK / LIGHT)
// ==========================================================================
function initTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(currentTheme);

  DOM.btnThemeToggle.addEventListener('click', () => {
    const newTheme = AppState.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    showToast(`Modo ${newTheme === 'dark' ? 'Escuro' : 'Claro'} ativado`, 'info');
  });
}

function applyTheme(theme) {
  AppState.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  if (theme === 'dark') {
    DOM.themeIconMoon.style.display = 'block';
    DOM.themeIconSun.style.display = 'none';
  } else {
    DOM.themeIconMoon.style.display = 'none';
    DOM.themeIconSun.style.display = 'block';
  }
}

// ==========================================================================
// 8. CARREGAMENTO E SINCRONIZAÇÃO DE DADOS
// ==========================================================================
async function loadDashboardData(showLoading = true, force = false) {
  if (AppState.isRefreshing) return;
  AppState.isRefreshing = true;

  if (DOM.refreshIcon) DOM.refreshIcon.classList.add('rotating');
  if (DOM.btnRefreshAll) DOM.btnRefreshAll.disabled = true;
  const startTime = Date.now();

  try {
    const [units, printers] = await Promise.all([
      API.getUnits(),
      API.getPrinters()
    ]);

    AppState.units = units;
    AppState.printers = printers;

    if (AppState.printers.length === 0) {
      AppState.statusData.clear();
      AppState.rechargesSummary = {};
      renderAllViews();
      updateLastUpdatedTimestamp();
      return;
    }

    const [statuses, rechargesSummary] = await Promise.all([
      API.getAllStatus(force),
      API.getRechargesSummary()
    ]);

    AppState.statusData.clear();
    statuses.forEach(item => AppState.statusData.set(item.id, item));
    AppState.rechargesSummary = rechargesSummary || {};

    updateLastUpdatedTimestamp();
    renderAllViews();

    if (force) {
      showToast('Telemetria e histórico de recargas sincronizados!', 'success');
    }

  } catch (err) {
    console.error('[Dashboard]', err);
    showToast(err.message || 'Erro ao conectar ao servidor', 'error');
  } finally {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 650 - elapsed);
    setTimeout(() => {
      AppState.isRefreshing = false;
      if (DOM.refreshIcon) DOM.refreshIcon.classList.remove('rotating');
      if (DOM.btnRefreshAll) DOM.btnRefreshAll.disabled = false;
    }, remaining);
  }
}

function renderAllViews() {
  updateHeaderRoleAndUnit();
  populateDropdownFilters();
  renderOverviewTab();
  if (AppState.userRole === 'admin' && AppState.activeAdminTab === 'forecast') {
    loadAndRenderForecastTab();
  }
}

// Controle de Permissões e Visibilidade baseado no Perfil (Operador vs Admin)
function updateHeaderRoleAndUnit() {
  const adminOnlyElements = document.querySelectorAll('.admin-only');

  if (AppState.userRole === 'admin') {
    // Modo Administrador
    if (DOM.adminRoleBadge) DOM.adminRoleBadge.style.display = 'inline-block';
    
    if (AppState.activeUnitFilter) {
      const u = AppState.units.find(x => x.id === AppState.activeUnitFilter);
      if (DOM.currentUnitBadge) DOM.currentUnitBadge.textContent = u ? u.name : 'Unidade Selecionada';
      if (DOM.headerUnitDesc) DOM.headerUnitDesc.textContent = `Gestão focada na unidade: ${u ? u.name : ''}`;
    } else {
      if (DOM.currentUnitBadge) DOM.currentUnitBadge.textContent = 'Todas as Unidades (Visão Global)';
      if (DOM.headerUnitDesc) DOM.headerUnitDesc.textContent = 'Painel Administrativo Completo - Acesso Total';
    }

    adminOnlyElements.forEach(el => {
      if (el.id === 'admin-main-tabs') {
        el.style.display = 'flex';
      } else if (el.id === 'unit-recent-recharges-section') {
        // Controlado separadamente pelo renderUnitRecentRecharges
      } else {
        el.style.display = el.tagName === 'BUTTON' ? 'inline-flex' : 'block';
      }
    });

    // Mantém aba ativa
    if (AppState.activeAdminTab === 'forecast') {
      if (DOM.tabViewPrinters) DOM.tabViewPrinters.style.display = 'none';
      if (DOM.tabViewForecast) DOM.tabViewForecast.style.display = 'block';
    } else {
      if (DOM.tabViewPrinters) DOM.tabViewPrinters.style.display = 'block';
      if (DOM.tabViewForecast) DOM.tabViewForecast.style.display = 'none';
    }

  } else {
    // Modo Operador (Read-Only focado na sua filial)
    if (DOM.adminRoleBadge) DOM.adminRoleBadge.style.display = 'none';

    const selectedUnitObj = AppState.units.find(u => u.id === AppState.activeUnitFilter);
    if (selectedUnitObj) {
      if (DOM.currentUnitBadge) DOM.currentUnitBadge.textContent = selectedUnitObj.name;
      if (DOM.headerUnitDesc) DOM.headerUnitDesc.textContent = selectedUnitObj.description || `Operação local da unidade ${selectedUnitObj.name}`;
    } else {
      if (DOM.currentUnitBadge) DOM.currentUnitBadge.textContent = 'Minha Unidade';
      if (DOM.headerUnitDesc) DOM.headerUnitDesc.textContent = 'Visão operacional da unidade em tempo real';
    }

    // Esconde todos os elementos administrativos e força visão de inventário
    AppState.activeAdminTab = 'printers';
    if (DOM.tabViewPrinters) DOM.tabViewPrinters.style.display = 'block';
    if (DOM.tabViewForecast) DOM.tabViewForecast.style.display = 'none';

    adminOnlyElements.forEach(el => {
      el.style.display = 'none';
    });
  }
}

function populateDropdownFilters() {
  const curUnit = AppState.activeUnitFilter;
  
  // Select no bloco Status Agora (Apenas Administrador)
  DOM.overviewUnitFilter.innerHTML = '<option value="">Todas as Unidades</option>' + 
    AppState.units.map(u => `<option value="${u.id}" ${curUnit === u.id ? 'selected' : ''}>${escapeHtml(u.name)}</option>`).join('');

  // Select na tela de Login (Operador: Unidade Obrigatória!)
  if (DOM.loginUnitSelect) {
    DOM.loginUnitSelect.innerHTML = '<option value="">Selecione sua unidade / filial...</option>' + 
      AppState.units.map(u => `<option value="${u.id}" ${curUnit === u.id ? 'selected' : ''}>${escapeHtml(u.name)}</option>`).join('');
  }

  // Select no Modal de Cadastro
  if (DOM.formUnitSelect) {
    const activeSelected = curUnit || '';
    DOM.formUnitSelect.innerHTML = '<option value="">Selecione a Pasta de Unidade...</option>' + 
      AppState.units.map(u => `<option value="${u.id}" ${activeSelected === u.id ? 'selected' : ''}>${escapeHtml(u.name)}</option>`).join('');
  }

  const locations = new Set();
  getScopedPrinters().forEach(p => {
    if (p.location?.trim()) locations.add(p.location.trim());
  });

  const curLoc = DOM.filterLocationSelect.value;
  DOM.filterLocationSelect.innerHTML = '<option value="">Todos os Setores</option>' + 
    Array.from(locations).sort().map(loc => `<option value="${escapeHtml(loc)}" ${curLoc === loc ? 'selected' : ''}>${escapeHtml(loc)}</option>`).join('');
}

function getScopedPrinters() {
  // Operador só pode ver impressoras da sua filial cadastrada
  if (AppState.userRole === 'operator') {
    return AppState.printers.filter(p => p.unitId === AppState.activeUnitFilter);
  }
  // Administrador pode ver todas ou filtrar por uma
  if (!AppState.activeUnitFilter) return AppState.printers;
  return AppState.printers.filter(p => p.unitId === AppState.activeUnitFilter);
}

// ==========================================================================
// 8. FUNÇÕES AUXILIARES DE NOMENCLATURA & MODELO LIMPO
// ==========================================================================
function formatCleanModel(modelStr) {
  if (!modelStr || modelStr === 'Desconhecido' || modelStr === 'N/D') return '';
  return String(modelStr).split(/\r?\n/).map(l => l.trim()).filter(Boolean)[0] || '';
}

function getPrinterLocationTitle(printer) {
  if (printer.location && printer.location.trim()) {
    return printer.location.trim();
  }
  if (printer.name && !/^[0-9A-Z]{10,}$/i.test(printer.name.replace(/[-_]/g, ''))) {
    return printer.name;
  }
  return 'Impressora Local';
}

function getPrinterModelSubtitle(printer, status) {
  const cleanModel = formatCleanModel(status?.info?.model);
  if (cleanModel && cleanModel !== 'Desconhecido') {
    return cleanModel;
  }
  return 'Modelo não detectado';
}

// ==========================================================================
// 9. VISÃO GERAL / MINHAS IMPRESSORAS (FORMATO LISTA/TABELA COM AÇÕES POR PERFIL)
// ==========================================================================
function renderOverviewTab() {
  const scopedPrinters = getScopedPrinters();
  const total = scopedPrinters.length;

  let countCrit = 0;
  let countWarn = 0;
  let countOff = 0;
  let countAccessible = 0;

  scopedPrinters.forEach(p => {
    const st = AppState.statusData.get(p.id);
    if (!st || !st.online) {
      countOff++;
    } else {
      countAccessible++;
      const supplies = st.supplies || [];
      const hasCritical = supplies.some(s => !isWasteSupply(s) && normalizeSupplyPercentage(s) >= 0 && normalizeSupplyPercentage(s) < 10);
      const hasWarning = supplies.some(s => !isWasteSupply(s) && normalizeSupplyPercentage(s) >= 10 && normalizeSupplyPercentage(s) <= 30);

      if (hasCritical) countCrit++;
      else if (hasWarning) countWarn++;
    }
  });

  DOM.countCritical.textContent = countCrit;
  DOM.countWarning.textContent = countWarn;
  DOM.countOffline.textContent = countOff;

  // Banner Cockpit de Telemetria & Banner Conectadas
  const onlineCount = countAccessible;
  if (DOM.statusNowSummaryText) {
    DOM.statusNowSummaryText.innerHTML = total > 0 
      ? `<strong>${total}</strong> impressoras monitoradas <span style="opacity: 0.5; margin: 0 4px;">•</span> <span style="color: var(--color-success); font-weight: 700;">${onlineCount} Online</span>`
      : 'Nenhum equipamento cadastrado nesta unidade';
  }

  if (DOM.countConnectedBanner) {
    DOM.countConnectedBanner.textContent = onlineCount;
  }

  DOM.countAll.textContent = total;
  DOM.pillCountCritical.textContent = countCrit;
  DOM.pillCountWarning.textContent = countWarn;
  DOM.pillCountOffline.textContent = countOff;

  // Atualiza classe active-card nos cards e banner
  document.querySelectorAll('.status-metric-card[data-action], .connected-hero-banner[data-action]').forEach(c => {
    c.classList.toggle('active-card', c.dataset.filter === AppState.overviewFilter);
  });

  renderMyPrinters(scopedPrinters);
  renderUnitRecentRecharges();
}

// Histórico Resumido de Reposições na Unidade (Visível exclusivamente para Administrador)
async function renderUnitRecentRecharges() {
  if (!DOM.unitRecentRechargesSection || !DOM.unitRecentRechargesList) return;

  // Apenas o perfil Administrador pode ver a seção de reposições da unidade, e apenas na aba de inventário
  if (AppState.userRole !== 'admin' || AppState.activeAdminTab === 'forecast') {
    DOM.unitRecentRechargesSection.style.display = 'none';
    return;
  }

  DOM.unitRecentRechargesSection.style.display = 'block';

  const scopedPrinters = getScopedPrinters();
  const scopedIds = new Set(scopedPrinters.map(p => p.id));

  try {
    let recharges = await API.getRecharges();
    if (scopedPrinters.length > 0 && scopedPrinters.length < AppState.printers.length) {
      recharges = recharges.filter(r => scopedIds.has(r.printerId));
    }

    if (DOM.unitRechargesCountBadge) {
      DOM.unitRechargesCountBadge.textContent = recharges.length;
    }

    if (recharges.length === 0) {
      DOM.unitRecentRechargesList.innerHTML = `
        <div style="padding: 0.75rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; background: var(--bg-input); border-radius: var(--radius-md);">
          Nenhuma reposição recente registrada nesta unidade.
        </div>
      `;
      return;
    }

    // Exibe até as 5 reposições mais recentes de forma limpa (sem dados técnicos/IPs/telemetria interna)
    const recent = recharges.slice(0, 5);
    DOM.unitRecentRechargesList.innerHTML = recent.map(r => {
      const isOfficial = r.isFullRecharge;
      const relTime = formatRelativeTime(r.timestamp);
      const fullDate = formatFullDateTime(r.timestamp);
      const locationLabel = r.location || r.printerName || 'Impressora';

      return `
        <div class="unit-recharge-item">
          <div class="unit-recharge-left">
            <span class="unit-recharge-dot" style="${isOfficial ? '' : 'background: #f59e0b;'}"></span>
            <div>
              <span class="unit-recharge-supply">${escapeHtml(translateSupplyName(r.supplyName))}</span>
              <span class="unit-recharge-printer">• ${escapeHtml(locationLabel)}</span>
            </div>
          </div>
          <div class="unit-recharge-right">
            <span class="printer-recharge-tag ${isOfficial ? '' : 'partial'}">${isOfficial ? 'Nova 100%' : 'Troca Parcial'}</span>
            <span title="${escapeHtml(fullDate)}">${escapeHtml(relTime)}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    // Silencioso em caso de erro de rede
  }
}

function renderMyPrinters(scopedPrinters) {
  if (!DOM.myPrintersListBody) return;

  if (scopedPrinters.length === 0) {
    DOM.myPrintersListBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          ${Icons.printer}
          <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 600; margin-top: 0.5rem;">Nenhuma impressora encontrada nesta unidade</div>
          ${AppState.userRole === 'admin' ? `
            <p style="font-size: 0.8rem; margin-top: 0.2rem;">Cadastre uma nova impressora usando o botão "+ Nova Impressora" no topo.</p>
          ` : `
            <p style="font-size: 0.8rem; margin-top: 0.2rem;">Solicite ao administrador o cadastro de impressoras para sua filial.</p>
          `}
        </td>
      </tr>
    `;
    return;
  }

  let filtered = scopedPrinters.filter(printer => {
    const status = AppState.statusData.get(printer.id);
    const isOnline = status && status.online;
    const supplies = (status && status.supplies) || [];

    const query = AppState.searchQuery.toLowerCase().trim();
    if (query) {
      const matchName = printer.name.toLowerCase().includes(query);
      const matchIp = printer.ip.toLowerCase().includes(query);
      const matchLoc = (printer.location || '').toLowerCase().includes(query);
      const matchModel = (status?.info?.model || '').toLowerCase().includes(query);
      if (!matchName && !matchIp && !matchLoc && !matchModel) return false;
    }

    if (AppState.locationFilter && (printer.location || '').trim() !== AppState.locationFilter) {
      return false;
    }

    if (AppState.overviewFilter === 'critical') {
      return isOnline && supplies.some(s => !isWasteSupply(s) && normalizeSupplyPercentage(s) >= 0 && normalizeSupplyPercentage(s) < 10);
    }
    if (AppState.overviewFilter === 'warning') {
      const hasCritical = supplies.some(s => !isWasteSupply(s) && normalizeSupplyPercentage(s) >= 0 && normalizeSupplyPercentage(s) < 10);
      const hasWarning = supplies.some(s => !isWasteSupply(s) && normalizeSupplyPercentage(s) >= 10 && normalizeSupplyPercentage(s) <= 30);
      return isOnline && hasWarning && !hasCritical;
    }
    if (AppState.overviewFilter === 'offline') {
      return !isOnline;
    }
    if (AppState.overviewFilter === 'online') {
      return isOnline;
    }

    return true;
  });

  filtered.sort((a, b) => {
    const stA = AppState.statusData.get(a.id);
    const stB = AppState.statusData.get(b.id);

    if (AppState.sortBy === 'lowest-supply') {
      const getLowest = (st) => {
        if (!st?.online || !st.supplies?.length) return 999;
        const valid = st.supplies.filter(s => !isWasteSupply(s) && normalizeSupplyPercentage(s) >= 0);
        return valid.length > 0 ? Math.min(...valid.map(s => normalizeSupplyPercentage(s))) : 999;
      };
      return getLowest(stA) - getLowest(stB);
    }
    if (AppState.sortBy === 'name-asc') return (a.location || a.name).localeCompare(b.location || b.name);
    if (AppState.sortBy === 'ip-asc') return a.ip.localeCompare(b.ip, undefined, { numeric: true });
    return 0;
  });

  if (filtered.length === 0) {
    DOM.myPrintersListBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Nenhuma impressora corresponde aos filtros aplicados.
        </td>
      </tr>
    `;
    return;
  }

  DOM.myPrintersListBody.innerHTML = filtered.map(printer => {
    const status = AppState.statusData.get(printer.id);
    const isOnline = status && status.online;
    const supplies = (status && status.supplies) || [];

    // Normalizar suprimentos: tanques recarregáveis (-2) viram ~85%, waste é tratado separadamente
    const normalizedSupplies = supplies.map(s => ({
      ...s,
      _normalizedPct: normalizeSupplyPercentage(s),
      _isWaste: isWasteSupply(s)
    }));
    const validSupplies = normalizedSupplies.filter(s => s._normalizedPct >= 0 && !s._isWaste).sort((a, b) => a._normalizedPct - b._normalizedPct);
    const lowest = validSupplies[0];

    // Filtra apenas os toners e tintas principais de consumo para a visualização resumida
    const mainToners = normalizedSupplies.filter(s => 
      s._normalizedPct >= 0 && 
      !s._isWaste && 
      (s.type === 'toner' || !s.type) &&
      !s.name.toLowerCase().includes('drum') && 
      !s.name.toLowerCase().includes('fuser') && 
      !s.name.toLowerCase().includes('transfer')
    );

    const locationTitle = getPrinterLocationTitle(printer);
    const modelSubtitle = getPrinterModelSubtitle(printer, status);

    let statusClass = 'offline';
    let statusIcon = Icons.wifiOff;
    let statusText = 'Sem conexão';

    if (isOnline) {
      if (lowest && lowest._normalizedPct < 10) {
        statusClass = 'critical';
        statusIcon = Icons.alertOctagon;
        statusText = lowest._normalizedPct === 0 ? 'Toner Esgotado' : 'Nível Crítico';
      } else if (lowest && lowest._normalizedPct <= 30) {
        statusClass = 'warning';
        statusIcon = Icons.alertTriangle;
        statusText = 'Nível Atenção';
      } else {
        statusClass = 'online';
        statusIcon = Icons.checkCircle;
        statusText = 'Operacional';
      }
    }

    let supplyCellHTML = '';
    if (!isOnline) {
      supplyCellHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Inacessível na rede</span>`;
    } else if (lowest) {
      const pct = lowest._normalizedPct;
      const isRefillable = isRefillableTank(lowest);
      const isZero = pct === 0;
      const displayVal = isZero ? '0% (Esgotado)' : isRefillable ? `~${pct}% (Estimado)` : `${pct}%`;
      const fillWidth = isZero ? 100 : pct;
      const supplyColorStatus = getSupplyStatusByPercentage(pct, isRefillable);

      // Mini-paleta limpa exclusivamente com os toners/tintas principais (sem poluir com cilindros/fusores)
      let allSuppliesDotsHTML = '';
      if (mainToners.length > 1) {
        allSuppliesDotsHTML = `
          <div style="display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.35rem;" title="Níveis dos toners e tintas">
            ${mainToners.map(s => {
              const dotColor = getSupplyColorByName(s.name);
              const statusClr = getSupplyStatusByPercentage(s._normalizedPct, isRefillableTank(s));
              const borderClr = statusClr === 'critical' ? 'var(--color-danger)' : (statusClr === 'warning' ? 'var(--color-warning)' : 'var(--color-success)');
              const translatedShort = translateSupplyName(s.name, s.type)
                .replace('Toner / Tinta ', '')
                .replace('Cartucho / Toner ', '')
                .replace('Bolsa de Tinta ', '');
              return `
                <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.68rem; font-weight: 700; color: var(--text-secondary); background: var(--bg-input); padding: 1px 5px; border-radius: 4px; border-left: 2px solid ${borderClr};" title="${escapeHtml(translateSupplyName(s.name, s.type))}: ${s._normalizedPct}%">
                  <span style="width: 7px; height: 7px; border-radius: 50%; background-color: ${dotColor}; display: inline-block;"></span>
                  <span>${translatedShort}: ${s._normalizedPct}%</span>
                </span>
              `;
            }).join('')}
          </div>
        `;
      }

      // Tag de última recarga recente se houver
      const rechargeInfo = AppState.rechargesSummary && AppState.rechargesSummary[printer.id];
      let recentRechargeHTML = '';
      if (rechargeInfo && rechargeInfo.lastRecharge) {
        const rec = rechargeInfo.lastRecharge;
        const isRecent = (Date.now() - new Date(rec.timestamp).getTime()) < (7 * 86400000);
        if (isRecent) {
          const recName = translateSupplyName(rec.supplyName).replace('Cartucho / Toner ', '').replace('Bolsa de Tinta ', '');
          recentRechargeHTML = `
            <div style="margin-top: 0.3rem; font-size: 0.7rem; color: var(--color-success); font-weight: 700; display: flex; align-items: center; gap: 0.25rem;" title="Última reposição: ${escapeHtml(rec.supplyName)} (${rec.newLevel}%) em ${formatFullDateTime(rec.timestamp)}">
              <svg class="icon icon-xs" viewBox="0 0 24 24" style="width: 12px; height: 12px; color: var(--color-success);"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>Troca Recente: ${escapeHtml(recName)} (${rec.newLevel}%)</span>
            </div>
          `;
        }
      }

      supplyCellHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.2rem; min-width: 150px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
            <span style="font-weight: 600; color: var(--text-primary);">${escapeHtml(translateSupplyName(lowest.name))} (Crítico)</span>
            <strong class="supply-percentage ${supplyColorStatus}" style="font-family: var(--font-mono);">${displayVal}</strong>
          </div>
          <div class="progress-track" style="height: 5px;">
            <div class="progress-fill ${supplyColorStatus}" style="width: ${Math.max(5, fillWidth)}%"></div>
          </div>
          ${allSuppliesDotsHTML}
          ${recentRechargeHTML}
        </div>
      `;
    } else {
      supplyCellHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Suprimentos: N/D</span>`;
    }

    const isAdmin = AppState.userRole === 'admin';

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.9rem;">${escapeHtml(locationTitle)}</div>
          ${isAdmin && printer.unitName ? `<span class="unit-current-badge" style="font-size: 0.65rem; margin-top: 0.2rem; display: inline-block;">${escapeHtml(printer.unitName)}</span>` : ''}
        </td>
        <td style="color: var(--text-secondary); font-size: 0.85rem;">
          ${escapeHtml(modelSubtitle)}
        </td>
        <td>
          <code style="font-family: var(--font-mono); color: var(--color-primary); font-weight: 600;">${printer.ip}</code>
        </td>
        <td>
          ${supplyCellHTML}
        </td>
        <td style="text-align: center;">
          <span class="action-recommended-badge ${statusClass}" style="font-size: 0.75rem;">
            ${statusIcon}
            <span>${statusText}</span>
          </span>
        </td>
        <td style="text-align: center;">
          <div style="display: flex; justify-content: center; gap: 0.35rem;">
            <button class="btn btn-secondary btn-sm" onclick="openPrinterDetailDrawer('${printer.id}')" title="Visualizar Raio-X">
              ${Icons.eye}
              <span>Raio-X</span>
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-refresh-row-${printer.id}" onclick="refreshSinglePrinter('${printer.id}', this)" title="Atualizar dados desta impressora">
              ${Icons.refresh}
            </button>
            ${isAdmin ? `
              <button class="btn btn-secondary btn-sm" onclick="openEditPrinterModal('${printer.id}')" title="Editar dados cadastrais">
                ${Icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" onclick="confirmDeletePrinter('${printer.id}', '${escapeHtml(locationTitle)}')" style="color: var(--color-danger);" title="Excluir impressora">
                ${Icons.trash}
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// 10. ATUALIZAÇÃO INDIVIDUAL DE UMA IMPRESSORA
// ==========================================================================
async function refreshSinglePrinter(id, btnElement) {
  const icon = btnElement ? btnElement.querySelector('svg') : null;
  if (icon) icon.classList.add('rotating');
  if (btnElement) btnElement.disabled = true;

  try {
    const updatedStatus = await API.getPrinterStatus(id);
    AppState.statusData.set(id, updatedStatus);
    renderOverviewTab();
    showToast('Dados da impressora atualizados com sucesso!', 'success');
  } catch (err) {
    showToast(`Erro ao atualizar: ${err.message}`, 'error');
  } finally {
    if (icon) icon.classList.remove('rotating');
    if (btnElement) btnElement.disabled = false;
  }
}

// ==========================================================================
// ==========================================================================
// 11. EXPORTAÇÃO GERENCIAL DE RELATÓRIO DE INSUMOS & TINTAS (CSV / EXCEL)
// ==========================================================================
function exportInkReportCsv() {
  if (AppState.userRole !== 'admin') {
    showToast('Apenas administradores podem exportar relatórios.', 'error');
    return;
  }

  const rows = [
    [
      'Unidade / Pasta',
      'Local / Setor',
      'Modelo da Impressora',
      'Endereço IP',
      'Número de Série',
      'Total Páginas Impressas',
      'Toner / Tinta Preta (%)',
      'Tinta Ciano (%)',
      'Tinta Magenta (%)',
      'Tinta Amarela (%)',
      'Suprimento Mais Baixo (%)',
      'Status Operacional'
    ]
  ];
  
  const printers = getScopedPrinters();
  if (printers.length === 0) {
    showToast('Nenhuma impressora disponível para exportação.', 'warning');
    return;
  }

  printers.forEach(printer => {
    const status = AppState.statusData.get(printer.id);
    const info = status?.info || {};
    const cleanModel = formatCleanModel(info.model) || 'N/D';
    const inks = extractInkLevels(status?.supplies || []);
    const supplies = status?.supplies || [];

    let statusGeral = !status?.online ? 'Sem Conexão' : 'Operacional';
    let lowestPct = 'N/D';

    if (status?.online) {
      const validSupplies = supplies
        .map(s => ({ ...s, _pct: normalizeSupplyPercentage(s) }))
        .filter(s => s._pct >= 0 && !isWasteSupply(s))
        .sort((a, b) => a._pct - b._pct);

      if (validSupplies.length > 0) {
        lowestPct = `${validSupplies[0]._pct}% (${translateSupplyName(validSupplies[0].name)})`;
        const minVal = validSupplies[0]._pct;
        if (minVal === 0) statusGeral = 'Toner Esgotado';
        else if (minVal < 10) statusGeral = 'Nível Crítico (Troca Imediata)';
        else if (minVal <= 30) statusGeral = 'Nível Atenção (Pedir Estoque)';
        else statusGeral = 'Nível Seguro / Operacional';
      }
    }

    const serial = info.serialNumber && info.serialNumber !== 'N/D' 
      ? info.serialNumber 
      : (printer.name && printer.name !== printer.location ? printer.name : 'N/D');

    rows.push([
      printer.unitName || 'Sem Unidade',
      printer.location || printer.name,
      cleanModel,
      printer.ip,
      serial,
      info.pageCount ? Number(info.pageCount) : 0,
      inks.black !== null ? `${inks.black}%` : 'N/D',
      inks.cyan !== null ? `${inks.cyan}%` : 'N/D',
      inks.magenta !== null ? `${inks.magenta}%` : 'N/D',
      inks.yellow !== null ? `${inks.yellow}%` : 'N/D',
      lowestPct,
      statusGeral
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `relatorio_suprimentos_prevent_senior_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Relatório de suprimentos exportado com sucesso!', 'success');
}

// ==========================================================================
// 12. MODAL DE TESTE DE CONEXÃO COM IMPRESSORA NÃO CADASTRADA (ADM)
// ==========================================================================
function openTestIpModal() {
  if (AppState.userRole !== 'admin') {
    showToast('Apenas administradores podem executar testes de conexão IP.', 'error');
    return;
  }
  DOM.inputTestIp.value = '';
  DOM.testIpResultBox.innerHTML = '';
  DOM.btnQuickAddFromTest.style.display = 'none';
  AppState.testedPrinterIp = '';
  DOM.modalTestIp.classList.add('active');
  setTimeout(() => DOM.inputTestIp.focus(), 100);
}

function closeTestIpModal() {
  DOM.modalTestIp.classList.remove('active');
}

async function handleTestIpSubmit(e) {
  e.preventDefault();
  const ip = DOM.inputTestIp.value.trim();
  if (!ip) return;

  DOM.btnSubmitTestIp.disabled = true;
  DOM.btnSubmitTestIp.innerHTML = `<span>Testando rede...</span>`;
  DOM.testIpResultBox.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-secondary); padding: 0.5rem 0;">Enviando pacotes SNMP (UDP 161) para <code>${ip}</code>...</div>`;
  DOM.btnQuickAddFromTest.style.display = 'none';

  try {
    const res = await API.testAnyIp(ip);
    
    if (res.success) {
      AppState.testedPrinterIp = ip;
      const cleanModel = formatCleanModel(res.details?.info?.model) || 'Impressora Compatível';
      const serial = res.details?.info?.serialNumber || 'Detectado';

      DOM.testIpResultBox.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--color-success); font-weight: 700;">
            ${Icons.checkCircle}
            <span>Comunicação Estabelecida com Sucesso!</span>
          </div>
          <div style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 0.5rem; line-height: 1.5;">
            <div><strong>Modelo Detectado:</strong> ${escapeHtml(cleanModel)}</div>
            <div><strong>Número de Série:</strong> ${escapeHtml(serial)}</div>
            <div><strong>Porta SNMP:</strong> UDP 161 (Ativa)</div>
          </div>
        </div>
      `;
      DOM.btnQuickAddFromTest.style.display = 'inline-flex';
      showToast(`Impressora no IP ${ip} respondeu com sucesso!`, 'success');
    } else {
      DOM.testIpResultBox.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--color-danger); font-weight: 700;">
            ${Icons.alertOctagon}
            <span>Sem Resposta no IP Informado</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.4rem;">
            O equipamento não respondeu na porta SNMP UDP 161. Verifique se a impressora está ligada, conectada à rede local e com o protocolo SNMP habilitado.
          </p>
        </div>
      `;
      showToast(`O IP ${ip} não respondeu na rede local.`, 'error');
    }
  } catch (err) {
    DOM.testIpResultBox.innerHTML = `<div style="color: var(--color-danger); font-size: 0.85rem;">Falha no teste: ${err.message}</div>`;
  } finally {
    DOM.btnSubmitTestIp.disabled = false;
    DOM.btnSubmitTestIp.innerHTML = `${Icons.zap}<span>Testar Conexão</span>`;
  }
}

function handleQuickAddFromTest() {
  const ip = AppState.testedPrinterIp || DOM.inputTestIp.value.trim();
  closeTestIpModal();
  openAddPrinterModal();
  if (ip) {
    DOM.formIp.value = ip;
  }
}

// ==========================================================================
// 13. SIDE DRAWER (RAIO-X 360° DA IMPRESSORA)
// ==========================================================================
let currentDrawerPrinterId = null;

async function openPrinterDetailDrawer(id) {
  const printer = AppState.printers.find(p => p.id === id);
  if (!printer) return;

  currentDrawerPrinterId = id;
  const status = AppState.statusData.get(id);
  const info = status?.info || {};
  const supplies = status?.supplies || [];
  const trays = status?.trays || [];
  const isOnline = status?.online;

  const cleanModel = formatCleanModel(info.model);
  const locationTitle = getPrinterLocationTitle(printer);

  DOM.detailPrinterName.textContent = `Raio-X: ${locationTitle}`;

  // Abre a gaveta imediatamente
  DOM.drawerPrinterDetail.classList.add('active');

  const tonerSupplies = [];
  const drumSupplies = [];
  const maintenanceSupplies = [];
  const wasteSupplies = [];

  if (isOnline && supplies.length > 0) {
    supplies.forEach(s => {
      const lower = (s.name || '').toLowerCase();
      if (isWasteSupply(s)) {
        wasteSupplies.push(s);
      } else if (lower.includes('drum') || lower.includes('imaging') || lower.includes('fotocondutor') || lower.includes('cilindro') || s.type === 'imaging_kit') {
        drumSupplies.push(s);
      } else if (lower.includes('fuser') || lower.includes('fusor') || lower.includes('transfer') || lower.includes('laser') || lower.includes('kit') || s.type === 'fuser' || s.type === 'transfer') {
        maintenanceSupplies.push(s);
      } else {
        tonerSupplies.push(s);
      }
    });
  }

  // Buscar histórico de recargas específico desta impressora
  let printerRecharges = [];
  try {
    printerRecharges = await API.getRecharges({ printerId: printer.id });
  } catch (err) {
    printerRecharges = [];
  }

  const isAdmin = AppState.userRole === 'admin';

  function renderSupplyCardsList(list) {
    return list.map(s => {
      const pct = normalizeSupplyPercentage(s);
      const refillable = isRefillableTank(s);
      const isZero = pct === 0;
      const isND = pct < 0;
      const textVal = isZero ? '0% (Esgotado)' : isND ? 'N/D' : refillable ? `~${pct}% (Estimado)` : `${pct}%`;
      const fillWidth = isZero ? 100 : isND ? 0 : pct;
      const statusClass = getSupplyStatusByPercentage(pct, refillable);
      const borderStatus = statusClass === 'critical' ? 'var(--color-danger)' : (statusClass === 'warning' ? 'var(--color-warning)' : 'var(--color-success)');
      const dotColor = getSupplyColorByName(s.name);

      const matchedRec = printerRecharges.find(r => r.supplyName === s.name || r.supplyType === s.type);
      const isRecentlyRecharged = matchedRec && (Date.now() - new Date(matchedRec.timestamp).getTime()) < (7 * 86400000);
      const rechargeBadge = isRecentlyRecharged 
        ? `<span class="printer-recharge-tag" style="margin-left: 0.4rem; font-size: 0.65rem;" title="Trocado em ${formatFullDateTime(matchedRec.timestamp)} (${matchedRec.newLevel}%)">✨ Recarga (${matchedRec.newLevel}%)</span>` 
        : '';

      return `
        <div class="detail-chip" style="border-left: 3px solid ${borderStatus};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); display: inline-flex; align-items: center; flex-wrap: wrap; gap: 0.35rem;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${dotColor}; display: inline-block;"></span>
              <span>${escapeHtml(translateSupplyName(s.name, s.type))}</span>
              ${refillable ? ' <span title="Tanque recarregável - nível estimado" style="cursor: help; opacity: 0.6;">≈</span>' : ''}
              ${rechargeBadge}
            </span>
            <span class="supply-percentage ${statusClass}" style="font-size: 0.9rem; font-weight: 800; font-family: var(--font-mono);">${textVal}</span>
          </div>
          <div class="progress-track" style="margin-top: 0.45rem;">
            <div class="progress-fill ${statusClass}" style="width: ${Math.max(5, fillWidth)}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Suprimentos divididos de forma elegante e intuitiva
  let suppliesHTML = '';
  if (isOnline && (tonerSupplies.length > 0 || drumSupplies.length > 0 || maintenanceSupplies.length > 0 || wasteSupplies.length > 0)) {
    if (tonerSupplies.length > 0) {
      suppliesHTML += `
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          ${renderSupplyCardsList(tonerSupplies)}
        </div>
      `;
    }

    if (drumSupplies.length > 0) {
      suppliesHTML += `
        <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-top: 1.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
          <svg class="icon icon-xs" viewBox="0 0 24 24" style="color: var(--color-primary);"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span>Cilindros / Fotocondutores (Drums)</span>
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          ${renderSupplyCardsList(drumSupplies)}
        </div>
      `;
    }

    if (maintenanceSupplies.length > 0) {
      suppliesHTML += `
        <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-top: 1.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
          <svg class="icon icon-xs" viewBox="0 0 24 24" style="color: var(--color-primary);"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          <span>Unidades de Fusão & Manutenção</span>
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          ${renderSupplyCardsList(maintenanceSupplies)}
        </div>
      `;
    }

    if (wasteSupplies.length > 0) {
      suppliesHTML += `
        <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-top: 1.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
          ${Icons.trash}
          <span>Caixas de Resíduos & Manutenção</span>
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          ${renderSupplyCardsList(wasteSupplies)}
        </div>
      `;
    }
  } else if (!isOnline) {
    suppliesHTML = `<p style="color: var(--color-danger); font-size: 0.85rem;">Equipamento offline. Não é possível ler os suprimentos agora.</p>`;
  } else {
    suppliesHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Suprimentos: N/D (Equipamento não reportou níveis).</p>`;
  }

  let traysHTML = '';
  if (isOnline && trays.length > 0) {
    traysHTML = trays.map(t => `
      <div class="detail-chip">
        <div class="detail-chip-lbl">${Icons.paper} ${escapeHtml(t.name.replace(/Tray/i, 'Bandeja'))}</div>
        <div class="detail-chip-val tabular-nums">${t.percentage >= 0 ? t.percentage + '%' : 'Abastecida'}</div>
      </div>
    `).join('');
  }

  const serialVal = info.serialNumber && info.serialNumber !== 'N/D' 
    ? info.serialNumber 
    : (printer.name && printer.name !== printer.location ? printer.name : 'N/D');

  // Linha do tempo das recargas (Visível exclusivamente para Perfil de Administrador)
  let adminRechargesSectionHTML = '';
  if (isAdmin) {
    let rechargesTimelineHTML = '';
    if (printerRecharges.length === 0) {
      rechargesTimelineHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; background: var(--bg-input); border-radius: var(--radius-md); border: 1px dashed var(--border-card);">
          Nenhum evento no histórico ainda. Clique em <strong>"Registrar Recarga"</strong> para lançar a primeira troca.
        </div>
      `;
    } else {
      rechargesTimelineHTML = printerRecharges.map(rec => {
        const isOfficial = rec.isFullRecharge;
        const formattedDate = formatFullDateTime(rec.timestamp);
        const relTime = formatRelativeTime(rec.timestamp);
        const pagesText = rec.pagesSinceLastRecharge > 0 
          ? `<span style="color: var(--color-success); font-weight: 700;">+${rec.pagesSinceLastRecharge.toLocaleString('pt-BR')}</span> pág. no ciclo` 
          : 'Ciclo inicial';

        return `
          <div class="recharge-item-card">
            <div class="recharge-item-top">
              <div>
                <span class="recharge-item-supply">${escapeHtml(translateSupplyName(rec.supplyName))}</span>
                <span class="printer-recharge-tag ${isOfficial ? '' : 'partial'}" style="margin-left: 0.5rem;">${escapeHtml(rec.statusTag || (isOfficial ? 'Oficial (100%)' : 'Parcial'))}</span>
              </div>
              <span class="recharge-item-date" title="${escapeHtml(formattedDate)}">${escapeHtml(relTime)}</span>
            </div>
            <div class="recharge-item-meta">
              <span class="recharge-item-stat">Nível: <strong>${rec.previousLevel}% ➔ ${rec.newLevel}%</strong></span>
              <span class="recharge-item-stat">Total: <strong>${rec.pageCount ? Number(rec.pageCount).toLocaleString('pt-BR') : '0'} pág.</strong></span>
              <span class="recharge-item-stat">${pagesText}</span>
              <span style="color: var(--text-muted); font-size: 0.7rem;">• ${escapeHtml(rec.technician || 'Sensor SNMP')}</span>
            </div>
            ${rec.notes ? `<div class="recharge-item-notes">Obs: ${escapeHtml(rec.notes)}</div>` : ''}
          </div>
        `;
      }).join('');
    }

    adminRechargesSectionHTML = `
      <div class="drawer-recharges-header" style="margin-top: 1.75rem;">
        <div class="drawer-recharges-title">
          <svg class="icon icon-xs" viewBox="0 0 24 24" style="color: var(--color-primary); width: 16px; height: 16px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Histórico de Recargas & Auditoria (TI)</span>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openManualRechargeModal('${printer.id}')" title="Registrar uma recarga manualmente">
          <svg class="icon icon-xs" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          <span>Registrar Recarga</span>
        </button>
      </div>
      <div class="recharges-timeline-list">
        ${rechargesTimelineHTML}
      </div>
    `;
  }

  DOM.detailModalBody.innerHTML = `
    <div class="detail-meta-grid">
      <div class="detail-chip">
        <div class="detail-chip-lbl">Pasta / Unidade</div>
        <div class="detail-chip-val">${escapeHtml(printer.unitName || 'Sem Unidade')}</div>
      </div>
      <div class="detail-chip">
        <div class="detail-chip-lbl">Modelo da Impressora</div>
        <div class="detail-chip-val" style="font-weight: 700;">${escapeHtml(cleanModel || 'N/D')}</div>
      </div>
      <div class="detail-chip">
        <div class="detail-chip-lbl">Endereço IP</div>
        <div class="detail-chip-val"><code style="font-family: var(--font-mono); color: var(--color-primary);">${printer.ip}</code></div>
      </div>
      <div class="detail-chip">
        <div class="detail-chip-lbl">Setor / Local</div>
        <div class="detail-chip-val">${escapeHtml(printer.location || 'Sem localização')}</div>
      </div>
      <div class="detail-chip" style="grid-column: 1 / -1;">
        <div class="detail-chip-lbl">Número de Série</div>
        <div class="detail-chip-val tabular-nums">${escapeHtml(serialVal)}</div>
      </div>
      <div class="detail-chip" style="grid-column: 1 / -1;">
        <div class="detail-chip-lbl">Total de Impressões Acumuladas (Histórico)</div>
        <div class="detail-chip-val tabular-nums" style="color: var(--color-primary); font-size: 1.1rem;">
          ${info.pageCount ? Number(info.pageCount).toLocaleString('pt-BR') : '0'} páginas
        </div>
      </div>
    </div>

    <div style="margin-top: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin: 0;">Todos os Suprimentos & Tintas</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openManualRechargeModal('${printer.id}')" title="Registrar troca de toner, bolsa de tinta ou abastecimento">
          <svg class="icon icon-xs" viewBox="0 0 24 24" style="color: var(--color-primary); width: 14px; height: 14px;"><path d="M12 5v14M5 12h14"/></svg>
          <span>Registrar Troca</span>
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.65rem;">
        ${suppliesHTML}
      </div>
    </div>

    ${adminRechargesSectionHTML}

    ${trays.length > 0 ? `
      <div style="margin-top: 1.5rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem;">Bandejas de Papel</h4>
        <div class="detail-meta-grid">
          ${traysHTML}
        </div>
      </div>
    ` : ''}
  `;

  DOM.btnDetailEdit.style.display = isAdmin ? 'inline-flex' : 'none';
  DOM.btnDetailDelete.style.display = isAdmin ? 'inline-flex' : 'none';
}

function closePrinterDetailDrawer() {
  DOM.drawerPrinterDetail.classList.remove('active');
}

// ==========================================================================
// 14. REGISTRO MANUAL DE RECARGAS & MODAL (PROJETO HEFESTO)
// ==========================================================================
function openManualRechargeModal(printerId) {
  const printer = AppState.printers.find(p => p.id === printerId);
  if (!printer) return;

  const status = AppState.statusData.get(printerId) || { info: {}, supplies: [] };
  const info = status.info || {};
  const supplies = status.supplies || [];

  DOM.rechargePrinterId.value = printer.id;
  DOM.rechargePrinterName.value = printer.name || printer.location || 'Impressora';
  DOM.rechargePrinterIp.value = printer.ip || '';
  DOM.rechargeUnitName.value = printer.unitName || 'Sem Unidade';
  DOM.rechargeLocation.value = printer.location || '';
  DOM.rechargePageCount.value = info.pageCount || 0;

  DOM.rechargeModalPrinterInfo.innerHTML = `
    <div class="p-name">${escapeHtml(printer.location || printer.name)}</div>
    <div class="p-meta">
      <span>IP: <code>${printer.ip}</code></span>
      <span>Unidade: <strong>${escapeHtml(printer.unitName || 'Sem Unidade')}</strong></span>
      <span>Páginas: <strong>${info.pageCount ? Number(info.pageCount).toLocaleString('pt-BR') : '0'}</strong></span>
    </div>
  `;

  DOM.rechargeSupplySelect.innerHTML = '<option value="">Selecione o suprimento trocado...</option>';
  if (supplies.length > 0) {
    supplies.forEach(s => {
      if (!isWasteSupply(s)) {
        const translated = translateSupplyName(s.name);
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.dataset.type = s.type || 'toner';
        opt.textContent = `${translated} (${s.percentage >= 0 ? s.percentage + '%' : 'Atual'})`;
        DOM.rechargeSupplySelect.appendChild(opt);
      }
    });
  } else {
    [
      { name: 'Cartucho / Toner Preto', type: 'toner' },
      { name: 'Bolsa de Tinta Ciano', type: 'toner' },
      { name: 'Bolsa de Tinta Magenta', type: 'toner' },
      { name: 'Bolsa de Tinta Amarela', type: 'toner' },
      { name: 'Kit Fotocondutor / Cilindro', type: 'imaging_kit' },
      { name: 'Caixa de Manutenção', type: 'waste_toner' }
    ].forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.name;
      opt.dataset.type = item.type;
      opt.textContent = item.name;
      DOM.rechargeSupplySelect.appendChild(opt);
    });
  }

  if (DOM.rechargeSupplySelect.options.length > 1) {
    DOM.rechargeSupplySelect.selectedIndex = 1;
  }
  setRechargeTypeOption('full');
  DOM.rechargeNewLevel.value = 100;
  if (DOM.rechargeCustomDate) {
    const localIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    DOM.rechargeCustomDate.value = localIso;
  }
  DOM.rechargeTechnician.value = '';
  DOM.rechargeNotes.value = '';

  DOM.modalManualRecharge.classList.add('active');
  setTimeout(() => DOM.rechargeSupplySelect.focus(), 100);
}

function closeManualRechargeModal() {
  DOM.modalManualRecharge.classList.remove('active');
}

function setRechargeTypeOption(type) {
  if (type === 'full') {
    DOM.optRechargeFullCard.classList.add('active');
    DOM.optRechargePartialCard.classList.remove('active');
    DOM.optRechargeFullInput.checked = true;
    DOM.optRechargePartialInput.checked = false;
    DOM.rechargeNewLevel.value = 100;
  } else {
    DOM.optRechargeFullCard.classList.remove('active');
    DOM.optRechargePartialCard.classList.add('active');
    DOM.optRechargeFullInput.checked = false;
    DOM.optRechargePartialInput.checked = true;
    DOM.rechargeNewLevel.value = 50;
  }
}

async function handleManualRechargeSubmit(e) {
  e.preventDefault();

  const printerId = DOM.rechargePrinterId.value.trim();
  const printerName = DOM.rechargePrinterName.value.trim();
  const ip = DOM.rechargePrinterIp.value.trim();
  const unitName = DOM.rechargeUnitName.value.trim();
  const location = DOM.rechargeLocation.value.trim();
  const pageCount = Number(DOM.rechargePageCount.value) || 0;

  const supplySelect = DOM.rechargeSupplySelect;
  const supplyName = supplySelect.value;
  const selectedOption = supplySelect.options[supplySelect.selectedIndex];
  const supplyType = selectedOption ? (selectedOption.dataset.type || 'toner') : 'toner';

  const isFull = DOM.optRechargeFullInput.checked;
  const newLevel = Number(DOM.rechargeNewLevel.value);
  const customDateVal = DOM.rechargeCustomDate ? DOM.rechargeCustomDate.value : '';
  const timestamp = customDateVal ? new Date(customDateVal).toISOString() : new Date().toISOString();
  const technician = DOM.rechargeTechnician.value.trim();
  const notes = DOM.rechargeNotes.value.trim();

  if (!supplyName) {
    showToast('Por favor, selecione qual suprimento foi trocado.', 'error');
    return;
  }

  const submitBtn = document.getElementById('btn-submit-manual-recharge');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Gravando...';

  try {
    const status = AppState.statusData.get(printerId);
    const existingSupply = status?.supplies?.find(s => s.name === supplyName);
    const previousLevel = existingSupply ? existingSupply.percentage : 0;

    await API.addRecharge({
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
      isFull,
      technician,
      notes,
      timestamp
    });

    // Atualiza imediatamente o suprimento no AppState local
    const currentStatus = AppState.statusData.get(printerId);
    if (currentStatus) {
      if (!Array.isArray(currentStatus.supplies)) currentStatus.supplies = [];
      const targetSupply = currentStatus.supplies.find(s => s.name === supplyName || s.type === supplyType);
      const normalizedStatus = Number(newLevel) > 30 ? 'ok' : (Number(newLevel) >= 10 ? 'warning' : 'critical');
      if (targetSupply) {
        targetSupply.percentage = Number(newLevel);
        targetSupply.status = normalizedStatus;
      } else {
        currentStatus.supplies.push({
          name: supplyName,
          type: supplyType || 'toner',
          percentage: Number(newLevel),
          status: normalizedStatus
        });
      }
    }

    showToast(`Recarga de "${supplyName}" gravada com sucesso!`, 'success');
    closeManualRechargeModal();

    AppState.rechargesSummary = await API.getRechargesSummary();
    renderAllViews();
    renderUnitRecentRecharges();

    if (currentDrawerPrinterId === printerId) {
      openPrinterDetailDrawer(printerId);
    }
  } catch (err) {
    showToast(err.message || 'Erro ao gravar recarga', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar Recarga';
  }
}

// ==========================================================================
// 15. CADASTRO, EDIÇÃO E EXCLUSÃO DE IMPRESSORAS (ADM)
// ==========================================================================
function openAddPrinterModal() {
  if (AppState.userRole !== 'admin') {
    showToast('Apenas administradores podem cadastrar impressoras.', 'error');
    return;
  }
  DOM.formId.value = '';
  DOM.printerForm.reset();
  populateDropdownFilters();
  if (AppState.activeUnitFilter) {
    DOM.formUnitSelect.value = AppState.activeUnitFilter;
  }
  DOM.formCommunity.value = 'public';
  DOM.modalFormTitleText.textContent = 'Cadastrar Nova Impressora';
  DOM.modalPrinterForm.classList.add('active');
  setTimeout(() => DOM.formLocation.focus(), 100);
}

function openEditPrinterModal(id) {
  if (AppState.userRole !== 'admin') {
    showToast('Apenas administradores podem editar impressoras.', 'error');
    return;
  }
  const printer = AppState.printers.find(p => p.id === id);
  if (!printer) return;

  populateDropdownFilters();
  DOM.formId.value = printer.id;
  DOM.formUnitSelect.value = printer.unitId || '';
  DOM.formLocation.value = printer.location || '';
  DOM.formName.value = printer.name && printer.name !== printer.location ? printer.name : '';
  DOM.formIp.value = printer.ip;
  DOM.formCommunity.value = printer.community || 'public';
  DOM.modalFormTitleText.textContent = 'Editar Impressora';
  DOM.modalPrinterForm.classList.add('active');
  setTimeout(() => DOM.formLocation.focus(), 100);
}

function closeModalForm() {
  DOM.modalPrinterForm.classList.remove('active');
}

async function handlePrinterFormSubmit(e) {
  e.preventDefault();
  if (AppState.userRole !== 'admin') {
    showToast('Apenas administradores podem salvar alterações no parque.', 'error');
    return;
  }

  const id = DOM.formId.value.trim();
  const unitId = DOM.formUnitSelect.value;
  const unitObj = AppState.units.find(u => u.id === unitId);
  const unitName = unitObj ? unitObj.name : 'Sem Unidade';

  const location = DOM.formLocation.value.trim();
  const nameInput = DOM.formName.value.trim();
  const name = nameInput || location;
  const ip = DOM.formIp.value.trim();
  const community = DOM.formCommunity.value.trim() || 'public';

  if (!location || !ip) {
    showToast('Local/Setor e Endereço IP são obrigatórios!', 'error');
    return;
  }

  const submitBtn = document.getElementById('btn-submit-printer-form');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Salvando...';

  try {
    if (id) {
      await API.updatePrinter(id, { name, ip, unitId, unitName, location, community });
      showToast('Impressora atualizada com sucesso!', 'success');
    } else {
      await API.addPrinter({ name, ip, unitId, unitName, location, community });
      showToast('Nova impressora cadastrada com sucesso!', 'success');
    }

    closeModalForm();
    await loadDashboardData(false, true);

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar Impressora';
  }
}

async function confirmDeletePrinter(id, name) {
  if (AppState.userRole !== 'admin') {
    showToast('Apenas administradores podem excluir impressoras.', 'error');
    return;
  }

  if (!confirm(`Deseja realmente remover a impressora "${name}"?`)) return;

  try {
    await API.deletePrinter(id);
    AppState.printers = AppState.printers.filter(p => p.id !== id);
    AppState.statusData.delete(id);
    closePrinterDetailDrawer();
    renderAllViews();
    showToast(`Impressora "${name}" removida com sucesso.`, 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openQuickUnitModal(unitId = null) {
  if (AppState.userRole !== 'admin') {
    showToast('Apenas administradores podem criar ou editar unidades.', 'error');
    return;
  }
  DOM.unitForm.reset();
  if (DOM.unitFormId) DOM.unitFormId.value = '';

  if (unitId && typeof unitId === 'string') {
    const unit = AppState.units.find(u => u.id === unitId);
    if (unit) {
      if (DOM.unitFormId) DOM.unitFormId.value = unit.id;
      DOM.unitNameInput.value = unit.name;
      DOM.unitDescInput.value = unit.description || '';
      if (DOM.modalUnitFormTitleText) DOM.modalUnitFormTitleText.textContent = 'Editar Pasta de Unidade';
    }
  } else {
    if (DOM.modalUnitFormTitleText) DOM.modalUnitFormTitleText.textContent = 'Nova Pasta de Unidade';
  }

  DOM.modalUnitForm.classList.add('active');
  setTimeout(() => DOM.unitNameInput.focus(), 100);
}

function closeQuickUnitModal() {
  DOM.modalUnitForm.classList.remove('active');
}

async function handleUnitFormSubmit(e) {
  e.preventDefault();
  const id = DOM.unitFormId ? DOM.unitFormId.value.trim() : '';
  const name = DOM.unitNameInput.value.trim();
  const description = DOM.unitDescInput.value.trim();

  if (!name) {
    showToast('Nome da unidade é obrigatório!', 'error');
    return;
  }

  try {
    if (id) {
      await API.updateUnit(id, { name, description });
      AppState.units = await API.getUnits();
      AppState.printers = await API.getPrinters();
      populateDropdownFilters();
      renderAllViews();
      closeQuickUnitModal();
      openManageUnitsModal();
      showToast('Pasta de unidade atualizada com sucesso!', 'success');
    } else {
      const newUnit = await API.addUnit({ name, description });
      AppState.units = await API.getUnits();
      populateDropdownFilters();
      if (DOM.formUnitSelect) DOM.formUnitSelect.value = newUnit.id;
      closeQuickUnitModal();
      showToast('Nova pasta de unidade criada!', 'success');
    }
  } catch (err) {
    showToast(err.message || 'Erro ao salvar pasta', 'error');
  }
}

function openManageUnitsModal() {
  if (AppState.userRole !== 'admin') {
    showToast('Apenas administradores podem gerenciar pastas.', 'error');
    return;
  }
  renderManageUnitsList();
  DOM.modalManageUnits.classList.add('active');
}

function closeManageUnitsModal() {
  DOM.modalManageUnits.classList.remove('active');
}

function renderManageUnitsList() {
  if (!DOM.manageUnitsListBody) return;

  if (AppState.units.length === 0) {
    DOM.manageUnitsListBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          Nenhuma pasta de unidade cadastrada.
        </td>
      </tr>
    `;
    return;
  }

  DOM.manageUnitsListBody.innerHTML = AppState.units.map(unit => {
    const printerCount = AppState.printers.filter(p => p.unitId === unit.id).length;

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.9rem;">${escapeHtml(unit.name)}</div>
          ${unit.description ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(unit.description)}</div>` : ''}
        </td>
        <td style="text-align: center;">
          <span class="unit-current-badge" style="font-size: 0.75rem;">
            ${printerCount} ${printerCount === 1 ? 'impressora' : 'impressoras'}
          </span>
        </td>
        <td style="text-align: center;">
          <div style="display: inline-flex; gap: 0.35rem; justify-content: center;">
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              onclick="openEditUnitModal('${unit.id}')"
              title="Editar nome e descrição desta pasta"
            >
              ${Icons.edit}
              <span>Editar</span>
            </button>
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              style="color: var(--color-danger);" 
              onclick="confirmDeleteUnit('${unit.id}', '${escapeHtml(unit.name)}', ${printerCount})"
              title="Excluir esta pasta"
            >
              ${Icons.trash}
              <span>Excluir</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openEditUnitModal = function(unitId) {
  closeManageUnitsModal();
  openQuickUnitModal(unitId);
};

async function confirmDeleteUnit(unitId, unitName, printerCount) {
  if (AppState.userRole !== 'admin') {
    showToast('Apenas administradores podem excluir pastas.', 'error');
    return;
  }

  let confirmMsg = `Deseja realmente excluir a pasta "${unitName}"?`;
  if (printerCount > 0) {
    confirmMsg += `\n\nAtenção: Existem ${printerCount} impressoras associadas a esta pasta que ficarão com o status "Sem Unidade".`;
  }

  if (!confirm(confirmMsg)) return;

  try {
    await API.deleteUnit(unitId);
    AppState.units = await API.getUnits();
    
    if (AppState.activeUnitFilter === unitId) {
      AppState.activeUnitFilter = '';
    }

    renderManageUnitsList();
    populateDropdownFilters();
    renderOverviewTab();
    showToast(`Pasta "${unitName}" excluída com sucesso!`, 'info');
  } catch (err) {
    showToast(err.message || 'Erro ao excluir pasta', 'error');
  }
}

// ==========================================================================
// 16. EXPORTAÇÃO DE RELATÓRIOS CSV (PROJETO HEFESTO)
// ==========================================================================
async function exportRechargesReportCsv() {
  try {
    showToast('Gerando relatório de recargas...', 'info');
    const recharges = await API.getRecharges();

    if (recharges.length === 0) {
      showToast('Nenhum registro de recarga encontrado para exportar.', 'warning');
      return;
    }

    const headers = [
      'Data_Hora',
      'Unidade_Filial',
      'Setor_Local',
      'Impressora',
      'IP',
      'Suprimento',
      'Tipo_Suprimento',
      'Nivel_Anterior',
      'Nivel_Instalado',
      'Tipo_Recarga',
      'Contador_Paginas_Total',
      'Paginas_Rodadas_No_Ciclo',
      'Origem_Registro',
      'Tecnico_Responsavel',
      'Observacoes'
    ];

    const rows = recharges.map(r => [
      formatFullDateTime(r.timestamp),
      r.unitName || 'Sem Unidade',
      r.location || '',
      r.printerName || '',
      r.ip || '',
      translateSupplyName(r.supplyName),
      r.supplyType || 'toner',
      r.previousLevel + '%',
      r.newLevel + '%',
      r.isFullRecharge ? 'Recarga Oficial (Nova ≥95%)' : 'Troca Provisória / Usada (<95%)',
      r.pageCount || 0,
      r.pagesSinceLastRecharge || 0,
      r.source === 'auto' ? 'Detecção Automática SNMP' : 'Registro Manual',
      r.technician || '',
      (r.notes || '').replace(/[;\n\r]/g, ' ')
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Recargas_Suprimentos_PreventSenior_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Relatório de Recargas baixado com sucesso!', 'success');
  } catch (err) {
    showToast('Erro ao exportar relatório: ' + err.message, 'error');
  }
}

async function exportInkReportCsv() {
  try {
    const scopedPrinters = getScopedPrinters();
    if (scopedPrinters.length === 0) {
      showToast('Nenhuma impressora disponível para exportação.', 'warning');
      return;
    }

    const headers = [
      'Unidade_Filial',
      'Setor_Local',
      'Nome_Impressora',
      'IP',
      'Modelo',
      'Numero_Serie',
      'Status_Conexao',
      'Toner_Tinta_Preta',
      'Toner_Ciano',
      'Toner_Magenta',
      'Toner_Amarelo',
      'Menor_Nivel_Atual',
      'Total_Paginas_Impressas',
      'Ultima_Recarga_Data',
      'Ultima_Recarga_Suprimento',
      'Ultima_Recarga_Tipo'
    ];

    const rows = scopedPrinters.map(p => {
      const st = AppState.statusData.get(p.id) || {};
      const info = st.info || {};
      const isOnline = st.online;
      const supplies = st.supplies || [];

      let black = 'N/D', cyan = 'N/D', magenta = 'N/D', yellow = 'N/D';
      let lowestVal = 999;

      supplies.forEach(s => {
        const pct = normalizeSupplyPercentage(s);
        const lower = (s.name || '').toLowerCase();
        if (pct >= 0 && !isWasteSupply(s)) {
          if (pct < lowestVal) lowestVal = pct;
        }

        if (lower.includes('black') || lower.includes('preto') || lower.includes('k cartridge') || lower.includes('bk')) {
          black = pct >= 0 ? `${pct}%` : 'N/D';
        } else if (lower.includes('cyan') || lower.includes('ciano')) {
          cyan = pct >= 0 ? `${pct}%` : 'N/D';
        } else if (lower.includes('magenta')) {
          magenta = pct >= 0 ? `${pct}%` : 'N/D';
        } else if (lower.includes('yellow') || lower.includes('amarelo')) {
          yellow = pct >= 0 ? `${pct}%` : 'N/D';
        }
      });

      const recSummary = AppState.rechargesSummary ? AppState.rechargesSummary[p.id] : null;
      const lastRec = recSummary ? (recSummary.lastFullRecharge || recSummary.lastRecharge) : null;

      return [
        p.unitName || 'Sem Unidade',
        p.location || '',
        p.name || '',
        p.ip || '',
        info.model || 'Desconhecido',
        info.serialNumber || 'N/D',
        isOnline ? 'Online' : 'Offline',
        black,
        cyan,
        magenta,
        yellow,
        lowestVal !== 999 ? `${lowestVal}%` : 'N/D',
        info.pageCount || 0,
        lastRec ? formatFullDateTime(lastRec.timestamp) : 'Sem registro',
        lastRec ? translateSupplyName(lastRec.supplyName) : 'N/D',
        lastRec ? (lastRec.isFullRecharge ? 'Oficial (100%)' : 'Parcial') : 'N/D'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Suprimentos_PreventSenior_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Relatório de suprimentos baixado!', 'success');
  } catch (err) {
    showToast('Erro ao exportar relatório: ' + err.message, 'error');
  }
}

// ==========================================================================
// 17. MÓDULO DE VOLUME DE PÁGINAS & PREVISIBILIDADE (PROJETO HEFESTO)
// ==========================================================================
function switchAdminTab(tabName) {
  AppState.activeAdminTab = tabName;

  if (DOM.btnTabPrinters) DOM.btnTabPrinters.classList.toggle('active', tabName === 'printers');
  if (DOM.btnTabForecast) DOM.btnTabForecast.classList.toggle('active', tabName === 'forecast');

  if (DOM.tabViewPrinters) DOM.tabViewPrinters.style.display = tabName === 'printers' ? 'block' : 'none';
  if (DOM.tabViewForecast) DOM.tabViewForecast.style.display = tabName === 'forecast' ? 'block' : 'none';

  // Oculta automaticamente os cards operacionais de status (Conectadas, Crítico, Atenção, Sem Conexão e Reposições Recentes) na aba de Previsibilidade
  const operationalContainer = document.getElementById('operational-status-cards-container');
  if (operationalContainer) {
    operationalContainer.style.display = tabName === 'printers' ? 'block' : 'none';
  }
  if (DOM.unitRecentRechargesSection) {
    if (tabName === 'forecast') {
      DOM.unitRecentRechargesSection.style.display = 'none';
    } else if (AppState.userRole === 'admin') {
      renderUnitRecentRecharges();
    }
  }

  if (tabName === 'forecast') {
    loadAndRenderForecastTab();
  }
}

async function loadAndRenderForecastTab() {
  if (AppState.userRole !== 'admin' || !DOM.tabViewForecast) return;

  try {
    const data = await API.getVolumeForecast();
    AppState.forecastData = data;

    // Se o usuário já filtrou uma unidade na barra de status, sincroniza
    if (AppState.activeUnitFilter && !AppState.forecastUnitFilter) {
      const u = AppState.units.find(x => x.id === AppState.activeUnitFilter);
      if (u) AppState.forecastUnitFilter = u.name;
    }

    // Popula dropdown de unidades do forecast
    if (DOM.forecastUnitSelect) {
      const cur = AppState.forecastUnitFilter || '';
      DOM.forecastUnitSelect.innerHTML = '<option value="">Todas as Unidades</option>' + 
        AppState.units.map(u => `<option value="${escapeHtml(u.name)}" ${cur === u.name ? 'selected' : ''}>${escapeHtml(u.name)}</option>`).join('');
    }

    updateForecastKPIs(AppState.forecastUnitFilter);
    renderForecastTable();
  } catch (err) {
    console.error('[Forecast]', err);
    showToast('Erro ao carregar dados de volume e previsão', 'error');
  }
}

function updateForecastKPIs(unitFilterName) {
  let list = AppState.forecastData || [];

  if (unitFilterName) {
    list = list.filter(p => p.unitName === unitFilterName);
  }

  let totalToday = 0;
  let totalWeek = 0;
  let totalMonth = 0;
  let criticalSwaps = 0;

  list.forEach(item => {
    totalToday += Number(item.pagesToday) || 0;
    totalWeek += Number(item.pagesThisWeek) || 0;
    totalMonth += Number(item.pagesThisMonth) || 0;
    if (item.criticalSupply && item.criticalSupply.daysRemaining <= 7) {
      criticalSwaps++;
    }
  });

  if (DOM.kpiPagesToday) DOM.kpiPagesToday.textContent = totalToday.toLocaleString('pt-BR');
  if (DOM.kpiPagesWeek) DOM.kpiPagesWeek.textContent = totalWeek.toLocaleString('pt-BR');
  if (DOM.kpiPagesMonth) DOM.kpiPagesMonth.textContent = totalMonth.toLocaleString('pt-BR');
  if (DOM.kpiCriticalSwapsCount) DOM.kpiCriticalSwapsCount.textContent = criticalSwaps;

  // Datas exatas dos períodos de contabilização
  const now = new Date();
  const todayStr = now.toLocaleDateString('pt-BR');
  const dWeek = new Date(now.getTime() - 6 * 86400000);
  const weekStartStr = dWeek.toLocaleDateString('pt-BR');
  const dMonth = new Date(now.getTime() - 29 * 86400000);
  const monthStartStr = dMonth.toLocaleDateString('pt-BR');
  const dFuture = new Date(now.getTime() + 7 * 86400000);
  const futureStr = dFuture.toLocaleDateString('pt-BR');

  if (DOM.kpiPeriodToday) DOM.kpiPeriodToday.textContent = `📅 ${todayStr} (Hoje)`;
  if (DOM.kpiPeriodWeek) DOM.kpiPeriodWeek.textContent = `📅 ${weekStartStr} a ${todayStr} (7d)`;
  if (DOM.kpiPeriodMonth) DOM.kpiPeriodMonth.textContent = `📅 ${monthStartStr} a ${todayStr} (30d)`;
  if (DOM.kpiPeriodSwaps) DOM.kpiPeriodSwaps.textContent = `🚨 Janela: até ${futureStr} (< 7d)`;

  // Atualiza legendas dos KPIs conforme o escopo selecionado
  if (unitFilterName) {
    if (DOM.kpiSubPagesToday) DOM.kpiSubPagesToday.textContent = `Hoje na unidade ${unitFilterName}`;
    if (DOM.kpiSubPagesWeek) DOM.kpiSubPagesWeek.textContent = `Últimos 7d na unidade ${unitFilterName}`;
    if (DOM.kpiSubPagesMonth) DOM.kpiSubPagesMonth.textContent = `Últimos 30d na unidade ${unitFilterName}`;
    if (DOM.kpiSubCriticalSwaps) DOM.kpiSubCriticalSwaps.textContent = `Perto de acabar na unidade ${unitFilterName}`;
  } else {
    if (DOM.kpiSubPagesToday) DOM.kpiSubPagesToday.textContent = 'Total rodado na rede hoje';
    if (DOM.kpiSubPagesWeek) DOM.kpiSubPagesWeek.textContent = 'Últimos 7 dias acumulados';
    if (DOM.kpiSubPagesMonth) DOM.kpiSubPagesMonth.textContent = 'Últimos 30 dias de operação';
    if (DOM.kpiSubCriticalSwaps) DOM.kpiSubCriticalSwaps.textContent = 'Suprimentos perto de acabar na rede';
  }
}

function renderForecastTable() {
  if (!DOM.forecastTableBody) return;

  const q = (AppState.forecastSearch || '').toLowerCase().trim();
  const unitFilter = AppState.forecastUnitFilter;
  const workloadFilter = AppState.forecastWorkloadFilter;
  const timeFilter = AppState.forecastTimeFilter;

  // Atualiza KPIs para a unidade selecionada
  updateForecastKPIs(unitFilter);

  let list = AppState.forecastData || [];

  // Filtro de busca
  if (q) {
    list = list.filter(p => 
      (p.printerName || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q) ||
      (p.ip || '').toLowerCase().includes(q) ||
      (p.model || '').toLowerCase().includes(q) ||
      (p.unitName || '').toLowerCase().includes(q)
    );
  }

  // Filtro de Unidade
  if (unitFilter) {
    list = list.filter(p => p.unitName === unitFilter);
  }

  // Filtro de Carga de Trabalho
  if (workloadFilter) {
    list = list.filter(p => p.workloadStatus === workloadFilter);
  }

  // Filtro por Janela de Troca
  if (timeFilter) {
    if (timeFilter === 'critical7') {
      list = list.filter(p => p.criticalSupply && p.criticalSupply.daysRemaining <= 7);
    } else if (timeFilter === 'warning15') {
      list = list.filter(p => p.criticalSupply && p.criticalSupply.daysRemaining <= 15);
    } else if (timeFilter === 'normal30') {
      list = list.filter(p => p.criticalSupply && p.criticalSupply.daysRemaining <= 30);
    }
  }

  // Ordena por dias restantes mais urgentes
  list.sort((a, b) => {
    const daysA = a.criticalSupply ? a.criticalSupply.daysRemaining : 999;
    const daysB = b.criticalSupply ? b.criticalSupply.daysRemaining : 999;
    return daysA - daysB;
  });

  if (list.length === 0) {
    DOM.forecastTableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          Nenhum equipamento encontrado com os filtros selecionados.
        </td>
      </tr>
    `;
    return;
  }

  DOM.forecastTableBody.innerHTML = list.map(item => {
    const crit = item.criticalSupply;
    const daysRemaining = crit ? crit.daysRemaining : null;
    const pagesRemaining = crit ? crit.pagesRemaining : 0;
    
    // Status do Prazo
    let tagClass = 'ok';
    let daysText = 'Estável';
    if (daysRemaining !== null) {
      if (daysRemaining <= 7) {
        tagClass = 'urgent';
        daysText = daysRemaining === 1 ? 'Esgota em ~1 dia!' : `Esgota em ~${daysRemaining} dias!`;
      } else if (daysRemaining <= 15) {
        tagClass = 'warn';
        daysText = `Esgota em ~${daysRemaining} dias`;
      } else {
        tagClass = 'ok';
        daysText = `Esgota em ~${daysRemaining} dias`;
      }
    } else {
      daysText = 'Sem telemetria';
    }

    // Formatação da Data Projetada
    let dateFormatted = 'N/D';
    if (crit && crit.depletionDate) {
      const parts = crit.depletionDate.split('-');
      if (parts.length === 3) {
        dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    // Badge de Carga
    let workloadClass = 'ideal';
    let workloadIcon = '✓';
    if (item.workloadStatus === 'high') {
      workloadClass = 'high';
      workloadIcon = '▲';
    } else if (item.workloadStatus === 'low') {
      workloadClass = 'low';
      workloadIcon = '▼';
    }

    // Cor e rótulo do Suprimento
    const supPct = crit ? crit.percentage : 0;
    const isEstimated = crit && (crit.isRefillable || (crit.name && (crit.name.toLowerCase().includes('bottle') || crit.name.toLowerCase().includes('tanque'))));
    const pctDisplay = isEstimated ? `~${supPct}% (Est.)` : `${supPct}%`;

    let supColor = 'var(--color-primary)';
    if (crit) {
      const lowerName = (crit.name || '').toLowerCase();
      if (lowerName.includes('yellow') || lowerName.includes('amarel')) supColor = '#eab308';
      else if (lowerName.includes('magenta')) supColor = '#ec4899';
      else if (lowerName.includes('cyan') || lowerName.includes('ciano')) supColor = '#06b6d4';
      else if (lowerName.includes('black') || lowerName.includes('preto')) supColor = '#3b82f6';
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem;">
            ${escapeHtml(item.location || item.printerName)}
          </div>
          <div style="font-size: 0.725rem; color: var(--text-muted); display: flex; gap: 0.35rem; align-items: center; margin-top: 0.15rem;">
            <code style="font-family: var(--font-mono); color: var(--color-primary);">${item.ip}</code>
            <span>•</span>
            <span>${escapeHtml(item.unitName)}</span>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.15rem;">
            ${escapeHtml(item.model)}
          </div>
        </td>

        <td style="text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);">
          ${item.pagesToday ? Number(item.pagesToday).toLocaleString('pt-BR') : '0'}
        </td>

        <td style="text-align: center; font-family: var(--font-mono); font-weight: 600; color: var(--text-secondary);">
          ${item.pagesThisWeek ? Number(item.pagesThisWeek).toLocaleString('pt-BR') : '0'}
        </td>

        <td style="text-align: center; font-family: var(--font-mono); font-weight: 600; color: var(--text-secondary);">
          ${item.pagesThisMonth ? Number(item.pagesThisMonth).toLocaleString('pt-BR') : '0'}
        </td>

        <td style="text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">
          ~${item.avgPagesPerDay || 0}/dia
        </td>

        <td style="text-align: center;">
          <span class="workload-chip ${workloadClass}" title="Capacidade nominal: ${item.capacityMonthlyNominal?.toLocaleString('pt-BR')} pág/mês (${item.capacityRatio}% utilizada)">
            <span>${workloadIcon}</span>
            <span>${item.workloadLabel}</span>
          </span>
        </td>

        <td>
          ${crit ? `
            <div class="forecast-supply-meter">
              <div class="forecast-supply-info">
                <span style="font-weight: 600; color: var(--text-primary); max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(translateSupplyName(crit.name))}</span>
                <span style="font-family: var(--font-mono); font-weight: 700; color: ${isEstimated ? 'var(--color-success)' : (supPct <= 10 ? 'var(--color-danger)' : (supPct <= 30 ? '#f59e0b' : 'var(--color-success)'))};">${pctDisplay}</span>
              </div>
              <div class="forecast-meter-bar">
                <div class="forecast-meter-fill" style="width: ${supPct}%; background: ${supColor};"></div>
              </div>
              ${(() => {
                const forecastToners = (item.suppliesForecast || []).filter(s => 
                  !s.name.toLowerCase().includes('waste') &&
                  !s.name.toLowerCase().includes('drum') &&
                  !s.name.toLowerCase().includes('imaging') &&
                  !s.name.toLowerCase().includes('transfer') &&
                  !s.name.toLowerCase().includes('adf') &&
                  !s.name.toLowerCase().includes('fuser') &&
                  !s.name.toLowerCase().includes('fusor') &&
                  !s.name.toLowerCase().includes('kit')
                );
                if (forecastToners.length <= 1) return '';
                return `
                  <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.35rem;" title="Níveis de todos os insumos de impressão">
                    ${forecastToners.map(s => {
                      const dotColor = getSupplyColorByName(s.name);
                      const shortName = translateSupplyName(s.name, s.type)
                        .replace('Toner / Tinta ', '')
                        .replace('Cartucho / Toner ', '')
                        .replace('Bolsa de Tinta ', '');
                      const statusClr = s.percentage <= 10 ? 'var(--color-danger)' : (s.percentage <= 30 ? 'var(--color-warning)' : 'var(--color-success)');
                      return `
                        <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.65rem; font-weight: 700; color: var(--text-secondary); background: var(--bg-input); padding: 1px 4px; border-radius: 3px; border-left: 2px solid ${statusClr};" title="${escapeHtml(translateSupplyName(s.name, s.type))}: ${s.percentage}% (${s.daysRemainingEstimated ? '~' + s.daysRemainingEstimated + ' dias' : 'Estável'})">
                          <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${dotColor}; display: inline-block;"></span>
                          <span>${shortName}: ${s.percentage}%</span>
                        </span>
                      `;
                    }).join('')}
                  </div>
                `;
              })()}
            </div>
          ` : '<span style="color: var(--text-muted); font-size: 0.75rem;">Sem dados</span>'}
        </td>

        <td style="text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);">
          ${pagesRemaining ? Number(pagesRemaining).toLocaleString('pt-BR') : '0'} pág.
        </td>

        <td>
          <div class="forecast-date-badge">
            <span class="forecast-days-tag ${tagClass}">${daysText}</span>
            <span class="forecast-projected-date">Previsão: ${dateFormatted}</span>
          </div>
        </td>

        <td style="text-align: center;">
          <div style="display: inline-flex; gap: 0.35rem; justify-content: center;">
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              onclick="openPrinterDetailDrawer('${item.printerId}')"
              title="Abrir Raio-X detalhado"
            >
              ${Icons.eye}
              <span>Raio-X</span>
            </button>
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              onclick="openManualRechargeModal('${item.printerId}')"
              title="Registrar troca de suprimento"
            >
              ${Icons.plus}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function exportForecastReportCsv() {
  try {
    showToast('Gerando relatório de volume e previsibilidade...', 'info');
    const data = await API.getVolumeForecast();

    if (!data || data.length === 0) {
      showToast('Nenhum dado analítico encontrado para exportar.', 'warning');
      return;
    }

    const headers = [
      'Unidade_Filial',
      'Setor_Localizacao',
      'Nome_Identificacao',
      'Endereco_IP',
      'Modelo_Equipamento',
      'Contador_Total_Paginas',
      'Paginas_Hoje',
      'Paginas_Semana_7d',
      'Paginas_Mes_30d',
      'Media_Paginas_Por_Dia',
      'Status_Carga_Trabalho',
      'Capacidade_Nominal_Mes',
      'Percentual_Utilizacao_Capacidade',
      'Suprimento_Mais_Critico',
      'Nivel_Atual_Percentual',
      'Paginas_Restantes_Estimadas',
      'Dias_Restantes_Estimados',
      'Data_Projetada_Proxima_Troca'
    ];

    const rows = data.map(p => {
      const crit = p.criticalSupply;
      return [
        p.unitName || 'Sem Unidade',
        p.location || '',
        p.printerName || '',
        p.ip || '',
        p.model || '',
        p.pageCount || 0,
        p.pagesToday || 0,
        p.pagesThisWeek || 0,
        p.pagesThisMonth || 0,
        p.avgPagesPerDay || 0,
        p.workloadLabel || '',
        p.capacityMonthlyNominal || 0,
        (p.capacityRatio || 0) + '%',
        crit ? translateSupplyName(crit.name) : 'N/D',
        crit ? (crit.percentage + '%') : 'N/D',
        crit ? crit.pagesRemaining : 0,
        crit ? crit.daysRemaining : 'N/D',
        crit ? crit.depletionDate : 'N/D'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Volume_Previsibilidade_PreventSenior_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Download do relatório de volume e previsão concluído!', 'success');
  } catch (err) {
    showToast('Erro ao exportar relatório CSV', 'error');
  }
}

window.openPrinterDetailDrawer = openPrinterDetailDrawer;
window.openManualRechargeModal = openManualRechargeModal;
window.exportRechargesReportCsv = exportRechargesReportCsv;
window.exportInkReportCsv = exportInkReportCsv;
window.switchAdminTab = switchAdminTab;
window.exportForecastReportCsv = exportForecastReportCsv;

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const iconHtml = type === 'success' ? Icons.checkCircle : type === 'error' ? Icons.alertOctagon : Icons.wifiOff;
  toast.innerHTML = `<span>${iconHtml}</span><span>${escapeHtml(message)}</span>`;
  
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function updateLastUpdatedTimestamp() {
  AppState.lastUpdated = new Date();
  const timeStr = AppState.lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (DOM.lastUpdatedText) {
    DOM.lastUpdatedText.innerHTML = `Sincronizado às <strong style="color: var(--text-primary); font-family: var(--font-mono);">${timeStr}</strong>`;
  }
}

// ==========================================================================
// 17. EVENT LISTENERS & BOOTSTRAP
// ==========================================================================
function setupEventListeners() {
  DOM.btnRefreshAll.addEventListener('click', () => loadDashboardData(false, true));
  DOM.btnAddPrinterHeader.addEventListener('click', openAddPrinterModal);

  if (DOM.btnOpenDiagnoseIp) {
    DOM.btnOpenDiagnoseIp.addEventListener('click', openTestIpModal);
  }
  if (DOM.btnCloseModalTestIp) {
    DOM.btnCloseModalTestIp.addEventListener('click', closeTestIpModal);
  }
  if (DOM.btnCancelModalTestIp) {
    DOM.btnCancelModalTestIp.addEventListener('click', closeTestIpModal);
  }
  if (DOM.formTestIpModal) {
    DOM.formTestIpModal.addEventListener('submit', handleTestIpSubmit);
  }
  if (DOM.btnQuickAddFromTest) {
    DOM.btnQuickAddFromTest.addEventListener('click', handleQuickAddFromTest);
  }

  DOM.tabLoginOperator.addEventListener('click', () => {
    DOM.tabLoginOperator.classList.add('active');
    DOM.tabLoginAdmin.classList.remove('active');
    DOM.formLoginUnit.style.display = 'block';
    DOM.formLoginAdmin.style.display = 'none';
    DOM.adminUserInput.value = '';
    DOM.adminPasswordInput.value = '';
    DOM.loginOverlay.classList.remove('admin-mode');
    setLoginMode('operator');
  });

  DOM.tabLoginAdmin.addEventListener('click', () => {
    DOM.tabLoginAdmin.classList.add('active');
    DOM.tabLoginOperator.classList.remove('active');
    DOM.formLoginUnit.style.display = 'none';
    DOM.formLoginAdmin.style.display = 'block';
    DOM.adminUserInput.value = '';
    DOM.adminPasswordInput.value = '';
    DOM.loginOverlay.classList.add('admin-mode');
    setLoginMode('admin');
    setTimeout(() => DOM.adminUserInput.focus(), 100);
  });

  DOM.formLoginUnit.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedUnit = DOM.loginUnitSelect.value;
    if (!selectedUnit) {
      showToast('Por favor, selecione sua unidade/filial para acessar.', 'error');
      return;
    }

    AppState.userRole = 'operator';
    AppState.activeUnitFilter = selectedUnit;
    sessionStorage.setItem('auth_role', 'operator');
    sessionStorage.setItem('printer_monitor_unit', selectedUnit);
    
    stopLoginCanvas();
    DOM.loginOverlay.classList.remove('admin-mode');
    DOM.loginOverlay.classList.remove('active');
    renderAllViews();
    showToast('Acesso de Operador iniciado!', 'success');
  });

  DOM.formLoginAdmin.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = DOM.adminUserInput.value.trim();
    const pass = DOM.adminPasswordInput.value.trim();

    if (user === 'admin' && pass === 'admin') {
      AppState.userRole = 'admin';
      AppState.activeUnitFilter = '';
      sessionStorage.setItem('auth_role', 'admin');
      sessionStorage.removeItem('printer_monitor_unit');
      
      DOM.adminUserInput.value = '';
      DOM.adminPasswordInput.value = '';

      stopLoginCanvas();
      DOM.loginOverlay.classList.remove('admin-mode');
      DOM.loginOverlay.classList.remove('active');
      renderAllViews();
      showToast('Bem-vindo ao Painel do Administrador!', 'success');
    } else {
      showToast('Usuário ou senha de administrador incorretos!', 'error');
      DOM.adminPasswordInput.value = '';
      DOM.adminPasswordInput.focus();
    }
  });

  const handleLogout = () => {
    sessionStorage.clear();
    AppState.userRole = 'operator';
    AppState.activeUnitFilter = '';
    if (DOM.adminUserInput) DOM.adminUserInput.value = '';
    if (DOM.adminPasswordInput) DOM.adminPasswordInput.value = '';
    if (DOM.tabLoginOperator) DOM.tabLoginOperator.classList.add('active');
    if (DOM.tabLoginAdmin) DOM.tabLoginAdmin.classList.remove('active');
    if (DOM.formLoginUnit) DOM.formLoginUnit.style.display = 'block';
    if (DOM.formLoginAdmin) DOM.formLoginAdmin.style.display = 'none';
    if (DOM.loginOverlay) {
      DOM.loginOverlay.classList.remove('admin-mode');
      DOM.loginOverlay.classList.add('active');
      setLoginMode('operator');
      startLoginCanvas();
    }
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  if (DOM.btnLogout) {
    DOM.btnLogout.addEventListener('click', handleLogout);
  }

  if (DOM.btnExportInkCsvHeader) {
    DOM.btnExportInkCsvHeader.addEventListener('click', exportInkReportCsv);
  }

  if (DOM.btnExportRechargesCsvHeader) {
    DOM.btnExportRechargesCsvHeader.addEventListener('click', exportRechargesReportCsv);
  }

  if (DOM.overviewUnitFilter) {
    DOM.overviewUnitFilter.addEventListener('change', (e) => {
      AppState.activeUnitFilter = e.target.value;
      const u = AppState.units.find(x => x.id === e.target.value);
      AppState.forecastUnitFilter = u ? u.name : '';
      if (DOM.forecastUnitSelect) DOM.forecastUnitSelect.value = AppState.forecastUnitFilter;
      updateHeaderRoleAndUnit();
      populateDropdownFilters();
      renderOverviewTab();
      if (AppState.userRole === 'admin' && AppState.activeAdminTab === 'forecast') {
        updateForecastKPIs(AppState.forecastUnitFilter);
        renderForecastTable();
      }
    });
  }

  document.querySelectorAll('.status-metric-card[data-action], .connected-hero-banner[data-action]').forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.dataset.filter;
      if (AppState.overviewFilter === filter) {
        AppState.overviewFilter = 'all';
      } else {
        AppState.overviewFilter = filter;
      }

      DOM.overviewFilterPills.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === AppState.overviewFilter);
      });

      document.querySelectorAll('.status-metric-card[data-action], .connected-hero-banner[data-action]').forEach(c => {
        c.classList.toggle('active-card', c.dataset.filter === AppState.overviewFilter);
      });

      const scoped = getScopedPrinters();
      renderMyPrinters(scoped);

      const tableSection = document.querySelector('.my-printers-section');
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  DOM.overviewFilterPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill-btn');
    if (!pill) return;
    DOM.overviewFilterPills.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
    pill.classList.add('active');
    AppState.overviewFilter = pill.dataset.filter;
    renderMyPrinters(getScopedPrinters());
  });

  DOM.searchInput.addEventListener('input', (e) => {
    AppState.searchQuery = e.target.value;
    renderMyPrinters(getScopedPrinters());
  });

  DOM.filterLocationSelect.addEventListener('change', (e) => {
    AppState.locationFilter = e.target.value;
    renderMyPrinters(getScopedPrinters());
  });

  DOM.sortFleetSelect.addEventListener('change', (e) => {
    AppState.sortBy = e.target.value;
    renderMyPrinters(getScopedPrinters());
  });

  if (DOM.btnManageUnitsHeader) {
    DOM.btnManageUnitsHeader.addEventListener('click', openManageUnitsModal);
  }
  if (DOM.btnCloseModalManageUnits) {
    DOM.btnCloseModalManageUnits.addEventListener('click', closeManageUnitsModal);
  }
  if (DOM.btnCloseModalManageUnitsBtn) {
    DOM.btnCloseModalManageUnitsBtn.addEventListener('click', closeManageUnitsModal);
  }
  if (DOM.btnOpenCreateUnitInsideManage) {
    DOM.btnOpenCreateUnitInsideManage.addEventListener('click', () => {
      closeManageUnitsModal();
      openQuickUnitModal();
    });
  }

  DOM.btnCloseModalForm.addEventListener('click', closeModalForm);
  DOM.btnCancelModalForm.addEventListener('click', closeModalForm);
  DOM.printerForm.addEventListener('submit', handlePrinterFormSubmit);

  DOM.btnQuickNewUnit.addEventListener('click', openQuickUnitModal);
  DOM.btnCloseModalUnit.addEventListener('click', closeQuickUnitModal);
  DOM.btnCancelModalUnit.addEventListener('click', closeQuickUnitModal);
  DOM.unitForm.addEventListener('submit', async (e) => {
    await handleUnitFormSubmit(e);
    renderManageUnitsList();
  });

  if (DOM.optRechargeFullCard) {
    DOM.optRechargeFullCard.addEventListener('click', () => setRechargeTypeOption('full'));
  }
  if (DOM.optRechargePartialCard) {
    DOM.optRechargePartialCard.addEventListener('click', () => setRechargeTypeOption('partial'));
  }
  if (DOM.btnCloseModalRecharge) {
    DOM.btnCloseModalRecharge.addEventListener('click', closeManualRechargeModal);
  }
  if (DOM.btnCancelModalRecharge) {
    DOM.btnCancelModalRecharge.addEventListener('click', closeManualRechargeModal);
  }
  if (DOM.formManualRecharge) {
    DOM.formManualRecharge.addEventListener('submit', handleManualRechargeSubmit);
  }

  if (DOM.toggleUnitRechargesBtn && DOM.unitRecentRechargesList && DOM.btnToggleUnitRechargesText) {
    DOM.toggleUnitRechargesBtn.addEventListener('click', () => {
      const isHidden = DOM.unitRecentRechargesList.style.display === 'none';
      DOM.unitRecentRechargesList.style.display = isHidden ? 'flex' : 'none';
      DOM.btnToggleUnitRechargesText.textContent = isHidden ? 'Ocultar' : 'Mostrar';
    });
  }

  // Abas Administrativas
  if (DOM.btnTabPrinters) {
    DOM.btnTabPrinters.addEventListener('click', () => switchAdminTab('printers'));
  }
  if (DOM.btnTabForecast) {
    DOM.btnTabForecast.addEventListener('click', () => switchAdminTab('forecast'));
  }

  // Filtros da aba de Previsibilidade
  if (DOM.forecastSearchInput) {
    DOM.forecastSearchInput.addEventListener('input', (e) => {
      AppState.forecastSearch = e.target.value;
      renderForecastTable();
    });
  }
  if (DOM.forecastUnitSelect) {
    DOM.forecastUnitSelect.addEventListener('change', (e) => {
      AppState.forecastUnitFilter = e.target.value;
      renderForecastTable();
    });
  }
  if (DOM.forecastWorkloadSelect) {
    DOM.forecastWorkloadSelect.addEventListener('change', (e) => {
      AppState.forecastWorkloadFilter = e.target.value;
      renderForecastTable();
    });
  }
  if (DOM.forecastTimeFilter) {
    DOM.forecastTimeFilter.addEventListener('change', (e) => {
      AppState.forecastTimeFilter = e.target.value;
      renderForecastTable();
    });
  }
  if (DOM.btnExportForecastCsv) {
    DOM.btnExportForecastCsv.addEventListener('click', exportForecastReportCsv);
  }

  DOM.btnCloseDrawerDetail.addEventListener('click', closePrinterDetailDrawer);
  DOM.btnDetailClose.addEventListener('click', closePrinterDetailDrawer);
  DOM.btnDetailRefresh.addEventListener('click', () => {
    if (currentDrawerPrinterId) {
      loadDashboardData(false, true).then(() => openPrinterDetailDrawer(currentDrawerPrinterId));
    }
  });
  DOM.btnDetailEdit.addEventListener('click', () => {
    if (currentDrawerPrinterId && AppState.userRole === 'admin') {
      closePrinterDetailDrawer();
      openEditPrinterModal(currentDrawerPrinterId);
    }
  });
  DOM.btnDetailDelete.addEventListener('click', () => {
    if (currentDrawerPrinterId && AppState.userRole === 'admin') {
      const p = AppState.printers.find(x => x.id === currentDrawerPrinterId);
      confirmDeletePrinter(currentDrawerPrinterId, p ? (p.location || p.name) : 'Impressora');
    }
  });

  if (DOM.btnScrollTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 200) {
        DOM.btnScrollTop.classList.add('visible');
      } else {
        DOM.btnScrollTop.classList.remove('visible');
      }
    }, { passive: true });

    DOM.btnScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Backdrop individual para cada modal e gaveta
  const backdropMap = [
    { el: DOM.modalManualRecharge, close: closeManualRechargeModal },
    { el: DOM.modalPrinterForm, close: closeModalForm },
    { el: DOM.modalUnitForm, close: closeQuickUnitModal },
    { el: DOM.modalTestIp, close: closeTestIpModal },
    { el: DOM.modalManageUnits, close: closeManageUnitsModal },
    { el: DOM.drawerPrinterDetail, close: closePrinterDetailDrawer }
  ];

  backdropMap.forEach(({ el, close }) => {
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          close();
        }
      });
    }
  });

  // Fechamento em camadas com a tecla ESC (fecha primeiro o modal ativo superior)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.modalManualRecharge?.classList.contains('active')) {
        closeManualRechargeModal();
      } else if (DOM.modalPrinterForm?.classList.contains('active')) {
        closeModalForm();
      } else if (DOM.modalUnitForm?.classList.contains('active')) {
        closeQuickUnitModal();
      } else if (DOM.modalTestIp?.classList.contains('active')) {
        closeTestIpModal();
      } else if (DOM.modalManageUnits?.classList.contains('active')) {
        closeManageUnitsModal();
      } else if (DOM.drawerPrinterDetail?.classList.contains('active')) {
        closePrinterDetailDrawer();
      }
    }
  });
}

/* ==========================================================================
   FUNDO DINÂMICO DE ACESSO: CONSTELAÇÃO PREVENT SENIOR & MATRIX TI
   ========================================================================== */
let loginCanvasAnimId = null;
let currentLoginMode = 'operator'; // 'operator' (Rede Constelar Prevent Senior) ou 'admin' (Matrix TI)

function setLoginMode(mode) {
  currentLoginMode = mode;
}

function initLoginBackground() {
  const canvas = document.getElementById('login-background-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  // --------------------------------------------------------------------------
  // RECURSOS DO MODO 1: REDE CONSTELAR DE SAÚDE PREVENT SENIOR (VISUALIZAR UNIDADE)
  // --------------------------------------------------------------------------
  const corpNodes = [];
  const corpNodeCount = 42;
  const healthIcons = ['✦', '✚', '⬡', '◈', '⚕'];

  // --------------------------------------------------------------------------
  // RECURSOS DO MODO 2: CHUVA MATRIX COM EFEITO PÓ NO SOLO (ADMINISTRADOR)
  // --------------------------------------------------------------------------
  const codeTokens = [
    'SNMPv2c', '1.3.6.1.2.1.43', 'hrPrinterStatus', 'sysDescr',
    '10.1.152.x', '10.1.176.x', '10.5.104.x', 'UDP:161',
    'Epson_M1180', 'Brother_TLV', 'Lexmark_XC', 'Xerox_A3',
    'fetch("/api/status")', 'express()', 'Promise.allSettled',
    'renderMyPrinters()', 'tonerLevel:98%', 'drumKit:OK', 'fuserUnit:100%',
    'async/await', 'const { ip }', 'pageCount: 42890', 'ONLINE', 'OFFLINE',
    'CRITICAL<10%', 'WARNING:20%', '01001100', '11010001', '0x1F', '0xFF',
    'HTTP/1.1 200 OK', 'PreventSenior.TI', 'Units_138_Taiti',
    'Units_121_RioSul', 'Units_113_Havai', 'Units_103_Leblon', 'net-snmp',
    '0', '1', '{}', '[]', '=>', '//', '✦', '⌬', '⬡', '⚡', '</>', '◈'
  ];

  const fontSize = 13;
  let columns = 0;
  let columnStreams = [];
  const dustParticles = [];
  const maxDustParticles = 220;

  function createStream(colIndex) {
    const x = colIndex * fontSize * 1.55;
    const trailLength = 12 + Math.floor(Math.random() * 16);
    const speed = 2.4 + Math.random() * 3.4;
    const historyChars = [];
    for (let i = 0; i < trailLength; i++) {
      historyChars.push(getRandomChar());
    }

    return {
      x,
      y: -Math.random() * height * 0.9,
      speed,
      trailLength,
      historyChars,
      changeTimer: 0,
      colorType: Math.random() > 0.35 ? 'cyan' : 'royal'
    };
  }

  function getRandomChar() {
    const token = codeTokens[Math.floor(Math.random() * codeTokens.length)];
    return token[Math.floor(Math.random() * token.length)] || '0';
  }

  function spawnDust(x, groundY, colorType) {
    const burstCount = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < burstCount; i++) {
      if (dustParticles.length >= maxDustParticles) {
        dustParticles.shift();
      }
      const angle = (Math.PI * 0.15) + Math.random() * (Math.PI * 0.7);
      const speed = 1.2 + Math.random() * 3.2;
      dustParticles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: groundY - Math.random() * 4,
        vx: (Math.random() - 0.5) * 3.2,
        vy: -Math.sin(angle) * speed,
        gravity: 0.08 + Math.random() * 0.08,
        size: 0.8 + Math.random() * 1.8,
        alpha: 0.9 + Math.random() * 0.1,
        decay: 0.02 + Math.random() * 0.025,
        colorType: Math.random() > 0.3 ? colorType : 'white'
      });
    }
  }

  function resize() {
    width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
    height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
    dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Inicializa nós da constelação Prevent Senior
    corpNodes.length = 0;
    for (let i = 0; i < corpNodeCount; i++) {
      corpNodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 1.5 + Math.random() * 2.2,
        alpha: 0.3 + Math.random() * 0.5,
        icon: Math.random() > 0.75 ? healthIcons[Math.floor(Math.random() * healthIcons.length)] : null,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    // Inicializa colunas matrix
    columns = Math.floor(width / (fontSize * 1.55));
    columnStreams = [];
    for (let c = 0; c < columns; c++) {
      columnStreams.push(createStream(c));
    }
  }

  window.addEventListener('resize', resize);
  resize();

  let time = 0;

  function draw() {
    if (!DOM.loginOverlay || !DOM.loginOverlay.classList.contains('active')) {
      loginCanvasAnimId = null;
      return;
    }

    time += 0.015;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    // ==========================================================================
    // 1️⃣ MODO OPERADOR: REDE CONSTELAR DE SAÚDE PREVENT SENIOR (VISUALIZAR UNIDADE)
    // ==========================================================================
    if (currentLoginMode === 'operator') {
      ctx.clearRect(0, 0, width, height);

      // Fundo azul marinho profundo com gradiente institucional da Prevent Senior
      const grad = ctx.createRadialGradient(
        width * 0.5, height * 0.45, 40,
        width * 0.5, height * 0.45, Math.max(width, height) * 0.75
      );

      if (isLight) {
        grad.addColorStop(0, '#f0f9ff');
        grad.addColorStop(0.6, '#e0f2fe');
        grad.addColorStop(1, '#f8fafc');
      } else {
        grad.addColorStop(0, '#041f3d');
        grad.addColorStop(0.5, '#031429');
        grad.addColorStop(1, '#020b1e');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ondas Circulares de Pulso Harmônico Suave
      const pulseRadius = (time * 30) % (Math.min(width, height) * 0.6);
      const pulseAlpha = Math.max(0, 1 - (pulseRadius / (Math.min(width, height) * 0.6))) * 0.22;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.45, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isLight ? `rgba(2, 132, 199, ${pulseAlpha})` : `rgba(0, 229, 255, ${pulseAlpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Linhas Finas Translúcidas de Conexão entre Nós
      const maxConnectDist = Math.min(width * 0.18, 140);
      ctx.lineWidth = 0.8;
      for (let i = 0; i < corpNodes.length; i++) {
        for (let j = i + 1; j < corpNodes.length; j++) {
          const n1 = corpNodes[i];
          const n2 = corpNodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const edgeAlpha = (1 - dist / maxConnectDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = isLight ? `rgba(2, 132, 199, ${edgeAlpha})` : `rgba(56, 189, 248, ${edgeAlpha})`;
            ctx.stroke();
          }
        }
      }

      // Nós Sutis da Constelação e Ícones de Saúde
      ctx.font = '600 11px "JetBrains Mono", monospace';
      corpNodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        const pulse = Math.sin(time * 2 + node.pulseOffset);
        const currentRadius = node.radius + pulse * 0.5;
        const currentAlpha = node.alpha + pulse * 0.15;

        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? `rgba(2, 132, 199, ${currentAlpha})` : `rgba(0, 229, 255, ${currentAlpha})`;
        ctx.fill();

        if (node.icon) {
          ctx.fillStyle = isLight ? `rgba(1, 87, 155, ${currentAlpha * 0.8})` : `rgba(255, 255, 255, ${currentAlpha * 0.65})`;
          ctx.fillText(node.icon, node.x + 5, node.y + 4);
        }
      });
    }
    // ==========================================================================
    // 2️⃣ MODO ADMINISTRADOR: CHUVA MATRIX DE CÓDIGOS COM DISSOLUÇÃO EM PÓ NO SOLO
    // ==========================================================================
    else {
      // Fundo cinematográfico escuro com rastro
      ctx.fillStyle = 'rgba(2, 6, 23, 0.26)';
      ctx.fillRect(0, 0, width, height);

      const groundY = height - 8;

      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;

      columnStreams.forEach((stream) => {
        stream.y += stream.speed;
        stream.changeTimer++;

        if (stream.changeTimer > 4) {
          stream.historyChars.pop();
          stream.historyChars.unshift(getRandomChar());
          stream.changeTimer = 0;
        }

        for (let i = 0; i < stream.trailLength; i++) {
          const charY = stream.y - i * (fontSize + 3);
          if (charY < -20 || charY > height + 20) continue;

          const char = stream.historyChars[i] || '0';
          const progress = 1 - (i / stream.trailLength);

          if (i === 0) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00e5ff';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(char, stream.x, charY);
            ctx.shadowBlur = 0;
          } else {
            const alpha = progress * 0.85;
            ctx.fillStyle = stream.colorType === 'cyan' ? `rgba(56, 189, 248, ${alpha})` : `rgba(0, 229, 255, ${alpha})`;
            ctx.fillText(char, stream.x, charY);
          }
        }

        // Colisão no chão e virada em pó
        if (stream.y >= groundY) {
          spawnDust(stream.x, groundY, stream.colorType);
          stream.y = -20 - Math.random() * 220;
          stream.speed = 2.4 + Math.random() * 3.4;
        }
      });

      // Partículas de Pó Luminoso
      for (let i = dustParticles.length - 1; i >= 0; i--) {
        const p = dustParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.96;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y > height + 20) {
          dustParticles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.colorType === 'white' ? '#ffffff' : '#00e5ff';
        ctx.fillStyle = p.colorType === 'white' ? `rgba(255, 255, 255, ${p.alpha})` : `rgba(0, 229, 255, ${p.alpha})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Linha sutil de energia no chão
      const groundGrad = ctx.createLinearGradient(0, groundY, width, groundY);
      groundGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
      groundGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.35)');
      groundGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.strokeStyle = groundGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 2);
      ctx.lineTo(width, groundY + 2);
      ctx.stroke();
    }

    loginCanvasAnimId = requestAnimationFrame(draw);
  }

  if (loginCanvasAnimId) {
    cancelAnimationFrame(loginCanvasAnimId);
  }
  loginCanvasAnimId = requestAnimationFrame(draw);
}

function startLoginCanvas() {
  if (!loginCanvasAnimId) {
    initLoginBackground();
  }
}

function stopLoginCanvas() {
  if (loginCanvasAnimId) {
    cancelAnimationFrame(loginCanvasAnimId);
    loginCanvasAnimId = null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupEventListeners();

  // Limpa campos de credencial ao carregar a página
  if (DOM.adminUserInput) DOM.adminUserInput.value = '';
  if (DOM.adminPasswordInput) DOM.adminPasswordInput.value = '';

  const savedRole = sessionStorage.getItem('auth_role');
  const savedUnit = sessionStorage.getItem('printer_monitor_unit');

  // Operador pode manter a unidade selecionada na sessão ativa da aba
  if (savedRole === 'operator' && savedUnit) {
    AppState.userRole = 'operator';
    AppState.activeUnitFilter = savedUnit;
    DOM.loginOverlay.classList.remove('active');
    stopLoginCanvas();
  } else {
    // Para Administrador ou primeiro acesso, sempre abre a tela inicial exigindo credenciais
    sessionStorage.clear();
    AppState.userRole = 'operator';
    AppState.activeUnitFilter = '';
    DOM.loginOverlay.classList.add('active');
    setLoginMode('operator');
    startLoginCanvas();
  }

  await loadDashboardData(true);

  AppState.autoRefreshInterval = setInterval(() => {
    loadDashboardData(false);
  }, AppState.refreshIntervalMs);
});
