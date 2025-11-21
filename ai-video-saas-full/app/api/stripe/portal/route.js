import Stripe from "stripe";

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const customers = await stripe.customers.list({ limit: 1 });
    const customer = customers.data[0];

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
    });

    return Response.json({ url: portal.url });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
