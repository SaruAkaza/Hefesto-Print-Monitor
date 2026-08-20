# 📖 Manual de Uso, Perfis e Acesso em Rede

> **Documento Operacional e de Governança do Painel de Impressoras**  
> **Compatibilidade:** Obsidian Vault / Markdown  
> **Última Atualização:** Agosto / 2026  

---

## 1. 🌐 Acesso em Rede Local e Hospedagem

O Painel de Monitoramento de Impressoras é executado como uma aplicação web centralizada na infraestrutura local, permitindo que múltiplos usuários e setores acessem simultaneamente sem necessidade de instalar softwares nas máquinas clientes.

### Links Oficiais de Acesso:
- **Nesta Máquina (Host):** `http://localhost:3000/`
- **Acesso na Rede Corporativa (Cabo Ethernet):** `http://10.1.159.240:3000/`
- **Acesso na Rede Corporativa (Wi-Fi):** `http://10.1.148.114:3000/`

### 🏢 Unidades Cadastradas (72 Impressoras):
1. **Unidade São Francisco:** 41 impressoras (Subsolo, Térreo, 1º ao 4º Andar - Faixa `10.1.152.x`).
2. **Unidade Rio Sul:** 16 impressoras (Consultórios e Atendimento 13º Andar - Faixa `10.5.104.x`).
3. **Unidade Havaí:** 12 impressoras (Consultórios e Procedimentos Térreo e 1º Andar - Faixa `10.1.176.x`).
4. **Sede Leblon:** 3 impressoras (Sede Corporativa 7º Andar - Faixa `10.5.16.x`).

### Como Iniciar o Servidor:
1. Localize o arquivo executável na raiz do projeto: `INICIAR_PAINEL.bat`.
2. Dê **dois cliques** sobre o arquivo.
3. O servidor Node.js iniciará automaticamente e ficará ouvindo na porta `3000 (0.0.0.0)` para toda a rede local.

---

## 2. 🛡️ Controle de Acesso e Perfis de Usuário

O sistema implementa **segregação estrita de funções e permissões** entre a equipe de campo/postos de atendimento e a gestão de TI:

```
                  ┌─────────────────────────────────────┐
                  │          TELA DE ACESSO             │
                  └──────────────┬──────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
    ┌──────────────────────────┐    ┌──────────────────────────┐
    │    👤 OPERADOR LOCAL     │    │     👑 ADMINISTRADOR     │
    │  (Seleção Obrigatória)   │    │     (Usuário e Senha)    │
    └────────────┬─────────────┘    └────────────┬─────────────┘
                 ▼                               ▼
    • Apenas a filial escolhida     • Visão Global (Todas Filiais)
    • Somente Leitura (Read-Only)   • Cadastrar / Editar / Excluir
    • Status Agora e Alertas        • Testar Conexão de Qualquer IP
    • Raio-X 360° e Atualizar       • Relatório Consolidado de Tintas
                                    • Exportação de Planilha (CSV)
```

---

## 3. 👤 Perfil: Operador de Unidade

Destinado aos recepcionistas, técnicos locais e operadores de cada filial/posto de atendimento.

### Características:
- **Login:** O operador é obrigado a selecionar a sua unidade/filial na lista.
- **Escopo Travado:** Visualiza **apenas** os equipamentos cadastrados na sua filial (ex: *Unidade São Francisco*).
- **Sem poluição:** Não visualiza nem acessa formulários de cadastro, testes de rede ou botões de exclusão.

### Funcionalidades Disponíveis para o Operador:
1. **Status Agora:** Visualização rápida da quantidade de impressoras *Críticas* (<10%), em *Atenção* (10% a 30%) e *Sem Conexão*.
2. **Requer Ação Imediata:** Fila de prioridade com o suprimento mais esgotado e recomendação clara (*Trocar imediatamente* / *Pedir estoque*).
3. **Lista de Minhas Impressoras:**
   - **Local / Setor em destaque** (ex: `Recepção`, `Oncologia`).
   - **Modelo detectado** (ex: `Lexmark CX522ade`, `M1180 Series`).
   - **IP na rede** e **barra visual do suprimento principal**.
   - Botão 👁️ **Raio-X:** Abre gaveta lateral com todas as tintas, bandejas e contagem total de páginas.
   - Botão 🔄 **Atualizar:** Consulta instantânea do status na rede.
4. **Alternador de Tema:** Botão para comutar entre modo Dark e Light.

---

## 4. 👑 Perfil: Administrador de TI

Destinado exclusivamente à equipe de infraestrutura, suporte corporativo e gestores de compras.

### Segurança e Credenciais:
- **Campos Limpos e Sem Preenchimento Automático:** Por segurança, os campos de usuário e senha nunca vêm pré-preenchidos e bloqueiam o autocompletar do navegador.
- **Digitação Obrigatória:** O acesso administrativo exige a digitação manual das credenciais a cada acesso.
- **Usuário Padrão:** `admin`
- **Senha Padrão:** `admin`

### Recursos Exclusivos do Administrador:
1. **Visão Global:** Acesso irrestrito a todas as unidades corporativas e postos com seletor dinâmico.
2. **📁 Gerenciar & Excluir Pastas de Unidades:** Botão no cabeçalho que abre a central de filiais, permitindo criar novas pastas e **excluir pastas existentes** com total segurança.
3. **Cadastro de Impressoras:** Botão **`+ Nova Impressora`** no cabeçalho com vinculação de Pasta/Unidade, Local/Setor e Endereço IP.
4. **Edição e Exclusão de Equipamentos:** Botões ✏️ **Editar** e 🗑️ **Excluir** presentes em cada linha da lista e dentro do Raio-X.
5. **Diagnóstico Rápido de IP:** Botão **`⚡ Testar Conexão (IP)`** para validar equipamentos não cadastrados na rede local via portas SNMP (UDP 161) e Web (HTTP 80).
6. **Relatório Consolidado de Tintas:** Tabela com 1 linha por impressora exibindo o percentual exato das 4 cores (*Preto*, *Ciano*, *Magenta*, *Amarelo*).
7. **Exportação de CSV para Compras:** Botão **`📥 Exportar Relatório (CSV)`** que gera planilha compatível com Excel já formatada para o departamento de suprimentos.

---

## 5. 🖨️ Nomenclatura e Visualização Padronizada

- **Título Principal nos Cards/Lista:** Sempre o **Local / Setor** onde a impressora está alocada (ex: `Recepção`, `Oncologia`, `Faturamento`).
- **Subtítulo:** **Modelo Detectado** limpo via SNMP/HTTP + **Endereço IP** (ex: `Lexmark CX522ade • 10.5.128.41`).
- **Número de Série:** Isolado exclusivamente dentro do **Raio-X (Side Drawer)** para não poluir a visualização operacional do dia a dia.
