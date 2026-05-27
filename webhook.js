if (event.type === "checkout.session.completed") {
  const session = event.data.object;

  const userId = session.metadata?.user_id;
  const customerId = session.customer;

  if (!userId) return;

  await supabase.from("users").upsert({
    id: userId,
    plan: "pro",
    stripe_customer_id: customerId,
    updated_at: new Date().toISOString(),
  });
}