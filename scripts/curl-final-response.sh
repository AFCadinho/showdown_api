#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

CREATE_RESPONSE="$TMP_DIR/create-response.json"
P1_RESPONSE="$TMP_DIR/p1-choice-response.json"
FINAL_RESPONSE="$TMP_DIR/final-response.json"

echo "Using API: $BASE_URL"

curl -sS -X POST "$BASE_URL/create_wild_battle" \
  -H "Content-Type: application/json" \
  -d '{
    "formatId": "gen9nationaldex",
    "p1": {
      "name": "Ash",
      "team": [
        {
          "species": "Pikachu",
          "level": 100,
          "ability": "Static",
          "item": "Light Ball",
          "moves": ["Thunderbolt"]
        }
      ]
    },
    "p2": {
      "name": "Wild",
      "team": [
        {
          "species": "Pidgey",
          "level": 1,
          "ability": "Keen Eye",
          "moves": ["Tackle"]
        }
      ]
    }
  }' > "$CREATE_RESPONSE"

BATTLE_ID="$(node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
if (!body.success || !body.battleId) {
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}
console.log(body.battleId);
' "$CREATE_RESPONSE")"

echo "Battle id: $BATTLE_ID"

curl -sS -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"p1","type":"move","slot":1}' > "$P1_RESPONSE"

curl -sS -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"p2","type":"move","slot":1}' > "$FINAL_RESPONSE"

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const damage = body.events?.find((event) => event.type === "damage");
const p2Pokemon = body.requests?.p2?.side?.pokemon;

console.log(JSON.stringify({
  state: body.state,
  damageEvent: damage,
  p2Pokemon,
}, null, 2));

if (!damage) {
  console.error("Expected a damage event in the final response.");
  process.exit(1);
}

for (const field of ["previousCondition", "previousHp", "hp", "maxHp", "amount"]) {
  if (!(field in damage)) {
    console.error(`Damage event is missing ${field}.`);
    process.exit(1);
  }
}

if (damage.maxHp !== 100) {
  console.error(`Expected damage.maxHp to use percentage units with maxHp 100, received ${damage.maxHp}.`);
  process.exit(1);
}

if (damage.amount !== Math.abs(damage.previousHp - damage.hp)) {
  console.error("Expected damage.amount to equal the difference between previousHp and hp.");
  process.exit(1);
}

const faintedPokemon = p2Pokemon?.find((pokemon) => pokemon.condition === "0 fnt");
if (!faintedPokemon) {
  console.error("Expected requests.p2.side.pokemon to contain condition 0 fnt.");
  process.exit(1);
}
' "$FINAL_RESPONSE"
