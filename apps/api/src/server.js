require("dotenv").config();

console.log("🔥 SERVER.JS FROM UTRAVEL API IS RUNNING");

const app = require("./app");

const { listPlaceSuggestions } = require("./controllers/places.controller");

app.get("/api/test", (_, res) => {
  res.json({ ok: true, message: "API test fungerar från server.js" });
});

app.get("/api/places/suggestions", listPlaceSuggestions);

console.log("MODE:", process.env.NODE_ENV);
console.log(
  "DUFFEL TOKEN:",
  process.env.DUFFEL_API_TOKEN ? "✅ finns" : "❌ saknas"
);

if (process.env.NODE_ENV !== "production") {
  console.log("⚠️ RUNNING IN TEST MODE");
} else {
  console.log("🚀 LIVE MODE ACTIVE");
}

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});