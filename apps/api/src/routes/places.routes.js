const express = require("express");
const router = express.Router();

const { listPlaceSuggestions } = require("../controllers/places.controller");

router.get("/suggestions", listPlaceSuggestions);

module.exports = router;