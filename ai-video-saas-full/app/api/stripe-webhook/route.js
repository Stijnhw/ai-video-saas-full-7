import Stripe from "stripe";
import { buffer } from "micro";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// PRICE_ID → PLAN NAAM MAPPING
const priceMap = {
  [process.env.STARTER_PRICE_ID]: "starter",
  [process.env.PRO_PRICE_ID]: "pro",
  [process.env.UNLIMITED_PRICE_ID]: "unlimited",
};

export async function POST(req) {
  try {
    const rawBody = await buffer(req);
    const signature = req.headers.get("stripe-signature");

    const event = stripe.webhooks.constructEvent(
      rawBody.toString(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("➡️ Stripe event:", event.type);

    // ==========================================
    // ✔ CHECKOUT COMPLETED
    // ==========================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("Checkout completed:", session.id);
    }

    // ==========================================
    // ✔ SUBSCRIPTION CREATED OR UPDATED
    // ==========================================
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object;

      const priceId = sub.items.data[0].price.id;
      const planName = priceMap[priceId] || "unknown";

      console.log("Subscription update:", {
        customer: sub.customer,
        status: sub.status,
        plan: planName,
      });

      // 👉 HIER UPDATE JE SUPABASE GEBRUIKER
      // (dit vullen we in stap E in)
    }

    // ==========================================
    // ✔ SUBSCRIPTION CANCELLED
    // ==========================================
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;

      console.log("Subscription cancelled:", sub.customer);

      // 👉 user terugzetten naar FREE tier
    }

    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
