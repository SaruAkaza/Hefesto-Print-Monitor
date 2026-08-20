# 🖨️ Painel de Monitoramento de Impressoras — Prevent Senior

Sistema web em tempo real para telemetria, diagnóstico e gestão de suprimentos (toner, tintas, caixas de manutenção, fotocondutores e bandejas) do parque de impressoras corporativo da **Prevent Senior**.

---

## 🌟 Principais Recursos

- 📡 **Telemetria SNMP em Tempo Real:** Comunicação direta com equipamentos multimarca (**Epson, Brother, Lexmark, Xerox**) através dos protocolos SNMPv1, SNMPv2c e decodificação proprietária TLV.
- 🏢 **Gestão por Pastas / Unidades:**
  - `103 - Sede Leblon`
  - `113 - Havaí`
  - `121 - Rio Sul`
  - `138 - Taiti`
- 🎯 **Perfis de Acesso:**
  - **Operador de Filial (Read-Only):** Visão focada e objetiva das impressoras da sua própria unidade, alertas de troca e consulta de Raio-X.
  - **Administrador de TI (Full Access):** Visão global de todas as unidades, criação/edição de pastas de unidades, cadastro de novas impressoras, teste de conectividade por IP e exportação gerencial em CSV/Excel.
- 🚨 **Cockpit & Fila "Requer Ação":**
  - Contagem instantânea de equipamentos **Online & Conectados**, **Nível Crítico (< 10%)**, **Nível Atenção (10% a 30%)** e **Sem Conexão**.
  - Alinhamento rigoroso com ordenação por prioridade para trocas preventivas.
- 🔬 **Modal Raio-X Detalhado:**
  - Diagnóstico completo de cada suprimento (nível percentual, vida útil de fusor, laser, fotocondutor e bandejas de papel).
  - Contador de páginas impressas acumulado no equipamento.
- 📊 **Exportação Gerencial (CSV):**
  - Relatório direto no cabeçalho com todos os dados consolidados para planejamento de compras e reposição de estoque.
- 🌙 **Dark Mode & Light Mode:** Suporte a temas com alternância instantânea e persistência local.
- ⚙️ **Execução em Segundo Plano no Windows:** Inicialização silenciosa integrada ao `shell:startup` sem janelas de terminal abertas.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js (ES Modules), Express, `net-snmp` (Protocolo SNMP UDP 161).
- **Frontend:** HTML5 Semântico, CSS3 Moderno (Custom Properties / Design Tokens / Flexbox & CSS Grid), JavaScript Vanilla (Zero dependências externas pesadas).
- **Identidade Visual:** Ícones e logos vetoriais SVG oficiais Prevent Senior.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** instalado (versão 18 ou superior).

### 1. Instalação das dependências
Abra o terminal na pasta do projeto e instale os módulos do servidor:
```bash
cd server
npm install
```

### 2. Inicialização

#### Opção A: Executar em Segundo Plano (Recomendado para Produção / Servidor)
Dê um duplo clique no arquivo:
```
INICIAR_EM_SEGUNDO_PLANO.vbs
```

#### Opção B: Executar via Linha de Comando (Modo Desenvolvimento)
```bash
cd server
node server.js
```

### 3. Acesso ao Painel
Abra seu navegador no endereço:
- **Local:** `http://localhost:3000/`
- **Rede Corporativa:** `http://[IP_DA_MAQUINA]:3000/` (ex: `http://10.1.159.240:3000/`)

---

## 🔄 Inicialização Automática com o Windows

Para que o painel suba automaticamente ao ligar o computador/servidor:
1. Pressione **`Win + R`** no teclado.
2. Digite **`shell:startup`** e pressione **Enter**.
3. Crie um **Atalho** do arquivo `INICIAR_EM_SEGUNDO_PLANO.vbs` dentro desta pasta.

---

## 📂 Estrutura de Diretórios

```
Painel de Impressoras/
│
├── public/                     # Frontend da aplicação
│   ├── css/
│   │   └── style.css           # Design system e folhas de estilo
│   ├── js/
│   │   └── app.js              # Lógica da interface e chamadas de API
│   ├── favicon.svg             # Favicon oficial Prevent Senior
│   └── index.html              # Estrutura da interface
│
├── server/                     # Backend Node.js
│   ├── data/
│   │   ├── printers.json       # Base de dados das impressoras cadastradas
│   │   └── units.json          # Cadastro das unidades / pastas
│   ├── node_modules/           # Pacotes instalados
│   ├── package.json            # Dependências do backend
│   ├── server.js               # Servidor Express e rotas REST API
│   └── snmp-service.js         # Motor SNMP multimarca e decodificador TLV Brother
│
├── INICIAR_EM_SEGUNDO_PLANO.vbs # Script de inicialização silenciosa
├── INICIAR_PAINEL.bat          # Script de inicialização em terminal
├── PARAR_PAINEL.bat            # Script para encerrar o processo Node
├── STATUS_PAINEL.bat           # Script para verificar status do serviço
├── .gitignore                  # Arquivos ignorados no versionamento
└── README.md                   # Documentação do projeto
```

---

## 🔒 Segurança e Perfis

- **Operador:** Seleciona sua unidade no login para monitoramento exclusivo de sua filial.
- **Administrador:** Acesso com credenciais de gestão (`admin` / `admin`).

---

## 🤝 Manutenção e Versionamento

Qualquer alteração na base de impressoras ou lógica de comunicação pode ser facilmente versionada via Git:
```bash
git add .
git commit -m "feat: descrição da alteração"
git push origin main
```
