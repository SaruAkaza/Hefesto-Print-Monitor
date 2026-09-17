# Volume de impressões e previsão de suprimentos

> Hub central: [[Projeto Hefesto]]  
> Tags: #projeto-hefesto #previsibilidade #volume #capacidade #kpis

## Objetivo

O módulo de volume calcula o ritmo de impressão das máquinas e projeta a data aproximada de término de cada suprimento com base no histórico recente. O acompanhamento analisa quatro pontos:
1. Total de páginas impressas hoje, nos últimos 7 dias e nos últimos 30 dias.
2. Estimativa de páginas restantes com a carga atual de tinta ou toner.
3. Previsão da data de esgotamento de cada suprimento.
4. Comparação entre o volume mensal projetado e a capacidade nominal do equipamento.

## Fórmulas de cálculo

A projeção de consumo combina a média móvel de impressões com o rendimento nominal do suprimento:

### 1. Média diária de produção ($\text{AvgPages/Dia}$)
$$\text{Média Diária} = \max\left(1, \left\lceil \frac{\text{Páginas}_{30\text{d}}}{30} \right\rceil\right)$$

### 2. Páginas restantes estimadas ($\text{Pages}_{\text{rem}}$)
$$\text{Pages}_{\text{rem}} = \left\lfloor \text{Rendimento Nominal} \times \left( \frac{\%\text{ Nível Normalizado}}{100} \right) \right\rfloor$$

### 3. Dias restantes até o esgotamento ($\text{Days}_{\text{rem}}$)
$$\text{Days}_{\text{rem}} = \left\lceil \frac{\text{Pages}_{\text{rem}}}{\text{Média Diária}} \right\rceil$$

### 4. Data projetada para a troca
$$\text{Data da Troca} = \text{Data Atual} + \text{Days}_{\text{rem}} \text{ dias}$$

## Classificação de carga

O cálculo relaciona o volume mensal projetado com a recomendação do fabricante:

$$\text{Taxa de Carga (\%)} = \left( \frac{\text{Média Diária} \times 30}{\text{Capacidade Nominal Mensal}} \right) \times 100$$

| Faixa de carga | Utilização | Avaliação |
| :--- | :---: | :--- |
| Alta carga | $> 80\%$ | Uso acima da média recomendada para o modelo. |
| Carga normal | $25\% - 80\%$ | Uso dentro da faixa recomendada. |
| Ociosa | $< 25\%$ | Baixo volume de páginas impressas. |

## Tanques de tinta contínuos (EcoTank)

Impressoras como Epson M1180 e C5790 reportam o código SNMP `-2` para nível presente sem medição fracionada. O sistema padroniza essa leitura em 85% para manter a exibição no painel e evitar falsos alarmes de nível zerado.

## Indicadores na interface

O painel exibe quatro cartões com o período correspondente:
- Páginas hoje: contagem desde as 00h00.
- Páginas na semana: volume dos últimos 7 dias.
- Páginas no mês: volume dos últimos 30 dias.
- Trocas em até 7 dias: quantidade de suprimentos com término previsto na semana seguinte.

Ao selecionar uma unidade específica, os valores e datas dos cartões se ajustam automaticamente ao grupo de impressoras filtrado.

## Links relacionados

- [[Projeto Hefesto]]: visão geral do sistema
- [[Banco de Dados e Persistência SQLite]]: armazenamento das leituras e histórico diário
- [[Histórico de Recargas e Suprimentos]]: registro e auditoria de trocas
- [[Arquitetura e Endpoints da API]]: rota `/api/analytics/volume-forecast`
- [[Atualizações]]: histórico de alterações