const express = require("express");
const router = express.Router();

const {
  getBookingBySessionId,
  downloadBookingPdf,
} = require("../controllers/booking.controller");

router.get("/:sessionId", getBookingBySessionId);
router.get("/:reference/pdf", downloadBookingPdf);

module.exports = router;