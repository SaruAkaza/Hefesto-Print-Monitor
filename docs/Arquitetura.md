# Arquitetura do sistema: painel de impressoras

> Documento técnico de arquitetura e catálogo de serviços.  
> Compatibilidade: Markdown e Obsidian  

## Visão geral

O sistema monitora impressoras de rede em tempo real, coletando contadores e níveis de suprimentos via protocolo SNMP para apoiar o suporte técnico e o planejamento de compras.

## Estrutura da aplicação

```
Painel de Impressoras
├── Visão geral
│   ├── Status operacional (Críticas, Atenção, Sem Conexão)
│   ├── Fila de atenção priorizada por nível de suprimento
│   ├── Lista de impressoras por filial com detalhes e ações
│   └── Relatório de suprimentos CMYK por equipamento
├── Controle de acesso
│   ├── Perfil Operador: modo leitura restrito à filial selecionada
│   └── Perfil Administrador: visão global, cadastro, edição e relatórios
├── Diagnóstico de rede
│   └── Teste de conectividade por endereço IP (SNMP e HTTP)
└── Exportação de relatórios
    └── Geração de planilhas em CSV com contadores e níveis
```

## Componentes técnicos

### Backend (Node.js e Express)
- Runtime: Node.js v24 (ES Modules)
- Framework: Express.js
- Porta: 80 (acesso local e na rede corporativa)
- Driver SNMP: biblioteca `net-snmp` (consultas RFC 3805 e MIBs proprietárias de fabricantes)
- Banco de dados: SQLite local via `node:sqlite` (`DatabaseSync` nativo)
- Cache de status: persistência da última telemetria lida para carregamento rápido
- Varredura agendada: leitura automática a cada 30 minutos

### Frontend (Web)
- Interface: HTML5 semântico e CSS3 com suporte a tema escuro e claro
- Tipografia: fontes Plus Jakarta Sans e JetBrains Mono
- Lógica de cliente: JavaScript vanilla sem etapas de compilação ou bundlers externos

## Rotas da API REST

### Impressoras
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/printers` | Lista todas as impressoras cadastradas |
| `POST` | `/api/printers` | Cadastra nova impressora (`name`, `ip`, `location`, `unitId`, `unitName`) |
| `PUT` | `/api/printers/:id` | Atualiza dados cadastrais da impressora |
| `DELETE` | `/api/printers/:id` | Remove impressora do sistema |
| `POST` | `/api/printers/batch` | Importação de impressoras em lote |

### Unidades e pastas
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/units` | Lista as pastas de unidades cadastradas |
| `POST` | `/api/units` | Cria nova pasta de unidade |
| `PUT` | `/api/units/:id` | Atualiza dados da unidade |
| `DELETE` | `/api/units/:id` | Remove pasta de unidade |

### Telemetria e diagnóstico
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/status/all` | Retorna telemetria do cache (ou `?force=true` para leitura em tempo real) |
| `GET` | `/api/printers/:id/status` | Leitura SNMP detalhada de uma impressora |
| `GET` | `/api/printers/:id/test` | Teste de comunicação com impressora cadastrada |
| `GET` | `/api/test-ip?ip=...` | Teste de conectividade SNMP direto em endereço IP avulso |
| `GET` | `/api/telemetry/history` | Histórico de leituras para análise de consumo |

