import express from "express";
import path from "path";
import { createBattle } from "./battle/battle-service";

const packageJson = require("../package.json");
const pokemonShowdownPackageJson = require("pokemon-showdown/package.json");

const app = express();
const port = Number(process.env.PORT) || 3001;

const createBattleDocs = {
  method: "POST",
  path: "/create_battle",
  contentType: "application/json",
  description: "Maakt een Pokemon Showdown battle aan met twee teams.",
  requestBody: {
    formatId: "gen9nationaldex",
    p1: {
      name: "Ash",
      team: [
        {
          species: "Pikachu",
          ability: "Static",
          item: "Light Ball",
          moves: ["Thunderbolt", "Quick Attack", "Iron Tail", "Volt Switch"],
          nature: "Timid",
          evs: {
            hp: 4,
            spa: 252,
            spe: 252,
          },
        },
      ],
    },
    p2: {
      name: "Gary",
      team: [
        {
          species: "Bulbasaur",
          ability: "Overgrow",
          item: "Eviolite",
          moves: ["Giga Drain", "Sludge Bomb", "Sleep Powder", "Protect"],
          nature: "Bold",
          evs: {
            hp: 252,
            def: 252,
            spa: 4,
          },
        },
      ],
    },
  },
  fields: {
    formatId: {
      type: "string",
      required: false,
      description: "Pokemon Showdown format. Default: gen9nationaldex.",
    },
    "p1.name": {
      type: "string",
      required: false,
      description: "Naam van speler 1. Default: Player 1.",
    },
    "p1.team": {
      type: "PokemonSet[]",
      required: true,
      description: "Team van speler 1 in Pokemon Showdown set formaat.",
    },
    "p2.name": {
      type: "string",
      required: false,
      description: "Naam van speler 2. Default: Player 2.",
    },
    "p2.team": {
      type: "PokemonSet[]",
      required: true,
      description: "Team van speler 2 in Pokemon Showdown set formaat.",
    },
  },
  successResponse: {
    success: true,
    battleId: "b7c68e40-2e60-4c11-8f92-87b4f6856c2d",
    formatId: "gen9nationaldex",
    players: {
      p1: { name: "Ash" },
      p2: { name: "Gary" },
    },
    requests: {},
    log: [],
  },
  errorResponse: {
    success: false,
    error: "Missing teams",
  },
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
  });
});

app.get("/info", (_, res) => {
  res.json({
    name: packageJson.name,
    version: packageJson.version,
    engine: "pokemon-showdown",
    engineVersion: pokemonShowdownPackageJson.version,
    routes: {
      home: "/",
      health: "/health",
      info: "/info",
      createBattle: "/create_battle",
      createBattleSchema: "/create_battle/schema",
    },
  });
});

app.get("/create_battle", (_, res) => {
  res.sendFile(path.join(__dirname, "../public/create-battle.html"));
});

app.get("/create_battle/schema", (_, res) => {
  res.json(createBattleDocs);
});

app.post("/create_battle", async (req, res) => {
  const result = await createBattle(req.body);

  if (!result) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
