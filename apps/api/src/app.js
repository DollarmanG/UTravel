const express = require("express");
const cors = require("cors");

const routes = require("./routes");

const app = express();

app.use(cors());

app.use("/webhook", express.raw({ type: "application/json" }), routes.webhook);

app.use(express.json());

app.get("/", (_, res) => {
  res.json({
    ok: true,
    service: "utravel-api",
  });
});

app.use("/", routes.router);

module.exports = app;