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
          "species": "Koraidon",
          "level": 100,
          "ability": "Orichalcum Pulse",
          "moves": ["Collision Course"]
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

const weatherEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "field" &&
    event.effectType === "weather" &&
    event.effect === "SunnyDay" &&
    event.state === "start"
);
const weatherEffect = body.field?.effects?.find(
  (effect) =>
    effect.scope === "field" &&
    effect.effectType === "weather" &&
    effect.effect === "SunnyDay"
);

console.log(JSON.stringify({
  battleId: body.battleId,
  state: body.state,
  weatherEvent,
  field: body.field,
}, null, 2));

if (!weatherEvent) {
  console.error("Expected events to contain SunnyDay weather start from Orichalcum Pulse.");
  process.exit(1);
}

if (weatherEvent.source !== "ability: Orichalcum Pulse") {
  console.error("Expected SunnyDay event source to be ability: Orichalcum Pulse.");
  process.exit(1);
}

if (weatherEvent.sourceTarget !== "p1a: Koraidon") {
  console.error("Expected SunnyDay event sourceTarget to be p1a: Koraidon.");
  process.exit(1);
}

if (!weatherEffect) {
  console.error("Expected field.effects to contain active SunnyDay weather.");
  process.exit(1);
}
' "$CREATE_RESPONSE"
