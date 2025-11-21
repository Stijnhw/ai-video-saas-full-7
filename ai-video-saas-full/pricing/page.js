export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "€19,99 / maand",
      description:
        "Begin met AI no-face video’s: scripts, voice-overs, thumbnails en captions in 720p. Perfect om te starten.",
      features: [
        "30 video's per maand",
        "AI Script Generator",
        "Standaard AI stemmen",
        "Thumbnail generator",
        "Captions generator",
        "720p export",
        "Cloud opslag",
      ],
      priceId: process.env.STARTER_PRICE_ID,
    },
    {
      name: "Pro",
      price: "€29,99 / maand",
      description:
        "Voor serieuze creators: premium stemmen, 1080p exports, snelle rendering en groei-tools.",
      features: [
        "120 video's per maand",
        "Premium AI stemmen",
        "Cinematic thumbnails",
        "Snelle rendering",
        "1080p export",
        "Content kalender",
        "Priority support",
      ],
      highlight: true,
      priceId: process.env.PRO_PRICE_ID,
    },
    {
      name: "Unlimited",
      price: "€49,99 / maand",
      description:
        "Onbeperkt AI-video’s genereren. Batch renders, premium modellen en multi-account support. Ideaal voor agencies.",
      features: [
        "Onbeperkt video's",
        "Alle premium functies",
        "Batch rendering",
        "Automation workflows",
        "Multi-account support",
        "Snelle support",
        "Toegang tot nieuwe features",
      ],
      priceId: process.env.UNLIMITED_PRICE_ID,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Kies je abonnement</h1>
        <p className="text-gray-600 mb-12">
          Start vandaag met het automatisch genereren van AI no-face TikTok’s & YouTube Shorts.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl shadow-md bg-white border ${
                plan.highlight
                  ? "border-blue-500 shadow-blue-200"
                  : "border-gray-200"
              }`}
            >
              {plan.highlight && (
                <div className="text-sm bg-blue-500 text-white py-1 px-3 inline-block rounded-full mb-3">
                  Meest gekozen
                </div>
              )}

              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <p className="text-xl font-bold mt-2">{plan.price}</p>

              <p className="text-gray-600 mt-3">{plan.description}</p>

              <ul className="mt-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-gray-700">
                    ✔ {f}
                  </li>
                ))}
              </ul>

              <form action="/api/stripe/checkout" method="POST">
                <input type="hidden" name="priceId" value={plan.priceId} />

                <button
                  type="submit"
                  className="mt-6 w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition"
                >
                  Start {plan.name}
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
