export async function fireWebhooks(event, data) {
  const urls = (process.env.WEBHOOK_URLS || "").split(",").filter(Boolean);
  if (!urls.length) return;

  const payload = JSON.stringify({ event, ...data, timestamp: new Date().toISOString() });

  await Promise.allSettled(
    urls.map((url) =>
      fetch(url.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).catch(() => {})
    )
  );
}
