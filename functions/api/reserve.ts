import { CLEANING_FEE, DOUBLE_BED_RATE, SEASON_PRICING, SINGLE_BED_RATE, TOWEL_RATE } from "../../src/config/bookingConstants";

export const onRequestPost: PagesFunction<{ TURNSTILE_SECRET_KEY: string; RESEND_API_KEY: string }> = async (context) => {
  try {
    const data = (await context.request.json()) as any;

    const formData = new FormData();
    formData.append("secret", context.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA");
    formData.append("response", data.turnstileToken);

    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { body: formData, method: "POST" });
    const outcome = (await result.json()) as any;
    if (!outcome.success) return new Response(JSON.stringify({ error: "Invalid captcha response" }), { status: 400 });

    let highNightsCount = 0;
    let lowNightsCount = 0;
    const nightsCount = data.nights || 0;
    const isLongStay = nightsCount >= 7;

    if (data.fromDate && data.toDate && nightsCount > 0) {
      const start = new Date(data.fromDate);
      for (let i = 0; i < nightsCount; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        if (SEASON_PRICING.HIGH_SEASON_MONTHS.includes(d.getMonth())) highNightsCount++;
        else lowNightsCount++;
      }
    }

    const currentHRate = isLongStay ? SEASON_PRICING.HIGH_LONG_RATE : SEASON_PRICING.HIGH_SHORT_RATE;
    const currentLRate = isLongStay ? SEASON_PRICING.LOW_LONG_RATE : SEASON_PRICING.LOW_SHORT_RATE;
    const totalNightsPrice = highNightsCount * currentHRate + lowNightsCount * currentLRate;

    const nightsBreakdownText =
      highNightsCount > 0 && lowNightsCount > 0
        ? `${highNightsCount} x ${currentHRate}€ (Haute Saison) + ${lowNightsCount} x ${currentLRate}€ (Basse Saison)`
        : highNightsCount > 0
          ? `${nightsCount} x ${currentHRate}€ (Haute Saison)`
          : `${nightsCount} x ${currentLRate}€ (Basse Saison)`;

    const beddingPrice = data.linens ? data.doubleBeds * DOUBLE_BED_RATE + data.singleBeds * SINGLE_BED_RATE : 0;
    const towelsPrice = data.towels ? data.guests * TOWEL_RATE : 0;

    const emailHtml = `
<div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px;">Nouvelle Réservation</h2>
  <p><strong>Nom:</strong> ${data.firstName} ${data.lastName}<br><strong>Email:</strong> ${data.email}<br><strong>Téléphone:</strong> ${data.phone}<br><strong>Adresse Postale:</strong><br>${(data.postalAddress || "-").replace(/\n/g, "<br>")}</p>
  <p><strong>Configuration des chambres:</strong><br>Suite: ${data.suiteBed}<br>Chambre 2: ${data.room2Bed}<br>Chambre 3: ${data.room3Bed}<br>Total: ${data.doubleBeds} lit(s) double(s), ${data.singleBeds} lit(s) simple(s)</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;"><tbody>
      <tr><td style="padding: 10px; border-bottom: 1px solid #eee;">Nuitées (${data.nights} nuits)</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #666;">${nightsBreakdownText}</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${totalNightsPrice}€</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #eee;">Ménage</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #666;">Inclus</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${CLEANING_FEE}€</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #eee;">Lits</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #666;">${data.doubleBeds}xDB + ${data.singleBeds}xSB</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${beddingPrice}€</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #eee;">Serviettes</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #666;">${data.towels ? data.guests + " x " + TOWEL_RATE + "€" : "-"}</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${towelsPrice}€</td></tr>
      <tr style="font-weight: bold;"><td colspan="2" style="padding: 10px;">TOTAL</td><td style="padding: 10px; text-align: right;">${data.totalPrice}€</td></tr>
  </tbody></table>
  <p><strong>Message:</strong><br>${(data.message || "-").replace(/\n/g, "<br>")}</p>
</div>`;

    const sendEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${context.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "onboarding@resend.dev", to: "jmleglise@gmail.com", subject: `✨ Nouvelle Réservation - ${data.firstName} ${data.lastName}`, html: emailHtml }),
    });

    if (!sendEmailResponse.ok) throw new Error("Failed to dispatch email via Resend");
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};