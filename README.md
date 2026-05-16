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
  "engineVersion": "0.11.10"
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
