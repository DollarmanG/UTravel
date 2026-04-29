const express = require("express");
const router = express.Router();

const {
  getBookingBySessionId,
  downloadBookingPdf,
  findBooking,
  sendBookingEmail,
} = require("../controllers/booking.controller");

router.post("/find", findBooking);
router.post("/:reference/send-email", sendBookingEmail);
router.get("/:reference/pdf", downloadBookingPdf);
router.get("/:sessionId", getBookingBySessionId);

module.exports = router;