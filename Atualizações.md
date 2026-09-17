# Histórico de atualizações e tarefas

> Hub central: [[Projeto Hefesto]]  
> Tags: #projeto-hefesto #roadmap #atualizacoes

## Funcionalidades implementadas e pendências

- [x] Persistência em SQLite local e confirmação rápida de trocas:  
  Armazenamento em banco local SQLite (`node:sqlite` do Node.js v24). Detecção de substituições com baseline a partir de 0%, confirmação em 10 segundos via SNMP, gravação intermediária na tabela `pending_recharges`, backups diários via `VACUUM INTO` com retenção de 7 dias e aviso de nova recarga na interface.  
  Documentação: [[Banco de Dados e Persistência SQLite]] e [[Histórico de Recargas e Suprimentos]].

- [x] Histórico de recargas de suprimentos:  
  Registro de data e hora da última recarga, separação entre insumo novo e usado ($\ge 95\%$ vs $< 95\%$), contagem de páginas por ciclo e formulário manual de registro.  
  Documentação: [[Histórico de Recargas e Suprimentos]].

- [x] Volume de páginas e estimativa de término de suprimentos:  
  Contagem de impressões no dia, últimos 7 dias e últimos 30 dias. Projeção da data aproximada de término do suprimento e validação de carga mensal. Cartões com filtros por unidade.  
  Documentação: [[Módulo de Volume e Previsibilidade]].

- [x] Perfis de acesso:  
  Perfil Administrador com visão de todas as unidades e gestão do sistema. Perfil Operador restrito à unidade selecionada.  
  Documentação: [[Projeto Hefesto]].

- [x] Relatório de início na rede:  
  Registro da primeira leitura da impressora no sistema e contadores iniciais de entrada. Exportação em planilha CSV.  
  Documentação: [[Relatório Histórico de Início na Rede]].

- [ ] Coleta de dados de impressoras USB via agente local instalado na estação.
- [ ] Envio automático de solicitação de insumo para o fornecedor ao confirmar substituição.
- [ ] Aba de controle de pedidos para baixa de insumos recebidos nas unidades.
- [ ] Registro de auditoria para alterações manuais de equipamentos e contadores.
- [ ] Identificação de usuário e volume por impressão, com alerta para trabalhos acima de 40 páginas.

## Navegação do cofre

- [[Projeto Hefesto]]: visão geral do sistema
- [[Banco de Dados e Persistência SQLite]]: schema do banco e backups
- [[Relatório Histórico de Início na Rede]]: primeira leitura e contadores iniciais
- [[Módulo de Volume e Previsibilidade]]: métricas de volume e fórmulas de previsão
- [[Histórico de Recargas e Suprimentos]]: registros de trocas e auditoria
- [[Arquitetura e Endpoints da API]]: referência das rotas HTTP e persistência