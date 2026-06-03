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
          "species": "Golem",
          "level": 50,
          "ability": "Sturdy",
          "moves": ["Stealth Rock", "Tackle"]
        }
      ]
    },
    "p2": {
      "name": "Wild",
      "team": [
        {
          "species": "Blastoise",
          "level": 50,
          "ability": "Torrent",
          "moves": ["Tackle", "Rapid Spin"]
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
const hazardEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "side" &&
    event.side === "p2" &&
    event.effectType === "sideCondition" &&
    event.effect === "move: Stealth Rock" &&
    event.state === "start"
);
const hazardEffect = body.field?.effects?.find(
  (effect) =>
    effect.scope === "side" &&
    effect.side === "p2" &&
    effect.effectType === "sideCondition" &&
    effect.effect === "move: Stealth Rock"
);

console.log(JSON.stringify({
  state: body.state,
  hazardEvent,
  field: body.field,
}, null, 2));

if (!hazardEvent) {
  console.error("Expected events to contain p2 Stealth Rock sideCondition start.");
  process.exit(1);
}

if (!hazardEffect) {
  console.error("Expected field.effects to contain p2 Stealth Rock.");
  process.exit(1);
}
' "$TURN_RESPONSE"

curl -sS -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"p1","type":"move","slot":2}' > "$P1_TURN_2_RESPONSE"

curl -sS -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"p2","type":"move","slot":2}' > "$TURN_2_RESPONSE"

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const hazardEffect = body.field?.effects?.find(
  (effect) =>
    effect.scope === "side" &&
    effect.side === "p2" &&
    effect.effectType === "sideCondition" &&
    effect.effect === "move: Stealth Rock"
);
const hazardEndEvent = body.events?.find(
  (event) =>
    event.type === "fieldEffect" &&
    event.scope === "side" &&
    event.side === "p2" &&
    event.effectType === "sideCondition" &&
    event.effect === "move: Stealth Rock" &&
    event.state === "end"
);

console.log(JSON.stringify({
  state: body.state,
  events: body.events,
  hazardEndEvent,
  field: body.field,
}, null, 2));

if (!hazardEndEvent) {
  console.error("Expected events to contain p2 Stealth Rock sideCondition end after Rapid Spin.");
  process.exit(1);
}

if (hazardEffect) {
  console.error("Expected field.effects to remove p2 Stealth Rock after Rapid Spin.");
  process.exit(1);
}
' "$TURN_2_RESPONSE"
