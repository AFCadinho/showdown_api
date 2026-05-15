import express from "express";
import path from "path";
import { battleRoutes } from "./routes/battle-routes";
import { docsRoutes } from "./routes/docs-routes";
import { systemRoutes } from "./routes/system-routes";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(docsRoutes);
app.use(systemRoutes);
app.use(battleRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
