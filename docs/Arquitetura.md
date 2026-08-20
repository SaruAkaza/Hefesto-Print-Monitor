# 📄 Arquitetura do Projeto - Painel de Impressoras (Enterprise Edition)

> Documento de arquitetura, padrões de engenharia e decisões técnicas.  
> **Compatibilidade:** Obsidian Vault / Markdown  

---

## 1. Visão Geral da Plataforma

Sistema corporativo de **Fleet & Supplies Management (Gestão de Parque de Impressoras e Reposição de Suprimentos)** que monitora em tempo real equipamentos de rede e conecta a telemetria técnica de TI com a esteira de compras e estoque de insumos.

---

## 2. Estrutura Modular da Aplicação

```
Painel de Impressoras
├─ 📊 Visão Geral (Tela Única Contínua)
│  ├─ Status Agora: KPIs operacionais clicáveis (Críticas, Atenção, Sem Conexão)
│  ├─ Fila “Requer Ação Imediata” priorizada por criticidade
│  ├─ Lista de Minhas Impressoras (Tabela Densa com Raio-X, Atualizar, Editar, Excluir)
│  └─ Relatório Consolidado de Tintas por Impressora (Preto, Ciano, Magenta, Amarelo)
├─ 🛡️ Controle de Acesso & Perfis
│  ├─ Perfil Operador: Read-only travado na filial selecionada
│  └─ Perfil Administrador: Acesso irrestrito com cadastro, edição, exclusão e relatórios
├─ ⚡ Diagnóstico de Rede & Teste Rápido de IP
│  └─ Validação de impressoras não cadastradas via SNMP UDP 161 e HTTP TCP 80
└─ 📦 Exportação para Compras
   └─ Geração de planilha CSV padronizada com níveis de suprimento
```

---

## 3. Stack Tecnológica & Performance

### Backend (Node.js & Express)
- **Runtime:** Node.js v24 (ESM Modules)
- **Framework:** Express.js com API REST
- **Endereço de Escuta:** `0.0.0.0:3000` (Acesso direto via localhost e IP na rede local)
- **Engine SNMP:** `net-snmp` (consultas RFC 3805 em 1.8s com zero retries desnecessários)
- **Conector Resiliente:** HTTP Web Scraper automático para vencer firewalls entre VLANs
- **Cache em Memória:** Pré-carregamento de dados para respostas instantâneas (< 100ms)
- **Background Worker:** Sincronização em segundo plano a cada 3 minutos

### Frontend (Vanilla Web)
- **Design System:** Dark Slate Theme nativo com suporte a Light Mode comutável
- **Tipografia:** Google Fonts (Inter e JetBrains Mono)
- **Visualizações:** Lista/Tabela Densa de alta densidade de informação e Side Drawer Raio-X 360°

---

## 4. Endpoints da API REST

### Impressoras & Parque
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/printers` | Lista todas as impressoras cadastradas |
| `POST` | `/api/printers` | Cadastra nova impressora (`name`, `ip`, `location`, `unitId`, `unitName`) |
| `PUT` | `/api/printers/:id` | Atualiza dados cadastrais da impressora |
| `DELETE` | `/api/printers/:id` | Remove impressora do parque |
| `POST` | `/api/printers/batch` | Importação em lote via planilha |

### Unidades & Pastas
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/units` | Lista todas as pastas de unidades/filiais |
| `POST` | `/api/units` | Cria nova pasta de unidade |
| `PUT` | `/api/units/:id` | Atualiza dados da pasta |
| `DELETE` | `/api/units/:id` | Remove pasta de unidade |

### Telemetria, Status & Diagnóstico
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/status/all` | Status instantâneo via Cache (ou `?force=true` para consulta direta) |
| `GET` | `/api/printers/:id/status` | Status detalhado em tempo real de uma impressora |
| `GET` | `/api/printers/:id/test` | Teste de conectividade SNMP/HTTP de impressora cadastrada |
| `GET` | `/api/test-ip?ip=...` | **Testa qualquer IP avulso (não cadastrado) na rede local** |
| `GET` | `/api/telemetry/history` | Histórico acumulado de contadores e suprimentos |
