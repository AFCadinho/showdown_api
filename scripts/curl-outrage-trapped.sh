#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

CREATE_RESPONSE="$TMP_DIR/create-response.json"
P1_TURN_1_RESPONSE="$TMP_DIR/p1-turn-1-response.json"
TURN_1_RESPONSE="$TMP_DIR/turn-1-response.json"
SWITCH_RESPONSE="$TMP_DIR/switch-response.json"

echo "Using API: $BASE_URL"

curl -sS -X POST "$BASE_URL/create_wild_battle" \
  -H "Content-Type: application/json" \
  -d '{
    "formatId": "gen9nationaldex",
    "p1": {
      "name": "Ash",
      "team": [
        {
          "species": "Dragonite",
          "level": 50,
          "ability": "Inner Focus",
          "moves": ["Outrage"]
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
          "species": "Steelix",
          "level": 100,
          "ability": "Rock Head",
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
  -d '{"playerId":"p1","type":"move","slot":1}' > "$P1_TURN_1_RESPONSE"

curl -sS -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"p2","type":"move","slot":1}' > "$TURN_1_RESPONSE"

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const p1Active = body.requests?.p1?.active?.[0];
const p1Pokemon = body.requests?.p1?.side?.pokemon;
const outrageMove = body.events?.find((event) => event.type === "move" && event.move === "Outrage");

console.log(JSON.stringify({
  state: body.state,
  outrageMove,
  p1Active,
  p1Pokemon,
}, null, 2));

if (!outrageMove) {
  console.error("Expected Dragonite to use Outrage in turn 1.");
  process.exit(1);
}

if (!p1Active) {
  console.error("Expected requests.p1.active[0] after turn 1.");
  process.exit(1);
}

if (p1Active.trapped !== true && p1Active.maybeTrapped !== true) {
  console.error("Expected requests.p1.active[0].trapped or maybeTrapped to be true after Outrage.");
  process.exit(1);
}
' "$TURN_1_RESPONSE"

echo "Confirmed: Outrage lock is visible in requests.p1.active[0].trapped/maybeTrapped."
echo "Trying an invalid switch anyway, so you can inspect how the API responds today..."

SWITCH_STATUS="$(curl -sS -w "%{http_code}" -o "$SWITCH_RESPONSE" -X POST "$BASE_URL/battles/$BATTLE_ID/choice" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"p1","type":"switch","slot":2}')"

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const status = Number(process.argv[2]);

console.log(JSON.stringify({
  status,
  success: body.success,
  invalidChoice: body.invalidChoice,
  error: body.error,
  state: body.state,
  p1Active: body.requests?.p1?.active?.[0],
}, null, 2));

if (status !== 400) {
  console.error(`Expected invalid switch to return HTTP 400, received ${status}.`);
  process.exit(1);
}

if (body.success !== false || body.invalidChoice !== true) {
  console.error("Expected invalid switch response to contain success:false and invalidChoice:true.");
  process.exit(1);
}
' "$SWITCH_RESPONSE" "$SWITCH_STATUS"
