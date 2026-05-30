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
    "createBattle": "/create_battle",
    "createBattleSchema": "/create_battle/schema",
    "createWildBattle": "/create_wild_battle",
    "createWildBattleSchema": "/create_wild_battle/schema",
    "chooseLead": "/battles/:battleId/lead",
    "chooseAction": "/battles/:battleId/choice"
  }
}
```

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
| `requests` | `object` | Laatste request per speler, verrijkt met Dex-data voor UI-gebruik. Bij `create_battle` is dit meestal een `teamPreview` request. |
| `events` | `BattleEvent[]` | Nieuwe game-vriendelijke events sinds de vorige API response. Bij `create_battle` meestal nog leeg. |
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
| `shortDesc` | `string` | Korte Showdown omschrijving. |
| `desc` | `string` | Volledige Showdown omschrijving. |

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

Die moves bevatten live battle-data uit Showdown, zoals actuele `pp`, `maxpp`
en `disabled`.

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
              "accuracy": 100
            }
          ]
        }
      ]
    }
  },
  "events": [],
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
    "condition": "176/231"
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
]
```

Ondersteunde event types:

| Type | Velden | Beschrijving |
| --- | --- | --- |
| `move` | `actor`, `move`, `target` | Een Pokemon gebruikt een move. |
| `damage` | `target`, `condition` | Een Pokemon krijgt damage. |
| `heal` | `target`, `condition`, `source`, `sourceTarget` | Een Pokemon krijgt HP terug. |
| `status` | `target`, `status` | Een Pokemon krijgt een status, zoals `par`. |
| `cant` | `target`, `reason`, `move` | Een Pokemon kan geen move uitvoeren, bijvoorbeeld door flinch, paralysis, sleep of recharge. |
| `fail` | `target`, `action` | Een move of action faalt door eigen mechanics, zoals Fake Out buiten de eerste beurt of Protect die faalt. |
| `switch` | `pokemon`, `details`, `condition` | Een Pokemon komt actief het veld in. |
| `faint` | `target` | Een Pokemon faint. |
| `turn` | `turn` | Showdown start een nieuwe turn. |
| `win` | `winner` | De battle is afgelopen. |

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
              "disabled": false
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
battle-data zoals `move`, `pp`, `maxpp` en `disabled`.

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
              "disabled": false
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

Na een choice response gebruik je:

- `requests` voor de actuele UI state zoals HP, PP, disabled moves en switches.
- `events` voor animaties en feedback van wat er sinds de vorige response gebeurde.
- `state` voor de huidige turn en of de battle gewonnen is.

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
