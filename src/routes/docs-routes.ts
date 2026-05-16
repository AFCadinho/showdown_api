import { Router } from "express";
import path from "path";
import { createBattleDocs } from "../docs/create-battle-docs";

export const docsRoutes = Router();

const publicPath = path.join(__dirname, "../../public");

docsRoutes.get("/", (_, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

docsRoutes.get("/create_battle", (_, res) => {
  res.sendFile(path.join(publicPath, "create-battle.html"));
});

docsRoutes.get("/create_battle/schema", (_, res) => {
  res.json(createBattleDocs);
});

docsRoutes.get("/battles/:battleId/lead", (_, res) => {
  res.sendFile(path.join(publicPath, "lead-battle.html"));
});

docsRoutes.get("/battles/:battleId/choice", (_, res) => {
  res.sendFile(path.join(publicPath, "choice-battle.html"));
});
