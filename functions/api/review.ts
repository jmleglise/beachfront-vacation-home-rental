type CFContext = {
  request: Request;
  env: { BOT_TOKEN: string; CHAT_ID: string };
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Relais serveur pour le formulaire d'avis de /review/.
 * Le token du bot reste dans les variables d'environnement Cloudflare :
 * il n'est jamais exposé au navigateur (cf. l'ancien PUBLIC_BOT_TOKEN).
 */
export const onRequestPost = async (context: CFContext) => {
  const { BOT_TOKEN, CHAT_ID } = context.env;
  if (!BOT_TOKEN || !CHAT_ID) {
    return json({ error: "Review endpoint not configured" }, 500);
  }

  let data: { rating?: unknown; text?: unknown; month?: unknown; year?: unknown };
  try {
    data = await context.request.json();
  } catch {
    return json({ error: "Invalid payload" }, 400);
  }

  const rating = Number(data.rating);
  const text = typeof data.text === "string" ? data.text.trim() : "";
  const month = typeof data.month === "string" ? data.month.slice(0, 20) : "";
  const year = typeof data.year === "string" ? data.year.slice(0, 4) : "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: "Invalid rating" }, 400);
  }
  if (!text || text.length > 4000) {
    return json({ error: "Invalid review text" }, 400);
  }

  const message = `⭐ ${rating}/5\nDate: ${month} ${year}\n\n${text}`;

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
  });

  if (!res.ok) {
    return json({ error: "Upstream delivery failed" }, 502);
  }
  return json({ ok: true }, 200);
};
