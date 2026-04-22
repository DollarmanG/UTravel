/* require("dotenv").config();
const express = require("express");
const cors = require("cors");

const searchRoute = require("./routes/search");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.json({ ok: true });
});

app.use("/search", searchRoute);

app.listen(process.env.PORT || 4000, () => {
  console.log(`API running on port ${process.env.PORT || 4000}`);
}); */

require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});