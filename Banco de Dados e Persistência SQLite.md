# 🗄️ Banco de Dados Relacional & Persistência SQLite Nativo

> **Hub Central:** [[Projeto Hefesto]]  
> **Tags:** #projeto-hefesto #banco-de-dados #sqlite #persistencia #acid #backup #node24

---

## 🎯 Visão Geral & Motivação

O **Projeto Hefesto** migrou sua camada de armazenamento de arquivos JSON voláteis em disco para uma arquitetura de **Banco de Dados Relacional SQLite Nativo** (`node:sqlite`), embutido nativamente no binário do **Node.js v24**.

### Por que esta solução foi escolhida?
1. **Custo R$ 0,00 (100% Gratuito e Local):** Não requer contratação de servidores em nuvem (AWS RDS, Supabase, etc.) nem portas de rede adicionais.
2. **Zero Dependências de Compilação:** Como utiliza a API oficial `DatabaseSync` do Node.js v24 (`import { DatabaseSync } from 'node:sqlite'`), dispensa compiladores C++ (`node-gyp`, Visual Studio Build Tools ou Python).
3. **Integridade Transacional ACID:** Garante escritas atômicas e isoladas, eliminando o risco de corrupção de arquivos em caso de desligamento abrupto ou concorrência.
4. **Resiliência e Continuidade:** O status das impressoras e as confirmações de recarga pendentes sobrevivem a reinicializações do servidor.

---

## 🏗️ Modelo Entidade-Relacionamento (ER)

```mermaid
erDiagram
    UNITS ||--o{ PRINTERS : "contém"
    PRINTERS ||--|| PRINTER_STATUS_CACHE : "possui cache ativo"
    PRINTERS ||--o{ PENDING_RECHARGES : "aguarda confirmação"
    PRINTERS ||--o{ RECHARGES : "acumula histórico"
    PRINTERS ||--o{ PAGE_HISTORY : "registra contadores"
    PRINTERS ||--o{ TELEMETRY_SNAPSHOTS : "registra snapshots"

    UNITS {
        TEXT id PK
        TEXT name
        TEXT description
        TEXT created_at
    }

    PRINTERS {
        TEXT id PK
        TEXT name
        TEXT ip UK
        TEXT location
        TEXT unit_id FK
        TEXT unit_name
        TEXT community
        INTEGER initial_page_count
        TEXT hefesto_activated_at
        TEXT installed_at
        TEXT created_at
        TEXT updated_at
    }

    PRINTER_STATUS_CACHE {
        TEXT printer_id PK,FK
        INTEGER online
        INTEGER status_code
        TEXT status_description
        INTEGER page_count
        TEXT model
        TEXT serial_number
        TEXT supplies_json
        TEXT trays_json
        TEXT cached_at
    }

    PENDING_RECHARGES {
        TEXT id PK
        TEXT printer_id FK
        TEXT supply_name
        TEXT supply_type
        REAL baseline_level
        REAL target_level
        INTEGER consecutive_cycles
        TEXT first_seen
        TEXT last_seen
    }

    RECHARGES {
        TEXT id PK
        TEXT printer_id
        TEXT printer_name
        TEXT ip
        TEXT unit_name
        TEXT location
        TEXT supply_name
        TEXT supply_type
        REAL previous_level
        REAL new_level
        INTEGER page_count
        INTEGER pages_since_last_recharge
        TEXT source
        INTEGER is_full_recharge
        TEXT status_tag
        TEXT technician
        TEXT notes
        TEXT timestamp
    }

    PAGE_HISTORY {
        TEXT id PK
        TEXT printer_id
        TEXT date
        INTEGER start_page_count
        INTEGER end_page_count
        INTEGER pages_printed
        TEXT supplies_json
        TEXT created_at
        TEXT updated_at
    }

    TELEMETRY_SNAPSHOTS {
        INTEGER id PK
        TEXT printer_id
        TEXT ip
        TEXT name
        TEXT unit_name
        INTEGER page_count
        TEXT supplies_json
        TEXT recorded_at
    }
```

---

## 📋 Dicionário de Tabelas

| Tabela | Finalidade | Regras & Chaves Estrangeiras |
| :--- | :--- | :--- |
| `units` | Pastas das filiais/unidades (Sede, Taiti, Leblon, etc.). | `id` chave primária. |
| `printers` | Cadastro das 73 impressoras ativas. | `ip` único. `unit_id` com `ON DELETE SET NULL`. |
| `printer_status_cache` | Última telemetria válida lida via SNMP. | `printer_id` com `ON DELETE CASCADE`. Permite boot instantâneo. |
| `pending_recharges` | Memória de intenção para trocas em processo de validação. | `printer_id` com `ON DELETE CASCADE`. Elimina perdas por reboot. |
| `recharges` | Histórico permanente e auditável de recargas. | Registro de páginas rodadas no ciclo e tipo (Oficial vs Provisória). |
| `page_history` | Snapshots diários para volumetria (Hoje, 7d, 30d). | Desacoplado de deleção de impressoras para preservar histórico contábil. |
| `telemetry_snapshots` | Histórico granular de níveis de suprimentos. | Base para o motor analítico e predição de esgotamento. |

---

## ⚡ Rotina de Backup Diário Rotativo (`VACUUM INTO`)

Para garantir segurança total contra falhas de hardware ou exclusões acidentais, o módulo `server/db.js` executa uma rotina automática de backup:
- **Método Atômico:** Executa `VACUUM INTO 'data/backups/hefesto_backup_YYYY-MM-DD.db'`, gerando uma cópia compacta e 100% consistente mesmo enquanto o banco está em uso.
- **Frequência:** Executado no arranque do servidor e agendado a cada 24 horas via `setInterval`.
- **Janela de Retenção:** Mantém os últimos **7 dias de backups**, expurgando automaticamente os arquivos mais antigos para não consumir espaço desnecessário.

---

## 🔄 Migração Automática a partir dos JSONs

Ao iniciar pela primeira vez em um ambiente novo, o sistema verifica a existência do arquivo `server/data/hefesto.db`. Se não existir:
1. Executa o script de DDL (`createSchema()`) gerando todas as tabelas e índices.
2. Faz backup preventivo dos arquivos JSON existentes em `server/data/backups/json_pre_sqlite_[timestamp]`.
3. Popula as tabelas a partir de `units.json`, `printers.json`, `recharges.json`, `page_history.json` e `telemetry_history.json`.
4. Sanitiza os dados, garantindo que o painel continue operacional sem interrupções.

---

## 🔗 Ligações do Obsidian
- [[Projeto Hefesto]] — Hub principal de arquitetura
- [[Histórico de Recargas e Suprimentos]] — Motor de assertividade e confirmação em 10s
- [[Módulo de Volume e Previsibilidade]] — Motor analítico alimentado pelo SQLite
- [[Arquitetura e Endpoints da API]] — Catálogo de serviços REST e camada de dados
- [[Atualizações]] — Registro de versões e roadmap
