const express = require("express");

const searchRoutes = require("./search.routes");
const checkoutRoutes = require("./checkout.routes");
const bookingRoutes = require("./booking.routes");
const webhookRoutes = require("./webhook.routes");

const router = express.Router();

router.use("/search", searchRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/booking", bookingRoutes);

module.exports = {
  router,
  webhook: webhookRoutes,
};

console.log("searchRoutes:", typeof searchRoutes, searchRoutes);
console.log("checkoutRoutes:", typeof checkoutRoutes, checkoutRoutes);
console.log("bookingRoutes:", typeof bookingRoutes, bookingRoutes);
console.log("webhookRoutes:", typeof webhookRoutes, webhookRoutes);