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

    // 2. Construction du mail au format HTML (Plus lisible sur Gmail)
    const emailHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #000; border-bottom: 2px solid #eee; padding-bottom: 10px;">Nouvelle demande de réservation</h2>
        
        <h3 style="color: #555;">👤 Informations Client</h3>
        <p><strong>Nom complet :</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email :</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>Téléphone :</strong> ${data.phone}</p>
        
        <h3 style="color: #555;">📅 Détails Séjour</h3>
        <p><strong>Arrivée :</strong> ${data.fromDate ? new Date(data.fromDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
        <p><strong>Départ :</strong> ${data.toDate ? new Date(data.toDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
        <p><strong>Nombre de nuits :</strong> ${data.nights}</p>
        <p><strong>Nombre de voyageurs :</strong> ${data.guests}</p>
        
        <h3 style="color: #555;">🛏️ Configuration & Options</h3>
        <p><strong>Lits doubles :</strong> ${data.doubleBeds} | <strong>Lits simples :</strong> ${data.singleBeds}</p>
        <p><strong>Option draps / lits faits :</strong> ${data.linens ? "✅ Oui" : "❌ Non"}</p>
        <p><strong>Option serviettes :</strong> ${data.towels ? "✅ Oui" : "❌ Non"}</p>
        
        <h3 style="color: #555;">💬 Message du client</h3>
        <blockquote style="background: #f9f9f9; border-left: 4px solid #ccc; margin: 10px 0; padding: 10px 20px; font-style: italic;">
          ${data.message ? data.message.replace(/\n/g, '<br>') : "Aucun message fourni."}
        </blockquote>
        
        <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 6px; text-align: right;">
          <span style="font-size: 16px; font-weight: bold; color: #000;">TOTAL À RÉGLER : ${data.totalPrice} €</span>
        </div>
      </div>
    `;

    // 3. Envoi du mail via l'API de Resend
    const sendEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev", // Domaine de test gratuit (Zéro configuration DNS requise)
        to: "jmleglise@gmail.com",     // Ton adresse de réception
        subject: `✨ Nouvelle Réservation - ${data.firstName} ${data.lastName}`,
        html: emailHtml,
      }),
    });

    if (!sendEmailResponse.ok) {
      const errText = await sendEmailResponse.text();
      console.error("Resend API Error:", errText);
      throw new Error("Failed to dispatch email via Resend");
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};