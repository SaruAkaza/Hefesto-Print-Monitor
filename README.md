# Hefesto: painel de monitoramento de impressoras

Aplicação web para monitoramento de impressoras em rede corporativa via SNMP. O sistema acompanha níveis de suprimentos, histórico de recargas e volume de páginas impressas.

## Recursos principais

### Telemetria SNMP em tempo real
- Varredura de equipamentos multimarca (Epson, Brother, Lexmark, Xerox e HP) via SNMPv1 e SNMPv2c (porta UDP 161).
- Leitura contínua de toners, bolsas de tinta, caixas de manutenção, fotocondutores e fusores.
- Tratamento para tanques de tinta contínuos (EcoTank), que reportam código `-2`.
- Exibição gráfica dos quatro canais de cor (CMYK).

### Volume de páginas e previsão de consumo
- Contabilização de páginas impressas hoje, nos últimos 7 dias e nos últimos 30 dias.
- Cálculo da média diária de páginas impressas.
- Projeção da data aproximada de término do suprimento com base na taxa de consumo.
- Comparação do volume mensal projetado com a capacidade recomendada do modelo.
- Cartões de resumo com filtros dinâmicos por filial.

### Histórico de recargas
- Detecção automática de trocas, aceitando reposições iniciadas em 0%.
- Leitura de confirmação em 10 segundos via SNMP para validar a estabilidade do valor antes da gravação.
- Fila de validação em tabela própria no SQLite (`pending_recharges`), mantendo o estado caso o servidor reinicie.
- Separação entre recarga oficial com insumo novo ($\ge 95\%$) e troca temporária com insumo usado ($< 95\%$).
- Formulário manual para registro de substituições com recálculo de páginas no ciclo.

### Perfis de acesso
- Operador: visão em modo leitura restrita à filial selecionada.
- Administrador: acesso ao inventário completo, edição de equipamentos, diagnóstico de IP e exportação de dados.

### Exportação de relatórios
- Exportação de relatórios em CSV com codificação UTF-8 BOM, compatível com Excel.

## Tecnologias utilizadas

- Backend: Node.js (ES Modules), Express, biblioteca `net-snmp` (UDP 161).
- Banco de dados: SQLite local via `node:sqlite` (`DatabaseSync` nativo do Node.js v24), com backup diário automático via `VACUUM INTO`.
- Frontend: HTML5, CSS3 com variáveis nativas (temas escuro e claro) e JavaScript vanilla.

## Como executar

### Pré-requisitos
- Node.js instalado (versão 22 ou superior, recomendado v24).

### 1. Instalação das dependências
```bash
cd server
npm install
```

### 2. Configuração de marca (opcional)
Copie o modelo de identidade visual e configure com os dados da instituição:
```bash
cp server/data/branding.example.json server/data/branding.json
```

### 3. Inicialização do servidor
O servidor utiliza a porta 80 por padrão, ou a porta definida na variável `PORT`:

```bash
cd server
node server.js
```

### 4. Acesso
- Local: http://localhost/
- Rede interna: `http://<IP-DO-SERVIDOR>/`

## Estrutura do projeto

```
Painel de Impressoras/
├── public/                          # Interface web
│   ├── css/style.css                # Estilos e temas
│   ├── js/app.js                    # Lógica da interface e consumo da API
│   ├── favicon.svg                  # Ícone da aplicação
│   └── index.html                   # Estrutura HTML
│
├── server/                          # Backend Node.js
│   ├── data/                        # Arquivos do banco (hefesto.db e backups/)
│   ├── db.js                        # Camada de banco de dados SQLite (node:sqlite)
│   ├── snmp-service.js              # Driver de comunicação SNMP
│   └── server.js                    # Rotas da API Express e rotinas agendadas
│
├── docs/                            # Documentação técnica detalhada
└── README.md                        # Guia geral do projeto
```

## Perfis de acesso

- Operador: seleciona a unidade na tela inicial para ver as impressoras locais.
- Administrador: acesso com usuário e senha configurados para gerenciar o parque.

## Licença

Distribuído sob licença MIT.
