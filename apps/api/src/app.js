const express = require("express");
const cors = require("cors");

const routes = require("./routes");

const app = express();

app.use(cors());

// Stripe webhook behöver raw body, så den mountas innan express.json()
// därför ligger /webhook inne i routes/index.js före resten av JSON-middleware
app.use("/webhook", routes.webhook);

app.use(express.json());

app.get("/", (_, res) => {
  res.json({
    ok: true,
    service: "utravel-api",
  });
});

app.use("/", routes.router);

module.exports = app;