# Documentação da API - Painel de Impressoras

> Use este documento como referência para construir o frontend do painel.
> O backend está em Node.js/Express e roda na porta **3000**.

---

## Base URL

```
http://localhost:3000
```

---

## Endpoints

### 1. Listar Impressoras Cadastradas

```
GET /api/printers
```

**Resposta:** `200 OK`
```json
[
  {
    "id": "uuid-gerado-automaticamente",
    "name": "Impressora Recepção",
    "ip": "192.168.1.100",
    "location": "Recepção - 1º andar",
    "community": "public",
    "createdAt": "2026-08-17T18:18:18.632Z"
  }
]
```

---

### 2. Cadastrar Nova Impressora

```
POST /api/printers
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Impressora Recepção",     // obrigatório
  "ip": "192.168.1.100",              // obrigatório
  "location": "Recepção - 1º andar", // opcional
  "community": "public"               // opcional (padrão: "public")
}
```

**Resposta:** `201 Created`
```json
{
  "id": "f691aa2e-ef7f-4494-8263-9be072dd8cc0",
  "name": "Impressora Recepção",
  "ip": "192.168.1.100",
  "location": "Recepção - 1º andar",
  "community": "public",
  "createdAt": "2026-08-17T18:18:18.632Z"
}
```

**Erros:**
- `400` — Nome e IP são obrigatórios

---

### 3. Atualizar Impressora

```
PUT /api/printers/:id
Content-Type: application/json
```

**Body:** (mesmos campos do POST)

**Resposta:** `200 OK` — Impressora atualizada

**Erros:**
- `404` — Impressora não encontrada

---

### 4. Remover Impressora

```
DELETE /api/printers/:id
```

**Resposta:** `204 No Content`

**Erros:**
- `404` — Impressora não encontrada

---

### 5. Consultar Status SNMP de Uma Impressora

```
GET /api/printers/:id/status
```

**Resposta:** `200 OK`
```json
{
  "printer": {
    "id": "f691aa2e-...",
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
      "description": "Lexmark MS622de LPR...",
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
        "status": "warning",
        "icon": "🎨"
      },
      {
        "name": "Imaging Unit",
        "type": "imaging_kit",
        "level": 45000,
        "maxLevel": 60000,
        "percentage": 75,
        "status": "ok",
        "icon": "📷"
      },
      {
        "name": "Maintenance Kit",
        "type": "maintenance_kit",
        "level": 180000,
        "maxLevel": 200000,
        "percentage": 90,
        "status": "ok",
        "icon": "🔧"
      },
      {
        "name": "Waste Toner Bottle",
        "type": "waste_toner",
        "level": 5000,
        "maxLevel": 50000,
        "percentage": 10,
        "status": "warning",
        "icon": "🗑️"
      }
    ],
    "trays": [
      {
        "name": "Tray 1",
        "currentLevel": 200,
        "maxLevel": 250,
        "percentage": 80
      },
      {
        "name": "Tray 2",
        "currentLevel": 0,
        "maxLevel": 500,
        "percentage": 0
      }
    ]
  }
}
```

**Quando a impressora está offline:**
```json
{
  "printer": { "..." },
  "data": {
    "online": false,
    "error": "RequestTimedOutError: Request timed out"
  }
}
```

---

### 6. Testar Conexão SNMP

```
GET /api/printers/:id/test
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "version": "v2c",
  "message": "Conexão bem sucedida (SNMPv2c)"
}
```

**Resposta (falha):**
```json
{
  "success": false,
  "message": "Nenhuma resposta SNMP da impressora"
}
```

---

### 7. Consultar Status de TODAS as Impressoras

```
GET /api/status/all
```

**Resposta:** `200 OK` — Array com o status de cada impressora
```json
[
  {
    "id": "uuid-1",
    "ip": "192.168.1.100",
    "name": "Impressora Recepção",
    "online": true,
    "info": { "..." },
    "status": { "..." },
    "supplies": [ "..." ],
    "trays": [ "..." ]
  },
  {
    "id": "uuid-2",
    "ip": "192.168.1.101",
    "name": "Impressora Diretoria",
    "online": false,
    "error": "RequestTimedOutError: Request timed out"
  }
]
```

> **Nota:** Este endpoint consulta TODAS as impressoras em paralelo. O tempo de resposta depende da impressora mais lenta (timeout máximo: ~5 segundos por impressora).

---

## Tipos de Suprimentos

O campo `type` nos suprimentos pode ter os seguintes valores:

| Tipo | Descrição | Ícone | Palavras-chave detectadas |
| :--- | :-------- | :---: | :------------------------ |
| `toner` | Toner / Cartucho de tinta | 🎨 | toner, cartucho, ink, tinta |
| `maintenance_kit` | Kit de Manutenção | 🔧 | maintenance, manutenção |
| `imaging_kit` | Kit de Imagem / Cilindro | 📷 | imaging, imagem, drum, cilindro, photo, conductor |
| `waste_toner` | Recipiente de Resíduos | 🗑️ | waste, resíduo, coletor |
| `fuser` | Fusor | 🔥 | fuser, fusor |
| `transfer` | Rolo/Correia de Transferência | ↔️ | transfer, transferência, belt |
| `other` | Outro suprimento | 📦 | (não identificado) |

---

## Status dos Suprimentos

| Status | Percentual | Cor Sugerida | Ação |
| :----- | :--------- | :----------- | :--- |
| `ok` | > 30% | 🟢 Verde | Nível normal |
| `warning` | 10%–30% | 🟡 Amarelo | Preparar pedido |
| `critical` | < 10% | 🔴 Vermelho | Pedir imediatamente! |
| `unknown` | Negativo | ⚪ Cinza | Sem dados precisos |

---

## Status do Dispositivo (hrDeviceStatus)

| Código | Descrição |
| :----- | :-------- |
| 1 | Desconhecido |
| 2 | Operando |
| 3 | Atenção |
| 4 | Testando |
| 5 | Desligado |

## Status da Impressora (hrPrinterStatus)

| Código | Descrição |
| :----- | :-------- |
| 1 | Outro |
| 2 | Desconhecido |
| 3 | Ociosa |
| 4 | Imprimindo |
| 5 | Aquecendo |

---

## Notas para o Frontend

1. **Auto-refresh:** Recomendado a cada 5 minutos usando `GET /api/status/all`
2. **Barras de progresso:** Usar o campo `percentage` para largura da barra
3. **Cores:** Baseiar no campo `status` (ok→verde, warning→amarelo, critical→vermelho)
4. **Offline:** Quando `online: false`, mostrar card com opacidade reduzida
5. **Valores negativos:** Percentual negativo = valor especial SNMP, tratar como "indisponível"
6. **Ícones:** Campo `icon` já contém emoji pronto para uso
7. **CORS:** Já habilitado no backend, pode chamar de qualquer origem
