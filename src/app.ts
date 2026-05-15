import express from "express";
import path from "path";
import { battleRoutes } from "./routes/battle-routes";
import { docsRoutes } from "./routes/docs-routes";
import { systemRoutes } from "./routes/system-routes";

export const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(docsRoutes);
app.use(systemRoutes);
app.use(battleRoutes);
