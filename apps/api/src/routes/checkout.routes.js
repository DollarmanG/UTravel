const express = require("express");
const router = express.Router();

const {
  createCheckoutSession,
} = require("../controllers/checkout.controller");

router.post("/", createCheckoutSession);

module.exports = router;