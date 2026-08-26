# 📥 Relatório Histórico de Início na Rede & Auditoria Inicial

> **Hub Central:** [[Projeto Hefesto]]  
> **Tags:** #projeto-hefesto #auditoria #integracao #relatorios #contadores #telemetria

---

## 🎯 Objetivo & Visão Geral

O **Relatório Histórico de Início na Rede** registra o marco zero (baseline) de cada equipamento no parque corporativo, respondendo com precisão:
1. **Quando a impressora foi conectada pela primeira vez à rede** (data e hora de integração).
2. **Quantas impressões totais de fábrica/vida útil ela possuía** no momento da primeira sincronização.
3. **Quantas páginas foram efetivamente produzidas sob a gestão do sistema** ($\text{Delta} = \text{Contador Atual} - \text{Contador Inicial}$).
4. **Auditoria de Contratos de Outsourcing / Locação:** Garantia de que impressoras alugadas novas ou recondicionadas tenham seus contadores iniciais periciados contra a Nota Fiscal e Termo de Entrega.

```mermaid
flowchart LR
    A[Chegada da Impressora na Unidade] --> B[1ª Conexão IP / SNMP na Rede]
    B --> C[Captura do Marco Zero: Data & Contador Inicial]
    C --> D[Monitoramento Contínuo de Produção]
    D --> E[Raio-X: Card de Entrada na Rede]
    D --> F[Exportação CSV: Relatório de Auditoria Inicial]
```

---

## 📐 Fórmulas & Regras de Cálculo

### 1. Páginas Produzidas sob Gestão do Sistema
$$\text{Produção sob Gestão} = \max(0, \, \text{Contador Atual} - \text{Contador Inicial})$$

* **Caso 1 (Máquina Nova / Zerada):** $\text{Contador Inicial} = 0 \implies \text{Produção sob Gestão} = \text{Contador Atual}$.
* **Caso 2 (Máquina Remanejada / Locada):** $\text{Contador Inicial} = 15.420 \text{ e } \text{Atual} = 18.900 \implies \text{Produção sob Gestão} = +3.480 \text{ páginas}$.

---

## 🏛️ Onde o Recurso Está Disponível

### 1. 🔬 No Raio-X 360° da Impressora
* Card em destaque: **"Marco de Entrada na Rede & Auditoria Inicial"**.
* Exibe os 4 pilares: **1ª Conexão**, **Contador Inicial**, **Contador Atual** e **Produção sob Gestão (+X pág.)**.

### 2. 📊 No Cabeçalho Administrativo (Exportação CSV)
* Botão **`📥 Histórico Inicial CSV`** para download de relatório consolidado com 10 colunas:
  1. `Unidade / Filial`
  2. `Local / Setor`
  3. `Endereço IP`
  4. `Modelo da Impressora`
  5. `Número de Série`
  6. `Data de Entrada na Rede`
  7. `Contador Inicial (Páginas)`
  8. `Contador Atual (Páginas)`
  9. `Páginas Rodadas sob Gestão (Delta)`
  10. `Status Operacional Atual`

### 3. ⚙️ No Modal de Cadastro / Edição da Impressora
* Campos para calibração manual pelo Administrador (`Contador Inicial` e `Data de Entrada`), permitindo ajuste caso a máquina tenha chegado dias antes da configuração de rede.

---

## 🔗 Ligações do Sistema (Wikilinks)
- [[Projeto Hefesto]] — Hub central da plataforma.
- [[Módulo de Volume e Previsibilidade]] — Análise diária, semanal e mensal de produção.
- [[Histórico de Recargas e Suprimentos]] — Registro de trocas de insumos.
- [[Arquitetura e Endpoints da API]] — Endpoint `GET /api/reports/initial-integration`.
- [[Atualizações]] — Registro de entrega da funcionalidade.
