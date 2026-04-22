const express = require("express");
const router = express.Router();

router.get("/:id", (req, res) => {
  res.json({ message: "booking route ok", id: req.params.id });
});

module.exports = router;