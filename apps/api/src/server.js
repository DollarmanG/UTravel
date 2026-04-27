require("dotenv").config();

const app = require("./app");

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