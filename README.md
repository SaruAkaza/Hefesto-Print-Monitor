# 🖨️ Hefesto — Painel de Monitoramento & Telemetria de Impressoras Corporativo
### 🏛️ Telemetria SNMP, Auditoria de Recargas & Motor Preditivo de Volume

Sistema corporativo em tempo real para telemetria, diagnóstico de suprimentos, histórico de trocas e motor de previsibilidade de consumo de páginas para parques de impressão corporativos e multifuncionais.

---

## 🌟 Principais Recursos

### 1. 📡 Telemetria SNMP em Tempo Real
- Varredura de equipamentos multimarca (**Epson, Brother, Lexmark, Xerox, HP**) via protocolos **SNMPv1** e **SNMPv2c** (Porta UDP 161).
- Monitoramento contínuo de toners, bolsas de tinta, caixas de manutenção, fotocondutores, fusores e bandejas de papel.
- Normalização inteligente para modelos contínuos **EcoTank / Garrafas de Tinta** (evitando falsos alarmes de esgotamento).
- Mini-paletas de cores dedicadas para visualização simultânea de todos os insumos CMYK (Preto, Ciano, Magenta, Amarelo).

### 2. 🔮 Módulo Executivo de Volume & Previsibilidade
- **Horizontes de Produção:** Contabilização de páginas rodadas **Hoje**, na **Semana (7 dias)** e no **Mês (30 dias)**.
- **Média Diária de Produção:** Cálculo da taxa diária de páginas impressas ($\text{pág/dia}$).
- **Motor Preditivo Inteligente (Run-Rate):** Projeção de quantas páginas ainda podem ser impressas com a carga atual e cálculo da **data estimada de esgotamento do suprimento**.
- **Validação de Carga & Capacidade Nominal:** Classificação do equipamento em relação à sua capacidade mensal recomendada (**Sobrecarga**, **Ideal**, **Ociosa**).
- **KPIs Reativos por Unidade:** Cartões dinâmicos com tags de períodos exatos que se adaptam instantaneamente à filial/setor selecionado.

### 3. 🔄 Histórico de Recargas & Auditoria de Suprimentos
- **Regra de Corte Inteligente:** Classificação automática de **Recarga Oficial ($\ge 95\%$)** vs. **Troca Provisória / Usada ($< 95\%$)**.
- **Detecção Automática SNMP:** Identificação instantânea de reposições quando o nível sobe $\ge +20\%$ em relação à leitura anterior.
- **Registro Manual no Raio-X:** Modal em camadas com suporte a datas retroativas de substituição.
- **Cálculo de Ciclo de Páginas:** Quantificação de quantas páginas cada suprimento rendeu entre trocas.

### 4. 👥 Isolamento de Perfis de Acesso
- **Perfil Operador de Filial (Read-Only):** Visão focada e objetiva nas impressoras da sua própria unidade, garantindo privacidade de dados estratégicos.
- **Perfil Administrador de TI (Full Access):** Acesso total ao inventário global, cockpit de previsão, histórico de auditoria, testes de IP e exportação em lote.

### 5. 🎨 Customização & White-Label
- Configuração dinâmica de marca e identidade visual via `server/data/branding.json`.
- Alterne o logotipo, nome da empresa e títulos sem alterar uma única linha de código.

### 6. 📊 Exportação de Relatórios Gerenciais (CSV / Excel)
- Download instantâneo de relatórios de inventário, reposições e previsão com codificação **UTF-8 BOM** para compatibilidade com Microsoft Excel e PowerBI.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js (ES Modules), Express, `net-snmp` (Protocolo SNMP UDP 161).
- **Frontend:** HTML5 Semântico, CSS3 Moderno (Custom Properties / Design Tokens / Flexbox & CSS Grid), JavaScript Vanilla (Zero dependências externas pesadas).
- **Identidade Visual:** Design System corporativo com suporte nativo a Dark Mode e Light Mode.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** instalado (versão 18 ou superior).

### 1. Instalação das dependências
```bash
cd server
npm install
```

### 2. Configuração de Marca (Opcional - White-Label)
Copie o arquivo de exemplo de branding e ajuste com os dados da sua empresa:
```bash
cp server/data/branding.example.json server/data/branding.json
```

### 3. Inicialização do Servidor
O servidor opera na **Porta 80 (HTTP Padrão)** ou na porta definida pela variável `PORT`:

```bash
cd server
node server.js
```

### 4. Acesso ao Painel
- **Local:** [http://localhost/](http://localhost/)
- **Rede Local:** `http://<IP-DO-SEU-SERVIDOR>/`

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
│   ├── favicon.svg                  # Ícone vetorial da aplicação
│   └── index.html                   # Estrutura HTML e abas de navegação
│
├── server/                          # Backend Node.js
│   ├── data/                        # Bases JSON (printers, units, recharges, branding)
│   ├── snmp-service.js              # Serviço de comunicação SNMP multimarca
│   └── server.js                    # Servidor Express e rotas de API
│
├── .gitignore                       # Arquivos ignorados no versionamento
└── README.md                        # Documentação do projeto
```

---

## 🔒 Segurança e Perfis

- **Operador:** Seleciona sua unidade no login para monitoramento exclusivo de sua filial.
- **Administrador:** Acesso com credenciais de gestão (`admin` / `admin`).

---

## 📄 Licença
Distribuído sob licença MIT. Consulte `LICENSE` para mais detalhes.

---

## 🤝 Manutenção e Versionamento

Qualquer alteração na base de impressoras ou lógica de comunicação pode ser facilmente versionada via Git:
```bash
git add .
git commit -m "feat: descrição da alteração"
git push origin main
```
