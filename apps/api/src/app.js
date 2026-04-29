const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const { listPlaceSuggestions } = require("./controllers/places.controller");

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

app.get("/api/places/suggestions", listPlaceSuggestions);

app.use("/api", routes.router);
app.use("/api/bookings", require("./routes/booking.routes"));

module.exports = app;