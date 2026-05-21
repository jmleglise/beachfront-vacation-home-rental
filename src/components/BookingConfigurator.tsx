import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { CLEANING_FEE, DOUBLE_BED_RATE, LEAD_DAYS, MAX_TRAVELERS, MIN_NIGHTS, SEASON_PRICING, SINGLE_BED_RATE, TOWEL_RATE } from "../config/bookingConstants";

type Props = {
  lang: string;
  apiKey?: string;
  calendarId?: string;
  turnstileSiteKey?: string;
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
    suite: "Suite",
    room2: "Chambre 2",
    room3: "Chambre 3",
    noBed: "Aucun",
    oneDoubleBed: "1 lit double",
    oneSingleBed: "1 lit simple",
    twoSingleBeds: "2 lits simples",
    options: "Options",
    linens: "Linge de maison et lits faits",
    towels: "Serviettes de toilette",
    personalInfo: "Informations personnelles",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Adresse email",
    phone: "Téléphone",
    messageTitle: "Message",
    postalAddress: "Adresse Postale",
    postalAddressPlaceholder: "nécessaire pour l'inscrire dans le contrat",
    messagePlaceholder: "Un commentaire, une question ou une demande particulière ?",
    price: "Détail du prix",
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
    departureOnlyHint: "Jour de départ seulement",
    blockedBeforeHint: `Arrivée impossible. ${MIN_NIGHTS} nuits minimum`,
    weekDiscount: "séjour d'une semaine et plus",
    disclaimer:
      "Le prix inclut toutes les taxes, les charges pour un usage normal, et l'usage du matériel mis à disposition (Barbecue Gaz, Velo...). La haute Saison court de Mai à Septembre. La basse saison de Octobre à Avril. Tarif préférentiel pour 7 nuits et plus.",
    successMessage:
      "Nous vous remercions pour votre réservation. Je bloque les dates et vous recevrez les instructions de paiement sous 12h.",
    errorMessage:
      "Une erreur technique est survenue. La réservation n'a pas été enregistrée. Essayez de contacter le propriétaire par email à jmleglise@gmail.com.",
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
    suite: "Suite",
    room2: "Bedroom 2",
    room3: "Bedroom 3",
    noBed: "none",
    oneDoubleBed: "1 double bed",
    oneSingleBed: "1 single bed",
    twoSingleBeds: "2 single beds",
    options: "Options",
    linens: "Bed linen and prepared beds",
    towels: "Bath towels",
    personalInfo: "Personal information",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone number",
    messageTitle: "Message",
    postalAddress: "Postal address",
    postalAddressPlaceholder: "required for the rental contract",
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
    departureOnlyHint: "Checkout day only",
    blockedBeforeHint: `Arrival not possible. ${MIN_NIGHTS} nights minimum`,
    weekDiscount: "stay of a week or more",
    disclaimer:
      "The price includes all taxes, utilities for normal use, and use of equipment provided (Gas BBQ, Bikes...).High season runs from May to September. Low season from October to April.Preferential rate for 7 nights or more.",
    successMessage:
      "Thank you for your booking. I am blocking the dates and you will receive payment instructions within 12 hours.",
    errorMessage:
      "A technical error occurred. The booking could not be saved. Please try contacting the owner by email at jmleglise@gmail.com.",
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
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const fixedDate = new Date(year, month, day, 12, 0, 0);
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fixedDate);
};

// Tooltip global rendu dans le body via portail, positionné en fixed
function GlobalTooltip({ text, anchorEl }: { text: string; anchorEl: Element | null }) {
  const [style, setStyle] = useState<React.CSSProperties>({ display: "none" });

  useEffect(() => {
    if (!anchorEl || !text) {
      setStyle({ display: "none" });
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    setStyle({
      display: "block",
      position: "fixed",
      top: rect.top - 6,
      left: rect.left + rect.width / 2,
      transform: "translate(-50%, -100%)",
      backgroundColor: "rgba(55, 55, 55, 0.93)",
      color: "#fff",
      border: "1px solid rgba(180,180,180,0.4)",
      borderRadius: "6px",
      padding: "4px 10px",
      fontSize: "11px",
      lineHeight: "1.5",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      zIndex: 99999,
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    });
  }, [anchorEl, text]);

  if (typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <div style={style}>{text}</div>,
    document.body
  );
}

export default function BookingConfigurator({ lang, apiKey, calendarId, turnstileSiteKey }: Props) {
  const t = txtFor(lang);

  const [date, setDate] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [suiteBed, setSuiteBed] = useState("none");
  const [room2Bed, setRoom2Bed] = useState("none");
  const [room3Bed, setRoom3Bed] = useState("none");
  const [linens, setLinens] = useState(false);
  const [towels, setTowels] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [postalAddress, setPostalAddress] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | undefined>();

  const [tooltipAnchor, setTooltipAnchor] = useState<Element | null>(null);
  const [tooltipText, setTooltipText] = useState("");

  // Mobile drawer state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 580);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const container = document.getElementById("turnstile-container");
    if (!container || !turnstileSiteKey) return;
    const loadTurnstile = () => {
      if ((window as any).turnstile) {
        (window as any).turnstile.render("#turnstile-container", {
          sitekey: turnstileSiteKey,
          callback: (token: string) => setTurnstileToken(token),
        });
      }
    };
    if (!(window as any).turnstile) {
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
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiKey, calendarId]);

  const minArrival = useMemo(() => startOfDay(addDays(new Date(), LEAD_DAYS)), []);

  const fromDate = date?.from ? startOfDay(date.from) : undefined;
  const toDate = date?.to ? startOfDay(date.to) : undefined;
  const nights = fromDate && toDate ? Math.max(0, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000)) : 0;

  const bedConfig = useMemo(() => {
    const map = { none: { doubleBeds: 0, singleBeds: 0 }, double: { doubleBeds: 1, singleBeds: 0 }, single: { doubleBeds: 0, singleBeds: 1 }, single2: { doubleBeds: 0, singleBeds: 2 } } as const;
    const suite = map[suiteBed as keyof typeof map];
    const r2 = map[room2Bed as keyof typeof map];
    const r3 = map[room3Bed as keyof typeof map];
    return { doubleBeds: suite.doubleBeds + r2.doubleBeds + r3.doubleBeds, singleBeds: suite.singleBeds + r2.singleBeds + r3.singleBeds };
  }, [suiteBed, room2Bed, room3Bed]);

  const doubleBeds = bedConfig.doubleBeds;
  const singleBeds = bedConfig.singleBeds;

  const pricingDetail = useMemo(() => {
    let highNights = 0, lowNights = 0;
    if (fromDate && toDate && nights > 0) {
      for (let i = 0; i < nights; i++) {
        const currentNight = addDays(fromDate, i);
        if (SEASON_PRICING.HIGH_SEASON_MONTHS.includes(currentNight.getMonth())) highNights++;
        else lowNights++;
      }
    }
    const isLong = nights >= 7;
    const hRate = isLong ? SEASON_PRICING.HIGH_LONG_RATE : SEASON_PRICING.HIGH_SHORT_RATE;
    const lRate = isLong ? SEASON_PRICING.LOW_LONG_RATE : SEASON_PRICING.LOW_SHORT_RATE;
    const hBase = SEASON_PRICING.HIGH_SHORT_RATE;
    const lBase = SEASON_PRICING.LOW_SHORT_RATE;
    return { highNights, lowNights, hRate, lRate, hBase, lBase, totalNightsPrice: highNights * hRate + lowNights * lRate };
  }, [fromDate, toDate, nights]);

  const beddingPrice = linens ? doubleBeds * DOUBLE_BED_RATE + singleBeds * SINGLE_BED_RATE : 0;
  const towelsPrice = towels ? guests * TOWEL_RATE : 0;
  const total = pricingDetail.totalNightsPrice + CLEANING_FEE + beddingPrice + towelsPrice;

  const bookedDateObjects = useMemo(() => bookedDates.map((d) => startOfDay(new Date(d))), [bookedDates]);
  const bookedDateSet = useMemo(() => new Set(bookedDateObjects.map((d) => toDayKey(d))), [bookedDateObjects]);

  const reservationStartDays = useMemo(
    () => bookedDateObjects.filter((d) => !bookedDateSet.has(toDayKey(addDays(d, -1)))),
    [bookedDateObjects, bookedDateSet],
  );

  const blockedBeforeBookedDates = useMemo(() => {
    const preBlocked: Date[] = [];
    for (const blockedDay of bookedDateObjects)
      for (let i = 1; i <= MIN_NIGHTS - 1; i++) preBlocked.push(addDays(blockedDay, -i));
    return preBlocked;
  }, [bookedDateObjects]);

  const nextBlockedDate = useMemo(() => {
    if (!fromDate) return undefined;
    return bookedDates.map((d) => startOfDay(new Date(d))).filter((d) => d > fromDate).sort((a, b) => a.getTime() - b.getTime())[0];
  }, [fromDate, bookedDates]);

  const requiredMinStayDays = useMemo(() => {
    if (!fromDate) return [];
    return Array.from({ length: Math.max(0, MIN_NIGHTS - 1) }, (_, i) => addDays(fromDate, i + 1));
  }, [fromDate]);

  const reservationStartDaysSet = useMemo(() => new Set(reservationStartDays.map((d) => toDayKey(d))), [reservationStartDays]);
  const blockedBeforeSet = useMemo(() => new Set(blockedBeforeBookedDates.map((d) => toDayKey(d))), [blockedBeforeBookedDates]);

  const disabledDates = useMemo(
    () => (day: Date) => {
      const normalizedDay = startOfDay(day);
      const key = toDayKey(normalizedDay);
      if (normalizedDay < minArrival) return true;
      if (!fromDate) {
        const isReservationStart = reservationStartDays.some((d) => toDayKey(d) === key);
        if (bookedDateSet.has(key) && !isReservationStart) return true;
        return false;
      } else {
        if (requiredMinStayDays.some((d) => toDayKey(d) === key)) return true;
        if (nextBlockedDate && normalizedDay > nextBlockedDate) return true;
        if (bookedDateSet.has(key)) {
          if (nextBlockedDate && toDayKey(nextBlockedDate) === key) return false;
          return true;
        }
        return false;
      }
    },
    [minArrival, fromDate, reservationStartDays, bookedDateSet, requiredMinStayDays, nextBlockedDate],
  );

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) { setDate(undefined); return; }
    if (range.from && !date?.from) {
      const startKey = toDayKey(startOfDay(range.from));
      if (reservationStartDays.some((d) => toDayKey(d) === startKey)) return;
      if (blockedBeforeBookedDates.some((d) => toDayKey(d) === startKey)) return;
    }
    setDate(range);
  };

  const previewRange = useMemo(() => {
    if (!fromDate || !hoveredDay || hoveredDay <= fromDate) return [];
    const days: Date[] = [];
    for (let d = addDays(fromDate, 1); d <= hoveredDay; d = addDays(d, 1)) days.push(new Date(d));
    return days;
  }, [fromDate, hoveredDay]);

  const rangeHasBlockedNights = useMemo(() => {
    if (!fromDate || !toDate) return false;
    const blocked = new Set(bookedDates);
    for (let d = new Date(fromDate); d < toDate; d = addDays(d, 1))
      if (blocked.has(toDayKey(d))) return true;
    return false;
  }, [fromDate, toDate, bookedDates]);

  const exceedsNextBlockedDate = Boolean(fromDate && toDate && nextBlockedDate && toDate > nextBlockedDate);
  const hasValidRange = Boolean(fromDate && toDate && nights >= MIN_NIGHTS && fromDate >= minArrival && !rangeHasBlockedNights && !exceedsNextBlockedDate);
  const isFormValid = Boolean(firstName && lastName && email && phone && turnstileToken);
  const canReserve = hasValidRange && !calendarError && isFormValid && submitStatus !== "submitting";

  const handleBookingSubmit = async () => {
    if (!canReserve) return;
    setSubmitStatus("submitting");
    try {
      const response = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, message, postalAddress, fromDate: fromDate?.toISOString(), toDate: toDate?.toISOString(), nights, guests, doubleBeds, singleBeds, suiteBed, room2Bed, room3Bed, linens, towels, totalPrice: total, turnstileToken }),
      });
      if (response.ok) setSubmitStatus("success");
      else setSubmitStatus("error");
    } catch {
      setSubmitStatus("error");
    }
  };

  const handleDayMouseEnter = (day: Date, _modifiers: any, e: React.MouseEvent<Element>) => {
    setHoveredDay(day);
    if (fromDate) { setTooltipText(""); setTooltipAnchor(null); return; }
    const key = toDayKey(startOfDay(day));
    let hint = "";
    if (reservationStartDaysSet.has(key)) hint = t.departureOnlyHint;
    else if (blockedBeforeSet.has(key)) hint = t.blockedBeforeHint;
    if (hint) {
      setTooltipText(hint);
      setTooltipAnchor(e.currentTarget);
    } else {
      setTooltipText("");
      setTooltipAnchor(null);
    }
  };

  const handleDayMouseLeave = () => {
    setHoveredDay(undefined);
    setTooltipText("");
    setTooltipAnchor(null);
  };

  const controlStyles = "h-10 w-full max-w-xs sm:w-48 inline-flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors";
  const inputStyles = "h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors placeholder:text-gray-400";

  // DayPicker props partagés desktop et mobile
  const dayPickerProps = {
    mode: "range" as const,
    selected: date,
    onSelect: handleSelect,
    defaultMonth: date?.from,
    numberOfMonths: 2,
    disabled: disabledDates,
    min: MIN_NIGHTS,
    modifiersClassNames: {
      booked: "line-through text-gray-400",
      departureOnly: "text-gray-400",
      ruleBlocked: "text-gray-400",
      preview: "bg-blue-100 text-blue-900",
    },
    modifiers: {
      booked: bookedDateObjects.filter((d) => !reservationStartDays.some((s) => toDayKey(s) === toDayKey(d))),
      departureOnly: fromDate ? [] : reservationStartDays,
      ruleBlocked: fromDate ? [] : blockedBeforeBookedDates,
      preview: [...requiredMinStayDays, ...previewRange].filter(Boolean) as Date[],
    },
    onDayMouseEnter: handleDayMouseEnter,
    onDayMouseLeave: handleDayMouseLeave,
  };

  const clearBtn = (
    <button
      className="text-xs text-gray-500 underline transition-colors hover:text-black"
      type="button"
      onClick={() => setDate(undefined)}
    >
      {t.clear} les dates
    </button>
  );

  return (
    <section className="mt-10 mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <GlobalTooltip text={tooltipText} anchorEl={tooltipAnchor} />

      <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50/50 p-5">
        {/* BLOC DATES */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h3 className="m-0 text-lg font-semibold text-gray-900">{t.dates}</h3>
              <p className="m-0 text-sm text-gray-500">
                {fromDate && toDate
                  ? `Du ${formatDate(fromDate, lang)} au ${formatDate(toDate, lang)} (${nights} nuits)`
                  : t.datesPlaceholder}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">

              {/* DESKTOP : Radix Popover — rendu dans document.body, aucune contrainte de largeur parente */}
              {!isMobile && (
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
                    <Popover.Content
                      className="z-50 w-auto rounded-lg border bg-white p-2 shadow-xl"
                      align="end"
                      sideOffset={8}
                    >
                      <DayPicker {...dayPickerProps} />
                      <div className="px-2 pb-2 pt-1">{clearBtn}</div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              )}

              {/* MOBILE : bouton qui ouvre un drawer depuis le bas */}
              {isMobile && (
                <>
                  <button type="button" className={controlStyles} onClick={() => setCalendarOpen(true)}>
                    <span className="flex items-center gap-2 text-gray-700">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      {t.chooseDates}
                    </span>
                  </button>
                  {calendarOpen && ReactDOM.createPortal(
                    <>
                      <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setCalendarOpen(false)} />
                      <div
                        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-2xl"
                        style={{ maxHeight: "90dvh", overflowY: "auto" }}
                      >
                        <div className="flex justify-center pt-3 pb-1">
                          <div className="h-1 w-10 rounded-full bg-gray-300" />
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                          <span className="text-sm font-semibold text-gray-900">{t.dates}</span>
                          <button type="button" className="text-sm text-gray-500 underline" onClick={() => setCalendarOpen(false)}>✕</button>
                        </div>
                        <div className="px-2 py-3" style={{ overflowX: "hidden" }} data-calendar="mobile">
                          <DayPicker {...dayPickerProps} />
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                          {clearBtn}
                          <button
                            className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white"
                            type="button"
                            onClick={() => setCalendarOpen(false)}
                          >
                            Confirmer
                          </button>
                        </div>
                      </div>
                    </>,
                    document.body
                  )}
                </>
              )}

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
              <h3 className="m-0 text-lg font-semibold text-gray-900">{t.travelers}</h3>
              <span className="block text-sm text-gray-500">{t.travelersHint}</span>
            </div>
            <select className={controlStyles} value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
              {Array.from({ length: MAX_TRAVELERS }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} {t.people}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CONFIGURATION LITS */}
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">{t.bedding}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4"><span className="text-sm text-gray-700">{t.suite}</span><select className={`${controlStyles} max-w-[180px] sm:w-48`} value={suiteBed} onChange={(e) => setSuiteBed(e.target.value)}><option value="none">{t.noBed}</option><option value="double">{t.oneDoubleBed}</option></select></div>
            <div className="flex items-center justify-between gap-4"><span className="text-sm text-gray-700">{t.room2}</span><select className={`${controlStyles} max-w-[180px] sm:w-48`} value={room2Bed} onChange={(e) => setRoom2Bed(e.target.value)}><option value="none">{t.noBed}</option><option value="double">{t.oneDoubleBed}</option><option value="single">{t.oneSingleBed}</option><option value="single2">{t.twoSingleBeds}</option></select></div>
            <div className="flex items-center justify-between gap-4"><span className="text-sm text-gray-700">{t.room3}</span><select className={`${controlStyles} max-w-[180px] sm:w-48`} value={room3Bed} onChange={(e) => setRoom3Bed(e.target.value)}><option value="none">{t.noBed}</option><option value="double">{t.oneDoubleBed}</option><option value="single">{t.oneSingleBed}</option><option value="single2">{t.twoSingleBeds}</option></select></div>
          </div>
        </div>

        {/* OPTIONS */}
        <h3 className="mb-3 text-lg font-semibold text-gray-900">{t.options}</h3>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" checked={linens} onChange={(e) => setLinens(e.target.checked)} />
            <span>{t.linens}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" checked={towels} onChange={(e) => setTowels(e.target.checked)} />
            <span>{t.towels}</span>
          </label>
        </div>
      </div>

      {/* RÉSUMÉ DU PRIX */}
      <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50/50 p-5">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{t.price}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <tbody>
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
                      {nights >= 7 && (
                        <span className="text-xs font-normal text-gray-400">
                          [<span className="line-through">
                            {pricingDetail.highNights > 0 && pricingDetail.lowNights > 0
                              ? `${pricingDetail.highNights}x${pricingDetail.hBase}€ + ${pricingDetail.lowNights}x${pricingDetail.lBase}€`
                              : pricingDetail.highNights > 0 ? `${pricingDetail.hBase}€` : `${pricingDetail.lBase}€`}
                          </span>] ({t.weekDiscount})
                        </span>
                      )}
                    </div>
                  ) : "-"}
                </td>
                <td className="py-2.5 text-right font-medium text-gray-900">{pricingDetail.totalNightsPrice}€</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2.5">{t.cleaningLine}</td>
                <td className="py-2.5 text-gray-400">{t.cleaningIncluded}</td>
                <td className="py-2.5 text-right font-medium text-gray-900">{CLEANING_FEE}€</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2.5">Lits</td>
                <td className="py-2.5 text-gray-400">
                  {linens ? (
                    <div className="flex flex-col">
                      <span>{doubleBeds} x {DOUBLE_BED_RATE}€ + {singleBeds} x {SINGLE_BED_RATE}€</span>
                      <span className="mt-0.5 text-xs text-gray-400">(tapis de sol Sdb et torchons inclus)</span>
                    </div>
                  ) : "-"}
                </td>
                <td className="py-2.5 text-right font-medium text-gray-900">{beddingPrice}€</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2.5">{t.towelsLine}</td>
                <td className="py-2.5 text-gray-400">{towels ? `${guests} x ${TOWEL_RATE}€` : "-"}</td>
                <td className="py-2.5 text-right font-medium text-gray-900">{towelsPrice}€</td>
              </tr>
              <tr className="text-base font-semibold text-gray-900">
                <td className="pt-4">{t.total}</td>
                <td className="pt-4"></td>
                <td className="pt-4 text-right text-lg font-bold">{total}€</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-5 whitespace-pre-line border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-400">{t.disclaimer}</p>
      </div>

      {/* INFORMATIONS PERSONNELLES */}
      <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50/50 p-5">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{t.personalInfo}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t.firstName} *</label>
            <input type="text" className={inputStyles} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t.lastName} *</label>
            <input type="text" className={inputStyles} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t.email} *</label>
            <input type="email" className={inputStyles} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t.phone} *</label>
            <input type="tel" className={inputStyles} value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-gray-700">{t.postalAddress}</label>
          <textarea
            className="min-h-[100px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            placeholder={t.postalAddressPlaceholder}
            value={postalAddress}
            onChange={(e) => setPostalAddress(e.target.value)}
          />
        </div>
      </div>

      {/* MESSAGE */}
      <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50/50 p-5">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">{t.messageTitle}</h3>
        <textarea
          className="min-h-[100px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          placeholder={t.messagePlaceholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* CLOUDFLARE TURNSTILE CAPTCHA */}
      <div className="mb-5 flex justify-center sm:justify-start">
        <div id="turnstile-container"></div>
      </div>

      {/* BOUTON DE RÉSERVATION */}
      <button
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-black px-8 text-sm font-medium text-white shadow transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-40 sm:w-auto"
        type="button"
        disabled={!canReserve}
        onClick={handleBookingSubmit}
        title={!canReserve ? t.reserveDisabled : ""}
      >
        {submitStatus === "submitting" ? "Envoi en cours..." : t.reserve}
      </button>

      {submitStatus === "success" && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{t.successMessage}</div>
      )}
      {submitStatus === "error" && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t.errorMessage}</div>
      )}
    </section>
  );
}