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
TURN_RESPONSE="$TMP_DIR/turn-response.json"

echo "Using API: $BASE_URL"

curl -sS -X POST "$BASE_URL/create_wild_battle" \
  -H "Content-Type: application/json" \
  -d '{
    "formatId": "gen9nationaldex",
    "p1": {
      "name": "Ash",
      "team": [
        {
          "species": "Magikarp",
          "level": 1,
          "ability": "Swift Swim",
          "moves": ["Splash"]
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
          "species": "Pikachu",
          "level": 100,
          "ability": "Static",
          "item": "Light Ball",
          "moves": ["Thunderbolt"]
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
  -d '{"playerId":"p2","type":"move","slot":1}' > "$TURN_RESPONSE"

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const p1Request = body.requests?.p1;
const faintEvent = body.events?.find((event) => event.type === "faint" && event.target === "p1a: Magikarp");
const magikarp = p1Request?.side?.pokemon?.find((pokemon) => pokemon.ident === "p1: Magikarp");
const charizard = p1Request?.side?.pokemon?.find((pokemon) => pokemon.ident === "p1: Charizard");

console.log(JSON.stringify({
  state: body.state,
  forceSwitch: p1Request?.forceSwitch,
  faintEvent,
  magikarp,
  charizard,
}, null, 2));

if (body.state?.ended === true) {
  console.error("Expected battle to continue after Magikarp fainted.");
  process.exit(1);
}

if (p1Request?.forceSwitch?.[0] !== true) {
  console.error("Expected requests.p1.forceSwitch[0] to be true.");
  process.exit(1);
}

if (!faintEvent) {
  console.error("Expected a faint event for p1a: Magikarp.");
  process.exit(1);
}

if (magikarp?.condition !== "0 fnt") {
  console.error("Expected Magikarp condition to be 0 fnt.");
  process.exit(1);
}

if (charizard?.active !== false || charizard?.condition === "0 fnt") {
  console.error("Expected Charizard to be alive and available to switch in.");
  process.exit(1);
}
 ' "$TURN_RESPONSE"
