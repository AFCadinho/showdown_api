# Showdown API

API om een Pokemon Showdown battle aan te maken.

Base URL:

```txt
http://localhost:3001
```

## Health Check

```http
GET /
```

Response:

```json
{
  "message": "Hello World"
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
      "active": [
        {
          "moves": [
            {
              "move": "Thunderbolt",
              "id": "thunderbolt",
              "pp": 24,
              "maxpp": 24,
              "target": "normal",
              "disabled": false
            }
          ]
        }
      ],
      "side": {
        "name": "Ash",
        "id": "p1"
      },
      "rqid": 2
    },
    "p2": {
      "active": [
        {
          "moves": [
            {
              "move": "Giga Drain",
              "id": "gigadrain",
              "pp": 16,
              "maxpp": 16,
              "target": "normal",
              "disabled": false
            }
          ]
        }
      ],
      "side": {
        "name": "Gary",
        "id": "p2"
      },
      "rqid": 2
    }
  },
  "log": [
    "p1\n|request|{\"active\":[...],\"side\":{\"name\":\"Ash\",\"id\":\"p1\"},\"rqid\":2}",
    "p2\n|request|{\"active\":[...],\"side\":{\"name\":\"Gary\",\"id\":\"p2\"},\"rqid\":2}"
  ]
}
```

### Response Velden

| Veld | Type | Beschrijving |
| --- | --- | --- |
| `success` | `boolean` | Of de battle is aangemaakt. |
| `battleId` | `string` | Unieke id van de aangemaakte battle. |
| `formatId` | `string` | Gebruikt Showdown format. |
| `players` | `object` | Namen van `p1` en `p2`. |
| `requests` | `object` | Laatste Showdown request per speler. Hiermee kun je zien welke keuzes beschikbaar zijn. |
| `log` | `string[]` | Ruwe stream output die de API tot nu toe heeft ontvangen. |

## Error Response

Als `p1.team` of `p2.team` ontbreekt:

```json
{
  "success": false,
  "error": "Missing teams"
}
```

## Curl Voorbeeld

```bash
curl -X POST http://localhost:3001/create_battle \
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
