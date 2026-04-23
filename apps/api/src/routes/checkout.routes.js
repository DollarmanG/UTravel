const express = require("express");
const router = express.Router();

const {
  createCheckoutSession,
} = require("../controllers/checkout.controller");

// Skapa Stripe Checkout Session
router.post("/", createCheckoutSession);

module.exports = router;