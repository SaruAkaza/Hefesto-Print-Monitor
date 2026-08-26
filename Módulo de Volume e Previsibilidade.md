# 🔮 Módulo de Volume de Impressões & Previsibilidade de Suprimentos

> **Hub Central:** [[Projeto Hefesto]]  
> **Tags:** #projeto-hefesto #previsibilidade #volume #capacidade #kpis

---

## 🎯 Objetivo & Funcionalidades

O **Módulo de Volume e Previsibilidade** transforma dados brutos de contadores SNMP em inteligência de gestão para a equipe de TI e Operações, respondendo a quatro perguntas críticas:
1. **Quanto cada impressora imprimiu** hoje, nos últimos 7 dias e nos últimos 30 dias?
2. **Quantas páginas ainda podem ser impressas** com a tinta/toner restante?
3. **Quando exatamente será a próxima troca de suprimento** de cada impressora?
4. **O equipamento está operando em sua capacidade saudável**, ocioso ou sobrecarregado?

---

## 📐 Algoritmo Preditivo & Fórmulas Matemáticas

O motor de previsão emprega o modelo **Run-Rate Híbrido** cruzando a média histórica móvel com o rendimento nominal certificado do suprimento:

### 1. Cálculo da Média Diária de Produção ($\text{AvgPages/Dia}$)
$$\text{Média Diária} = \max\left(1, \left\lceil \frac{\text{Páginas}_{30\text{d}}}{30} \right\rceil\right)$$

### 2. Páginas Restantes Estimadas ($\text{Pages}_{\text{rem}}$)
$$\text{Pages}_{\text{rem}} = \left\lfloor \text{Rendimento Nominal} \times \left( \frac{\%\text{ Nível Normalizado}}{100} \right) \right\rfloor$$

### 3. Dias Restantes até Esgotamento ($\text{Days}_{\text{rem}}$)
$$\text{Days}_{\text{rem}} = \left\lceil \frac{\text{Pages}_{\text{rem}}}{\text{Média Diária}} \right\rceil$$

### 4. Data Projetada da Próxima Troca
$$\text{Data da Troca} = \text{Data Atual} + \text{Days}_{\text{rem}} \text{ dias}$$

---

## ⚖️ Classificação de Carga & Validação de Capacidade

O sistema compara a projeção mensal de impressões com o ciclo de trabalho mensal recomendado do equipamento:

$$\text{Taxa de Carga (\%)} = \left( \frac{\text{Média Diária} \times 30}{\text{Capacidade Nominal Mensal}} \right) \times 100$$

| Status da Carga | Faixa de Utilização | Diagnóstico & Ação |
| :--- | :---: | :--- |
| 🔴 **Alta Carga / Sobrecarga** | $> 80\%$ | Equipamento sob alto estresse térmico/mecânico. Avaliar remanejamento ou modelo de maior porte. |
| 🟢 **Carga Ideal / Saudável** | $25\% - 80\%$ | Operação em equilíbrio com a vida útil nominal do equipamento. |
| ⚪ **Subutilizada / Ociosa** | $< 25\%$ | Impressora com baixo volume. Oportunidade para consolidação de filas ou realocação para setores mais demandados. |

---

## 🖨️ Normalização Especial para Tanques EcoTank (Garrafas de Tinta)

Modelos contínuos da linha **Epson EcoTank (ex: EPSON M1180, C5790)** não possuem sensores ópticos de percentual fracionado, reportando código SNMP `-2` (*Nível Presente e Operacional*).
* O motor normaliza internamente essa leitura como `~85% (Estimado)`.
* Evita falsos alarmes de *"0% e esgotamento em 1 dia"*.
* Mantém 100% de alinhamento com a visualização do Raio-X.

---

## 📊 Cards de Indicadores (KPIs) Reativos por Unidade

O cockpit superior apresenta 4 cartões executivos equipados com tags de intervalo de datas exato:
- **Páginas Hoje:** `📅 DD/MM/AAAA (Hoje)` — Volume impresso desde as 00h00.
- **Páginas na Semana:** `📅 [Início] a [Fim] (7d)` — Volume acumulado dos últimos 7 dias corridos.
- **Páginas no Mês:** `📅 [Início] a [Fim] (30d)` — Volume acumulado dos últimos 30 dias corridos.
- **Trocas Iminentes (< 7 dias):** `🚨 Janela: até [Data Futura]` — Quantidade de toners/bolsas prestes a acabar.

> **Reatividade:** Ao selecionar uma unidade (ex: *113 - Havaí* ou *121 - Rio Sul*), todos os 4 cards recalculam os valores e legendas instantaneamente para o escopo daquela filial.

---

## 🔗 Ligações do Obsidian
- [[Projeto Hefesto]] — Hub principal de arquitetura
- [[Histórico de Recargas e Suprimentos]] — Registro de trocas e auditoria
- [[Arquitetura e Endpoints da API]] — Detalhes da rota `/api/analytics/volume-forecast`
- [[Atualizações]] — Roadmap e progresso