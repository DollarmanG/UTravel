const express = require("express");
const router = express.Router();

const { getBookingBySessionId } = require("../controllers/booking.controller");

router.get("/:sessionId", getBookingBySessionId);

module.exports = router;