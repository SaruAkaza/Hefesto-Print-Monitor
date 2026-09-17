# Descrição do projeto: painel de monitoramento de impressoras

> Equipe de Tecnologia e Infraestrutura  
> Data: agosto de 2026  
> Status: em produção  

## Contexto e objetivo

Em unidades com parque distribuído de impressão, a troca de insumos ocorria com frequência de forma reativa, notada apenas quando o equipamento parava por falta de suprimento. Essa situação causava paradas no atendimento e compras emergenciais.

O painel centraliza a comunicação com as impressoras via rede por SNMP, consolidando dados de contadores e níveis de suprimentos em uma interface acessível aos operadores e à equipe de TI.

## Comparativo operacional

| Situação | Anterior | Com o painel |
| :--- | :--- | :--- |
| Acompanhamento | Identificação na hora da falha | Alerta ao atingir faixa de atenção (30%) |
| Consulta | Verificação presencial ou acesso individual por IP | Visão consolidada de todas as impressoras na interface |
| Paradas | Risco de indisponibilidade prolongada | Antecipação de trocas e pedidos |
| Perfis de acesso | Sem distinção de permissões | Operador restrito à sua filial e administrador com controle total |
| Acesso | Restrito ao computador local | Acesso corporativo via navegador na rede interna |

## Arquitetura da solução

O sistema utiliza backend em Node.js com persistência em banco de dados SQLite local, comunicando-se diretamente com os equipamentos por SNMP.

```
┌─────────────────────────────────────────────────────────────┐
│                 PARQUE DE IMPRESSORAS                       │
│    [Epson]        [Lexmark]       [Brother]       [Xerox]   │
└──────────────┬──────────────────────────────┬───────────────┘
               │ SNMP (UDP 161)               │ HTTP (Porta 80)
               │ (RFC 3805 e MIBs de marca)   │ (Fallback Web)
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND NODE.JS                         │
│  • Coleta SNMP (net-snmp)                                   │
│  • API REST Express na porta 80                             │
│  • Banco de dados relacional SQLite (node:sqlite)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ API REST / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  PAINEL WEB (FRONTEND)                      │
│  • Interface responsiva com temas claro e escuro            │
│  • Separação de perfis (Operador e Administrador)           │
│  • Detalhes do equipamento, contadores e histórico de trocas│
│  • Exportação de dados em CSV                               │
└─────────────────────────────────────────────────────────────┘
```

## Componentes monitorados

O sistema acompanha os seguintes itens de cada equipamento:
- Consumíveis: percentual de toner e tanques de tinta.
- Caixas de manutenção: capacidade e uso do coletor de descarte.
- Peças de reposição: desgaste de fotocondutores, cilindros e fusores.
- Bandejas de papel: presença e nível de folhas por gaveta.
- Contadores: total de páginas impressas e número de série da máquina.

## Faixas de alerta de suprimentos

- Acima de 30%: nível adequado para operação normal.
- Entre 10% e 30%: atenção, ponto recomendado para planejamento de reposição.
- Abaixo de 10%: nível crítico, necessidade de troca iminente.

## Acesso na rede corporativa

- Endereço local: `http://localhost/`
- Endereço na rede interna: `http://10.1.159.240/`
- Inicialização: executar `INICIAR_PAINEL.bat` na raiz do projeto.
