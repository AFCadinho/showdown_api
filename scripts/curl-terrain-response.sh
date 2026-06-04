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
P1_TURN_2_RESPONSE="$TMP_DIR/p1-turn-2-response.json"
TURN_2_RESPONSE="$TMP_DIR/turn-2-response.json"

echo "Using API: $BASE_URL"

curl -sS -X POST "$BASE_URL/create_wild_battle" \
  -H "Content-Type: application/json" \
  -d '{
    "formatId": "gen9nationaldex",
    "p1": {
      "name": "Ash",
      "team": [
        {
          "species": "Mew",
          "level": 50,
          "ability": "Synchronize",
          "moves": ["Electric Terrain", "Grassy Terrain"]
        }
      ]
    },
    "p2": {
      "name": "Wild",
      "team": [
        {
          "species": "Blissey",
          "level": 50,
          "ability": "Natural Cure",
          "moves": ["Splash"]
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
const terrainEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "field" &&
    event.effectType === "fieldCondition" &&
    event.effectGroup === "terrain" &&
    event.effect === "move: Electric Terrain" &&
    event.state === "start"
);
const terrainEffects = body.field?.effects?.filter(
  (effect) => effect.effectGroup === "terrain"
) ?? [];

console.log(JSON.stringify({
  state: body.state,
  terrainEvent,
  field: body.field,
}, null, 2));

if (!terrainEvent) {
  console.error("Expected events to contain Electric Terrain start.");
  process.exit(1);
}

if (terrainEffects.length !== 1 || terrainEffects[0].effect !== "move: Electric Terrain") {
  console.error("Expected field.effects to contain only Electric Terrain.");
  process.exit(1);
}

if (terrainEvent.minDuration !== 5 || terrainEvent.maxDuration !== 8) {
  console.error("Expected Electric Terrain event to include minDuration 5 and maxDuration 8.");
  process.exit(1);
}

if (
  terrainEffects[0].startedTurn !== 2 ||
  terrainEffects[0].minDuration !== 5 ||
  terrainEffects[0].maxDuration !== 8 ||
  terrainEffects[0].minRemainingTurns !== 5 ||
  terrainEffects[0].maxRemainingTurns !== 8
) {
  console.error("Expected Electric Terrain field effect to include duration and remaining turns 5 to 8.");
  process.exit(1);
}
' "$TURN_RESPONSE"

curl -sS -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"p1","type":"move","slot":2}' > "$P1_TURN_2_RESPONSE"

curl -sS -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"p2","type":"move","slot":1}' > "$TURN_2_RESPONSE"

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const terrainEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "field" &&
    event.effectType === "fieldCondition" &&
    event.effectGroup === "terrain" &&
    event.effect === "move: Grassy Terrain" &&
    event.state === "start"
);
const terrainEffects = body.field?.effects?.filter(
  (effect) => effect.effectGroup === "terrain"
) ?? [];

console.log(JSON.stringify({
  state: body.state,
  terrainEvent,
  field: body.field,
}, null, 2));

if (!terrainEvent) {
  console.error("Expected events to contain Grassy Terrain start.");
  process.exit(1);
}

if (terrainEffects.length !== 1 || terrainEffects[0].effect !== "move: Grassy Terrain") {
  console.error("Expected field.effects to replace Electric Terrain with Grassy Terrain.");
  process.exit(1);
}

if (terrainEvent.minDuration !== 5 || terrainEvent.maxDuration !== 8) {
  console.error("Expected Grassy Terrain event to include minDuration 5 and maxDuration 8.");
  process.exit(1);
}

if (
  terrainEffects[0].startedTurn !== 3 ||
  terrainEffects[0].minDuration !== 5 ||
  terrainEffects[0].maxDuration !== 8 ||
  terrainEffects[0].minRemainingTurns !== 5 ||
  terrainEffects[0].maxRemainingTurns !== 8
) {
  console.error("Expected Grassy Terrain field effect to include duration and remaining turns 5 to 8.");
  process.exit(1);
}
' "$TURN_2_RESPONSE"
