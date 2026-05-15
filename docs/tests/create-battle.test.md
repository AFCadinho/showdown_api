# Uitleg van `tests/battle/create-battle.test.ts`

Deze testfile bevat minimale black-box tests voor de functie `createBattle`. De tests roepen de functie direct aan met input en controleren alleen de waarde die terugkomt.

De tests controleren niet welke interne helpers worden aangeroepen, hoe Pokemon Showdown precies werkt, of wat er allemaal in de stream gebeurt.

## Doel van deze file

Deze file test het publieke contract van `createBattle`:

- ontbrekende teams worden geweigerd
- zonder `formatId` gebruikt de functie de default
- zonder speler-namen gebruikt de functie default namen
- met speler-namen komen die namen terug in de response
- bij succes komt er een `battleId` terug

## Testdata

De test gebruikt twee kleine Pokemon sets:

- `pikachu`
- `bulbasaur`

Deze sets zijn bewust klein gehouden. Ze bevatten genoeg informatie voor Pokemon Showdown om een team te kunnen packen, maar de test gaat niet inhoudelijk controleren of de Pokemon competitief of compleet zijn.

## Test: `rejects requests without both teams`

Deze test roept aan:

```ts
createBattle({})
```

Omdat `p1.team` en `p2.team` ontbreken, verwacht de test:

```json
{
  "success": false,
  "error": "Missing teams"
}
```

Dit is de minimale validatie voor het aanmaken van een battle.

## Test: `uses the default format when no formatId is given`

Deze test geeft wel twee teams mee, maar geen `formatId`.

De verwachting is dat de response bevat:

```json
{
  "success": true,
  "formatId": "gen9nationaldex"
}
```

De test gebruikt `toMatchObject`, zodat extra velden zoals `battleId`, `players`, `requests` en `log` gewoon toegestaan blijven.

## Test: `uses default player names when names are not given`

Deze test geeft teams mee zonder speler-namen.

De verwachting is dat de response bevat:

```json
{
  "success": true,
  "players": {
    "p1": { "name": "Player 1" },
    "p2": { "name": "Player 2" }
  }
}
```

Zo blijft vastgelegd welke fallback namen de API gebruikt.

## Test: `returns custom player names and a battleId`

Deze test geeft custom namen mee:

```json
{
  "p1": { "name": "Ash" },
  "p2": { "name": "Gary" }
}
```

De test verwacht dat die namen terugkomen in `players`.

Daarnaast controleert de test dat `battleId` een string is:

```ts
expect(result.battleId).toEqual(expect.any(String));
```

De exacte id wordt niet getest, omdat die elke keer opnieuw wordt gegenereerd.

## Tests draaien

Alle tests eenmalig draaien:

```bash
npm test -- --run
```

Alleen deze testfile draaien:

```bash
npm test -- --run tests/battle/create-battle.test.ts
```
