app.post("/create-checkout", async (req, res) => {
  const { email, user_id } = req.body;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],

    customer_email: email,

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "SancheAI Pro"
          },
          unit_amount: 2900,
          recurring: {
            interval: "month"
          }
        },
        quantity: 1
      }
    ],

    success_url: `${process.env.APP_URL}/success.html`,
    cancel_url: `${process.env.APP_URL}/cancel.html`,

    metadata: {
      user_id
    }
  });

  res.json({ url: session.url });
});