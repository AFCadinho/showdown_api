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
LAST_RESPONSE="$TURN_2_RESPONSE"

echo "Using API: $BASE_URL"

curl -sS -X POST "$BASE_URL/create_wild_battle" \
  -H "Content-Type: application/json" \
  -d '{
    "formatId": "gen9nationaldex",
    "p1": {
      "name": "Ash",
      "team": [
        {
          "species": "Politoed",
          "level": 50,
          "ability": "Water Absorb",
          "moves": ["Rain Dance", "Splash"]
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
const weatherEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.effectType === "weather" &&
    event.effect === "RainDance" &&
    event.state === "start"
);
const weatherEffect = body.field?.effects?.find(
  (effect) =>
    effect.scope === "field" &&
    effect.effectType === "weather" &&
    effect.effect === "RainDance"
);

console.log(JSON.stringify({
  state: body.state,
  weatherEvent,
  field: body.field,
}, null, 2));

if (!weatherEvent) {
  console.error("Expected events to contain RainDance fieldEffect start.");
  process.exit(1);
}

if (!weatherEffect) {
  console.error("Expected field.effects to contain active RainDance weather.");
  process.exit(1);
}

if (weatherEvent.minDuration !== 5 || weatherEvent.maxDuration !== 8) {
  console.error("Expected RainDance start event to include minDuration 5 and maxDuration 8.");
  process.exit(1);
}

if (weatherEffect.minDuration !== 5 || weatherEffect.maxDuration !== 8) {
  console.error("Expected RainDance field effect to include minDuration 5 and maxDuration 8.");
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
const weatherEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.effectType === "weather" &&
    event.effect === "RainDance" &&
    event.state === "upkeep"
);
const weatherEffect = body.field?.effects?.find(
  (effect) =>
    effect.scope === "field" &&
    effect.effectType === "weather" &&
    effect.effect === "RainDance"
);

console.log(JSON.stringify({
  state: body.state,
  upkeepWeatherEvent: weatherEvent,
  field: body.field,
}, null, 2));

if (!weatherEvent) {
  console.error("Expected events to contain RainDance fieldEffect upkeep on turn 2.");
  process.exit(1);
}

if (!weatherEffect) {
  console.error("Expected field.effects to keep active RainDance weather on turn 2.");
  process.exit(1);
}

if (weatherEvent.minDuration !== 5 || weatherEvent.maxDuration !== 8) {
  console.error("Expected RainDance upkeep event to include minDuration 5 and maxDuration 8.");
  process.exit(1);
}

if (weatherEffect.minDuration !== 5 || weatherEffect.maxDuration !== 8) {
  console.error("Expected active RainDance field effect to keep minDuration 5 and maxDuration 8.");
  process.exit(1);
}
' "$TURN_2_RESPONSE"

for TURN in 3 4 5 6 7; do
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
    event.effectType === "weather" &&
    event.effect === "none" &&
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
const weatherEndEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.effectType === "weather" &&
    event.effect === "none" &&
    event.state === "end"
);
const weatherEffect = body.field?.effects?.find(
  (effect) => effect.effectType === "weather"
);

console.log(JSON.stringify({
  state: body.state,
  weatherEndEvent,
  field: body.field,
}, null, 2));

if (!weatherEndEvent) {
  console.error("Expected events to contain weather end after RainDance expires.");
  process.exit(1);
}

if (
  weatherEndEvent.minDuration !== undefined ||
  weatherEndEvent.maxDuration !== undefined
) {
  console.error("Expected weather none end event to omit duration metadata.");
  process.exit(1);
}

if (weatherEffect) {
  console.error("Expected field.effects to remove weather after RainDance expires.");
  process.exit(1);
}
' "$LAST_RESPONSE"
