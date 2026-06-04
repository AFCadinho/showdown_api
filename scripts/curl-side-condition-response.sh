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
LAST_RESPONSE="$TURN_RESPONSE"

echo "Using API: $BASE_URL"

curl -sS -X POST "$BASE_URL/create_wild_battle" \
  -H "Content-Type: application/json" \
  -d '{
    "formatId": "gen9nationaldex",
    "p1": {
      "name": "Ash",
      "team": [
        {
          "species": "Talonflame",
          "level": 50,
          "ability": "Flame Body",
          "moves": ["Tailwind", "Splash"]
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
const sideEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "side" &&
    event.side === "p1" &&
    event.effectType === "sideCondition" &&
    event.effect === "move: Tailwind" &&
    event.state === "start"
);
const sideEffect = body.field?.effects?.find(
  (effect) =>
    effect.scope === "side" &&
    effect.side === "p1" &&
    effect.effectType === "sideCondition" &&
    effect.effect === "move: Tailwind"
);

console.log(JSON.stringify({
  state: body.state,
  sideEvent,
  field: body.field,
}, null, 2));

if (!sideEvent) {
  console.error("Expected events to contain Tailwind sideCondition start.");
  process.exit(1);
}

if (!sideEffect) {
  console.error("Expected field.effects to contain active Tailwind.");
  process.exit(1);
}

if (sideEvent.minDuration !== 4 || sideEvent.maxDuration !== 4) {
  console.error("Expected Tailwind start event to include minDuration 4 and maxDuration 4.");
  process.exit(1);
}

if (sideEffect.minDuration !== 4 || sideEffect.maxDuration !== 4) {
  console.error("Expected active Tailwind field effect to include minDuration 4 and maxDuration 4.");
  process.exit(1);
}
' "$TURN_RESPONSE"

for TURN in 2 3 4 5 6; do
  P1_RESPONSE="$TMP_DIR/p1-turn-$TURN-response.json"
  TURN_RESPONSE="$TMP_DIR/turn-$TURN-response.json"

  curl -sS -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
    -H "Content-Type: application/json" \
    -d '{"playerId":"p1","type":"move","slot":2}' > "$P1_RESPONSE"

  curl -sS -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
    -H "Content-Type: application/json" \
    -d '{"playerId":"p2","type":"move","slot":1}' > "$TURN_RESPONSE"

  LAST_RESPONSE="$TURN_RESPONSE"

  if node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const ended = body.events?.some(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "side" &&
    event.side === "p1" &&
    event.effectType === "sideCondition" &&
    event.effect === "move: Tailwind" &&
    event.state === "end"
);
process.exit(ended ? 0 : 1);
' "$TURN_RESPONSE"; then
    break
  fi
done

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const sideEndEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "side" &&
    event.side === "p1" &&
    event.effectType === "sideCondition" &&
    event.effect === "move: Tailwind" &&
    event.state === "end"
);
const sideEffect = body.field?.effects?.find(
  (effect) =>
    effect.scope === "side" &&
    effect.side === "p1" &&
    effect.effectType === "sideCondition" &&
    effect.effect === "move: Tailwind"
);

console.log(JSON.stringify({
  state: body.state,
  sideEndEvent,
  field: body.field,
}, null, 2));

if (!sideEndEvent) {
  console.error("Expected events to contain Tailwind sideCondition end.");
  process.exit(1);
}

if (sideEndEvent.minDuration !== 4 || sideEndEvent.maxDuration !== 4) {
  console.error("Expected Tailwind end event to include minDuration 4 and maxDuration 4.");
  process.exit(1);
}

if (sideEffect) {
  console.error("Expected field.effects to remove Tailwind after it ends.");
  process.exit(1);
}
' "$LAST_RESPONSE"
