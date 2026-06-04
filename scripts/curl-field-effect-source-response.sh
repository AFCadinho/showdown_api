#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

CREATE_RESPONSE="$TMP_DIR/create-response.json"

echo "Using API: $BASE_URL"

curl -sS -X POST "$BASE_URL/create_wild_battle" \
  -H "Content-Type: application/json" \
  -d '{
    "formatId": "gen9nationaldex",
    "p1": {
      "name": "Ash",
      "team": [
        {
          "species": "Pincurchin",
          "level": 50,
          "ability": "Electric Surge",
          "moves": ["Tackle"]
        }
      ]
    },
    "p2": {
      "name": "Wild",
      "team": [
        {
          "species": "Magikarp",
          "level": 50,
          "ability": "Swift Swim",
          "moves": ["Splash"]
        }
      ]
    }
  }' > "$CREATE_RESPONSE"

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));

if (!body.success || !body.battleId) {
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

const fieldEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "field" &&
    event.effectType === "fieldCondition" &&
    event.effectGroup === "terrain" &&
    event.effect === "move: Electric Terrain" &&
    event.state === "start"
);
const fieldEffect = body.field?.effects?.find(
  (effect) =>
    effect.scope === "field" &&
    effect.effectType === "fieldCondition" &&
    effect.effectGroup === "terrain" &&
    effect.effect === "move: Electric Terrain"
);

console.log(JSON.stringify({
  battleId: body.battleId,
  state: body.state,
  fieldEvent,
  field: body.field,
}, null, 2));

if (!fieldEvent) {
  console.error("Expected events to contain Electric Terrain fieldCondition start.");
  process.exit(1);
}

if (fieldEvent.source !== "ability: Electric Surge") {
  console.error("Expected Electric Terrain event source to be ability: Electric Surge.");
  process.exit(1);
}

if (fieldEvent.sourceTarget !== "p1a: Pincurchin") {
  console.error("Expected Electric Terrain event sourceTarget to be p1a: Pincurchin.");
  process.exit(1);
}

if (!fieldEffect) {
  console.error("Expected field.effects to contain active Electric Terrain.");
  process.exit(1);
}
' "$CREATE_RESPONSE"
