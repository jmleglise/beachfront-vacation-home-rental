import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Props = { 
  lang: string; 
  apiKey?: string; 
  calendarId?: string;
  turnstileSiteKey?: string;
};

// --- CONFIGURATION DES TARIFS ---
const CLEANING_FEE = 120;
const DOUBLE_BED_RATE = 25;
const SINGLE_BED_RATE = 15;
const TOWEL_RATE = 8;
const MIN_NIGHTS = 2;
const LEAD_DAYS = 2;
const MAX_TRAVELERS = 6;

const SEASON_PRICING = {
  HIGH_SEASON_MONTHS: [4, 5, 6, 7, 8], // Mai à Septembre (Index JS : 4 à 8)
  HIGH_SHORT_RATE: 260,
  HIGH_LONG_RATE: 225,
  LOW_SHORT_RATE: 160,
  LOW_LONG_RATE: 142,
};

const copy = {
  fr: {
    dates: "Dates du séjour",
    datesPlaceholder: "(2 nuits minimum, arrivée à partir de J+2)",
    chooseDates: "Choisir vos dates",
    clear: "Effacer",
    travelers: "Voyageurs",
    travelersHint: "Adulte et Enfant occupant un lit.",
    people: "personnes",
    bedding: "Configuration des lits",
    doubleBeds: "Lits doubles",
    singleBeds: "Lits simples",
    options: "Options",
    linens: "Linge de maison et lits faits",
    towels: "Serviettes de toilette",
    personalInfo: "Informations personnelles",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Adresse email",
    phone: "Téléphone",
    messageTitle: "Message",
    messagePlaceholder: "Un commentaire, une question ou une demande particulière ?",
    price: "Résumé du prix",
    nightsLine: "Nuitées",
    cleaningLine: "Ménage",
    cleaningIncluded: "Inclus",
    towelsLine: "Serviettes",
    total: "Total",
    reserve: "Réserver",
    reserveDisabled: "Sélectionnez une plage valide, remplissez vos informations et validez le captcha.",
    loading: "Chargement des disponibilités…",
    apiError: "Impossible de récupérer les disponibilités en temps réel.",
    blockedRangeError: "La date de départ doit être avant la prochaine date déjà réservée.",
    weekDiscount: "séjour d'une semaine et plus",
    disclaimer: "Le prix inclut toutes les taxes, les charges pour un usage normal, et l'usage du matériel mis à disposition (Barbecue Gaz, Velo...). La haute Saison court de Mai à Septembre. La basse saison de Octobre à Avril. Tarif préférentiel pour 7 nuits et plus.",
    successMessage: "Nous vous remercions pour votre réservation. Je bloque les dates et vous recevrez les instructions de paiement sous 12h.",
    errorMessage: "Une erreur technique est survenue. La réservation n'a pas été enregistrée. Essayez de contacter le propriétaire par email à jmleglise@gmail.com."
  },
  en: {
    dates: "Stay dates",
    datesPlaceholder: "(2-night minimum, arrival from D+2)",
    chooseDates: "Choose your dates",
    clear: "Clear",
    travelers: "Travelers",
    travelersHint: "Adults and children occupying a bed.",
    people: "guests",
    bedding: "Bed configuration",
    doubleBeds: "Double beds",
    singleBeds: "Single beds",
    options: "Options",
    linens: "Bed linen and prepared beds",
    towels: "Bath towels",
    personalInfo: "Personal information",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone number",
    messageTitle: "Message",
    messagePlaceholder: "Any comments, questions or special requests?",
    price: "Price summary",
    nightsLine: "Nights",
    cleaningLine: "Cleaning",
    cleaningIncluded: "Included",
    towelsLine: "Towels",
    total: "Total",
    reserve: "Book",
    reserveDisabled: "Select a valid range, fill your details and complete the captcha.",
    loading: "Loading availability…",
    apiError: "Could not load real-time availability.",
    blockedRangeError: "Checkout must be before the next already-booked date.",
    weekDiscount: "stay of a week or more",
    disclaimer: "The price includes all taxes, utilities for normal use, and use of equipment provided (Gas BBQ, Bikes...).High season runs from May to September. Low season from October to April.Preferential rate for 7 nights or more.",
    successMessage: "Thank you for your booking. I am blocking the dates and you will receive payment instructions within 12 hours.",
    errorMessage: "A technical error occurred. The booking could not be saved. Please try contacting the owner by email at jmleglise@gmail.com."
  },
} as const;

const txtFor = (lang: string) => (lang === "fr" ? copy.fr : copy.en);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const toDayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatDate = (d: Date, lang: string) => {
  // On extrait l'année, le mois et le jour manuellement pour éviter tout décalage
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  
  // On crée une date "fixe" à midi pour éviter le décalage UTC
  const fixedDate = new Date(year, month, day, 12, 0, 0);
  
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fixedDate);
};

export default function BookingConfigurator({ lang, apiKey, calendarId, turnstileSiteKey }: Props) {
  const t = txtFor(lang);
  
  const [date, setDate] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [doubleBeds, setDoubleBeds] = useState(1);
  const [singleBeds, setSingleBeds] = useState(1);
  const [linens, setLinens] = useState(false);
  const [towels, setTowels] = useState(false);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    const container = document.getElementById("turnstile-container");
    if (!container || !turnstileSiteKey) return;

    const loadTurnstile = () => {
      if (window.turnstile) {
        window.turnstile.render("#turnstile-container", {
          sitekey: turnstileSiteKey,
          callback: (token: string) => setTurnstileToken(token),
        });
      }
    };

    if (!window.turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = loadTurnstile;
      document.body.appendChild(script);
    } else {
      loadTurnstile();
    }
  }, [turnstileSiteKey]);

  useEffect(() => {
    const load = async () => {
      if (!apiKey || !calendarId) { setCalendarError("missing"); return; }
      setLoading(true);
      try {
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(new Date().toISOString())}&key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) throw new Error();
        
        const blocked: string[] = [];
        for (const evt of data.items ?? []) {
          const start = evt?.start?.date || evt?.start?.dateTime;
          const end = evt?.end?.date || evt?.end?.dateTime;
          if (!start || !end) continue;
          for (let d = startOfDay(new Date(start)); d < startOfDay(new Date(end)); d = addDays(d, 1)) {
            blocked.push(toDayKey(d));
          }
        }
        setBookedDates(blocked);
      } catch {
        setCalendarError("api");
      } {
        setLoading(false);
      }
    };
    load();
  }, [apiKey, calendarId]);

  const minArrival = useMemo(() => startOfDay(addDays(new Date(), LEAD_DAYS)), []);
  const fromDate = date?.from ? startOfDay(date.from) : undefined;
  const toDate = date?.to ? startOfDay(date.to) : undefined;
  const nights = fromDate && toDate ? Math.max(0, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000)) : 0;

  // --- CALCUL DÉTAILLÉ DE LA SAISONNALITÉ ---
  const pricingDetail = useMemo(() => {
    let highNights = 0;
    let lowNights = 0;

    if (fromDate && toDate && nights > 0) {
      for (let i = 0; i < nights; i++) {
        const currentNight = addDays(fromDate, i);
        const isHigh = SEASON_PRICING.HIGH_SEASON_MONTHS.includes(currentNight.getMonth());
        if (isHigh) highNights++; else lowNights++;
      }
    }

    const isLong = nights >= 7;
    const hRate = isLong ? SEASON_PRICING.HIGH_LONG_RATE : SEASON_PRICING.HIGH_SHORT_RATE;
    const lRate = isLong ? SEASON_PRICING.LOW_LONG_RATE : SEASON_PRICING.LOW_SHORT_RATE;
    const hBase = SEASON_PRICING.HIGH_SHORT_RATE;
    const lBase = SEASON_PRICING.LOW_SHORT_RATE;

    const totalNightsPrice = (highNights * hRate) + (lowNights * lRate);

    return { highNights, lowNights, hRate, lRate, hBase, lBase, totalNightsPrice };
  }, [fromDate, toDate, nights]);

  const beddingPrice = linens ? (doubleBeds * DOUBLE_BED_RATE + singleBeds * SINGLE_BED_RATE) : 0;
  const towelsPrice = towels ? guests * TOWEL_RATE : 0;
  const total = pricingDetail.totalNightsPrice + CLEANING_FEE + beddingPrice + towelsPrice;

  const nextBlockedDate = useMemo(() => {
    if (!fromDate) return undefined;
    return bookedDates
      .map((d) => startOfDay(new Date(d)))
      .filter((d) => d > fromDate)
      .sort((a, b) => a.getTime() - b.getTime())[0];
  }, [fromDate, bookedDates]);

  const disabledDates = useMemo(() => {
    return [{ before: minArrival }, ...bookedDates.map((d) => startOfDay(new Date(d)))];
  }, [bookedDates, minArrival]);

  const rangeHasBlockedNights = useMemo(() => {
    if (!fromDate || !toDate) return false;
    const blocked = new Set(bookedDates);
    for (let d = new Date(fromDate); d < toDate; d = addDays(d, 1)) {
      if (blocked.has(toDayKey(d))) return true;
    }
    return false;
  }, [fromDate, toDate, bookedDates]);

  const exceedsNextBlockedDate = Boolean(fromDate && toDate && nextBlockedDate && toDate > nextBlockedDate);
  const hasValidRange = Boolean(
    fromDate && toDate && nights >= MIN_NIGHTS && fromDate >= minArrival && !rangeHasBlockedNights && !exceedsNextBlockedDate
  );
  
  const isFormValid = Boolean(firstName && lastName && email && phone && turnstileToken);
  const canReserve = hasValidRange && !calendarError && isFormValid && submitStatus !== "submitting";

  const handleBookingSubmit = async () => {
    if (!canReserve) return;
    setSubmitStatus("submitting");

    try {
      const response = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName, lastName, email, phone, message,
          fromDate: fromDate?.toISOString(),
          toDate: toDate?.toISOString(),
          nights, guests, doubleBeds, singleBeds, linens, towels,
          totalPrice: total,
          turnstileToken
        }),
      });

      if (response.ok) { setSubmitStatus("success"); } else { setSubmitStatus("error"); }
    } catch {
      setSubmitStatus("error");
    }
  };

  const controlStyles = "h-10 w-full max-w-xs sm:w-48 inline-flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors";
  const inputStyles = "h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors placeholder:text-gray-400";

  return (
    <section className="mt-10 mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">


      <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50/50 p-5">
      {/* BLOC DATES */}
      
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 m-0">{t.dates}</h3>
            <p className="m-0 text-sm text-gray-500">
              {fromDate && toDate ? `Du ${formatDate(fromDate, lang)} au ${formatDate(toDate, lang)} (${nights} nuits)` : t.datesPlaceholder}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <Popover.Root>
              <Popover.Trigger asChild>
                <button type="button" className={controlStyles}>
                  <span className="flex items-center gap-2 text-gray-700">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    {t.chooseDates}
                  </span>
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className="z-50 w-auto rounded-lg border bg-white p-2 shadow-xl" align="end">
                  <DayPicker mode="range" selected={date} onSelect={setDate} defaultMonth={date?.from} numberOfMonths={2} disabled={disabledDates} min={MIN_NIGHTS} />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            
            {fromDate && <button className="text-xs text-gray-500 underline hover:text-black transition-colors px-1" type="button" onClick={() => setDate(undefined)}>{t.clear}</button>}
          </div>
        </div>
       
        {loading && <p className="mt-2 text-sm text-gray-500">{t.loading}</p>}
        {calendarError && <p className="mt-2 text-sm text-red-600">{t.apiError}</p>}
        {exceedsNextBlockedDate && <p className="mt-2 text-sm text-red-600">{t.blockedRangeError}</p>}
      </div>
        
      {/* BLOC VOYAGEURS */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 m-0">{t.travelers}</h3>
            <span className="block text-sm text-gray-500">{t.travelersHint}</span>
          </div>
          <select className={controlStyles} value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {Array.from({ length: MAX_TRAVELERS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {t.people}</option>)}
          </select>
        </div>
      </div>

      {/* CONFIGURATION LITS */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.bedding}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700">{t.doubleBeds}</span>
            <select className={`${controlStyles} max-w-[120px] sm:w-32`} value={doubleBeds} onChange={(e) => setDoubleBeds(Number(e.target.value))}>
              {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700">{t.singleBeds}</span>
            <select className={`${controlStyles} max-w-[120px] sm:w-32`} value={singleBeds} onChange={(e) => setSingleBeds(Number(e.target.value))}>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* OPTIONS */}
      
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.options}</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" checked={linens} onChange={(e) => setLinens(e.target.checked)} /> 
            <span>{t.linens}</span>
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" checked={towels} onChange={(e) => setTowels(e.target.checked)} /> 
            <span>{t.towels}</span>
          </label>
        </div>
      </div>

      {/* INFORMATIONS PERSONNELLES */}
      <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50/50 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.personalInfo}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.firstName} *</label>
            <input type="text" className={inputStyles} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.lastName} *</label>
            <input type="text" className={inputStyles} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.email} *</label>
            <input type="email" className={inputStyles} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.phone} *</label>
            <input type="tel" className={inputStyles} value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </div>
      </div>

      {/* MESSAGE */}
      <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50/50 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.messageTitle}</h3>
        <textarea 
          className="w-full min-h-[100px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors placeholder:text-gray-400" 
          placeholder={t.messagePlaceholder} value={message} onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* RÉSUMÉ DU PRIX */}
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-5 mb-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.price}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <tbody>
              {/* Nuitées (Avec décomposition unitaire si à cheval) */}
              <tr className="border-b border-gray-100">
                <td className="py-2.5">{t.nightsLine}</td>
                <td className="py-2.5 text-gray-400">
                  {nights > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {pricingDetail.highNights > 0 && pricingDetail.lowNights > 0 ? (
                        <span>{pricingDetail.highNights} x {pricingDetail.hRate}€ + {pricingDetail.lowNights} x {pricingDetail.lRate}€</span>
                      ) : pricingDetail.highNights > 0 ? (
                        <span>{nights} x {pricingDetail.hRate}€</span>
                      ) : (
                        <span>{nights} x {pricingDetail.lRate}€</span>
                      )}
                      
                      {/* Ligne des tarifs de base barrés si >= 7 nuits */}
                      {nights >= 7 && (
                        <span className="text-xs font-normal text-gray-400">
                          [<span className="line-through">
                            {pricingDetail.highNights > 0 && pricingDetail.lowNights > 0 
                              ? `${pricingDetail.highNights}x${pricingDetail.hBase}€ + ${pricingDetail.lowNights}x${pricingDetail.lBase}€`
                              : pricingDetail.highNights > 0 ? `${pricingDetail.hBase}€` : `${pricingDetail.lBase}€`
                            }
                          </span>] ({t.weekDiscount})
                        </span>
                      )}
                    </div>
                  ) : "-"}
                </td>
                <td className="py-2.5 text-right font-medium text-gray-900">{pricingDetail.totalNightsPrice}€</td>
              </tr>
              
              {/* Ménage */}
              <tr className="border-b border-gray-100">
                <td className="py-2.5">{t.cleaningLine}</td>
                <td className="py-2.5 text-gray-400">{t.cleaningIncluded}</td>
                <td className="py-2.5 text-right font-medium text-gray-900">{CLEANING_FEE}€</td>
              </tr>

              {/* Lits */}
              <tr className="border-b border-gray-100">
                <td className="py-2.5">Lits</td>
                <td className="py-2.5 text-gray-400">
                  {linens ? (
                    <div className="flex flex-col">
                      <span>{doubleBeds} x {DOUBLE_BED_RATE}€ + {singleBeds} x {SINGLE_BED_RATE}€</span>
                      <span className="text-xs text-gray-400 mt-0.5">(tapis de sol Sdb et torchons inclus)</span>
                    </div>
                  ) : "-"}
                </td>
                <td className="py-2.5 text-right font-medium text-gray-900">{beddingPrice}€</td>
              </tr>

              {/* Serviettes */}
              <tr className="border-b border-gray-200">
                <td className="py-2.5">{t.towelsLine}</td>
                <td className="py-2.5 text-gray-400">{towels ? `${guests} x ${TOWEL_RATE}€` : "-"}</td>
                <td className="py-2.5 text-right font-medium text-gray-900">{towelsPrice}€</td>
              </tr>

              {/* Total */}
              <tr className="text-base font-semibold text-gray-900">
                <td className="pt-4">{t.total}</td>
                <td className="pt-4"></td>
                <td className="pt-4 text-right text-lg font-bold">{total}€</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bloc mentions légales sous le total avec le bon style */}
        <p className="mt-5 text-xs text-gray-400 border-t border-gray-100 pt-3 whitespace-pre-line leading-relaxed">
          {t.disclaimer}
        </p>
      </div>

      {/* CLOUDFLARE TURNSTILE CAPTCHA */}
      <div className="mb-5 flex justify-center sm:justify-start">
        <div id="turnstile-container"></div>
      </div>

      {/* BOUTON DE RÉSERVATION */}
      <button 
        className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-md bg-black px-8 text-sm font-medium text-white shadow transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-40" 
        type="button" disabled={!canReserve} onClick={handleBookingSubmit} title={!canReserve ? t.reserveDisabled : ""}
      >
        {submitStatus === "submitting" ? "Envoi en cours..." : t.reserve}
      </button>

      {/* BLOCS DE CONFIRMATION ET D'ERREUR (DÉPLACÉS SOUS LE BOUTON) */}
      {submitStatus === "success" && (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 border border-green-200">
          {t.successMessage}
        </div>
      )}

      {submitStatus === "error" && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          {t.errorMessage}
        </div>
      )}
    </section>
  );
}