#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

RESPONSE="$TMP_DIR/create-wild-response.json"

echo "Using API: $BASE_URL"

curl -sS -X POST "$BASE_URL/create_wild_battle" \
  -H "Content-Type: application/json" \
  -d '{
    "formatId": "gen9nationaldex",
    "p1": {
      "name": "Ash",
      "team": [
        {
          "species": "Pikachu",
          "level": 5,
          "ability": "Static",
          "moves": ["Thunderbolt"],
          "instanceId": "pokemon_123",
          "currentHp": 12,
          "maxHp": 35
        }
      ]
    },
    "p2": {
      "name": "Wild",
      "team": [
        {
          "species": "Bulbasaur",
          "level": 5,
          "ability": "Overgrow",
          "moves": ["Tackle"]
        }
      ]
    }
  }' > "$RESPONSE"

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const pikachu = body.requests?.p1?.side?.pokemon?.find(
  (pokemon) => pokemon.ident === "p1: Pikachu"
);

console.log(JSON.stringify({
  state: body.state,
  pikachu,
}, null, 2));

if (!body.success) {
  console.error("Expected create_wild_battle to succeed.");
  process.exit(1);
}

if (pikachu?.condition !== "12/20") {
  console.error(`Expected Pikachu condition to be 12/20, received ${pikachu?.condition}.`);
  process.exit(1);
}

if (pikachu?.instanceId !== "pokemon_123") {
  console.error(`Expected Pikachu instanceId to be pokemon_123, received ${pikachu?.instanceId}.`);
  process.exit(1);
}
' "$RESPONSE"
