# Showdown API

API om een Pokemon Showdown battle aan te maken.

Base URL:

```txt
http://localhost:3001
```

Op productie vervang je dit door je Render/custom domain URL, bijvoorbeeld:

```txt
https://api.afcadinho.com
```

## Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

## API Info

```http
GET /info
```

Response:

```json
{
  "name": "showdown-api",
  "version": "1.0.0",
  "engine": "pokemon-showdown",
  "engineVersion": "0.11.10",
  "routes": {
    "home": "/",
    "health": "/health",
    "info": "/info",
    "pokemonStats": "/pokemon-stats",
    "parsePokemon": "/parse_pokemon",
    "parseTeam": "/parse_team",
    "createBattle": "/create_battle",
    "createBattleSchema": "/create_battle/schema",
    "createWildBattle": "/create_wild_battle",
    "createWildBattleSchema": "/create_wild_battle/schema",
    "pokemonInfo": "/battles/:battleId/pokemon-info",
    "chooseLead": "/battles/:battleId/lead",
    "chooseAction": "/battles/:battleId/choice"
  }
}
```

## Pokemon Stats

```http
GET /pokemon-stats?species=Mewtwo&level=50
```

Deze route geeft Dex/stat-calculator informatie terug voor een Pokemon. De
route verandert geen battle-state en gebruikt Pokemon Showdown alleen voor de
species/base stat data.

### Query Parameters

- `species`: verplicht. Pokemon species, bijvoorbeeld `Mewtwo` of `Rillaboom`.
- `level`: optioneel. Heel getal van `1` tot en met `100`. Default is `100`,
  omdat PvP battles standaard op level 100 gespeeld worden.

### Voorbeeld Response

```json
{
  "success": true,
  "pokemon": {
    "species": "Mewtwo",
    "level": 50,
    "baseStats": {
      "hp": 106,
      "atk": 110,
      "def": 90,
      "spa": 154,
      "spd": 90,
      "spe": 130
    },
    "speed": {
      "min": 121,
      "minNeutral31Iv": 150,
      "maxNeutral31Iv": 182,
      "max": 200
    }
  }
}
```

Speed ranges betekenen:

- `min`: 0 Speed IV, 0 Speed EV, negatieve Speed nature.
- `minNeutral31Iv`: 31 Speed IV, 0 Speed EV, neutrale nature.
- `maxNeutral31Iv`: 31 Speed IV, 252 Speed EV, neutrale nature.
- `max`: 31 Speed IV, 252 Speed EV, positieve Speed nature.

Als `species` onbekend is of `level` buiten `1..100` valt, geeft de API een
`400` response met `success: false`.

## Pokemon Tekst Parsen

```http
POST /parse_pokemon
Content-Type: application/json
```

Deze route zet Pokemon Showdown/Pokepaste tekst om naar een Pokemon object dat
je direct in een battle team kunt gebruiken. De API gebruikt hiervoor de parser
van Pokemon Showdown zelf.

### Request Body

```json
{
  "text": "Pika (Pikachu) @ Light Ball\nAbility: Static\nLevel: 50\nTera Type: Electric\nEVs: 252 Atk / 4 SpD / 252 Spe\nJolly Nature\n- Volt Tackle\n- Quick Attack"
}
```

### Response

```json
{
  "success": true,
  "pokemon": {
    "name": "Pika",
    "species": "Pikachu",
    "item": "Light Ball",
    "ability": "Static",
    "gender": "",
    "nature": "Jolly",
    "evs": {
      "hp": 0,
      "atk": 252,
      "def": 0,
      "spa": 0,
      "spd": 4,
      "spe": 252
    },
    "ivs": {
      "hp": 31,
      "atk": 31,
      "def": 31,
      "spa": 31,
      "spd": 31,
      "spe": 31
    },
    "level": 50,
    "moves": ["Volt Tackle", "Quick Attack"],
    "teraType": "Electric"
  }
}
```

Als de tekst leeg is of niet geparsed kan worden, komt er een `400` response
terug met `success: false`.

## Team Tekst Parsen

```http
POST /parse_team
Content-Type: application/json
```

Deze route zet Pokemon Showdown/Pokepaste teamtekst om naar een team array. De
API gebruikt hiervoor de parser van Pokemon Showdown zelf en accepteert minimaal
1 en maximaal 6 Pokemon.

### Request Body

```json
{
  "text": "Rillaboom @ Assault Vest\nAbility: Grassy Surge\nLevel: 50\nTera Type: Grass\nEVs: 204 HP / 252 Atk / 52 Spe\nAdamant Nature\n- Grassy Glide\n- Knock Off\n- U-turn\n- Low Kick\n\nMewtwo @ Leftovers\nAbility: Pressure\nLevel: 100\nTera Type: Psychic\nTimid Nature\n- Psystrike\n- Aura Sphere"
}
```

### Response

```json
{
  "success": true,
  "team": [
    {
      "species": "Rillaboom",
      "item": "Assault Vest",
      "ability": "Grassy Surge",
      "nature": "Adamant",
      "evs": {
        "hp": 204,
        "atk": 252,
        "def": 0,
        "spa": 0,
        "spd": 0,
        "spe": 52
      },
      "level": 50,
      "moves": ["Grassy Glide", "Knock Off", "U-turn", "Low Kick"],
      "teraType": "Grass"
    },
    {
      "species": "Mewtwo",
      "item": "Leftovers",
      "ability": "Pressure",
      "nature": "Timid",
      "level": 100,
      "moves": ["Psystrike", "Aura Sphere"],
      "teraType": "Psychic"
    }
  ]
}
```

Als de tekst ontbreekt, niet geparsed kan worden of meer dan 6 Pokemon bevat,
krijg je een `400` response met `success: false`.

## Pokemon Informatie Oproepen

```http
GET /battles/:battleId/pokemon-info?viewerId=p1&ident=p1a:%20Mewtwo
```

Deze route geeft alleen bevestigde informatie terug die al zichtbaar is voor de
gegeven `viewerId`.

### Query Parameters

- `viewerId`: `p1` of `p2`.
- `ident`: ident van de Pokemon in battle-formaat, bijvoorbeeld `p1a: Mewtwo` of `p1: Mewtwo`.

### Voorbeeld Response

```json
{
  "success": true,
  "pokemon": {
    "ident": "p1: Mewtwo",
    "confirmedMoves": [
      {
        "name": "Aura Sphere",
        "pp": 19,
        "maxpp": 32
      }
    ],
    "confirmedItem": "Leftovers",
    "confirmedAbility": "Pressure",
    "statChanges": {
      "spa": 1,
      "spd": 1,
      "atk": -1
    }
  }
}
```

Als de gevraagde Pokemon nog niet bekend is voor die viewer, krijgt de API
`{"success": true, "pokemon": null}` terug.

`statChanges` bevat alleen non-zero stat stages voor de actieve Pokemon.
Deze waardes zijn battle-local, publiek zichtbaar voor beide viewers en resetten
bij switch, faint of battle end. Ability modifiers zoals Protosynthesis en
Quark Drive vallen hier niet onder.

## Battle Aanmaken

```http
POST /create_battle
Content-Type: application/json
```

### Request Body

```json
{
  "formatId": "gen9nationaldex",
  "p1": {
    "name": "Ash",
    "team": [
      {
        "species": "Pikachu",
        "instanceId": "pokemon_123",
        "ability": "Static",
        "item": "Light Ball",
        "moves": ["Thunderbolt", "Quick Attack", "Iron Tail", "Volt Switch"],
        "nature": "Timid",
        "evs": {
          "hp": 4,
          "spa": 252,
          "spe": 252
        }
      }
    ]
  },
  "p2": {
    "name": "Gary",
    "team": [
      {
        "species": "Bulbasaur",
        "ability": "Overgrow",
        "item": "Eviolite",
        "moves": ["Giga Drain", "Sludge Bomb", "Sleep Powder", "Protect"],
        "nature": "Bold",
        "evs": {
          "hp": 252,
          "def": 252,
          "spa": 4
        }
      }
    ]
  }
}
```

### Velden

| Veld | Type | Verplicht | Beschrijving |
| --- | --- | --- | --- |
| `formatId` | `string` | Nee | Pokemon Showdown format. Default: `gen9nationaldex`. |
| `p1.name` | `string` | Nee | Naam van speler 1. Default: `Player 1`. |
| `p1.team` | `PokemonSet[]` | Ja | Team van speler 1. |
| `p2.name` | `string` | Nee | Naam van speler 2. Default: `Player 2`. |
| `p2.team` | `PokemonSet[]` | Ja | Team van speler 2. |

Een Pokemon in `team` gebruikt het normale Pokemon Showdown set formaat:

```json
{
  "species": "Pikachu",
  "instanceId": "pokemon_123",
  "name": "Sparky",
  "gender": "M",
  "ability": "Static",
  "item": "Light Ball",
  "moves": ["Thunderbolt", "Quick Attack", "Iron Tail", "Volt Switch"],
  "nature": "Timid",
  "evs": {
    "hp": 4,
    "atk": 0,
    "def": 0,
    "spa": 252,
    "spd": 0,
    "spe": 252
  },
  "ivs": {
    "hp": 31,
    "atk": 31,
    "def": 31,
    "spa": 31,
    "spd": 31,
    "spe": 31
  },
  "level": 50,
  "shiny": false,
  "teraType": "Electric"
}
```

`instanceId` is optioneel voor Showdown, maar belangrijk voor de game-save. Als
de client dit veld meestuurt, geeft de API dezelfde waarde terug in
`requests[p1|p2].side.pokemon[].instanceId`. Daardoor kan de client HP na een
battle terugschrijven op basis van de vaste opgeslagen Pokemon-id, niet op basis
van de plek in de teamlijst.

De API koppelt `instanceId` eerst op Showdown ident. Als die ident verandert
door een form, bijvoorbeeld `Charizard-Mega-Y` die in de request als
`p1: Charizard` terugkomt, gebruikt de API de originele team-slot volgorde als
fallback.

## Succes Response

Voorbeeld:

```json
{
  "success": true,
  "battleId": "b7c68e40-2e60-4c11-8f92-87b4f6856c2d",
  "formatId": "gen9nationaldex",
  "players": {
    "p1": {
      "name": "Ash"
    },
    "p2": {
      "name": "Gary"
    }
  },
  "requests": {
    "p1": {
      "teamPreview": true,
      "side": {
        "name": "Ash",
        "id": "p1",
        "pokemon": [
          {
            "ident": "p1: Pikachu",
            "details": "Pikachu, M",
            "condition": "211/211",
            "active": true,
            "instanceId": "pokemon_123",
            "stats": {
              "atk": 146,
              "def": 116,
              "spa": 136,
              "spd": 136,
              "spe": 216
            },
            "moves": [
              {
                "id": "thunderbolt",
                "name": "Thunderbolt",
                "exists": true,
                "type": "Electric",
                "category": "Special",
                "basePower": 90,
                "accuracy": 100,
                "pp": 15,
                "priority": 0,
                "target": "normal",
                "shortDesc": "10% chance to paralyze the target.",
                "desc": "Has a 10% chance to paralyze the target."
              }
            ],
            "baseAbility": "static",
            "item": "lightball",
            "ability": "static",
            "teraType": "Electric"
          }
        ]
      }
    },
    "p2": {
      "teamPreview": true,
      "side": {
        "name": "Gary",
        "id": "p2",
        "pokemon": [
          {
            "ident": "p2: Bulbasaur",
            "details": "Bulbasaur, M",
            "condition": "231/231",
            "active": true,
            "moves": [
              {
                "id": "gigadrain",
                "name": "Giga Drain",
                "exists": true,
                "type": "Grass",
                "category": "Special",
                "basePower": 75,
                "accuracy": 100,
                "pp": 10,
                "priority": 0,
                "target": "normal",
                "shortDesc": "User recovers 50% of the damage dealt.",
                "desc": "The user recovers 1/2 the HP lost by the target, rounded half up."
              }
            ],
            "baseAbility": "overgrow",
            "item": "eviolite",
            "ability": "overgrow",
            "teraType": "Grass"
          }
        ]
      }
    }
  },
  "events": [],
  "log": [
    "p1\n|request|{\"teamPreview\":true,\"side\":{...}}",
    "p2\n|request|{\"teamPreview\":true,\"side\":{...}}"
  ]
}
```

Bij `create_battle` zit de battle meestal nog in team preview. Daarom staan de
zichtbare moves onder `requests[p1|p2].side.pokemon[].moves`. Deze moves zijn
verrijkt met Dex-data zoals `type`, `category`, `basePower`, `accuracy`,
`priority`, `target`, `shortDesc` en `desc`.

### Response Velden

| Veld | Type | Beschrijving |
| --- | --- | --- |
| `success` | `boolean` | Of de battle is aangemaakt. |
| `battleId` | `string` | Unieke id van de aangemaakte battle. |
| `formatId` | `string` | Gebruikt Showdown format. |
| `players` | `object` | Namen van `p1` en `p2`. |
| `requests` | `object` | Laatste request per speler, verrijkt met Dex-data voor UI-gebruik. De API werkt de response-snapshot bij met faint-informatie uit de battle log, zodat een final response ook `condition: "0 fnt"` kan tonen. Bij `create_battle` is dit meestal een `teamPreview` request. |
| `events` | `BattleEvent[]` | Nieuwe game-vriendelijke events sinds de vorige API response. Bij `create_battle` meestal nog leeg. |
| `field` | `object` | Actuele veldstatus voor UI-iconen en timers. `field.effects` bevat actieve weather, field conditions en side conditions. |
| `log` | `string[]` | Ruwe stream output die de API tot nu toe heeft ontvangen. |

### Move Velden

Moves in `requests` bevatten naast de Showdown request-data ook Dex-data:

| Veld | Type | Beschrijving |
| --- | --- | --- |
| `id` | `string` | Genormaliseerde Showdown move id. |
| `name` | `string` | Leesbare move naam. |
| `exists` | `boolean` | Of de move bestaat in de Dex voor dit format. |
| `type` | `string` | Move type, zoals `Electric` of `Fire`. |
| `category` | `string` | `Physical`, `Special` of `Status`. |
| `basePower` | `number` | Basissterkte van de move. Status moves hebben meestal `0`. |
| `accuracy` | `number \| true` | Accuracy percentage, of `true` voor moves die geen accuracy check doen. |
| `pp` | `number` | Dex basis-PP bij team info, of actuele battle PP bij `active[].moves`. |
| `maxpp` | `number` | Alleen bij actieve battle keuzes; maximale PP in deze battle. |
| `priority` | `number` | Move priority. |
| `target` | `string` | Showdown target type, zoals `normal`, `self` of `allAdjacent`. |
| `disabled` | `boolean` | Alleen bij actieve battle keuzes; of de move momenteel niet gekozen kan worden. |
| `effectiveness` | `object \| null` | Alleen bij actieve battle keuzes; type-effectiveness tegen de actieve tegenstander. `null` als er geen actieve tegenstander bekend is of als de move geen damage move is. |
| `shortDesc` | `string` | Korte Showdown omschrijving. |
| `desc` | `string` | Volledige Showdown omschrijving. |

`effectiveness` bevat:

| Veld | Type | Beschrijving |
| --- | --- | --- |
| `multiplier` | `number` | Type multiplier, zoals `0`, `0.5`, `1`, `2` of `4`. |
| `label` | `"immune" \| "not_very_effective" \| "normal" \| "super_effective"` | UI-vriendelijke classificatie. |
| `immune` | `boolean` | Of de move door type immunity geen effect heeft. |

## Wild Battle Aanmaken

```http
POST /create_wild_battle
Content-Type: application/json
```

Deze route gebruikt dezelfde request body als `POST /create_battle`, maar kiest
daarna automatisch slot 1 als lead voor `p1` en `p2`. Gebruik deze route voor
wild battles waarin de speler direct de eerste actie moet kunnen kiezen.

Omdat beide leads al gekozen zijn, bevat de response normaal direct actieve
move-keuzes:

```txt
requests[p1|p2].active[].moves
```

Die moves bevatten live battle-data uit Showdown, zoals actuele `pp`, `maxpp`,
`disabled` en `effectiveness`.

### Wild Battle Met Bestaande HP

Bij `create_wild_battle` mag de client voor `p1.team[]` ook save-state HP
meesturen:

```json
{
  "species": "Pikachu",
  "instanceId": "pokemon_123",
  "currentHp": 12,
  "maxHp": 35,
  "moves": ["Thunderbolt"]
}
```

`currentHp` wordt gebruikt om de Showdown battle met bestaande HP te starten,
zodat de party niet automatisch volledig gehealed wordt. `maxHp` komt uit de
save-state mee als context, maar de response gebruikt Showdown's berekende max
HP als leidend.

Voorbeeld: als de save `currentHp: 12` en `maxHp: 35` meestuurt, maar Showdown
berekent de Pokemon in deze battle als `20` max HP, dan wordt de response:

```json
{
  "ident": "p1: Pikachu",
  "condition": "12/20",
  "instanceId": "pokemon_123"
}
```

### Switch Beschikbaarheid

Tijdens een actieve battle kan Showdown aangeven dat de actieve Pokemon niet
mag switchen. De API geeft die velden door in de actuele request:

```txt
requests[p1|p2].active[0].trapped
requests[p1|p2].active[0].maybeTrapped
```

Als `trapped` of `maybeTrapped` `true` is, moet de game de switch-optie voor
die speler blokkeren. Dit kan bijvoorbeeld gebeuren bij Outrage-lock, trapping
moves of abilities die switchen blokkeren.

Voorbeeld:

```json
{
  "requests": {
    "p1": {
      "active": [
        {
          "moves": [],
          "trapped": true
        }
      ]
    }
  }
}
```

### Verplicht Wisselen

Als de actieve Pokemon van een speler faint en de battle nog niet voorbij is,
kan Showdown een verplichte switch request sturen. De API geeft die state door:

```txt
requests[p1|p2].forceSwitch[0]
```

Als `forceSwitch[0]` `true` is, moet de game de move-knoppen verbergen en de
party/switch UI openen. Alleen levende, niet-actieve Pokemon mogen dan gekozen
worden.

Bij een verplichte switch mag `trapped` of `maybeTrapped` de party UI niet
blokkeren. De speler moet dan namelijk wisselen. Als de battle al afgelopen is,
staat `state.ended` op `true` en is `forceSwitch` niet nodig.

Voorbeeld:

```json
{
  "state": {
    "ended": false
  },
  "requests": {
    "p1": {
      "forceSwitch": [true],
      "side": {
        "pokemon": [
          {
            "ident": "p1: Magikarp",
            "condition": "0 fnt",
            "active": true
          },
          {
            "ident": "p1: Charizard",
            "condition": "153/153",
            "active": false
          }
        ]
      }
    }
  }
}
```

Voorbeeld response-fragment:

```json
{
  "success": true,
  "battleId": "b7c68e40-2e60-4c11-8f92-87b4f6856c2d",
  "formatId": "gen9nationaldex",
  "requests": {
    "p1": {
      "active": [
        {
          "moves": [
            {
              "move": "Thunderbolt",
              "id": "thunderbolt",
              "name": "Thunderbolt",
              "pp": 24,
              "maxpp": 24,
              "disabled": false,
              "type": "Electric",
              "category": "Special",
              "basePower": 90,
              "accuracy": 100,
              "effectiveness": {
                "multiplier": 0.5,
                "label": "not_very_effective",
                "immune": false
              }
            }
          ]
        }
      ]
    }
  },
  "events": [],
  "field": {
    "effects": []
  },
  "state": {
    "turn": 1,
    "ended": false,
    "winner": null
  }
}
```

Schema:

```http
GET /create_wild_battle/schema
```

### Event Velden

`events` bevat nieuwe battle-informatie sinds de vorige API response, als JSON
die Godot direct kan gebruiken voor animaties en UI updates. De API houdt zelf
bij welke log chunks al als events zijn teruggegeven, zodat dezelfde move,
damage of turn events niet opnieuw terugkomen bij latere requests. Omdat
Showdown veel battle-regels naar beide player streams stuurt, gebruikt de API
voor `events` een canonieke stream zodat events niet dubbel terugkomen. De
volledige ruwe log blijft beschikbaar in `log` voor debugging.

Voorbeeld:

```json
[
  {
    "type": "move",
    "actor": "p1a: Pikachu",
    "move": "Thunderbolt",
    "target": "p2a: Bulbasaur"
  },
  {
    "type": "damage",
    "target": "p2a: Bulbasaur",
    "previousCondition": "231/231",
    "condition": "176/231",
    "previousHp": 231,
    "hp": 176,
    "maxHp": 231,
    "amount": 55
  },
  {
    "type": "heal",
    "target": "p2a: Bulbasaur",
    "previousCondition": "176/231",
    "condition": "231/231",
    "previousHp": 176,
    "hp": 231,
    "maxHp": 231,
    "amount": 55,
    "source": "drain",
    "sourceTarget": "p1a: Pikachu"
  },
  {
    "type": "fieldEffect",
    "scope": "field",
    "effectType": "weather",
    "effect": "RainDance",
    "state": "start"
  },
  {
    "type": "turn",
    "turn": 2
  }
]
```

### Field Snapshot

`field` bevat de actuele veldstatus. Gebruik dit voor UI-iconen en later timers.
`field.effects` kan drie soorten effecten bevatten:

```json
{
  "field": {
    "effects": [
      {
        "scope": "field",
        "effectType": "weather",
        "effect": "RainDance",
        "startedTurn": 2,
        "minDuration": 5,
        "maxDuration": 8,
        "minRemainingTurns": 4,
        "maxRemainingTurns": 7
      },
      {
        "scope": "field",
        "effectType": "fieldCondition",
        "effect": "move: Trick Room",
        "startedTurn": 2,
        "minDuration": 5,
        "maxDuration": 5,
        "minRemainingTurns": 4,
        "maxRemainingTurns": 4
      },
      {
        "scope": "field",
        "effectType": "fieldCondition",
        "effectGroup": "terrain",
        "effect": "move: Grassy Terrain",
        "startedTurn": 3,
        "minDuration": 5,
        "maxDuration": 8,
        "minRemainingTurns": 5,
        "maxRemainingTurns": 8
      },
      {
        "scope": "side",
        "side": "p1",
        "effectType": "sideCondition",
        "effect": "move: Tailwind",
        "startedTurn": 2,
        "minDuration": 4,
        "maxDuration": 4,
        "minRemainingTurns": 3,
        "maxRemainingTurns": 3
      },
      {
        "scope": "side",
        "side": "p2",
        "effectType": "sideCondition",
        "effect": "move: Stealth Rock"
      }
    ]
  }
}
```

Het verschil met `events`:

- `events` vertelt wat er sinds de vorige response gebeurde, bijvoorbeeld dat Rain net startte.
- `field.effects` vertelt wat nu actief is, bijvoorbeeld dat Rain op dit moment aan staat.

Weather, field conditions en side conditions gebruiken `fieldEffect` events.
Weather kan daarnaast `state: "upkeep"` krijgen als Showdown meldt dat de
weather doorgaat.

```json
{
  "type": "fieldEffect",
  "scope": "field",
  "effectType": "weather",
  "effect": "RainDance",
  "state": "start",
  "source": "ability: Drizzle",
  "sourceTarget": "p1a: Pelipper",
  "minDuration": 5,
  "maxDuration": 8
}
```

```json
{
  "type": "fieldEffect",
  "scope": "field",
  "effectType": "fieldCondition",
  "effectGroup": "terrain",
  "effect": "move: Electric Terrain",
  "state": "start",
  "source": "ability: Electric Surge",
  "sourceTarget": "p1a: Pincurchin",
  "minDuration": 5,
  "maxDuration": 8
}
```

```json
{
  "type": "fieldEffect",
  "scope": "side",
  "side": "p1",
  "effectType": "sideCondition",
  "effect": "move: Tailwind",
  "state": "start",
  "minDuration": 4,
  "maxDuration": 4
}
```

Als Showdown extra metadata meestuurt, zet de API die op het `fieldEffect`
event:

- `source`: de waarde uit Showdown `[from]`, bijvoorbeeld `ability: Drizzle`.
- `sourceTarget`: de waarde uit Showdown `[of]`, bijvoorbeeld `p1a: Pelipper`.

Deze velden zijn optioneel. Showdown stuurt ze niet voor elk effect mee. De
velden staan op het event, omdat ze uitleggen waarom iets net gebeurde. Ze staan
niet op `field.effects`, want de snapshot beschrijft alleen wat nu actief is.

Sommige effecten krijgen timer metadata in `field.effects`:

- `startedTurn`: de turn waarop de API het effect zag starten.
- `minDuration` en `maxDuration`: de basisduur van het effect.
- `minRemainingTurns` en `maxRemainingTurns`: hoeveel turns het effect volgens
  die basisduur nog kan duren in de huidige response.

Weather en terrain hebben `5` tot `8`, omdat items de duur kunnen verlengen.
Trick Room en Tailwind hebben dezelfde waarde voor min en max omdat ze een vaste
duur hebben. Hazards zoals Stealth Rock krijgen geen timer metadata, omdat ze
blijven staan totdat ze worden verwijderd.

Showdown blijft leidend voor het echte einde. Als Showdown meldt dat een effect
eindigt, verwijdert de API het effect uit `field.effects`, ook als een
remaining waarde nog hoger zou zijn.

Zolang een effect actief is, staat het in `field.effects`. Als Showdown meldt
dat een effect eindigt, verwijdert de API die entry uit `field.effects`.
Terrain effects gebruiken `effectGroup: "terrain"`, zodat een nieuwe terrain de
vorige terrain vervangt.

Voor terrain betekent dit dat er tegelijk maar een terrain in `field.effects`
staat. Als Electric Terrain actief is en daarna Grassy Terrain start, wordt de
oude terrain vervangen:

```json
{
  "field": {
    "effects": [
      {
        "scope": "field",
        "effectType": "fieldCondition",
        "effectGroup": "terrain",
        "effect": "move: Grassy Terrain",
        "startedTurn": 3,
        "minDuration": 5,
        "maxDuration": 8,
        "minRemainingTurns": 5,
        "maxRemainingTurns": 8
      }
    ]
  }
}
```

Hazards zoals Stealth Rock zijn side conditions. Ze blijven in `field.effects`
staan totdat Showdown meldt dat ze verwijderd zijn, bijvoorbeeld door Rapid
Spin. De API normaliseert de naam, zodat zowel start als end dezelfde
`effect` waarde gebruiken:

```json
{
  "type": "fieldEffect",
  "scope": "side",
  "side": "p2",
  "effectType": "sideCondition",
  "effect": "move: Stealth Rock",
  "state": "end"
}
```

Na zo'n end event staat Stealth Rock niet meer in `field.effects`.

Stackbare hazards krijgen een `layers` veld in `field.effects` en op start
events:

```json
{
  "scope": "side",
  "side": "p2",
  "effectType": "sideCondition",
  "effect": "move: Spikes",
  "layers": 2
}
```

`Spikes` telt tot maximaal 3 layers. `Toxic Spikes` telt tot maximaal 2
layers. Niet-stackbare hazards zoals Stealth Rock blijven zonder `layers`.

Ondersteunde event types:

De numerieke HP-velden op `damage` en `heal` events gebruiken dezelfde schaal
als de request snapshot. Als `condition` bijvoorbeeld `92/353` is, dan is
`hp: 92`, `maxHp: 353` en `amount` het verschil tussen `previousHp` en `hp`.
Zo rekenen HUD en event-animaties met dezelfde eindstate.

| Type | Velden | Beschrijving |
| --- | --- | --- |
| `move` | `actor`, `move`, `target`, `source`, `sourceTarget` | Een Pokemon gebruikt een move. Als Showdown metadata meestuurt, bijvoorbeeld bij Magic Bounce, bevat het event ook de bron. |
| `damage` | `target`, `previousCondition`, `condition`, `previousHp`, `hp`, `maxHp`, `amount`, `source`, `sourceTarget` | Een Pokemon krijgt damage. Als vorige HP bekend is, bevat het event ook self-contained HP-waarden voor UI-animaties. Als Showdown metadata meestuurt, bevat het event ook de bron, zoals `psn`, `brn`, sandstorm, hazards of binding moves. |
| `heal` | `target`, `previousCondition`, `condition`, `previousHp`, `hp`, `maxHp`, `amount`, `source`, `sourceTarget` | Een Pokemon krijgt HP terug. Als vorige HP bekend is, bevat het event ook self-contained HP-waarden voor UI-animaties. |
| `status` | `target`, `status` | Een Pokemon krijgt een status, zoals `par`. |
| `ability` | `target`, `ability`, `modifier`, `effect`, `stat`, `source`, `sourceTarget` | Een ability wordt door Showdown zichtbaar of actief, bijvoorbeeld `Pressure`, `Intimidate` of `Protosynthesis`. Gebruik dit voor de ability banner. |
| `statChange` | `target`, `stat`, `amount`, `source`, `sourceTarget` | Een stat verandert. `amount` is positief bij boost en negatief bij unboost. |
| `pokemonEffect` | `target`, `effect`, `state`, `source`, `sourceTarget` | Een tijdelijk effect op een Pokemon start, activeert of eindigt. Komt uit Showdown `-start`, `-activate` en `-end`. |
| `cant` | `target`, `reason`, `move` | Een Pokemon kan geen move uitvoeren, bijvoorbeeld door flinch, paralysis, sleep of recharge. |
| `fail` | `target`, `action` | Een move of action faalt door eigen mechanics, zoals Fake Out buiten de eerste beurt of Protect die faalt. |
| `miss` | `actor`, `target`, `source`, `sourceTarget` | Een move mist het doelwit. |
| `switch` | `playerId`, `from`, `fromIdent`, `to`, `toIdent`, `pokemon`, `details`, `condition` | Een Pokemon komt actief het veld in. Als de vorige actieve Pokemon bekend is, bevat het event ook wie eruit ging. |
| `fieldEffect` | `scope`, `side`, `effectType`, `effectGroup`, `effect`, `state` | Een veld-effect verandert. `effectType` is `weather`, `fieldCondition` of `sideCondition`. |
| `faint` | `target` | Een Pokemon faint. |
| `turn` | `turn` | Showdown start een nieuwe turn. |
| `win` | `winner` | De battle is afgelopen. |

Ability-effecten blijven in Showdown-volgorde staan. Bij Intimidate komt eerst
het `ability` event voor de banner, daarna een `statChange` event voor de
Attack drop:

Als een move wordt teruggekaatst door bijvoorbeeld Magic Bounce, komt dat terug
op het `move` event via `source`:

```json
{
  "type": "move",
  "actor": "p1a: Hatterene",
  "move": "Tail Whip",
  "target": "p2a: Rattata",
  "source": "ability: Magic Bounce"
}
```

Residual damage zoals poison, burn, weather, hazards of binding moves komt terug
als `damage` event met `source`:

```json
{
  "type": "damage",
  "target": "p1a: Pikachu",
  "previousCondition": "140/150",
  "condition": "120/150",
  "previousHp": 140,
  "hp": 120,
  "maxHp": 150,
  "amount": 20,
  "source": "psn"
}
```

Los ability event:

```json
{
  "type": "ability",
  "target": "p2a: Weavile",
  "ability": "Pressure"
}
```

Ability boost event zonder normale stat stage, bijvoorbeeld Protosynthesis:

```json
{
  "type": "ability",
  "target": "p1a: Great Tusk",
  "ability": "Protosynthesis",
  "effect": "boost",
  "stat": "atk"
}
```

Los stat boost event:

```json
{
  "type": "statChange",
  "target": "p1a: Dragonite",
  "stat": "atk",
  "amount": 1
}
```

Los stat drop event met Showdown metadata:

```json
{
  "type": "statChange",
  "target": "p2a: Gyarados",
  "stat": "atk",
  "amount": -1,
  "source": "ability: Intimidate",
  "sourceTarget": "p1a: Arcanine"
}
```

```json
[
  {
    "type": "ability",
    "target": "p1a: Arcanine",
    "ability": "Intimidate",
    "modifier": "boost"
  },
  {
    "type": "statChange",
    "target": "p2a: Gyarados",
    "stat": "atk",
    "amount": -1
  }
]
```

Tijdelijke Pokemon-effecten komen terug als `pokemonEffect`. Dit is generiek,
zodat de API niet elke mechanic apart hoeft te kennen. Bijvoorbeeld trapping
door Infestation:

```json
{
  "type": "pokemonEffect",
  "target": "p2a: Blissey",
  "effect": "move: Infestation",
  "state": "activate",
  "sourceTarget": "p1a: Shuckle"
}
```

De client kan op basis van `effect` zelf tekst of animatie kiezen, bijvoorbeeld
`Blissey is trapped by Infestation!`.

## Error Response

Als `p1.team` of `p2.team` ontbreekt:

```json
{
  "success": false,
  "error": "Missing teams"
}
```

## Lead Kiezen

```http
POST /battles/:battleId/lead
Content-Type: application/json
```

Gebruik deze route tijdens team preview om voor een speler de lead Pokemon te
kiezen.

### Request Body

```json
{
  "playerId": "p1",
  "slot": 1
}
```

| Veld | Type | Verplicht | Beschrijving |
| --- | --- | --- | --- |
| `playerId` | `"p1" \| "p2"` | Ja | Speler waarvoor je de lead kiest. |
| `slot` | `number` | Ja | Team slot van de gekozen lead, van `1` tot en met `6`. |

### Succes Response

```json
{
  "success": true,
  "battleId": "b7c68e40-2e60-4c11-8f92-87b4f6856c2d",
  "formatId": "gen9nationaldex",
  "players": {
    "p1": {
      "name": "Ash"
    },
    "p2": {
      "name": "Gary"
    }
  },
  "requests": {
    "p1": {
      "active": [
        {
          "moves": [
            {
              "id": "thunderbolt",
              "name": "Thunderbolt",
              "exists": true,
              "type": "Electric",
              "category": "Special",
              "basePower": 90,
              "accuracy": 100,
              "pp": 24,
              "priority": 0,
              "target": "normal",
              "shortDesc": "10% chance to paralyze the target.",
              "desc": "Has a 10% chance to paralyze the target.",
              "move": "Thunderbolt",
              "maxpp": 24,
              "disabled": false,
              "effectiveness": {
                "multiplier": 0.5,
                "label": "not_very_effective",
                "immune": false
              }
            }
          ]
        }
      ],
      "side": {
        "name": "Ash",
        "id": "p1",
        "pokemon": [
          {
            "ident": "p1: Pikachu",
            "details": "Pikachu, M",
            "condition": "211/211",
            "active": true,
            "moves": [
              {
                "id": "thunderbolt",
                "name": "Thunderbolt",
                "type": "Electric",
                "category": "Special",
                "basePower": 90,
                "accuracy": 100,
                "pp": 15
              }
            ]
          }
        ]
      },
      "rqid": 2
    }
  },
  "events": [
    {
      "type": "turn",
      "turn": 1
    }
  ],
  "log": [
    "p1\n|request|{\"active\":[...],\"side\":{...},\"rqid\":2}"
  ],
  "state": {
    "turn": 1,
    "ended": false,
    "winner": null
  }
}
```

Na de lead keuze staan de beschikbare battle-acties meestal onder
`requests[p1|p2].active[].moves`. Deze moves bevatten zowel Dex-data als live
battle-data zoals `move`, `pp`, `maxpp`, `disabled` en `effectiveness`.

`events` bevat alleen de nieuwe game-vriendelijke events sinds de vorige API
response. Bij lead selectie is dit vaak alleen een `turn` event zodra beide
spelers hun lead hebben gekozen. Als er sinds de vorige response niets nieuws is
gebeurd, is dit een lege array.

### Error Responses

```json
{
  "success": false,
  "error": "Battle not found"
}
```

```json
{
  "success": false,
  "error": "Invalid player"
}
```

```json
{
  "success": false,
  "error": "Invalid lead slot"
}
```

## Battle Choice

```http
POST /battles/:battleId/choice
Content-Type: application/json
```

Gebruik deze route om een move of switch keuze voor een speler naar Showdown te
sturen. Showdown verwerkt de turn zodra beide spelers een geldige keuze hebben
doorgestuurd.

### Request Body

Move:

```json
{
  "playerId": "p1",
  "type": "move",
  "slot": 1
}
```

Switch:

```json
{
  "playerId": "p2",
  "type": "switch",
  "slot": 3
}
```

| Veld | Type | Verplicht | Beschrijving |
| --- | --- | --- | --- |
| `playerId` | `"p1" \| "p2"` | Ja | Speler waarvoor je de keuze doorstuurt. |
| `type` | `"move" \| "switch"` | Ja | Soort keuze. |
| `slot` | `number` | Ja | Move slot of switch slot, van `1` tot en met `6`. |

### Succes Response

Move response:

```json
{
  "success": true,
  "battleId": "b7c68e40-2e60-4c11-8f92-87b4f6856c2d",
  "formatId": "gen9nationaldex",
  "players": {
    "p1": {
      "name": "Ash"
    },
    "p2": {
      "name": "Gary"
    }
  },
  "requests": {
    "p1": {
      "active": [
        {
          "moves": [
            {
              "id": "thunderbolt",
              "name": "Thunderbolt",
              "exists": true,
              "type": "Electric",
              "category": "Special",
              "basePower": 90,
              "accuracy": 100,
              "pp": 23,
              "priority": 0,
              "target": "normal",
              "shortDesc": "10% chance to paralyze the target.",
              "desc": "Has a 10% chance to paralyze the target.",
              "move": "Thunderbolt",
              "maxpp": 24,
              "disabled": false,
              "effectiveness": {
                "multiplier": 0.5,
                "label": "not_very_effective",
                "immune": false
              }
            }
          ]
        }
      ],
      "side": {
        "name": "Ash",
        "id": "p1",
        "pokemon": [
          {
            "ident": "p1: Pikachu",
            "details": "Pikachu, M",
            "condition": "94/211",
            "active": true
          }
        ]
      }
    }
  },
  "events": [
    {
      "type": "move",
      "actor": "p1a: Pikachu",
      "move": "Thunderbolt",
      "target": "p2a: Bulbasaur"
    },
    {
      "type": "damage",
      "target": "p2a: Bulbasaur",
      "condition": "176/231"
    },
    {
      "type": "move",
      "actor": "p2a: Bulbasaur",
      "move": "Giga Drain",
      "target": "p1a: Pikachu"
    },
    {
      "type": "heal",
      "target": "p2a: Bulbasaur",
      "condition": "231/231",
      "source": "drain",
      "sourceTarget": "p1a: Pikachu"
    },
    {
      "type": "turn",
      "turn": 2
    }
  ],
  "log": [
    "p1\n|move|p1a: Pikachu|Thunderbolt|p2a: Bulbasaur\n|-damage|p2a: Bulbasaur|176/231\n|turn|2"
  ],
  "state": {
    "turn": 2,
    "ended": false,
    "winner": null
  }
}
```

Switch response:

```json
{
  "success": true,
  "battleId": "b7c68e40-2e60-4c11-8f92-87b4f6856c2d",
  "formatId": "gen9nationaldex",
  "players": {
    "p1": {
      "name": "Ash"
    },
    "p2": {
      "name": "Gary"
    }
  },
  "requests": {
    "p1": {
      "active": [
        {
          "moves": [
            {
              "id": "thunderbolt",
              "name": "Thunderbolt",
              "move": "Thunderbolt",
              "pp": 23,
              "maxpp": 24,
              "disabled": false,
              "type": "Electric",
              "category": "Special",
              "basePower": 90,
              "accuracy": 100,
              "effectiveness": {
                "multiplier": 1,
                "label": "normal",
                "immune": false
              }
            }
          ]
        }
      ],
      "side": {
        "name": "Ash",
        "id": "p1",
        "pokemon": [
          {
            "ident": "p1: Pikachu",
            "details": "Pikachu, M",
            "condition": "94/211",
            "active": false
          },
          {
            "ident": "p1: Charizard",
            "details": "Charizard, M",
            "condition": "297/297",
            "active": true
          }
        ]
      }
    }
  },
  "events": [
    {
      "type": "switch",
      "playerId": "p1",
      "from": "Pikachu",
      "fromIdent": "p1a: Pikachu",
      "to": "Charizard",
      "toIdent": "p1a: Charizard",
      "pokemon": "p1a: Charizard",
      "details": "Charizard, M",
      "condition": "297/297"
    },
    {
      "type": "turn",
      "turn": 3
    }
  ],
  "log": [
    "p1\n|switch|p1a: Charizard|Charizard, M|297/297\n|turn|3"
  ],
  "state": {
    "turn": 3,
    "ended": false,
    "winner": null
  }
}
```

Na een choice response gebruik je:

- `requests` voor de actuele UI state zoals HP, PP, disabled moves, effectiveness en switches. Gebruik `forceSwitch[0]` om verplichte switch UI te openen, en gebruik `active[0].trapped` en `active[0].maybeTrapped` om normale switches te blokkeren.
- `events` voor animaties en feedback van wat er sinds de vorige response gebeurde.
- `field` voor actuele veldstatus zoals actieve weather, Trick Room, Terrain, Tailwind en hazards. Terrain vervangt vorige terrain; hazards blijven staan tot Showdown removal meldt.
- `state` voor de huidige turn en of de battle gewonnen is.

Als een battle direct eindigt na een choice, kan Showdown geen nieuwe
`|request|` meer sturen. De API corrigeert de response-snapshot dan met de
laatste faint-informatie uit de log. Daardoor blijven `events`, `state` en
`requests` consistent:

```json
{
  "requests": {
    "p2": {
      "side": {
        "pokemon": [
          {
            "ident": "p2: Pidgey",
            "condition": "0 fnt",
            "active": true
          }
        ]
      }
    }
  },
  "events": [
    {
      "type": "faint",
      "target": "p2a: Pidgey"
    },
    {
      "type": "win",
      "winner": "Player 1"
    }
  ],
  "state": {
    "ended": true
  }
}
```

### Error Responses

```json
{
  "success": false,
  "error": "Battle not found"
}
```

```json
{
  "success": false,
  "error": "Invalid player"
}
```

```json
{
  "success": false,
  "error": "Invalid choice type"
}
```

```json
{
  "success": false,
  "error": "Invalid choice slot"
}
```

```json
{
  "success": false,
  "invalidChoice": true,
  "error": "Cannot switch: active Pokemon is trapped"
}
```

Deze laatste response komt terug als de game toch een switch doorstuurt terwijl
de laatste request voor die speler `active[0].trapped` of
`active[0].maybeTrapped` op `true` heeft staan.

## Curl Voorbeeld

```bash
curl -X POST <base-url>/create_battle \
  -H "Content-Type: application/json" \
  -d '{
    "formatId": "gen9nationaldex",
    "p1": {
      "name": "Ash",
      "team": [
        {
          "species": "Pikachu",
          "ability": "Static",
          "item": "Light Ball",
          "moves": ["Thunderbolt", "Quick Attack", "Iron Tail", "Volt Switch"]
        }
      ]
    },
    "p2": {
      "name": "Gary",
      "team": [
        {
          "species": "Bulbasaur",
          "ability": "Overgrow",
          "item": "Eviolite",
          "moves": ["Giga Drain", "Sludge Bomb", "Sleep Powder", "Protect"]
        }
      ]
    }
  }'
```
