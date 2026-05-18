import { useEffect, useMemo, useState } from "react";

type Props = { lang: string; apiKey?: string; calendarId?: string };

const NIGHTLY_RATE = 250;
const CLEANING_FEE = 120;
const DOUBLE_BED_RATE = 20;
const SINGLE_BED_RATE = 10;
const TOWEL_RATE = 10;
const MIN_NIGHTS = 2;
const LEAD_DAYS = 2;
const MAX_TRAVELERS = 8;

const copy = {
  fr: {
    title: "Configurer votre séjour", dates: "Dates du séjour", datesPlaceholder: "Sélectionnez vos dates", edit: "Modifier", clear: "Effacer", travelers: "Voyageurs", people: "personnes", bedding: "Configuration des lits", doubleBeds: "Lits doubles", singleBeds: "Lits simples", options: "Options", linens: "Linge de maison et lits faits", towels: "Serviettes de toilette", price: "Résumé du prix", nightsLine: "Nuitées", cleaningLine: "Ménage", cleaningIncluded: "Inclus", towelsLine: "Serviettes", total: "Total", reserve: "Réserver", reserveDisabled: "Sélectionnez une plage valide et vérifiez les disponibilités.", loading: "Chargement des disponibilités…", apiError: "Impossible de récupérer les disponibilités en temps réel.", apiErrorDetails: "Code HTTP", minNights: "Séjour minimum : 2 nuits", leadTime: "Réservation possible à partir de J+2",
  },
  en: {
    title: "Configure your stay", dates: "Stay dates", datesPlaceholder: "Select your dates", edit: "Edit", clear: "Clear", travelers: "Travelers", people: "guests", bedding: "Bed configuration", doubleBeds: "Double beds", singleBeds: "Single beds", options: "Options", linens: "Bed linen and prepared beds", towels: "Bath towels", price: "Price summary", nightsLine: "Nights", cleaningLine: "Cleaning", cleaningIncluded: "Included", towelsLine: "Towels", total: "Total", reserve: "Book", reserveDisabled: "Select a valid range and verify availability first.", loading: "Loading availability…", apiError: "Could not load real-time availability.", apiErrorDetails: "HTTP status", minNights: "Minimum stay: 2 nights", leadTime: "Booking starts from D+2",
  },
} as const;

const txtFor = (lang: string) => (lang === "fr" ? copy.fr : copy.en);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const toDayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const formatDate = (d: Date, lang: string) => new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" }).format(d);

export default function BookingConfigurator({ lang, apiKey, calendarId }: Props) {
  const t = txtFor(lang);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [guests, setGuests] = useState(1);
  const [doubleBeds, setDoubleBeds] = useState(1);
  const [singleBeds, setSingleBeds] = useState(1);
  const [linens, setLinens] = useState(false);
  const [towels, setTowels] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarErrorDetails, setCalendarErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!apiKey || !calendarId) {
        setCalendarError("missing");
        setCalendarErrorDetails("Missing PUBLIC_GGCALENDAR_API_KEY or PUBLIC_GGCALENDAR_ID");
        return;
      }
      setLoading(true); setCalendarError(null); setCalendarErrorDetails(null);
      try {
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(new Date().toISOString())}&key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) throw new Error(`HTTP ${response.status} - ${data?.error?.message || data?.error_description || "Unknown API error"}`);
        const blocked: string[] = [];
        for (const evt of data.items ?? []) {
          const start = evt?.start?.date || evt?.start?.dateTime;
          const end = evt?.end?.date || evt?.end?.dateTime;
          if (!start || !end) continue;
          for (let d = startOfDay(new Date(start)); d < startOfDay(new Date(end)); d = addDays(d, 1)) blocked.push(toDayKey(d));
        }
        setBookedDates(blocked);
      } catch (error) {
        setCalendarError("api");
        setCalendarErrorDetails(error instanceof Error ? error.message : String(error));
      } finally { setLoading(false); }
    };
    load();
  }, [apiKey, calendarId]);

  const minArrival = useMemo(() => startOfDay(addDays(new Date(), LEAD_DAYS)), []);
  const minArrivalStr = toDayKey(minArrival);
  const fromDate = from ? startOfDay(new Date(from)) : undefined;
  const toDate = to ? startOfDay(new Date(to)) : undefined;
  const nights = fromDate && toDate ? Math.max(0, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000)) : 0;
  const rangeHasBlockedNights = useMemo(() => {
    if (!fromDate || !toDate) return false;
    const blocked = new Set(bookedDates);
    for (let d = new Date(fromDate); d < toDate; d = addDays(d, 1)) if (blocked.has(toDayKey(d))) return true;
    return false;
  }, [fromDate, toDate, bookedDates]);

  const hasValidRange = Boolean(fromDate && toDate && nights >= MIN_NIGHTS && from >= minArrivalStr && !rangeHasBlockedNights);
  const canReserve = hasValidRange && !calendarError;
  const nightsPrice = nights * NIGHTLY_RATE;
  const beddingPrice = doubleBeds * DOUBLE_BED_RATE + singleBeds * SINGLE_BED_RATE;
  const towelsPrice = towels ? guests * TOWEL_RATE : 0;
  const total = nightsPrice + CLEANING_FEE + beddingPrice + towelsPrice;

  return <section className="mt-10 rounded border border-border bg-white p-5 shadow-sm"><h2 className="mb-5">{t.title}</h2><div className="mb-5 rounded border p-4"><div className="mb-2 flex items-center justify-between gap-3"><h3 className="m-0">{t.dates}</h3><button className="btn btn-outline-primary btn-sm" type="button" onClick={() => setIsOpen(!isOpen)}>{t.edit}</button></div><p className="m-0">{fromDate && toDate ? `Du ${formatDate(fromDate, lang)} au ${formatDate(toDate, lang)} (${nights} nuits)` : t.datesPlaceholder}</p><small className="block mt-2">{t.minNights} • {t.leadTime}</small>{isOpen && <div className="mt-4 grid gap-3 md:grid-cols-2"><label>Arrivée<input className="form-input mt-1 w-full" type="date" min={minArrivalStr} value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>Départ<input className="form-input mt-1 w-full" type="date" min={from || minArrivalStr} value={to} onChange={(e) => setTo(e.target.value)} /></label><div className="md:col-span-2"><button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => { setFrom(""); setTo(""); }}>{t.clear}</button></div>{loading && <p className="mt-2 text-sm">{t.loading}</p>}{calendarError && <p className="mt-2 text-sm text-red-700">{t.apiError} {t.apiErrorDetails}: {calendarErrorDetails || "n/a"}</p>}</div>}</div><div className="mb-5 rounded border p-4"><h3>{t.travelers}</h3><div className="flex items-center gap-3"><button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setGuests((v) => Math.max(1, v - 1))}>-</button><span>{guests} {t.people}</span><button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setGuests((v) => Math.min(MAX_TRAVELERS, v + 1))}>+</button></div></div><div className="mb-5 rounded border p-4"><h3>{t.bedding}</h3><div className="mb-2 flex items-center justify-between"><span>{t.doubleBeds}</span><input type="number" min={1} max={3} value={doubleBeds} onChange={(e) => setDoubleBeds(Math.min(3, Math.max(1, Number(e.target.value) || 1)))} /></div><div className="flex items-center justify-between"><span>{t.singleBeds}</span><input type="number" min={1} max={4} value={singleBeds} onChange={(e) => setSingleBeds(Math.min(4, Math.max(1, Number(e.target.value) || 1)))} /></div></div><div className="mb-5 rounded border p-4"><h3>{t.options}</h3><label className="mb-2 block"><input type="checkbox" checked={linens} onChange={(e) => setLinens(e.target.checked)} /> {t.linens}</label><label className="block"><input type="checkbox" checked={towels} onChange={(e) => setTowels(e.target.checked)} /> {t.towels}</label></div><div className="rounded border p-4"><h3>{t.price}</h3><table className="w-full text-left"><tbody><tr><td>{t.nightsLine}</td><td>{nights} x {NIGHTLY_RATE}€</td><td>{nightsPrice}€</td></tr><tr><td>Lits</td><td>{doubleBeds} x {DOUBLE_BED_RATE}€ + {singleBeds} x {SINGLE_BED_RATE}€</td><td>{beddingPrice}€</td></tr><tr><td>{t.cleaningLine}</td><td>{t.cleaningIncluded}</td><td>{CLEANING_FEE}€</td></tr><tr><td>{t.towelsLine}</td><td>{towels ? `${guests} x ${TOWEL_RATE}€` : "-"}</td><td>{towelsPrice}€</td></tr><tr><th>{t.total}</th><th></th><th>{total}€</th></tr></tbody></table></div><button className="btn btn-primary mt-5" type="button" disabled={!canReserve} title={!canReserve ? t.reserveDisabled : ""}>{t.reserve}</button></section>;
}
