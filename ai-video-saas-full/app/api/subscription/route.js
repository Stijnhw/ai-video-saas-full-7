import Stripe from "stripe";

export async function GET() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // normale user ID via JWT/supabase
    const userId = "demo-user"; // <-- jij vult later echte auth hier in

    // Stripe Customer ophalen
    const customers = await stripe.customers.list({
      limit: 1,
    });

    if (!customers.data.length) {
      return Response.json({
        planName: "Free",
        status: "inactive",
      });
    }

    const customer = customers.data[0];

    // subscription ophalen
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    if (!subs.data.length) {
      return Response.json({
        planName: "Free",
        status: "inactive",
      });
    }

    const sub = subs.data[0];
    const priceId = sub.items.data[0].price.id;

    const priceMap = {
      [process.env.STARTER_PRICE_ID]: "Starter",
      [process.env.PRO_PRICE_ID]: "Pro",
      [process.env.UNLIMITED_PRICE_ID]: "Unlimited",
    };

    return Response.json({
      planName: priceMap[priceId] || "Onbekend",
      status: sub.status,
    });

  } catch (error) {
    console.error("SUB ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
