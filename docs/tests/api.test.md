# Uitleg van `tests/api.test.ts`

Deze testfile bevat minimale black-box tests voor de API. Dat betekent dat de tests requests naar de Express app sturen en alleen controleren welke response terugkomt. De tests controleren niet wat er intern gebeurt in services, stores of Pokemon Showdown.

## Doel van deze file

De file test of de belangrijkste publieke endpoints op basisniveau blijven werken:

- `GET /health`
- `GET /info`
- `POST /create_battle`
- `POST /battles/:battleId/lead`

Dit zijn bewust kleine tests. Ze zijn bedoeld als snelle smoke tests: als een route per ongeluk breekt, een verkeerde statuscode teruggeeft, of een response-vorm verandert, zie je dat direct.

## Testserver setup

De test importeert de Express app uit `src/app.ts`:

```ts
import { app } from "../src/app";
```

Daarna start `beforeAll` een tijdelijke HTTP server:

```ts
server = app.listen(0, "127.0.0.1", ...)
```

Poort `0` betekent dat Node automatisch een vrije poort kiest. Daardoor botsen de tests niet met een dev server die misschien al op `3001` draait.

Zodra de server draait, wordt `baseUrl` opgebouwd:

```ts
baseUrl = `http://127.0.0.1:${address.port}`;
```

Alle tests gebruiken daarna deze `baseUrl`.

## Testserver afsluiten

Na alle tests sluit `afterAll` de tijdelijke server weer:

```ts
server.close(...)
```

Dit voorkomt dat Vitest blijft hangen door een open HTTP server.

## Helper: `postJson`

De helper `postJson` stuurt een JSON POST request:

```ts
async function postJson(path: string, body: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
```

Hierdoor hoeven POST tests niet steeds dezelfde `fetch` configuratie te herhalen.

## Test: `returns health status`

Deze test stuurt:

```http
GET /health
```

Verwachting:

```json
{
  "status": "ok"
}
```

De test controleert ook dat de HTTP status `200` is.

## Test: `returns API info`

Deze test stuurt:

```http
GET /info
```

De test controleert alleen de belangrijkste velden:

- `name`
- `version`
- `engine`
- `routes.createBattle`
- `routes.chooseLead`

De test gebruikt `toMatchObject`, zodat extra velden in de response toegestaan blijven.

## Test: `rejects create battle requests without teams`

Deze test stuurt:

```http
POST /create_battle
Content-Type: application/json
```

Met deze body:

```json
{}
```

Omdat `p1.team` en `p2.team` ontbreken, verwacht de test:

```json
{
  "success": false,
  "error": "Missing teams"
}
```

De verwachte HTTP status is `400`.

## Test: `rejects lead selection for an unknown battle`

Deze test stuurt:

```http
POST /battles/unknown-battle-id/lead
Content-Type: application/json
```

Met deze body:

```json
{
  "playerId": "p1",
  "slot": 1
}
```

Omdat de battle id niet bestaat, verwacht de test:

```json
{
  "success": false,
  "error": "Battle not found"
}
```

De verwachte HTTP status is `404`.

## Tests draaien

Alle tests eenmalig draaien:

```bash
npm test -- --run
```

Tests in watch mode draaien:

```bash
npm test
```
