const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const { listPlaceSuggestions } = require("./controllers/places.controller");

const app = express();

app.use((req, _res, next) => {
  console.log("INCOMING REQUEST:", req.method, req.originalUrl);
  next();
});

app.use(cors());

app.use("/webhook", express.raw({ type: "application/json" }), routes.webhook);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "utravel-api",
    version: "app-js-debug-1",
  });
});

app.get("/api/test", (_req, res) => {
  res.json({
    ok: true,
    message: "API test fungerar",
    version: "app-js-debug-1",
  });
});

app.get("/api/places/suggestions", listPlaceSuggestions);

app.use("/api", routes.router);

app.use((req, res) => {
  console.log("404 FROM EXPRESS:", req.method, req.originalUrl);

  res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
    version: "app-js-debug-1",
  });
});

module.exports = app;