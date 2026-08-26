# ⚙️ Arquitetura Técnica & Endpoints da API

> **Hub Central:** [[Projeto Hefesto]]  
> **Tags:** #projeto-hefesto #api #arquitetura #node #express #snmp

---

## 🏗️ Visão da Arquitetura

O sistema é construído sobre uma arquitetura orientada a serviços leves em **Node.js (Express)**, com polling SNMP não-bloqueante (`net-snmp`) e frontend Vanilla JavaScript sem dependências pesadas de compilação.

```mermaid
graph LR
    subgraph Frontend
        A[index.html]
        B[app.js]
        C[style.css]
    end
    subgraph Backend
        D[server.js]
        E[snmp-service.js]
    end
    subgraph Persistencia
        F[(printers.json)]
        G[(units.json)]
        H[(recharges.json)]
        I[(page_history.json)]
    end
    Frontend <-->|HTTP REST / JSON| Backend
    Backend <-->|Leitura / Escrita| Persistencia
    Backend <-->|SNMP v1/v2c UDP 161| Impressoras[Parque de Impressoras]
```

---

## 📡 Catálogo de Endpoints REST

### 1. Volume & Previsibilidade
- **`GET /api/analytics/volume-forecast`**
  - Retorna a lista de todas as impressoras com contadores diários, semanais, mensais, média/dia, capacidade/workload, suprimento crítico e data projetada de esgotamento.

### 2. Recargas & Suprimentos
- **`GET /api/recharges`**
  - Lista o histórico de recargas registradas (com filtros opcionais por `printerId` ou `unitId`).
- **`GET /api/recharges/summary`**
  - Retorna um mapa indexado por `printerId` contendo os dados da última recarga de cada equipamento.
- **`POST /api/recharges`**
  - Registra manualmente uma recarga de suprimento e atualiza imediatamente o cache de status.
- **`DELETE /api/recharges/:id`**
  - Remove um registro de recarga do histórico.

### 3. Relatórios & Auditoria de Entrada
- **`GET /api/reports/initial-integration`**
  - Retorna o relatório consolidado de primeira conexão à rede, contadores iniciais de entrada, contadores atuais e total produzido sob gestão.
- **`GET /api/config/branding`**
  - Retorna a configuração ativa de identidade visual e marca da aplicação (White-Label).

### 4. Telemetria & Status Operacional
- **`GET /api/status/all`**
  - Retorna o status SNMP em tempo real de todas as impressoras (suporta `?force=true`).
- **`GET /api/printers/:id/status`**
  - Consulta o status detalhado de uma impressora específica.
- **`GET /api/test-ip?ip=...`**
  - Executa um teste de conectividade SNMP direto contra qualquer endereço IP.

### 5. Inventário & Pastas (Unidades)
- **`GET /api/printers`** | **`POST /api/printers`** | **`PUT /api/printers/:id`** | **`DELETE /api/printers/:id`**
- **`GET /api/units`** | **`POST /api/units`** | **`PUT /api/units/:id`** | **`DELETE /api/units/:id`**

---

## 💾 Persistência de Dados em Disco

| Arquivo | Descrição |
| :--- | :--- |
| `server/data/printers.json` | Cadastro de equipamentos, endereços IP, setor e unidade. |
| `server/data/units.json` | Cadastro de pastas de unidades e filiais (SP e RJ). |
| `server/data/recharges.json` | Histórico cronológico de trocas de suprimentos. |
| `server/data/page_history.json` | Snapshots diários de contadores de páginas para análise temporal. |

---

## 🔗 Ligações do Obsidian
- [[Projeto Hefesto]] — Hub central do projeto
- [[Módulo de Volume e Previsibilidade]] — Regras de negócio de previsão
- [[Histórico de Recargas e Suprimentos]] — Regras de ciclo e recargas
- [[Atualizações]] — Roadmap