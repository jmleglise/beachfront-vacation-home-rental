# Audit UX / direction artistique : location-maison-mer.fr

Date : 2026-09-25. Destinataire : développeur front.

## 0. Périmètre et méthode

- Site mesuré en production : `https://www.location-maison-mer.fr` (build Astro v6.4.8).
- Pages capturées (Playwright/Chromium), en 1440×900 et 390×844 :
  `/fr/`, `/en/`, `/fr/villa-tamaris-beachfront-ouistreham-feature/`,
  `/fr/villa-tamaris-beachfront-ouistreham-location/`,
  `/fr/villa-tamaris-beachfront-ouistreham-book-now/`, `/fr/blog/`,
  `/fr/blog/cabines-de-plage-beach-cabins/`,
  `/fr/blog/ouistreham-climate-temperature/`, `/fr/review/`, une URL 404.
- Valeurs `getComputedStyle` relevées sur chaque élément texte visible (famille, taille,
  graisse, couleur), titres, boutons, rayons, ombres, polices effectivement chargées.
- Lecture du code : `src/styles/*`, `tailwind.config.cjs`, `src/config/theme.json`,
  `src/layouts/**`, `src/pages/**`, `src/components/**`, contenus `src/content/**/french`.

Convention :
- **[M]** fait mesuré sur le site en ligne.
- **[C]** fait lu dans le code (chemin:ligne).
- **[D]** déduction.
- **[V]** à vérifier.

Niveaux : **bloquant** / **élevé** / **moyen** / **faible**.

---

## 1. Synthèse

| # | Constat | Niveau |
|---|---|---|
| 1 | Pas de charte couleur. `primary` = `#121212` (valeur par défaut Astroplate). La seule couleur de marque (sable `#E5BF7C`) n'existe que dans les SVG. Le formulaire de réservation utilise sa propre palette Tailwind `gray-*`/`black`. | élevé |
| 2 | Corps de texte à 12,8 px sur mobile (racine `html` réduite à 80 %). Textes secondaires à 11,2 px et 9,6 px. | élevé |
| 3 | Hiérarchie des titres incohérente : H1 d'accueil à 14,4 px sur mobile, sous des H2 à 20,7 px. H1 d'article = taille H2. Écart H2/H3/H4 ≈ 1,4 px sur desktop. | élevé |
| 4 | Pages Descriptif, Localisation, Réservation sans `section` ni padding vertical : H1 collé à l'image, texte pleine largeur (≈ 1290 px par ligne). | élevé |
| 5 | Quatre gabarits d'en-tête de page différents (accueil, pages villa, blog, article). | moyen |
| 6 | Boutons : `capitalize` CSS (« Découvrez La Maison », « Lire La Suite »), pas d'état hover sur `.btn-primary`, CTA « Réservez » en contour `btn-sm` dans le header et absent du header mobile. | élevé |
| 7 | Graisses demandées mais non chargées (Heebo 500/700, Signika 600/800) : rendu de substitution. | moyen |
| 8 | Résidus du template : « made with Astro.js & Astroplate » en pied de page, placeholders de couverture sur 5 articles, composants et CSS morts. | élevé (image de marque) |
| 9 | Libellés anglais sur pages FR (« Related Posts », « Share : », « Categories », date « 04 Jul, 2023 ») et fil d'Ariane construit depuis le slug anglais. | moyen |
| 10 | Page `/review/` hors charte (Helvetica Neue 300, indigo `#4f46e5`, pas de header/footer). | moyen |
| 11 | Filigrane « www.location-maison-mer.fr » incrusté dans les photos principales, et étiquette tronquée « Environnemer » sur la carte de l'accueil. | moyen |

---

## 2. Charte cible proposée (design tokens)

Le bloc suivant est une proposition. Les valeurs de contraste ont été calculées selon la formule WCAG 2.x.

### 2.1 Couleurs

| Token | Valeur | Usage | Contraste sur `#fff` |
|---|---|---|---|
| `primary` | `#1F3A5F` (bleu colombage de la villa, proposition) | boutons pleins, liens actifs, focus | 11,5:1 |
| `accent` | `#E5BF7C` (sable, déjà présent dans `public/images/icon_*.svg`) | pictos décoratifs, filets, fonds d'accent | 1,74:1 (décoratif uniquement) |
| `accent-strong` | `#8A6220` | texte/icône porteur d'information dans la teinte sable | 5,5:1 |
| `dark` | `#040404` (existant) | titres | 20:1 |
| `text` | `#444444` (existant) | corps | 9,7:1 |
| `light` | `#6B6B6B` (remplace `#717171`) | méta, légendes | 5,3:1 (4,8:1 sur `#F7F3EC`) |
| `border` | `#EAEAEA` (existant) | filets, cartes | – |
| `surface` | `#F7F3EC` (proposition, remplace `#f6f6f6` et `#f9f9f9`) | sections alternées, cartes, footer | – |
| `success` / `error` | à définir | messages du formulaire | ≥ 4,5:1 requis |

Règles :
- Aucune classe de palette Tailwind brute (`gray-*`, `black`, `blue-*`, `red-*`) hors tokens.
- Les SVG `icon_*.svg` passent en `stroke="currentColor"`/`fill="currentColor"` et se colorent par classe (`text-accent`).

### 2.2 Typographie

- Deux familles conservées : Signika (titres), Heebo (texte).
- Graisses chargées = graisses utilisées. Proposition : Heebo 400/500/600, Signika 600/700.
  Mettre à jour `src/layouts/Base.astro:11-14` et supprimer les classes qui demandent d'autres graisses.
- Racine à 16 px sur toutes les largeurs : supprimer `text-base-sm` de `src/styles/base.scss:11`.
- Échelle proposée (ratio ≈ 1,25) :

| Niveau | Desktop | Mobile (< 768 px) | Graisse | Interlignage |
|---|---|---|---|---|
| h1 | 40 px | 30 px | Signika 700 | 1,15 |
| h2 | 30 px | 24 px | Signika 700 | 1,2 |
| h3 | 23 px | 20 px | Signika 600 | 1,25 |
| h4 | 19 px | 18 px | Signika 600 | 1,3 |
| body | 16–17 px | 16 px | Heebo 400 | 1,6 |
| small (méta, légendes) | 14 px | 14 px | Heebo 400 | 1,5 |
| xs (mentions) | 13 px | 13 px (minimum) | Heebo 400 | 1,5 |

- Largeur de lecture : 65–75 caractères (`max-w-prose` ou `lg:col-8`).
- Alignement à gauche partout. Pas de `text-justify`.
- Pas de `text-transform: capitalize` sur du texte français.

### 2.3 Espacements

- Unité de base 4 px (échelle Tailwind).
- Sections : un seul rythme vertical, `section` = `py-16 md:py-24`, `section-sm` = `py-12 md:py-16`.
- Espacement titre → contenu : `mb-4` (h2), `mb-3` (h3). Espace avant titre de section : `mt-12`.
- Conteneur unique : `.container` = `max-w-[1320px] px-4 md:px-6`. Supprimer la définition concurrente `container.padding: "2rem"` dans `tailwind.config.cjs:31-34` [C], ou l'inverse, mais une seule.

### 2.4 Formes

- Rayons : `rounded` 6 px (contrôles, boutons, tags), `rounded-lg` 12 px (cartes, images, panneaux). Supprimer `rounded-md`, `rounded-xl`, `rounded-2xl`.
- Images de contenu : toutes en `rounded-lg`, ou toutes sans rayon. Une seule règle.
- Ombres : deux niveaux au plus (`shadow` léger pour cartes, `shadow-lg` pour overlays).

### 2.5 Boutons

| Variante | Rôle | Style |
|---|---|---|
| `btn-primary` | action principale (Réserver) | fond `primary`, texte blanc, hover assombri, `focus-visible:ring-2` |
| `btn-outline` | action secondaire (Lire la suite, Découvrir) | bordure `primary`, texte `primary`, hover fond `primary` |
| `btn-sm` | usage restreint (tags, header desktop) | hauteur ≥ 40 px |

Hauteur minimale 44 px sur mobile. Casse de phrase (« Découvrir la maison »).

---

## 3. Constats détaillés

### 3.1 Couleurs et charte

**3.1.1 — Pas de couleur de marque. Niveau : élevé.**
- [C] `src/config/theme.json:5` : `primary: #121212`. Valeur du template Astroplate.
- [C] `tailwind.config.cjs:41` : `secondary` lit `theme_color.secondary`, clé absente de `theme.json`. Valeur `undefined`.
- [C] `#E5BF7C` n'est présent que dans `public/images/icon_*.svg` (couleurs figées dans le fichier).
- [M] Le logo (camélia rouge, `camelia_cabochon_97.png`) n'apparaît que dans le footer. Sa couleur n'est reprise nulle part.
- Correction : appliquer §2.1.

**3.1.2 — Formulaire de réservation hors charte. Niveau : élevé.**
- [C] `src/components/BookingConfigurator.tsx` : `text-gray-900/700/600/500/400`, `border-gray-100/200/300`, `bg-gray-50/100`, `bg-black`, `bg-blue-100 text-blue-900`, `text-red-600`, `green-*`, `red-*` (≈ 80 occurrences, lignes 436–733).
- [M] Titres H3 du formulaire en `rgb(17,24,39)` (gray-900) au lieu de `dark` ; textes en `rgb(55,65,81)`, `rgb(75,85,99)`, `rgb(107,114,128)`, `rgb(156,163,175)`.
- [D] Le formulaire se lit comme un composant d'une autre application.
- Correction : `gray-900→text-dark`, `gray-500/600/700→text-text`, `gray-400→text-light`, `gray-100/200→border-border`, `gray-50→bg-surface`, `black→primary`, `blue→accent`, `red/green→error/success`.

**3.1.3 — Deux gris de fond différents. Niveau : faible.**
- [C] `src/styles/utilities.scss:2` : `.bg-gradient` utilise `#f9f9f9`.
- [C] `src/layouts/partials/PageHeader.astro:11` : `from-body to-theme-light` (`#f6f6f6`).
- Correction : un seul token `surface`.

**3.1.4 — Autres couleurs codées en dur. Niveau : moyen.**
- [C] `src/layouts/PostSingle.astro:90` : `bg-gray-100` sur l'encart CTA.
- [C] `src/layouts/components/Gallery.astro:50` : `text-gray-700` sur les légendes. [M] rendu `rgb(55,65,81)`.
- [C] `src/pages/[...lang]/review.astro:26-83` : `#333`, `#999`, `gold`, `#ccc`, `#eef2ff`, `#888`, `#4f46e5`.
- [C] `src/content/booknow/french/-index.md:31` : iframe Google Agenda en `color=%23795548` (marron).

### 3.2 Typographie

**3.2.1 — Corps de texte 12,8 px sur mobile. Niveau : élevé.**
- [C] `src/styles/base.scss:11` : `html { text-base-sm md:text-base }` → racine 12,8 px sous 768 px.
- [M] Mobile 390 px : corps 12,8 px sur accueil et blog ; légendes galerie 11,2 px ; libellés formulaire 9,6 px.
- [M] Article mobile : paragraphes à 16 px (`prose-p:text-base` en px, `src/styles/components.scss:169`) mais listes à 12,8 px et H3 à 15,1 px. Les H3 sont plus petits que le texte courant.
- Correction : racine 16 px partout, échelle §2.2, supprimer les tailles en px dans `.content`.

**3.2.2 — H1 de l'accueil. Niveau : élevé.**
- [C] `src/pages/[...lang]/index.astro:75-78` : `text-lg md:text-2xl lg:text-4xl`.
- [M] 14,4 px sur mobile, alors que les H2 de la même page font 20,7 px.
- [M] 36 px sur desktop, alors que les H1 des autres pages font 28,8 px.
- [M] H1 posé sur la photo dans un cartouche `bg-black/50`, qui masque une grande partie de l'image sur mobile. Les puces du carrousel chevauchent le filigrane.
- Correction : H1 au token `h1`, placé sous ou sur le carrousel avec un dégradé bas d'image plutôt qu'un cartouche.

**3.2.3 — H2 de l'accueil stylés en H1. Niveau : moyen.**
- [C] `index.astro:122, 177, 188` : `text-h1-sm md:text-h1` sur des `<h2>`.
- [M] 28,8 px desktop, taille identique aux H1 des pages intérieures.
- Correction : retirer ces classes. Le style `h2` s'applique par défaut.

**3.2.4 — Échelle trop plate. Niveau : élevé.**
- [C] `theme.json` : `scale: 1.07`.
- [M] desktop : h2 22,4 px, h3 21,0 px, h4 19,6 px, h5 18,3 px. Écarts inférieurs à 1,5 px, non perceptibles.
- [C] `base.scss:57-60` : pas de `h4-sm`. [D] sur mobile h4 (15,7 px) > h3 (15,1 px).
- Correction : ratio 1,25 (§2.2), variantes mobiles pour h1–h4.

**3.2.5 — H1 d'article = taille H2. Niveau : moyen.**
- [C] `src/layouts/PostSingle.astro:61` : `<h1 class="h2">`.
- [M] H1 22,4 px, identique au H2 « Villa Tamaris » de l'encart CTA juste en dessous.
- [C] `src/pages/404.astro:28` : même motif.
- Correction : classe `h1`.

**3.2.6 — Hiérarchie sémantique. Niveau : moyen.**
- [M] Accueil : H2 « FAQ » puis cartes blog en H4 (saut H2→H4), sans titre de section pour le bloc articles.
- [M] Blog : H1 puis H4 (cartes) puis H5 (« Categories », « Tags »). Aucun H2/H3.
- [M] Article : le premier H2 du document est « Villa Tamaris » (encart CTA `src/layouts/partials/CallToAction.astro:29`), avant le contenu.
- [M] Article météo : H1 puis douze H3 sans H2 parent (`src/content/blog/french/ouistreham-climate-temperature.md:17-97`).
- [C] `src/content/feature/french/-index.md:10` : `level: ""` produit un `<h2>` vide (`feature.astro:51`).
- Correction : titre de carte en `h3` avec style `h4` ; titres de sidebar en `h2` stylés `h5` ; CTA d'article en `<p class="h4">` ou `<aside>` avec `h2` placé après le contenu.

**3.2.7 — Graisses non chargées. Niveau : moyen.**
- [C] `Base.astro:11-14` : chargées Heebo 400/600, Signika 500/700.
- [M] polices effectivement utilisées : Heebo 400, Heebo 600, Signika 700. Signika 500 est déclarée mais inutilisée.
- [M] Heebo 500 demandé (liens `.content`, formulaire `font-medium`) → rendu en 400. Aucune différence visible avec le texte courant.
- [M] Signika 600 demandé (H3 du formulaire et des articles) → substitution par 700.
- [C] Heebo 700 demandé (`404.astro:27`, `BookingConfigurator.tsx:537, 662`) → rendu en 600 ou gras synthétique [V].
- [C] `theme.json:20-23` contient une syntaxe Google Fonts inutilisée ; les familles sont codées dans `base.scss:6-7`. Trois sources à synchroniser à la main.
- Correction : aligner chargement et usage (§2.2) ; supprimer la clé `font_family` inutilisée ou la brancher.

**3.2.8 — Texte justifié. Niveau : moyen.**
- [C] `index.astro:101, 123, 180` : `text-justify`.
- [M] Mobile : lézardes visibles (espaces inter-mots irréguliers), par exemple « en normandie, nous vous proposons ».
- [D] Les autres pages sont alignées à gauche : incohérence entre pages.
- Correction : `text-left` partout.

**3.2.9 — Casse de titre forcée. Niveau : élevé.**
- [C] `src/styles/buttons.scss:2` : `.btn { capitalize }`.
- [C] `src/layouts/components/Breadcrumbs.astro:52` : `capitalize`.
- [M] « Découvrez La Maison », « Suivez Nous Pour Découvrir La Région », « Lire La Suite », « Retour À L'accueil », « Découvrez La Localisation De La Location Saisonnière À Ouistreham Calvados », fil d'Ariane « Cabines De Plage Beach Cabins ».
- [D] Convention anglaise, fautive en typographie française.
- Correction : supprimer `capitalize`, écrire les libellés en casse de phrase.

**3.2.10 — Pseudo-listes. Niveau : moyen.**
- [M] Descriptif et Réservation : listes rendues en texte avec tirets et `<br>` (« - 2 chambres… », « -1 Salle de douche »), à côté de vraies listes `<ul>` à puces rondes (« Equipement ») et de listes à coches (accueil). Trois styles de liste.
- [C] `src/content/feature/french/-index.md:13-15, 34-36, 43-48, 74-77` ; `src/content/booknow/french/-index.md:23-28` (liste collée à un `<h2>` HTML, non parsée).
- Correction : Markdown de liste réel, un seul style de puce (coche `accent-strong` ou puce ronde).

### 3.3 Espacements, grille, conteneurs

**3.3.1 — Pages villa sans rythme vertical. Niveau : élevé.**
- [C] `feature.astro:32`, `location.astro:29`, `book-now.astro:31` : pas de `<section>`, pas de `py-*`.
- [M] H1 collé au bas de l'image héro (0 px). Dernier bouton collé au footer (Descriptif).
- Correction : `<section class="section-sm">` ; `mt-8` entre image et H1.

**3.3.2 — Largeur de lecture. Niveau : élevé.**
- [C] Descriptif/Localisation : `md:col-10 lg:col-12` (plus large en `lg` qu'en `md`). `.content` en `max-w-none`.
- [M] Lignes de ≈ 1290 px à 1440 px de viewport (≈ 180 caractères).
- [C] Article et « Qui nous sommes » : `lg:col-10` ; 404 : `lg:col-6`.
- Correction : une colonne de lecture unique (`max-w-prose` ≈ 65 ch) pour tous les textes longs ; galeries et images peuvent déborder à `col-12`.

**3.3.3 — Cartes d'article en 4 largeurs. Niveau : moyen.**
- [C] Blog `md:col-6` dans `lg:col-8` ; catégories/tags `lg:col-4` dans `lg:col-8` (≈ 270 px) ; accueil `md:col-6` dans `lg:col-8 mx-auto` ; articles liés `lg:col-4` pleine largeur.
- Correction : une grille unique (3 colonnes pleine largeur ou 2 colonnes + sidebar), réutilisée partout.

**3.3.4 — Accueil. Niveau : moyen.**
- [M] Rangée de pictos collée au carrousel (marge 0), puis paragraphe d'intro pleine largeur, sans titre.
- [M] ≈ 170 px de blanc entre la FAQ et les cartes d'articles, sans titre de section.
- [M] « Qui nous sommes » et FAQ dans une colonne plus étroite que les sections précédentes : le bord gauche du texte change de position.
- [M] Blocs image/texte : image centrée verticalement, décalée par rapport au titre de la colonne voisine.
- [C] Coquilles de classes : `index.astro:111` `mb:md-0` (au lieu de `md:mb-0`) ; `location.astro:35` `x-auto` (au lieu de `mx-auto`).
- Correction : titre de section « Nos articles » + `section` ; `items-start` sur les rangées image/texte ; colonne de texte commune.

**3.3.5 — Formulaire de réservation. Niveau : moyen.**
- [C] `BookingConfigurator.tsx:475` : `max-w-3xl mx-auto`. [M] Formulaire centré alors que H1 et texte au-dessus sont alignés à gauche.
- [M] Mobile : sélecteurs de largeurs différentes (« Voyageurs » plus étroit que « Suite »/« Chambre 2 »), libellés « Chambre 2 » sur deux lignes, cases à cocher rondes (aspect bouton radio).
- [M] Grand blanc sous « Planning des réservations » (iframe Google Agenda 800×600) [V : chargement de l'iframe en navigation réelle]. Le calendrier fait doublon avec celui du formulaire.
- [M] « 1 personnes » (accord).
- Correction : grille `label | champ` à largeur fixe, cases carrées `rounded`, alignement à gauche avec la colonne de contenu, suppression de l'iframe ou mise en `aspect-[4/3]`.

### 3.4 Composants

**3.4.1 — En-têtes de page : 4 gabarits. Niveau : moyen.**

| Page | Gabarit mesuré |
|---|---|
| Accueil | carrousel + H1 en cartouche noir translucide |
| Descriptif, Localisation, Réservation | image pleine largeur + H1 aligné à gauche, pas de fil d'Ariane |
| Blog, catégories, tags | encart gris centré `rounded-2xl py-14` + fil d'Ariane centré |
| Article | fil d'Ariane à gauche + image + H1 stylé h2 |

- Correction : un composant `PageHeader` unique (fil d'Ariane, H1, chapô optionnel, image optionnelle), aligné à gauche sur la colonne de contenu.

**3.4.2 — Boutons. Niveau : élevé.**
- [M] Header desktop : « Réservez » en `btn-outline-primary btn-sm`, 14 px, ≈ 32 px de haut. C'est l'action principale du site ; elle est rendue comme une action secondaire.
- [M] Header mobile : aucun bouton de réservation visible hors menu burger.
- [C] `buttons.scss:9-11` : `.btn-primary` sans hover réel (`hover:text-white` sur texte déjà blanc).
- [C] `buttons.scss:13-15` : `.btn-outline-primary` utilise `dark`, pas `primary`.
- [C] `BookingConfigurator.tsx:545, 720` : boutons hors système `.btn` (`rounded-md bg-black text-sm font-medium`). [M] bouton « Réserver » gris désactivé pleine largeur, sans explication de l'état.
- [C] `CallToAction.astro:37-41` : `<div class="btn">` dans un `<a>`.
- [C] Boutons dans `.content` (`feature/french/-index.md:130`, `location/french/-index.md:51`) : héritent du soulignement des liens de prose. [M] « Découvrez La Localisation… » souligné.
- Correction : §2.5 ; CTA « Réserver » en `btn-primary` dans le header, visible aussi sur mobile (bouton compact à côté du burger ou barre fixe basse) ; `not-prose` sur les boutons en contenu.

**3.4.3 — Cartes et panneaux. Niveau : faible.**
- [C] 7 traitements : `BlogCard` (sans fond ni bordure), encart CTA (`bg-gray-100 shadow-md rounded-lg p-3`), sidebar (`bg-theme-light rounded p-8` et `p-6`), accordéon (`bg-theme-light border rounded-lg`), panneaux formulaire (`bg-gray-50/50 border-gray-100 rounded-lg p-5`), conteneur formulaire (`rounded-xl shadow-sm`), en-tête blog (`rounded-2xl`).
- Correction : un composant `Card` (fond `surface`, `rounded-lg`, `p-6`), sans ombre ou avec l'ombre unique.

**3.4.4 — Tags / pastilles : 3 styles. Niveau : faible.**
- [C] `PostSingle.astro:106` `bg-theme-light px-3 py-1` ; `PostSidebar.astro:45` `bg-white px-3 py-1` ; `categories/index.astro:40` `px-4 py-2 text-xl`.

**3.4.5 — Liens. Niveau : moyen.**
- [C] `src/styles/navigation.scss:39` : hover nav `text-dark` (`#040404`) → `text-primary` (`#121212`). [D] aucun changement perceptible.
- [C] `Header.astro:86` ajoute `.active`, aucune règle CSS ne le cible. [M] l'entrée de menu courante n'est pas signalée.
- [C] Liens hors `.content` (catégories des cartes, footer, méta) sans style : impossible de les distinguer du texte.
- Correction : couleur `primary` + soulignement au survol ; état `active` (soulignement 2 px `accent`).

**3.4.6 — Icônes : 5 sources. Niveau : moyen.**
- [C] `react-icons/fa`, `react-icons/fa6`, `react-icons/io5`, `lucide-react`, SVG inline de chevrons dessinés différemment (`AccordionItem.astro:17`, `Pagination.astro:43`, `BannerSlider.astro:63`), SVG fichiers sable, caractères Unicode ✕ et ★, drapeaux GIF.
- [M] Pictos d'accueil : tailles optiques différentes (boîtes 40×40, 40×40, 24×36, 48×56 pour des viewBox hétérogènes) ; le 4ᵉ picto (plage) n'a pas de chiffre ni de libellé.
- [M] Pictos sable `#E5BF7C` sur blanc : contraste 1,74:1.
- [M] Drapeau britannique seul pour changer de langue : libellé textuel absent.
- Correction : une seule bibliothèque (lucide, déjà dépendance), trait 1,5 px, tailles 20/24 px ; pictos d'accueil avec libellé texte (« 6 voyageurs », « 3 chambres », « 3 salles d'eau », « Accès plage ») ; sélecteur de langue « FR | EN ».

**3.4.7 — FAQ. Niveau : faible.**
- [M] Écart vertical entre items variable (≈ 16 px puis ≈ 11 px) [V : mesure sur capture réduite].
- [C] `index.astro:192` : réponses hors `.content`, non passées par `markdownify`.

### 3.5 Images

**3.5.1 — Filigrane incrusté. Niveau : moyen.**
- [M] « www.location-maison-mer.fr » incrusté en bas à droite des images héro (accueil, Descriptif, Localisation, Réservation) et des vignettes de galerie.
- [M] Carte d'accueil : étiquette « Environnemer » tronquée dans l'image.
- [D] Rendu amateur ; l'URL est déjà dans la barre d'adresse.
- Correction : exporter les visuels sans filigrane ; recadrer la carte.

**3.5.2 — Couvertures d'articles. Niveau : élevé.**
- [M] Page blog : 3 cartes sur 4 visibles affichent la même photo de plage.
- [C] 5 articles FR utilisent `/images/placeholder.jpg` : `activities-ouistreham-rain-pluie`, `contrat-location_saisonniere`, `ouistreham-climate-temperature`, `restaurant-gastronomie`, `specialite-culinaire`.
- Correction : une image propre par article.

**3.5.3 — Ratios et rayons. Niveau : moyen.**
- [M] Images carrées (carrousel, héros, blocs accueil) et images arrondies (cartes, galerie, article) sur les mêmes pages.
- [C] Blocs accueil `index.astro:113-119` : sources 3:4, 4:3, 16:10 demandées en 520×480, sans `object-cover`/`aspect-*`.
- [C] `Gallery.astro:33-34` : `data-pswp-width=1200 height=700` codés en dur alors que les sources varient (1200×800, 1200×900, 2730×1536). [V] déformation ou recadrage des plans dans la lightbox.
- [M] Galerie Descriptif : « Salle de douche indépendante » en portrait dans une vignette paysage, avec bandes blanches.
- Correction : `aspect-[4/3] object-cover rounded-lg` pour toutes les vignettes ; dimensions réelles passées à PhotoSwipe.

**3.5.4 — Images non optimisées. Niveau : moyen.**
- [C] `<img>` bruts sans `width`/`height` : `content/location/french/-index.md:35` (1918×960 JPEG), `content/blog/french/villa-tamaris-history-of-a-normand-house.md:21, 28, 36`.
- [M] Réservation : adresse e-mail composée d'un texte Heebo (« villatamaris ») et d'une image (« @location-maison-mer.fr ») d'une autre police et d'une autre taille (`content/booknow/french/-index.md:38-44`).
- Correction : `ImageMod` partout ; e-mail en texte `mailto:` (protection anti-spam par obfuscation JS si nécessaire).

**3.5.5 — Logo. Niveau : moyen.**
- [M] Header : logo texte « Villa Tamaris - 6 pers » (Signika 700). Footer : camélia rouge seul. Deux identités sans lien visuel.
- [C] `Logo.astro:35-46` : PNG 97×98 affiché en 90×90, donc flou sur écran 2× [V].
- Correction : logotype unique (camélia + « Villa Tamaris »), en SVG, utilisé dans le header et le footer ; retirer « - 6 pers » du logo (information déjà dans les pictos).

### 3.6 Cohérence linguistique (UI)

**Niveau : moyen.**
- [M] Pages FR avec libellés anglais : « Related Posts », « Tags : », « Share : », « Categories », « Tags » (`PostSingle.astro:100, 117, 131`, `PostSidebar.astro:12, 36`).
- [M] Dates en format anglais sur pages FR : « 04 Jul, 2023 », « 24 Dec, 2024 ».
- [M] Auteur « Jml » et « JmL » selon les articles.
- [M] Fil d'Ariane construit depuis le slug : « Cabines De Plage Beach Cabins » (`Breadcrumbs.astro:30, 52`).
- [C] Pages EN avec libellés français dans le formulaire (`BookingConfigurator.tsx:470, 486, 549, 643`).
- [C] Tags « Restaurant » et « Restauration », coquille « Fruis de mer ».
- Correction : tous les libellés via `src/i18n/*.json` ; `Intl.DateTimeFormat(lang)` pour les dates ; fil d'Ariane depuis `title` ; normaliser auteur et taxonomie.

### 3.7 Pages spécifiques

**Accueil `/fr/`**
- Voir 3.2.2, 3.2.3, 3.2.8, 3.3.4, 3.4.6, 3.5.1.
- [M] Coquille de titre : « Localisation de la maison de vacance » (sans s).

**Descriptif**
- Voir 3.3.1, 3.3.2, 3.2.10, 3.5.3.
- [M] Titres « Au Rez de Chaussée: », « Au 1er étage : » : ponctuation finale variable (espace avant « : » absente ou présente). Supprimer les deux-points dans les titres.
- [M] « Equipement » sans accent (« Équipement »).
- [M] Galerie : 4 vignettes par ligne puis 1 vignette orpheline (Extérieur, 5 images). [D] grille pleine avec 3 ou 6 éléments, ou vignettes de largeur adaptative.

**Localisation**
- [M] Titres « Accès : », « A faire : » (« À faire »). Même remarque sur les deux-points.
- [M] Puces rondes grises à très faible contraste.

**Réservation**
- Voir 3.1.2, 3.3.5, 3.5.4.
- [M] Ordre : conditions → planning → contact → formulaire. [D] L'action principale est en bas de page, après ≈ 1 500 px de défilement desktop.
- Correction : formulaire en premier (ou en colonne droite collante), conditions en accordéon.

**Blog / article**
- Voir 3.2.5, 3.2.6, 3.3.3, 3.5.2, 3.6.
- [M] Encart CTA flottant dans le texte (`bg-gray-100`) : texte « à 2h de Paris. Pour vous retrouver… d'un wk. » (abréviation « wk »).

**404**
- [M] « 404 » en Heebo 128 px, H1 en Signika 22 px, bouton « Retour À L'accueil » (casse).
- [C] `404.astro:22` : `<title>` « Page Not Found » sur une page française.

**Avis `/fr/review/`**
- [M] Page hors charte : Helvetica Neue 300, fond blanc, aucune police web chargée, pas de header/footer, hauteur 146 px au chargement.
- [C] `review.astro:13` : `lang="fr"` codé en dur, y compris pour `/en/review/`.
- Correction : utiliser `Base.astro` et les composants communs.

**Footer (toutes pages)**
- [M] « made with Astro.js & Astroplate » en italique gris (`src/config/config.json:27`, `Footer.astro:58`). Niveau : élevé.
- [M] Logo à gauche, texte centré à droite : deux alignements dans le même bloc.
- [M] Ni adresse, ni contact, ni mentions légales visibles.
- Correction : remplacer le copyright par « © 2026 Villa Tamaris · Mentions légales · Contact » ; grille 3 colonnes (identité / navigation / contact).

### 3.8 Accessibilité liée à la qualité perçue

| Élément | Mesure | Niveau |
|---|---|---|
| `gray-400` `#9ca3af` sur blanc (prix, mentions, dates indisponibles du formulaire) | 2,54:1 [calcul] | élevé |
| Pictos sable `#E5BF7C` sur blanc | 1,74:1 [calcul] | moyen |
| `light` `#717171` sur `#f6f6f6` (footer, fil d'Ariane) | 4,52:1 [calcul] | faible |
| Mentions formulaire mobile | 9,6 px [M] | élevé |
| Menu mobile : `input[type=checkbox]` masqué + `<label>` (`Header.astro:59-74`) | non utilisable au clavier [C] | moyen |
| Aucun style `focus-visible` sur `.btn`, `.nav-link`, pagination, carrousel | [C] | moyen |
| Points du carrousel | 8 px de diamètre [C `BannerSlider.astro:170`] | moyen |
| Burger | ≈ 19 px [C `Header.astro:64`] | moyen |
| `aria-current="page"` sur tous les liens de pagination non courants | [C `Pagination.astro:93`] | faible |

Cible : contraste texte ≥ 4,5:1, graphiques porteurs d'information ≥ 3:1, cibles tactiles ≥ 44×44 px.

### 3.9 Résidus du template Astroplate

**Niveau : moyen (maintenance), élevé pour le footer.**
- [C] `package.json` : `"name": "astroplate"`, auteur `zeon.studio`.
- [C] `src/content/sections/french/testimonial.md` : lorem ipsum, « Marvin McKinney » ×4 ; chargé dans `index.astro:36-40`, rendu commenté.
- [C] Composants inutilisés : `AuthorCard`, `Social`, `DynamicIcon`, `Testimonial`, shortcodes `Button`, `Notice`, `Tabs`, `Tab`, `Video`, `Youtube`, `Accordion`.
- [C] CSS inutilisé : `.form-input`, `.form-label`, `.modal*`, `.notice*`, `.tab*`, `.nav-dropdown*`.
- [C] `TwSizeIndicator` inclus dans `Base.astro:124` (masqué hors dev).
- [C] Assets inutilisés : `camelia_cabochon_280 - Copie.png`, `placeholder.png`, `icon_shower.png`, `icon_chien-barre.svg`, `icon_lit-double.svg`, `icon_lit-simple.svg`.

---

## 4. Plan d'action

Ordre proposé. Chaque lot est livrable seul.

| Lot | Contenu | Fichiers principaux | Niveau |
|---|---|---|---|
| 1. Tokens | couleurs §2.1 dans `theme.json` + `tailwind.config.cjs` ; suppression `secondary` vide ; `surface` unique | `src/config/theme.json`, `tailwind.config.cjs`, `src/styles/utilities.scss` | élevé |
| 2. Typographie | racine 16 px ; échelle §2.2 ; graisses chargées = utilisées ; suppression `capitalize` et `text-justify` ; H1 accueil/article/404 | `base.scss`, `buttons.scss`, `components.scss`, `Base.astro`, `index.astro`, `PostSingle.astro`, `404.astro`, `Breadcrumbs.astro` | élevé |
| 3. Mise en page | `section` sur pages villa ; colonne de lecture unique ; `PageHeader` unique ; grille de cartes unique ; titres de section manquants | `feature.astro`, `location.astro`, `book-now.astro`, `PageHeader.astro`, `blog/*`, `categories/*`, `tags/*` | élevé |
| 4. Boutons et CTA | §2.5 ; CTA « Réserver » plein dans le header + mobile ; hover/focus ; `not-prose` | `buttons.scss`, `Header.astro`, `CallToAction.astro`, contenus MD | élevé |
| 5. Formulaire de réservation | migration `gray-*` → tokens ; tailles ≥ 13 px ; grille label/champ ; cases carrées ; ordre de page | `src/components/BookingConfigurator.tsx`, `content/booknow/*` | élevé |
| 6. Images | photos sans filigrane ; couvertures d'articles ; `aspect-*`/`object-cover` ; rayon unique ; `ImageMod` partout ; e-mail texte | `public/images/*`, `index.astro`, `Gallery.astro`, contenus MD | moyen |
| 7. Icônes et logo | lucide seule ; SVG en `currentColor` ; pictos avec libellés ; logotype SVG unique ; sélecteur FR/EN texte | `index.astro`, `Header.astro`, `Footer.astro`, `Logo.astro` | moyen |
| 8. i18n UI | libellés, dates, fil d'Ariane, taxonomie, auteur | `src/i18n/*.json`, `PostSingle.astro`, `PostSidebar.astro`, `BlogCard.astro`, `dateFormat.ts` | moyen |
| 9. Nettoyage | footer, `/review/`, composants/CSS/assets morts, `package.json` | voir §3.9 | moyen |

## 5. Points à vérifier

- Chargement réel de l'iframe Google Agenda sur la page Réservation (blanc observé en navigateur headless).
- Rendu Heebo 700 : gras synthétique ou graisse 600.
- Déformation des plans dans la lightbox PhotoSwipe.
- Netteté du logo camélia sur écran 2×.
- Écarts exacts entre items de la FAQ.
- Conflit effectif entre `container` de `tailwind.config.cjs` et `.container` de `components.scss`.
