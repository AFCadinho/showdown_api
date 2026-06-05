import { Router } from "express";
import path from "path";
import {
  createBattleDocs,
  createWildBattleDocs,
} from "../docs/create-battle-docs";

export const docsRoutes = Router();

const publicPath = path.join(__dirname, "../../public");

docsRoutes.get("/", (_, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

docsRoutes.get("/create_battle", (_, res) => {
  res.sendFile(path.join(publicPath, "create-battle.html"));
});

docsRoutes.get("/create_wild_battle", (_, res) => {
  res.sendFile(path.join(publicPath, "create-wild-battle.html"));
});

docsRoutes.get("/parse_pokemon", (_, res) => {
  res.sendFile(path.join(publicPath, "parse-pokemon.html"));
});

docsRoutes.get("/parse_team", (_, res) => {
  res.sendFile(path.join(publicPath, "parse-team.html"));
});

docsRoutes.get("/pokemon-stats/docs", (_, res) => {
  res.sendFile(path.join(publicPath, "pokemon-stats.html"));
});

docsRoutes.get("/create_battle/schema", (_, res) => {
  res.json(createBattleDocs);
});

docsRoutes.get("/create_wild_battle/schema", (_, res) => {
  res.json(createWildBattleDocs);
});

docsRoutes.get("/battles/:battleId/lead", (_, res) => {
  res.sendFile(path.join(publicPath, "lead-battle.html"));
});

docsRoutes.get("/battles/:battleId/choice", (_, res) => {
  res.sendFile(path.join(publicPath, "choice-battle.html"));
});

docsRoutes.get("/docs/battles/:battleId/pokemon-info", (_, res) => {
  res.sendFile(path.join(publicPath, "pokemon-info.html"));
});
