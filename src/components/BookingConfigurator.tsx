import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { Calendar as CalendarIcon, X } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import theme from "../config/theme.json";
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
    clearDates: "Effacer les dates",
    rangeLabel: (a: string, b: string, n: number) => `Du ${a} au ${b} (${n} ${n > 1 ? "nuits" : "nuit"})`,
    confirm: "Confirmer",
    close: "Fermer",
    travelers: "Voyageurs",
    travelersHint: "Adulte et Enfant occupant un lit.",
    people: (n: number) => (n > 1 ? "personnes" : "personne"),
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
    bedsLine: "Lits",
    bedsNote: "(tapis de sol Sdb et torchons inclus)",
    total: "Total",
    reserve: "Réserver",
    submitting: "Envoi en cours…",
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
    clearDates: "Clear dates",
    rangeLabel: (a: string, b: string, n: number) => `From ${a} to ${b} (${n} ${n > 1 ? "nights" : "night"})`,
    confirm: "Confirm",
    close: "Close",
    travelers: "Travelers",
    travelersHint: "Adults and children occupying a bed.",
    people: (n: number) => (n > 1 ? "guests" : "guest"),
    bedding: "Bed configuration",
    suite: "Suite",
    room2: "Bedroom 2",
    room3: "Bedroom 3",
    noBed: "None",
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
    bedsLine: "Beds",
    bedsNote: "(bath mats and tea towels included)",
    total: "Total",
    reserve: "Book",
    submitting: "Sending…",
    reserveDisabled: "Select a valid range, fill your details and complete the captcha.",
    loading: "Loading availability…",
    apiError: "Could not load real-time availability.",
    blockedRangeError: "Checkout must be before the next already-booked date.",
    departureOnlyHint: "Checkout day only",
    blockedBeforeHint: `Arrival not possible. ${MIN_NIGHTS} nights minimum`,
    weekDiscount: "stay of a week or more",
    disclaimer:
      "The price includes all taxes, utilities for normal use, and use of equipment provided (Gas BBQ, Bikes...). High season runs from May to September. Low season from October to April. Preferential rate for 7 nights or more.",
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
function GlobalTooltip({ text, anchorEl }: { text: string; anchorEl: Element | null }): React.ReactNode {
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({ display: "none" });
  
  useEffect(() => {
    setMounted(true);
  }, []);

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
      backgroundColor: theme.colors.default.text_color.dark,
      color: "#fff",
      borderRadius: "6px",
      padding: "4px 10px",
      fontSize: "13px",
      lineHeight: "1.5",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      zIndex: 60,
      boxShadow: "0 12px 40px rgba(4, 4, 4, 0.14)",
    });
  }, [anchorEl, text]);

  if (!mounted) return null;
  return (ReactDOM as any).createPortal(<div style={style}>{text}</div>, document.body) as React.ReactNode;
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

  // Bloquer le scroll de la page quand le calendrier mobile est ouvert
  useEffect(() => {
    if (isMobile && calendarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isMobile, calendarOpen]);

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

  // Charte : champs h-11 (44px), rayon 6px, bordure token, focus primary.
  const focusStyles = "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const controlStyles = `h-11 w-full inline-flex items-center justify-between gap-2 rounded border border-border bg-body px-3 text-base text-dark shadow-sm transition-colors ${focusStyles}`;
  // pr-10 : laisse la place a la fleche du select (@tailwindcss/forms)
  const selectStyles = `${controlStyles} pr-10`;
  const inputStyles = `h-11 w-full rounded border border-border bg-body px-3 text-base text-dark shadow-sm transition-colors placeholder:text-light ${focusStyles}`;
  const textareaStyles = `min-h-[100px] w-full rounded border border-border bg-body px-3 py-2 text-base text-dark shadow-sm transition-colors placeholder:text-light ${focusStyles}`;
  const checkboxStyles = "h-5 w-5 shrink-0 rounded-sm border-border text-primary focus:ring-primary";
  const labelStyles = "mb-1 block text-sm font-medium text-text";
  // Ligne libelle / controle : colonne controle de largeur fixe pour aligner tous les champs
  const rowStyles = "grid grid-cols-[minmax(0,1fr)_minmax(0,11rem)] items-center gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]";
  const panelStyles = "mb-4 rounded-lg bg-surface p-5";

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
      booked: "line-through text-light",
      departureOnly: "text-light",
      ruleBlocked: "text-light",
      preview: "bg-accent/30 text-dark",
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
      className="text-sm text-light underline transition-colors hover:text-primary"
      type="button"
      onClick={() => setDate(undefined)}
    >
      {t.clearDates}
    </button>
  );

  const dateTriggerContent = (
    <span className="flex min-w-0 items-center gap-2 text-text">
      <CalendarIcon className="h-4 w-4 shrink-0 text-light" aria-hidden="true" />
      <span className="truncate">{t.chooseDates}</span>
    </span>
  );

  const bedOptions = (
    <>
      <option value="none">{t.noBed}</option>
      <option value="double">{t.oneDoubleBed}</option>
      <option value="single">{t.oneSingleBed}</option>
      <option value="single2">{t.twoSingleBeds}</option>
    </>
  );

  return (
    <section className="max-w-3xl rounded-lg border border-border bg-body p-4 sm:p-6">
      <GlobalTooltip text={tooltipText} anchorEl={tooltipAnchor} />

      <div className={panelStyles}>
        {/* BLOC DATES */}
        <div className="mb-6">
          <div className={rowStyles}>
            <h3 className="h5 m-0">{t.dates}</h3>
            <div>
              {/* DESKTOP : Radix Popover — rendu dans document.body, aucune contrainte de largeur parente */}
              {!isMobile && (
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <button type="button" className={controlStyles}>
                      {dateTriggerContent}
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="z-50 w-auto rounded-lg border border-border bg-body p-2 shadow-lg"
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
                    {dateTriggerContent}
                  </button>
                  {calendarOpen && ReactDOM.createPortal(
                    <>
                      <div className="fixed inset-0 z-40 bg-dark/40" onClick={() => setCalendarOpen(false)} />
                      <div
                        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-lg bg-body shadow-lg"
                        style={{ maxHeight: "62dvh", overflowY: "auto" }}
                      >
                        <div className="flex justify-center pb-1 pt-3">
                          <div className="h-1 w-10 rounded-full bg-border" />
                        </div>
                        <div className="flex items-center justify-between border-b border-border px-4 py-2">
                          <span className="h5 m-0">{t.dates}</span>
                          <button
                            type="button"
                            aria-label={t.close}
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-dark transition-colors hover:bg-border"
                            onClick={() => setCalendarOpen(false)}
                          >
                            <X className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                        <div className="px-2 py-3" style={{ overflowX: "hidden" }} data-calendar="mobile">
                          <DayPicker {...dayPickerProps} />
                        </div>
                        <div className="flex items-center justify-between border-t border-border px-4 py-3">
                          {clearBtn}
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => setCalendarOpen(false)}
                          >
                            {t.confirm}
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
          <p className="mb-0 mt-2 text-sm text-light">
            {fromDate && toDate
              ? t.rangeLabel(formatDate(fromDate, lang), formatDate(toDate, lang), nights)
              : t.datesPlaceholder}
          </p>
          {loading && <p className="mb-0 mt-2 text-sm text-light">{t.loading}</p>}
          {calendarError && <p className="mb-0 mt-2 text-sm text-error">{t.apiError}</p>}
          {exceedsNextBlockedDate && <p className="mb-0 mt-2 text-sm text-error">{t.blockedRangeError}</p>}
        </div>

        {/* BLOC VOYAGEURS */}
        <div className="mb-6">
          <div className={rowStyles}>
            <h3 className="h5 m-0">
              <label htmlFor="booking-guests">{t.travelers}</label>
            </h3>
            <select
              id="booking-guests"
              className={selectStyles}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              aria-describedby="booking-guests-hint"
            >
              {Array.from({ length: MAX_TRAVELERS }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} {t.people(n)}</option>
              ))}
            </select>
          </div>
          <p id="booking-guests-hint" className="mb-0 mt-2 text-sm text-light">{t.travelersHint}</p>
        </div>

        {/* CONFIGURATION LITS */}
        <div className="mb-6">
          <h3 className="h5 mb-4 mt-0">{t.bedding}</h3>
          <div className="space-y-3">
            <div className={rowStyles}>
              <label htmlFor="booking-suite-bed" className="text-base text-text">{t.suite}</label>
              <select id="booking-suite-bed" className={selectStyles} value={suiteBed} onChange={(e) => setSuiteBed(e.target.value)}>
                <option value="none">{t.noBed}</option>
                <option value="double">{t.oneDoubleBed}</option>
              </select>
            </div>
            <div className={rowStyles}>
              <label htmlFor="booking-room2-bed" className="text-base text-text">{t.room2}</label>
              <select id="booking-room2-bed" className={selectStyles} value={room2Bed} onChange={(e) => setRoom2Bed(e.target.value)}>
                {bedOptions}
              </select>
            </div>
            <div className={rowStyles}>
              <label htmlFor="booking-room3-bed" className="text-base text-text">{t.room3}</label>
              <select id="booking-room3-bed" className={selectStyles} value={room3Bed} onChange={(e) => setRoom3Bed(e.target.value)}>
                {bedOptions}
              </select>
            </div>
          </div>
        </div>

        {/* OPTIONS */}
        <h3 className="h5 mb-3 mt-0">{t.options}</h3>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-base text-text">
            <input type="checkbox" className={checkboxStyles} checked={linens} onChange={(e) => setLinens(e.target.checked)} />
            <span>{t.linens}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-base text-text">
            <input type="checkbox" className={checkboxStyles} checked={towels} onChange={(e) => setTowels(e.target.checked)} />
            <span>{t.towels}</span>
          </label>
        </div>
      </div>

      {/* RÉSUMÉ DU PRIX */}
      <div className={panelStyles}>
        <h3 className="h5 mb-4 mt-0">{t.price}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base text-text">
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2.5 pr-3">{t.nightsLine}</td>
                <td className="py-2.5 pr-3 text-sm text-light">
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
                        <span className="text-[13px] font-normal text-light">
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
                <td className="py-2.5 text-right font-medium text-dark">{pricingDetail.totalNightsPrice}€</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 pr-3">{t.cleaningLine}</td>
                <td className="py-2.5 pr-3 text-sm text-light">{t.cleaningIncluded}</td>
                <td className="py-2.5 text-right font-medium text-dark">{CLEANING_FEE}€</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 pr-3">{t.bedsLine}</td>
                <td className="py-2.5 pr-3 text-sm text-light">
                  {linens ? (
                    <div className="flex flex-col">
                      <span>{doubleBeds} x {DOUBLE_BED_RATE}€ + {singleBeds} x {SINGLE_BED_RATE}€</span>
                      <span className="mt-0.5 text-[13px] text-light">{t.bedsNote}</span>
                    </div>
                  ) : "-"}
                </td>
                <td className="py-2.5 text-right font-medium text-dark">{beddingPrice}€</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 pr-3">{t.towelsLine}</td>
                <td className="py-2.5 pr-3 text-sm text-light">{towels ? `${guests} x ${TOWEL_RATE}€` : "-"}</td>
                <td className="py-2.5 text-right font-medium text-dark">{towelsPrice}€</td>
              </tr>
              <tr className="font-secondary text-h5 font-medium text-dark">
                <td className="pt-4">{t.total}</td>
                <td className="pt-4"></td>
                <td className="pt-4 text-right">{total}€</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mb-0 mt-5 whitespace-pre-line border-t border-border pt-3 text-[13px] leading-relaxed text-light">{t.disclaimer}</p>
      </div>

      {/* INFORMATIONS PERSONNELLES */}
      <div className={panelStyles}>
        <h3 className="h5 mb-4 mt-0">{t.personalInfo}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="booking-first-name" className={labelStyles}>{t.firstName} *</label>
            <input id="booking-first-name" type="text" autoComplete="given-name" className={inputStyles} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="booking-last-name" className={labelStyles}>{t.lastName} *</label>
            <input id="booking-last-name" type="text" autoComplete="family-name" className={inputStyles} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="booking-email" className={labelStyles}>{t.email} *</label>
            <input id="booking-email" type="email" autoComplete="email" className={inputStyles} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="booking-phone" className={labelStyles}>{t.phone} *</label>
            <input id="booking-phone" type="tel" inputMode="tel" autoComplete="tel" className={inputStyles} value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="booking-postal-address" className={labelStyles}>{t.postalAddress}</label>
          <textarea
            id="booking-postal-address"
            autoComplete="street-address"
            className={textareaStyles}
            placeholder={t.postalAddressPlaceholder}
            value={postalAddress}
            onChange={(e) => setPostalAddress(e.target.value)}
          />
        </div>
      </div>

      {/* MESSAGE */}
      <div className={panelStyles}>
        <h3 className="h5 mb-3 mt-0">
          <label htmlFor="booking-message">{t.messageTitle}</label>
        </h3>
        <textarea
          id="booking-message"
          className={textareaStyles}
          placeholder={t.messagePlaceholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* CLOUDFLARE TURNSTILE CAPTCHA */}
      <div className="mb-4 flex justify-center sm:justify-start">
        <div id="turnstile-container"></div>
      </div>

      {/* BOUTON DE RÉSERVATION */}
      <button
        className="btn btn-primary w-full sm:w-auto"
        type="button"
        disabled={!canReserve}
        onClick={handleBookingSubmit}
        aria-describedby={!canReserve && submitStatus !== "submitting" ? "booking-submit-hint" : undefined}
      >
        {submitStatus === "submitting" ? t.submitting : t.reserve}
      </button>
      {!canReserve && submitStatus !== "submitting" && (
        <p id="booking-submit-hint" className="mb-0 mt-2 text-sm text-light">{t.reserveDisabled}</p>
      )}

      {submitStatus === "success" && (
        <div role="status" className="mt-4 rounded-lg bg-success-light p-4 text-base text-success">{t.successMessage}</div>
      )}
      {submitStatus === "error" && (
        <div role="alert" className="mt-4 rounded-lg bg-error-light p-4 text-base text-error">{t.errorMessage}</div>
      )}
    </section>
  );
}
