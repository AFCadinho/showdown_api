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
          "species": "Arcanine",
          "level": 50,
          "ability": "Intimidate",
          "moves": ["Tackle"]
        }
      ]
    },
    "p2": {
      "name": "Wild",
      "team": [
        {
          "species": "Gyarados",
          "level": 50,
          "ability": "Intimidate",
          "moves": ["Tackle"]
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

const abilityEvents = body.events?.filter(
  (event) => event.type === "ability" && event.ability === "Intimidate"
) ?? [];
const statChangeEvents = body.events?.filter(
  (event) =>
    event.type === "statChange" &&
    event.stat === "atk" &&
    event.amount === -1
) ?? [];

console.log(JSON.stringify({
  battleId: body.battleId,
  state: body.state,
  abilityEvents,
  statChangeEvents,
  events: body.events,
}, null, 2));

if (abilityEvents.length === 0) {
  console.error("Expected events to contain at least one Intimidate ability event.");
  process.exit(1);
}

if (statChangeEvents.length === 0) {
  console.error("Expected events to contain at least one Intimidate statChange event.");
  process.exit(1);
}

const firstAbilityIndex = body.events.findIndex(
  (event) => event.type === "ability" && event.ability === "Intimidate"
);
const firstStatChangeIndex = body.events.findIndex(
  (event) =>
    event.type === "statChange" &&
    event.stat === "atk" &&
    event.amount === -1
);

if (firstStatChangeIndex === -1 || firstAbilityIndex > firstStatChangeIndex) {
  console.error("Expected Intimidate ability event to appear before its statChange event.");
  process.exit(1);
}
' "$CREATE_RESPONSE"
