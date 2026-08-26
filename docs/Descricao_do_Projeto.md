# 📄 Descrição do Projeto: Painel de Monitoramento de Impressoras e Gestão de Insumos

> **Documento Executivo e Técnico do Projeto**  
> **Autor/Responsável:** Equipe de Tecnologia & Infraestrutura  
> **Data:** Agosto / 2026  
> **Status:** ✅ Em Produção / Homologado  
> **Compatibilidade:** Obsidian / Markdown  

---

## 1. 🎯 Resumo Executivo & Contexto

### O Desafio / A Dor
Em unidades corporativas e estaduais com parque distribuído de impressão, um dos maiores gargalos operacionais era a **gestão reativa de insumos** (toner, garrafas de tinta, caixas de manutenção, kits de imagem e cilindros).  
Frequentemente, a TI ou os setores só percebiam a falta do suprimento no momento em que a máquina parava completamente, gerando:
- Interrupção nos atendimentos e fluxos de trabalho (Recepção, Diretoria, Atendimento ao Cliente).
- Compras em caráter de urgência com fretes elevados.
- Falta de previsibilidade orçamentária e de consumo por setor.

### A Solução
Desenvolvimento de uma **plataforma web centralizada e autônoma**, capaz de se comunicar diretamente com as impressoras de rede via endereço IP. O painel monitora a volumetria exata de cada componente e transforma dados brutos de telemetria em um **dashboard intuitivo de tomada de decisão**.

---

## 2. 💡 Benefícios e Impacto Gerado

| Benefício | Antes | Com o Painel |
| :--- | :--- | :--- |
| **Previsibilidade** | Descoberta da falta de insumo na hora da impressão | Alerta programado quando o nível atinge a faixa de atenção (30%) |
| **Visibilidade** | Necessidade de ir fisicamente até cada máquina ou abrir IP por IP | Visão unificada de todo o parque em uma única tela |
| **Disponibilidade** | Risco de máquinas paradas por dias | Tempo de parada reduzido a zero por desabastecimento |
| **Segregação de Perfis** | Todos viam e alteravam dados técnicos | Operador focado na sua filial (read-only) e Administrador com controle total |
| **Acesso em Rede** | Somente na máquina local | Disponível para toda a rede corporativa via IP |

---

## 3. 🏗️ Arquitetura e Engenharia da Solução

O sistema foi desenhado com arquitetura leve, de alta performance e sem dependências pesadas de bancos de dados externos.

```
┌─────────────────────────────────────────────────────────────┐
│                 PARQUE DE IMPRESSORAS                       │
│    [Epson M1180]    [Lexmark]    [Brother]    [Xerox]       │
└──────────────┬──────────────────────────────┬───────────────┘
               │ SNMP (UDP 161)               │ HTTP (Porta 80)
               │ (Printer MIB RFC 3805)       │ (Fallback Web Config)
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND NODE.JS                         │
│  • Engine SNMP (net-snmp) & Scraper HTTP Resiliente         │
│  • API REST Express ouvindo em 0.0.0.0:3000                 │
│  • Base de Dados JSON Local (Alta velocidade & portabilidade)│
└──────────────────────────────┬──────────────────────────────┘
                               │ API REST / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  DASHBOARD WEB (FRONTEND)                   │
│  • Design System Dark Slate Moderno & Responsivo            │
│  • Segregação de Perfis (Operador vs Administrador)         │
│  • Lista Densa com Ações (Raio-X, Atualizar, Editar, Excluir)│
│  • Relatório Consolidado de Tintas & Exportação CSV         │
└─────────────────────────────────────────────────────────────┘
```

### Destaque Tecnológico: Comunicação Híbrida & Resiliente
Em redes corporativas com múltiplas unidades e VLANs, roteadores e firewalls frequentemente bloqueiam portas de gerência UDP (`161 - SNMP`). Para garantir **100% de disponibilidade**, o painel conta com:
1. **Conector Primário (SNMP v1/v2c/v3):** Leitura direta dos OIDs padronizados da norma internacional RFC 3805.
2. **Conector Secundário (HTTP Fallback):** Caso o SNMP sofra timeout devido a regras de firewall entre filiais, o backend faz o fallback transparente via protocolo Web Config, garantindo a extração dos dados de tinta e caixas de manutenção.

---

## 4. 📊 Recursos e Componentes Monitorados

O painel categoriza e monitora os seguintes itens de cada equipamento:

- 🎨 **Consumíveis de Impressão:** Nível percentual de Toner (Preto / Coloridos) e Tanques de Tinta.
- 🗑️ **Caixas de Manutenção (Waste Box):** Vida útil e capacidade do coletor de resíduos.
- 🔧 **Kits de Manutenção e Fusores:** Desgaste de peças térmicas e roletes.
- 📷 **Kits de Imagem / Cilindros (Drum):** Vida útil da unidade fotocondutora.
- 📄 **Bandejas de Papel:** Nível e capacidade de folhas por gaveta.
- 🔢 **Telemetria de Uso:** Contador acumulado de páginas impressas e identificação de Série/MAC.

---

## 5. 🚦 Sistema de Tomada de Decisão (Semáforo de Suprimentos)

```
  🟢 OPERACIONAL (> 30%)      🟡 ATENÇÃO (10% a 30%)          🔴 CRÍTICO (< 10%)
  ─────────────────────      ──────────────────────          ──────────────────
  Operação estável           Gatilho de Pedido               Alerta de Emergência
  Nenhuma ação necessária    Iniciar cotação/compra          Substituição imediata
```

---

## 6. 🌐 Acesso em Rede Corporativa

- **Link Cabo (Ethernet):** `http://10.1.159.240:3000/`
- **Link Wi-Fi:** `http://10.1.148.114:3000/`
- **Inicialização Fácil:** `INICIAR_PAINEL.bat`
