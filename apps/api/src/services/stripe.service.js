const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function toMinorUnits(amount) {
  return Math.round(roundMoney(amount) * 100);
}

function createLineItem({ name, amountSek, quantity = 1 }) {
  const unitAmount = toMinorUnits(amountSek);

  if (!name) {
    throw new Error("Stripe line item name krävs.");
  }

  if (unitAmount < 0) {
    throw new Error("Stripe line item amount får inte vara negativt.");
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Stripe line item quantity måste vara ett positivt heltal.");
  }

  return {
    price_data: {
      currency: "sek",
      product_data: {
        name,
      },
      unit_amount: unitAmount,
    },
    quantity,
  };
}

function buildCheckoutLineItems({
  flightTotalSek = 0,
  agencyFeeSek = 0,
  insuranceSek = 0,
  cancellationProtectionSek = 0,
}) {
  const lineItems = [];

  if (toNumber(flightTotalSek) > 0) {
    lineItems.push(
      createLineItem({
        name: "Flygbiljett - Utravel",
        amountSek: flightTotalSek,
      })
    );
  }

  if (toNumber(agencyFeeSek) > 0) {
    lineItems.push(
      createLineItem({
        name: "Serviceavgift - Utravel",
        amountSek: agencyFeeSek,
      })
    );
  }

  if (toNumber(insuranceSek) > 0) {
    lineItems.push(
      createLineItem({
        name: "Reseförsäkring - Utravel",
        amountSek: insuranceSek,
      })
    );
  }

  if (toNumber(cancellationProtectionSek) > 0) {
    lineItems.push(
      createLineItem({
        name: "Avbeställningsskydd - Utravel",
        amountSek: cancellationProtectionSek,
      })
    );
  }

  return lineItems;
}

function calculateLineItemsTotalMinor(lineItems = []) {
  return lineItems.reduce((sum, item) => {
    const unitAmount = item?.price_data?.unit_amount || 0;
    const quantity = item?.quantity || 1;
    return sum + unitAmount * quantity;
  }, 0);
}

async function createStripeCheckoutSession({
  customerEmail,
  lineItems,
  successUrl,
  cancelUrl,
  metadata = {},
}) {
  if (!customerEmail) {
    throw new Error("customerEmail krävs för Stripe checkout.");
  }

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new Error("Minst en Stripe line item krävs.");
  }

  if (!successUrl || !cancelUrl) {
    throw new Error("successUrl och cancelUrl krävs för Stripe checkout.");
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    currency: "sek",
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
}

function constructWebhookEvent(rawBody, signature, webhookSecret) {
  if (!rawBody) {
    throw new Error("Raw request body krävs för Stripe webhook.");
  }

  if (!signature) {
    throw new Error("Stripe-signatur saknas.");
  }

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET saknas.");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

module.exports = {
  toMinorUnits,
  createLineItem,
  buildCheckoutLineItems,
  calculateLineItemsTotalMinor,
  createStripeCheckoutSession,
  constructWebhookEvent,
};