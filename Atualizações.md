# 📋 Roadmap & Registro de Atualizações — Prevent Senior

> **Hub Central:** [[Projeto Hefesto]]  
> **Tags:** #prevent-senior #projeto-hefesto #roadmap #atualizacoes

---

## 🎯 Status das Demandas e Funcionalidades

- [x] **Contador e Histórico de Recargas de Suprimentos:**  
  Data e hora da última recarga, regra de corte ($\ge 95\%$ vs $< 95\%$), cálculo automático de páginas rodadas no ciclo e formulário manual no Raio-X.  
  🔗 *Documentação completa:* [[Histórico de Recargas e Suprimentos]]

- [x] **Relatório de Volume & Motor Preditivo de Troca de Tinta:**  
  Contabilização de páginas impressas no dia, semana (7d), mês (30d) e média diária. Cálculo inteligente de quantas impressões ainda restam e data projetada de esgotamento/troca de suprimentos, validando capacidade máxima (Alta Carga, Ideal, Ociosa). Cards de indicadores reativos por unidade com exibição do período exato contabilizado.  
  🔗 *Documentação completa:* [[Módulo de Volume e Previsibilidade]]

- [x] **Isolamento de Perfis de Acesso e Privacidade:**  
  Perfil Administrador com visão analítica e gestão completa. Perfil Operador focado estritamente no status operacional da unidade, sem exibição de históricos de auditoria internos.  
  🔗 *Documentação completa:* [[Projeto Hefesto]]

- [ ] **Relatório Histórico de Início na Rede:**  
  Relatório histórico de quando a impressora foi conectada pela primeira vez à rede e quantas impressões totais ela possuía no momento da integração inicial.

- [ ] **Integração de Impressoras Locais USB via Agente Host:**  
  Mecanismo para capturar telemetria e contadores de impressoras conectadas via cabo USB em computadores locais na rede.

- [ ] **Automação de Pedidos de Insumos (Forms GOMAQ):**  
  Disparo automático de formulário/webhook para solicitação de novas bolsas/toners à GOMAQ no momento em que um suprimento for substituído na impressora.

- [ ] **Módulo "Insumos & Pedidos":**  
  Aba de controle logístico rastreando pedidos emitidos para cada impressora, permitindo ao Auxiliar Administrativo dar baixa quando o insumo chegar à unidade.

- [ ] **Auditoria & Trilha de Registro de Modificações:**  
  Log imutável de qualquer alteração de suprimento, entrada manual de insumo, ajuste na lista de equipamentos ou formatação de quantidades.

- [ ] Quem imprimiu?
	Log de qual CPF imprimiu e a quantidade que imprimiu. Gerar um alerta se em uma única impressão passou de 40 folhas.

---

## 🔗 Navegação do Cofre (Obsidian)
- [[Projeto Hefesto]] — Hub principal de arquitetura e documentação
- [[Módulo de Volume e Previsibilidade]] — Motor preditivo e métricas de produção
- [[Histórico de Recargas e Suprimentos]] — Registro de trocas e auditoria
- [[Arquitetura e Endpoints da API]] — Guia técnico de rotas e banco de dados