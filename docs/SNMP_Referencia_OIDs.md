# Referência SNMP - OIDs para Monitoramento de Impressoras

> Documento de referência técnica para o Painel de Impressoras.
> Baseado na **Printer MIB (RFC 3805)** e **Host-Resources MIB**.

---

## 1. Informações Gerais da Impressora

| Informação         | OID                              | Descrição                                      |
| :----------------- | :------------------------------- | :--------------------------------------------- |
| **Nome do Sistema** | `1.3.6.1.2.1.1.5.0`            | Nome de rede da impressora (sysName)           |
| **Descrição**       | `1.3.6.1.2.1.1.1.0`            | Descrição do dispositivo (sysDescr)            |
| **Uptime**          | `1.3.6.1.2.1.1.3.0`            | Tempo ligado desde último reinício             |
| **Localização**     | `1.3.6.1.2.1.1.6.0`            | Localização configurada no dispositivo         |
| **Contato**         | `1.3.6.1.2.1.1.4.0`            | Contato configurado no dispositivo             |
| **Modelo**          | `1.3.6.1.2.1.25.3.2.1.3.1`     | Modelo/descrição do hardware                   |
| **Número de Série** | `1.3.6.1.2.1.43.5.1.1.17.1`    | Número de série da impressora                  |

---

## 2. Contadores de Páginas

| Informação               | OID                               | Descrição                        |
| :----------------------- | :-------------------------------- | :------------------------------- |
| **Total de Páginas**      | `1.3.6.1.2.1.43.10.2.1.4.1.1`   | Contador total de páginas        |

---

## 3. Status do Dispositivo

| Informação         | OID                              | Descrição                              |
| :----------------- | :------------------------------- | :------------------------------------- |
| **Status**          | `1.3.6.1.2.1.25.3.2.1.5.1`     | Status do dispositivo (hrDeviceStatus) |
| **Status Detalhado**| `1.3.6.1.2.1.25.3.5.1.2.1`     | Status detalhado da impressora         |

### Valores de hrDeviceStatus:
- `1` = Desconhecido
- `2` = Rodando (OK)
- `3` = Atenção (Warning)
- `4` = Testando
- `5` = Desligado

### Valores de hrPrinterStatus:
- `1` = Outro
- `2` = Desconhecido
- `3` = Ociosa (Idle)
- `4` = Imprimindo
- `5` = Aquecendo (Warmup)

---

## 4. Suprimentos (Tabela prtMarkerSupplies) ⭐ PRINCIPAL

Base OID: `1.3.6.1.2.1.43.11.1.1`

| Informação              | OID                            | Descrição                                        |
| :---------------------- | :----------------------------- | :----------------------------------------------- |
| **Descrição do Suprimento** | `.6.1.{index}`             | Nome: "Black Toner", "Cyan Ink", "Fuser Kit", etc. |
| **Unidade de Medida**    | `.7.1.{index}`                | Tipo de unidade (ver tabela abaixo)              |
| **Capacidade Máxima**    | `.8.1.{index}`                | Capacidade total do suprimento                   |
| **Nível Atual**          | `.9.1.{index}`                | Nível restante do suprimento                     |

### OIDs Completos:
- **Descrição:** `1.3.6.1.2.1.43.11.1.1.6`
- **Unidade:** `1.3.6.1.2.1.43.11.1.1.7`
- **Máximo:** `1.3.6.1.2.1.43.11.1.1.8`
- **Atual:** `1.3.6.1.2.1.43.11.1.1.9`

### Unidades de Medida (prtMarkerSuppliesSupplyUnit):
- `7` = Impressões
- `12` = Milímetros
- `13` = Décimos de gramas
- `15` = Porcentagem (%)
- `19` = Porcentagem (%) - alternativo

### Valores Especiais de Nível:
- `-1` = Outro (informação indisponível)
- `-2` = Desconhecido
- `-3` = Parcial (há suprimento, mas quantidade indeterminada)

---

## 5. Bandejas de Papel (Tabela prtInputTable)

Base OID: `1.3.6.1.2.1.43.8.2.1`

| Informação              | OID                            | Descrição                          |
| :---------------------- | :----------------------------- | :--------------------------------- |
| **Nome da Bandeja**      | `.13.1.{index}`               | Ex: "Bandeja 1", "Bandeja Manual" |
| **Capacidade Máxima**    | `.9.1.{index}`                | Capacidade total de folhas         |
| **Nível Atual**          | `.10.1.{index}`               | Quantidade atual de folhas         |
| **Tamanho do Papel**     | `.12.1.{index}`               | Tamanho configurado (A4, Carta)    |

---

## 6. Tipos Comuns de Suprimentos Retornados

Quando fazemos um SNMP Walk na tabela de suprimentos, tipicamente encontramos:

| Tipo de Suprimento    | Descrição Comum Retornada             |
| :-------------------- | :------------------------------------ |
| **Toner/Tinta**        | "Black Toner", "Cyan Ink", "Yellow Toner" |
| **Kit de Manutenção**  | "Maintenance Kit", "Fuser Kit"        |
| **Kit de Imagem**      | "Imaging Unit", "Drum Unit", "Photo Conductor" |
| **Recipiente de Resíduos** | "Waste Toner Box", "Waste Container" |
| **Fusor**              | "Fuser Unit", "Fuser Assembly"        |
| **Rolo de Transferência** | "Transfer Belt", "Transfer Roller"  |

---

## 7. Dicas Importantes

1. **Sempre fazer SNMP Walk primeiro** em cada modelo de impressora para descobrir quais OIDs estão disponíveis
2. **Community String padrão** é geralmente `public` (SNMP v1/v2c)
3. **Implementação varia por fabricante** - HP, Lexmark, Brother, etc. podem ter MIBs proprietárias
4. **Para calcular percentual**: `(nível_atual / capacidade_máxima) * 100`
5. **Timeout recomendado**: 5-10 segundos por consulta SNMP
6. **Porta SNMP padrão**: UDP 161
