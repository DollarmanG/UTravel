const express = require("express");

const searchRoutes = require("./search.routes");
const checkoutRoutes = require("./checkout.routes");
const bookingRoutes = require("./booking.routes");
const webhookRoutes = require("./webhook.routes");
const placesRoutes = require("./places.routes"); // ✅ NY

const router = express.Router();

router.use("/search", searchRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/bookings", bookingRoutes);
router.use("/places", placesRoutes);

module.exports = {
  router,
  webhook: webhookRoutes,
};