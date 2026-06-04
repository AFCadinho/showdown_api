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
          "species": "Bronzong",
          "level": 50,
          "ability": "Levitate",
          "moves": ["Trick Room", "Splash"]
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
const fieldEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "field" &&
    event.effectType === "fieldCondition" &&
    event.effect === "move: Trick Room" &&
    event.state === "start"
);
const fieldEffect = body.field?.effects?.find(
  (effect) =>
    effect.scope === "field" &&
    effect.effectType === "fieldCondition" &&
    effect.effect === "move: Trick Room"
);

console.log(JSON.stringify({
  state: body.state,
  fieldEvent,
  field: body.field,
}, null, 2));

if (!fieldEvent) {
  console.error("Expected events to contain Trick Room fieldEffect start.");
  process.exit(1);
}

if (!fieldEffect) {
  console.error("Expected field.effects to contain active Trick Room.");
  process.exit(1);
}

if (fieldEvent.minDuration !== 5 || fieldEvent.maxDuration !== 5) {
  console.error("Expected Trick Room start event to include minDuration 5 and maxDuration 5.");
  process.exit(1);
}

if (fieldEffect.minDuration !== 5 || fieldEffect.maxDuration !== 5) {
  console.error("Expected active Trick Room field effect to include minDuration 5 and maxDuration 5.");
  process.exit(1);
}

if (
  fieldEffect.startedTurn !== 2 ||
  fieldEffect.minRemainingTurns !== 5 ||
  fieldEffect.maxRemainingTurns !== 5
) {
  console.error("Expected Trick Room field effect to start with remaining turns 5 to 5.");
  process.exit(1);
}
' "$TURN_RESPONSE"

for TURN in 2 3 4 5 6 7; do
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
    event.scope === "field" &&
    event.effectType === "fieldCondition" &&
    event.effect === "move: Trick Room" &&
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
const fieldEndEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "field" &&
    event.effectType === "fieldCondition" &&
    event.effect === "move: Trick Room" &&
    event.state === "end"
);
const fieldEffect = body.field?.effects?.find(
  (effect) =>
    effect.scope === "field" &&
    effect.effectType === "fieldCondition" &&
    effect.effect === "move: Trick Room"
);

console.log(JSON.stringify({
  state: body.state,
  fieldEndEvent,
  field: body.field,
}, null, 2));

if (!fieldEndEvent) {
  console.error("Expected events to contain Trick Room fieldCondition end.");
  process.exit(1);
}

if (fieldEndEvent.minDuration !== 5 || fieldEndEvent.maxDuration !== 5) {
  console.error("Expected Trick Room end event to include minDuration 5 and maxDuration 5.");
  process.exit(1);
}

if (fieldEffect) {
  console.error("Expected field.effects to remove Trick Room after it ends.");
  process.exit(1);
}
' "$LAST_RESPONSE"
