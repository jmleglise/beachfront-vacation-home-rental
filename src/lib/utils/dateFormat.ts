// Date localisee (Intl) : "4 juillet 2023" en francais, "4 July 2023" en
// anglais. Le format date-fns "dd MMM, yyyy" affichait des mois anglais
// sur les pages francaises.
const dateFormat = (date: Date | string, lang: string = "fr"): string => {
  const locale = lang === "en" ? "en-GB" : "fr-FR";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(date));
};

export default dateFormat;
