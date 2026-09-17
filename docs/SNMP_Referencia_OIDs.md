# Referência SNMP: OIDs para monitoramento de impressoras

> Referência técnica de OIDs baseada na Printer MIB (RFC 3805) e Host-Resources MIB.

## 1. Informações gerais do equipamento

| Informação | OID | Descrição |
| :--- | :--- | :--- |
| Nome do sistema | `1.3.6.1.2.1.1.5.0` | Nome de rede (sysName) |
| Descrição | `1.3.6.1.2.1.1.1.0` | Descrição do dispositivo (sysDescr) |
| Uptime | `1.3.6.1.2.1.1.3.0` | Tempo de atividade desde o último reinício |
| Localização | `1.3.6.1.2.1.1.6.0` | Localização configurada no equipamento |
| Contato | `1.3.6.1.2.1.1.4.0` | Contato configurado no equipamento |
| Modelo | `1.3.6.1.2.1.25.3.2.1.3.1` | Modelo do hardware |
| Número de série | `1.3.6.1.2.1.43.5.1.1.17.1` | Número de série de fábrica |

## 2. Contadores de páginas

| Informação | OID | Descrição |
| :--- | :--- | :--- |
| Total de páginas | `1.3.6.1.2.1.43.10.2.1.4.1.1` | Contador total vitalício |

## 3. Status do dispositivo

| Informação | OID | Descrição |
| :--- | :--- | :--- |
| Status geral | `1.3.6.1.2.1.25.3.2.1.5.1` | Status do equipamento (hrDeviceStatus) |
| Status de impressão | `1.3.6.1.2.1.25.3.5.1.2.1` | Estado do motor de impressão (hrPrinterStatus) |

### Códigos de hrDeviceStatus
- 1: Desconhecido
- 2: Operando (normal)
- 3: Atenção (warning)
- 4: Em teste
- 5: Desligado

### Códigos de hrPrinterStatus
- 1: Outro
- 2: Desconhecido
- 3: Ociosa
- 4: Imprimindo
- 5: Aquecendo

## 4. Tabela de suprimentos (prtMarkerSupplies)

Base OID: `1.3.6.1.2.1.43.11.1.1`

| Informação | OID | Descrição |
| :--- | :--- | :--- |
| Descrição do suprimento | `.6.1.{index}` | Nome reportado pelo firmware |
| Unidade de medida | `.7.1.{index}` | Tipo de unidade da medição |
| Capacidade máxima | `.8.1.{index}` | Capacidade total do suprimento |
| Nível atual | `.9.1.{index}` | Quantidade restante |

### Unidades de medida (prtMarkerSuppliesSupplyUnit)
- 7: Impressões
- 12: Milímetros
- 13: Décimos de gramas
- 15: Porcentagem (%)
- 19: Porcentagem alternativo

### Códigos especiais de nível
- -1: Outro (informação indisponível)
- -2: Desconhecido (usado em tanques de abastecimento contínuo)
- -3: Parcial (suprimento presente, mas sem percentual discreto)

## 5. Bandejas de papel (prtInputTable)

Base OID: `1.3.6.1.2.1.43.8.2.1`

| Informação | OID | Descrição |
| :--- | :--- | :--- |
| Nome da bandeja | `.13.1.{index}` | Identificação da gaveta |
| Capacidade máxima | `.9.1.{index}` | Total de folhas suportadas |
| Nível atual | `.10.1.{index}` | Quantidade estimada de folhas |
| Tamanho do papel | `.12.1.{index}` | Formato configurado (A4, Carta) |

## 6. Orientações de implementação

1. Consultar a tabela RFC 3805 via SNMP walk para mapear os índices de cada fabricante.
2. Fabricantes como Brother possuem OIDs proprietárias para leitura calibrada de percentual de consumíveis.
3. Para suprimentos com medição numérica, o percentual é calculado por: `(nível_atual / capacidade_máxima) * 100`.
4. Manter timeout de leitura entre 3 e 5 segundos por equipamento para evitar retenção da fila de varredura.

