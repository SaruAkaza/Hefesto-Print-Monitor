# Documentação da API: painel de impressoras

> Referência técnica para consumo das rotas pelo frontend.  
> O backend em Node.js e Express opera na porta 80.

## Endereço base

```
http://localhost/
```

## Rotas disponíveis

### 1. Listar impressoras cadastradas

```
GET /api/printers
```

Resposta: `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Impressora Recepção",
    "ip": "192.168.1.100",
    "location": "Recepção - 1º andar",
    "community": "public",
    "createdAt": "2026-08-17T18:18:18.632Z"
  }
]
```

### 2. Cadastrar nova impressora

```
POST /api/printers
Content-Type: application/json
```

Corpo da requisição:
```json
{
  "name": "Impressora Recepção",
  "ip": "192.168.1.100",
  "location": "Recepção - 1º andar",
  "community": "public"
}
```

Resposta: `201 Created`
```json
{
  "id": "uuid",
  "name": "Impressora Recepção",
  "ip": "192.168.1.100",
  "location": "Recepção - 1º andar",
  "community": "public",
  "createdAt": "2026-08-17T18:18:18.632Z"
}
```

Erros:
- `400`: nome e IP são obrigatórios

### 3. Atualizar impressora

```
PUT /api/printers/:id
Content-Type: application/json
```

Corpo da requisição: mesmos campos do `POST`.

Resposta: `200 OK`

Erros:
- `404`: impressora não encontrada

### 4. Remover impressora

```
DELETE /api/printers/:id
```

Resposta: `204 No Content`

Erros:
- `404`: impressora não encontrada

### 5. Consultar status SNMP de uma impressora

```
GET /api/printers/:id/status
```

Resposta: `200 OK`
```json
{
  "printer": {
    "id": "uuid",
    "name": "Impressora Recepção",
    "ip": "192.168.1.100",
    "location": "Recepção",
    "community": "public"
  },
  "data": {
    "online": true,
    "info": {
      "model": "Lexmark MS622de",
      "serialNumber": "ABC123456",
      "name": "IMPRESSORA-RECEPCAO",
      "description": "Lexmark MS622de",
      "location": "",
      "pageCount": 15420
    },
    "status": {
      "deviceCode": 2,
      "deviceDescription": "Operando",
      "printerCode": 3,
      "printerDescription": "Ociosa"
    },
    "supplies": [
      {
        "name": "Black Toner Cartridge",
        "type": "toner",
        "level": 2500,
        "maxLevel": 10000,
        "percentage": 25,
        "status": "warning"
      }
    ],
    "trays": [
      {
        "name": "Tray 1",
        "currentLevel": 200,
        "maxLevel": 250,
        "percentage": 80
      }
    ]
  }
}
```

Quando a impressora não responde:
```json
{
  "printer": { "..." },
  "data": {
    "online": false,
    "error": "RequestTimedOutError: Request timed out"
  }
}
```

### 6. Testar conexão SNMP

```
GET /api/printers/:id/test
```

Resposta com sucesso:
```json
{
  "success": true,
  "version": "v2c",
  "message": "Conexão bem sucedida (SNMPv2c)"
}
```

Resposta com falha:
```json
{
  "success": false,
  "message": "Nenhuma resposta SNMP da impressora"
}
```

### 7. Consultar status de todas as impressoras

```
GET /api/status/all
```

Resposta: `200 OK` (retorna o array de status das impressoras cadastradas).  
Parâmetro opcional: `?force=true` ignora o cache em memória e dispara leitura direta na rede.

## Tipos de suprimentos

Valores possíveis no campo `type`:

| Tipo | Descrição | Termos associados |
| :--- | :--- | :--- |
| `toner` | Toner ou cartucho de tinta | toner, cartucho, ink, tinta |
| `maintenance_kit` | Kit de manutenção | maintenance, manutenção |
| `imaging_kit` | Unidade de cilindro ou fotocondutor | imaging, drum, cilindro, photo |
| `waste_toner` | Caixa de descarte de resíduos | waste, resíduo, coletor |
| `fuser` | Unidade fusora | fuser, fusor |
| `transfer` | Correia ou rolo de transferência | transfer, belt |
| `other` | Outro componente | não identificado |

## Faixas de percentual de suprimento

| Status | Faixa | Condição operacional |
| :--- | :--- | :--- |
| `ok` | Acima de 30% | Nível adequado para uso |
| `warning` | 10% a 30% | Nível baixo, planejar reposição |
| `critical` | Abaixo de 10% | Nível crítico, substituição necessária |
| `unknown` | Negativo | Valor não reportado numericamente pelo fabricante |

## Códigos de status do dispositivo (hrDeviceStatus)

- 1: Desconhecido
- 2: Operando
- 3: Atenção
- 4: Em teste
- 5: Desligado

## Códigos de status de impressão (hrPrinterStatus)

- 1: Outro
- 2: Desconhecido
- 3: Ociosa
- 4: Imprimindo
- 5: Aquecendo

