"use client";

import { useEffect, useState } from "react";

export default function UpgradePage() {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    async function fetchSub() {
      const res = await fetch("/api/subscription");
      const data = await res.json();
      setSubscription(data);
    }
    fetchSub();
  }, []);

  const plans = [
    {
      name: "Starter",
      price: "€12.99 / maand",
      tier: "starter",
      highlight: false,
      features: ["30 video's", "720p export", "AI scripts", "Standaard stemmen"],
    },
    {
      name: "Pro",
      price: "€19.99 / maand",
      tier: "pro",
      highlight: true,
      features: [
        "120 video's",
        "1080p export",
        "Premium stemmen",
        "Snelle rendering",
      ],
    },
    {
      name: "Unlimited",
      price: "€29.99 / maand",
      tier: "unlimited",
      highlight: false,
      features: [
        "Onbeperkte video's",
        "Batch rendering",
        "Multi-account",
        "Premium modellen",
      ],
    },
  ];

  const onUpgrade = async (priceId) => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ priceId }),
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Upgrade je abonnement</h1>

        {subscription && (
          <p className="text-gray-600 mb-10">
            Huidig abonnement:{" "}
            <strong className="text-black">{subscription?.planName}</strong>
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-6 bg-white rounded-xl shadow-md border ${
                plan.highlight ? "border-blue-500 shadow-blue-200" : "border-gray-300"
              }`}
            >
              {plan.highlight && (
                <div className="text-sm mb-2 bg-blue-500 text-white inline-block px-3 py-1 rounded-full">
                  Meest gekozen
                </div>
              )}

              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <p className="text-xl text-gray-700 mt-2">{plan.price}</p>

              <ul className="text-left mt-5 space-y-2">
                {plan.features.map((f) => (
                  <li key={f}>✔ {f}</li>
                ))}
              </ul>

              <button
                className="mt-6 w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition"
                onClick={() => onUpgrade(plan.tier)}
              >
                Upgrade naar {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
