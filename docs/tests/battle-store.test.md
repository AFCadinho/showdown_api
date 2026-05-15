# Uitleg van `tests/battle/battle-store.test.ts`

Deze testfile bevat minimale black-box tests voor `BattleStore`. De tests maken een nieuwe store aan, voeren een actie uit, en controleren daarna wat de store teruggeeft.

De tests controleren niet hoe `BattleStore` intern data opslaat. Op dit moment gebruikt de class een `Map`, maar dat is geen onderdeel van deze tests.

## Doel van deze file

Deze file test het publieke contract van `BattleStore`:

- een battle opslaan en terugvragen
- een battle verwijderen
- een request bijwerken
- een logregel toevoegen
- geen crash bij updates voor onbekende battles

## Testdata

De helper `createBattleData` maakt een minimale `BattleData` aan:

```ts
function createBattleData(): BattleData {
  return {
    stream: {},
    playerStreams: {
      p1: { write: async () => {} },
      p2: { write: async () => {} },
    },
    log: [],
    requests: {},
    state: {
      turn: 1,
      ended: false,
      winner: null,
    },
    players: {
      p1: { name: "Ash" },
      p2: { name: "Gary" },
    },
  };
}
```

De fake player streams doen niets. Voor deze tests is dat genoeg, omdat `BattleStore` alleen data bewaart en niet zelf naar de streams schrijft.

## Test: `saves and returns a battle`

Deze test maakt een nieuwe store en battle aan:

```ts
const store = new BattleStore();
const battle = createBattleData();
```

Daarna wordt de battle opgeslagen:

```ts
store.saveBattle("battle-1", battle);
```

De verwachting is dat dezelfde battle terugkomt:

```ts
expect(store.getBattle("battle-1")).toBe(battle);
```

`toBe` controleert hier dat het exact hetzelfde object is.

## Test: `removes a battle`

Deze test slaat eerst een battle op en verwijdert hem daarna:

```ts
store.saveBattle("battle-1", battle);
store.removeBattle("battle-1");
```

De verwachting is dat `getBattle` daarna niets meer teruggeeft:

```ts
expect(store.getBattle("battle-1")).toBeUndefined();
```

## Test: `updates a player request`

Deze test slaat een battle op en werkt daarna de request voor `p1` bij:

```ts
store.updateRequest("battle-1", "p1", request);
```

De verwachting is dat `requests.p1` dezelfde request bevat:

```ts
expect(store.getBattle("battle-1")?.requests.p1).toBe(request);
```

## Test: `appends battle logs`

Deze test voegt een logregel toe:

```ts
store.appendLog("battle-1", "p1\n|request|{}");
```

De verwachting is dat die regel in de log-array staat:

```ts
expect(store.getBattle("battle-1")?.log).toEqual(["p1\n|request|{}"]);
```

## Test: `ignores updates for unknown battles`

Deze test roept update functies aan met een battle id die niet bestaat:

```ts
store.updateRequest("missing", "p1", { rqid: 1 });
store.appendLog("missing", "log");
```

De verwachting is dat deze calls niet crashen:

```ts
expect(...).not.toThrow();
```

Dit legt vast dat de store onbekende battles stil negeert.

## Tests draaien

Alle tests eenmalig draaien:

```bash
npm test -- --run
```

Alleen deze testfile draaien:

```bash
npm test -- --run tests/battle/battle-store.test.ts
```
