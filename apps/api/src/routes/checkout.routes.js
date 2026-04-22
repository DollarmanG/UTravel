const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  res.json({ message: "checkout route ok" });
});

module.exports = router;