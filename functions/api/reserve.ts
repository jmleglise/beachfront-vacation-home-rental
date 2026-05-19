export const onRequestPost: PagesFunction<{
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
}> = async (context) => {
  try {
    const data = await context.request.json() as any;

    // 1. Validation du jeton Cloudflare Turnstile
    const formData = new FormData();
    formData.append("secret", context.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA");
    formData.append("response", data.turnstileToken);

    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      body: formData,
      method: "POST",
    });

    const outcome = await result.json() as any;
    if (!outcome.success) {
      return new Response(JSON.stringify({ error: "Invalid captcha response" }), { status: 400 });
    }

    // --- LOGIQUE BACKEND : DÉCOMPOSITION ET CORRECTION DES DATES ---
    const HIGH_SEASON_MONTHS = [4, 5, 6, 7, 8];
    const HIGH_SHORT_RATE = 260;
    const HIGH_LONG_RATE = 225;
    const LOW_SHORT_RATE = 160;
    const LOW_LONG_RATE = 142;

    let highNightsCount = 0;
    let lowNightsCount = 0;
    const nightsCount = data.nights || 0;
    const isLongStay = nightsCount >= 7;

    if (data.fromDate && data.toDate && nightsCount > 0) {
      const start = new Date(data.fromDate);
      for (let i = 0; i < nightsCount; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        if (HIGH_SEASON_MONTHS.includes(d.getMonth())) {
          highNightsCount++;
        } else {
          lowNightsCount++;
        }
      }
    }

    const currentHRate = isLongStay ? HIGH_LONG_RATE : HIGH_SHORT_RATE;
    const currentLRate = isLongStay ? LOW_LONG_RATE : LOW_SHORT_RATE;

    let nightsBreakdownText = "";
    if (highNightsCount > 0 && lowNightsCount > 0) {
      nightsBreakdownText = `${highNightsCount} x ${currentHRate}€ (Haute Saison) + ${lowNightsCount} x ${currentLRate}€ (Basse Saison)`;
    } else if (highNightsCount > 0) {
      nightsBreakdownText = `${nightsCount} x ${currentHRate}€ (Haute Saison)`;
    } else {
      nightsBreakdownText = `${nightsCount} x ${currentLRate}€ (Basse Saison)`;
    }

    // Formatage des dates forcé sur le fuseau de Paris pour éliminer le bug du décalage d'1 jour
    const dateFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Paris' } as const;
    const arrivalFormatted = data.fromDate ? new Date(data.fromDate).toLocaleDateString('fr-FR', dateFormatOptions) : '-';
    const departureFormatted = data.toDate ? new Date(data.toDate).toLocaleDateString('fr-FR', dateFormatOptions) : '-';

    // 2. Construction du mail HTML
    // Remplace la partie emailHtml dans reserve.ts par ceci :
const emailHtml = `
<div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px;">Nouvelle Réservation</h2>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <thead>
      <tr style="background: #f9f9f9; text-align: left;">
        <th style="padding: 10px; border-bottom: 2px solid #eee;">Désignation</th>
        <th style="padding: 10px; border-bottom: 2px solid #eee; text-align: right;">Détail</th>
        <th style="padding: 10px; border-bottom: 2px solid #eee; text-align: right;">Prix</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">Nuitées (${data.nights} nuits)</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #666; font-size: 0.9em;">${nightsBreakdownText}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${pricingDetail.totalNightsPrice}€</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">Ménage</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #666;">Inclus</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">120€</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">Lits (${data.doubleBeds}xDB + ${data.singleBeds}xSB)</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #666; font-size: 0.8em;">(Tapis Sdb/Torchons inclus)</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${data.linens ? (data.doubleBeds * 20 + data.singleBeds * 10) : 0}€</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">Serviettes</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #666;">${data.towels ? data.guests + " x 10€" : "-"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${data.towels ? data.guests * 10 : 0}€</td>
      </tr>
      <tr style="font-weight: bold; font-size: 1.1em;">
        <td colspan="2" style="padding: 10px;">TOTAL</td>
        <td style="padding: 10px; text-align: right;">${data.totalPrice}€</td>
      </tr>
    </tbody>
  </table>

  <p style="font-size: 0.8em; color: #888; border-top: 1px solid #eee; pt: 10px;">
    Le prix inclut toutes les taxes, les charges pour un usage normal, et l'usage du matériel (Barbecue Gaz, Velo...).<br>
    Haute Saison: Mai à Septembre. Basse saison: Octobre à Avril.
  </p>
</div>
`;

    // 3. Envoi via Resend
    const sendEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: "jmleglise@gmail.com",
        subject: `✨ Nouvelle Réservation - ${data.firstName} ${data.lastName}`,
        html: emailHtml,
      }),
    });

    if (!sendEmailResponse.ok) {
      throw new Error("Failed to dispatch email via Resend");
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};