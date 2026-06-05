import { Router } from "express";

const packageJson = require("../../package.json");
const pokemonShowdownPackageJson = require("pokemon-showdown/package.json");

export const systemRoutes = Router();

systemRoutes.get("/health", (_, res) => {
  res.json({
    status: "ok",
  });
});

systemRoutes.get("/info", (_, res) => {
  res.json({
    name: packageJson.name,
    version: packageJson.version,
    engine: "pokemon-showdown",
    engineVersion: pokemonShowdownPackageJson.version,
    routes: {
      home: "/",
      health: "/health",
      info: "/info",
      parsePokemon: "/parse_pokemon",
      createBattle: "/create_battle",
      createBattleSchema: "/create_battle/schema",
      createWildBattle: "/create_wild_battle",
      createWildBattleSchema: "/create_wild_battle/schema",
      pokemonInfo: "/battles/:battleId/pokemon-info",
      chooseLead: "/battles/:battleId/lead",
      chooseAction: "/battles/:battleId/choice",
    },
  });
});
