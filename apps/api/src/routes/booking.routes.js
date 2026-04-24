const express = require("express");
const router = express.Router();

const {
  getBookingBySessionId,
  downloadBookingPdf,
  findBooking,
} = require("../controllers/booking.controller");

router.post("/find", findBooking);

router.get("/:sessionId", getBookingBySessionId);
router.get("/:reference/pdf", downloadBookingPdf);

module.exports = router;