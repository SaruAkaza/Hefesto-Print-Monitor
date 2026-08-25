# 🖨️ Painel de Monitoramento de Impressoras — Prevent Senior
### 🏛️ Projeto Hefesto — Telemetria SNMP, Auditoria de Recargas & Inteligência Preditiva

Sistema corporativo em tempo real para telemetria, diagnóstico de suprimentos, histórico de trocas e motor de previsibilidade de consumo de páginas do parque de impressoras da **Prevent Senior** (São Paulo e Rio de Janeiro).

---

## 🌟 Principais Recursos

### 1. 📡 Telemetria SNMP em Tempo Real
- Varredura de equipamentos multimarca (**Epson, Brother, Lexmark, Xerox**) via protocolos **SNMPv1** e **SNMPv2c** (Porta UDP 161).
- Monitoramento contínuo de toners, bolsas de tinta, caixas de manutenção, fotocondutores e bandejas de papel.
- Normalização inteligente para modelos contínuos **Epson EcoTank / Garrafas de Tinta** (evitando falsos alarmes de esgotamento).

### 2. 🔮 Módulo Executivo de Volume & Previsibilidade
- **Horizontes de Produção:** Contabilização de páginas rodadas **Hoje**, na **Semana (7 dias)** e no **Mês (30 dias)**.
- **Média Diária de Produção:** Cálculo da taxa diária de páginas impressas ($\text{pág/dia}$).
- **Motor Preditivo Inteligente (Run-Rate):** Cálculo de quantas páginas ainda podem ser impressas com a carga atual e projeção da **data exata da próxima troca**.
- **Validação de Carga & Capacidade Máxima:** Classificação do equipamento em relação à sua capacidade mensal recomendada (**Alta Carga / Sobrecarga**, **Carga Ideal / Saudável**, **Subutilizada / Ociosa**).
- **KPIs do Topo 100% Reativos por Unidade:** Cartões dinâmicos com tags de datas exatas contabilizadas que se adaptam instantaneamente à filial selecionada.

### 3. 🔄 Histórico de Recargas & Auditoria de Suprimentos
- **Regra de Corte Inteligente:** Classificação automática de **Recarga Oficial ($\ge 95\%$)** vs. **Troca Provisória / Usada ($< 95\%$)**.
- **Detecção Automática SNMP:** Identificação instantânea de reposições quando o nível sobe $\ge +20\%$ em relação à leitura anterior.
- **Registro Manual no Raio-X:** Modal em camadas sobreposto à gaveta de diagnóstico com atualização reativa em tempo real.
- **Cálculo de Ciclo de Páginas:** Quantificação de quantas páginas cada suprimento rendeu entre trocas.

### 4. 👥 Isolamento de Perfis de Acesso
- **Perfil Operador de Filial (Read-Only):** Visão focada e objetiva nas impressoras da sua própria unidade, garantindo privacidade de dados estratégicos.
- **Perfil Administrador de TI (Full Access):** Acesso total ao inventário global, cockpit de previsão, histórico de auditoria, testes de IP e exportação em lote.

### 5. 📊 Exportação de Relatórios Gerenciais (CSV / Excel)
- Download instantâneo de relatórios completos com codificação **UTF-8 BOM** para compatibilidade com Microsoft Excel e PowerBI.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js (ES Modules), Express, `net-snmp` (Protocolo SNMP UDP 161).
- **Frontend:** HTML5 Semântico, CSS3 Moderno (Custom Properties / Design Tokens / Flexbox & CSS Grid), JavaScript Vanilla (Zero dependências externas pesadas).
- **Identidade Visual:** Design System oficial Prevent Senior com Dark Mode nativo.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** instalado (versão 18 ou superior).

### 1. Instalação das dependências
```bash
cd server
npm install
```

### 2. Inicialização do Servidor
O servidor opera na **Porta 80 (HTTP Padrão)**:

```bash
cd server
node server.js
```

Ou execute em segundo plano através do script VBScript:
```
INICIAR_EM_SEGUNDO_PLANO.vbs
```

### 3. Acesso ao Painel
- **Local:** [http://localhost/](http://localhost/)
- **Rede Corporativa:** [http://10.1.159.240/](http://10.1.159.240/)

---

## 📂 Estrutura de Diretórios

```
Painel de Impressoras/
│
├── public/                          # Frontend da aplicação
│   ├── css/
│   │   └── style.css                # Design system, tokens e estilos
│   ├── js/
│   │   └── app.js                   # Lógica da interface, reatividade e API
│   ├── favicon.svg                  # Favicon oficial Prevent Senior
│   └── index.html                   # Estrutura HTML e abas de navegação
│
├── server/                          # Backend Node.js
│   ├── data/
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
