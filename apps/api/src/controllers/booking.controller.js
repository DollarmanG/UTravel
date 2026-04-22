const { pendingBookings, confirmedBookings } = require("../db/store");

function getBookingBySessionId(req, res) {
  const { sessionId } = req.params;

  if (confirmedBookings.has(sessionId)) {
    return res.json(confirmedBookings.get(sessionId));
  }

  if (pendingBookings.has(sessionId)) {
    return res.json(pendingBookings.get(sessionId));
  }

  return res.status(404).json({
    error: "Booking not found",
  });
}

module.exports = {
  getBookingBySessionId,
};