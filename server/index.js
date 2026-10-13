import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const purchasesPath = path.join(__dirname, "purchases.json");

app.get("/api/purchases", (_, res) => {
  if (!fs.existsSync(purchasesPath)) {
    return res.json([]);
  }
  const data = fs.readFileSync(purchasesPath, "utf8");
  res.json(JSON.parse(data || "[]"));
});

app.post("/api/purchases", (req, res) => {
  const payload = req.body;
  let list = [];
  if (fs.existsSync(purchasesPath)) {
    const raw = fs.readFileSync(purchasesPath, "utf8");
    list = JSON.parse(raw || "[]");
  }
  list.push(payload);
  fs.writeFileSync(purchasesPath, JSON.stringify(list, null, 2));
  res.json({ ok: true, saved: payload });
});

app.listen(3001, () => {
  console.log("Servidor backend en http://localhost:3001");
});
