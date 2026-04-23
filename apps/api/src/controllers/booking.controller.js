const { pendingBookings, confirmedBookings } = require("../db/store");

function getBookingBySessionId(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId krävs.",
      });
    }

    if (confirmedBookings.has(sessionId)) {
      const booking = confirmedBookings.get(sessionId);

      return res.json({
        status: "confirmed",
        booking,
      });
    }

    if (pendingBookings.has(sessionId)) {
      const booking = pendingBookings.get(sessionId);

      return res.json({
        status: "pending",
        booking,
      });
    }

    return res.status(404).json({
      error: "Bokning hittades inte.",
    });
  } catch (error) {
    console.error("getBookingBySessionId error:", error);

    return res.status(500).json({
      error: "Något gick fel vid hämtning av bokning.",
    });
  }
}

module.exports = {
  getBookingBySessionId,
};