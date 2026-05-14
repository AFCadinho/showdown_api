import express from "express";
import { createBattle } from "./battle/battle-service";

const app = express();
app.use(express.json());

app.get("/", (_, res) => {
  res.json({ message: "Hello World" });
});

app.post("/create_battle", async (req, res) => {
  const result = await createBattle(req.body);

  if (!result) {
    return res.status(400).json(result);
  }

  return res.json(result)
});

app.listen(3001, () => {
  console.log("Server running on: http://localhost:3001/");
});
