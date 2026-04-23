const express = require("express");
const router = express.Router();
const { listPlaceSuggestions } = require("../controllers/places.controller");

router.get("/places/suggestions", listPlaceSuggestions);

module.exports = router;