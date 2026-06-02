#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

CREATE_RESPONSE="$TMP_DIR/create-response.json"
P1_RESPONSE="$TMP_DIR/p1-switch-response.json"
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
          "level": 50,
          "ability": "Static",
          "item": "Light Ball",
          "moves": ["Thunderbolt"]
        },
        {
          "species": "Charizard",
          "level": 50,
          "ability": "Blaze",
          "moves": ["Flamethrower"]
        }
      ]
    },
    "p2": {
      "name": "Wild",
      "team": [
        {
          "species": "Pidgey",
          "level": 50,
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
  -d '{"playerId":"p1","type":"switch","slot":2}' > "$P1_RESPONSE"

curl -sS -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"p2","type":"move","slot":1}' > "$FINAL_RESPONSE"

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const switchEvent = body.events?.find((event) => event.type === "switch");
const p1Pokemon = body.requests?.p1?.side?.pokemon;

console.log(JSON.stringify({
  state: body.state,
  switchEvent,
  p1Pokemon,
}, null, 2));

if (!switchEvent) {
  console.error("Expected a switch event in the final response.");
  process.exit(1);
}

const expected = {
  playerId: "p1",
  from: "Pikachu",
  fromIdent: "p1a: Pikachu",
  to: "Charizard",
  toIdent: "p1a: Charizard",
};

for (const [field, value] of Object.entries(expected)) {
  if (switchEvent[field] !== value) {
    console.error(`Expected switchEvent.${field} to be ${value}, received ${switchEvent[field]}.`);
    process.exit(1);
  }
}

const pikachu = p1Pokemon?.find((pokemon) => pokemon.ident === "p1: Pikachu");
const charizard = p1Pokemon?.find((pokemon) => pokemon.ident === "p1: Charizard");

if (pikachu?.active !== false) {
  console.error("Expected Pikachu to be inactive after switching.");
  process.exit(1);
}

if (charizard?.active !== true) {
  console.error("Expected Charizard to be active after switching.");
  process.exit(1);
}
' "$FINAL_RESPONSE"
