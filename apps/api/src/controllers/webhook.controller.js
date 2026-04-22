const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { pendingBookings, confirmedBookings } = require('../db/store');

async function handleStripeWebhook(req, res) {
  let event;

  try {
    const signature = req.headers['stripe-signature'];

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const booking = pendingBookings.get(session.id);

    console.log('Webhook event:', event.type);
    console.log('Session ID:', session.id);
    console.log('Pending booking exists:', pendingBookings.has(session.id));

    if (!booking) {
      return res.json({ received: true, note: 'No pending booking found' });
    }

    confirmedBookings.set(session.id, {
      ...booking,
      status: 'confirmed',
      stripe_session_id: session.id,
    });

    pendingBookings.delete(session.id);

    console.log('Booking confirmed for session:', session.id);
  }

  return res.json({ received: true });
}

module.exports = {
  handleStripeWebhook,
};