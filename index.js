const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "src", "config.json"), "utf-8"));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const fiturPath = path.join(__dirname, "fitur");

function loadFitur() {
  if (!fs.existsSync(fiturPath)) return;
  const categories = fs.readdirSync(fiturPath);
  for (const cat of categories) {
    const catPath = path.join(fiturPath, cat);
    if (!fs.statSync(catPath).isDirectory()) continue;
    const files = fs.readdirSync(catPath).filter(f => f.endsWith(".js"));
    for (const file of files) {
      const name = file.replace(".js", "");
      const handler = require(path.join(catPath, file));
      app.get(`/api/${cat}/${name}`, handler);
    }
  }
}

loadFitur();

app.get("/config", (req, res) => {
  res.json({ status: true, ...config });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

module.exports = app;
