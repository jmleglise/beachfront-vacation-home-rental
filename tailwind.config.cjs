const theme = require("./src/config/theme.json");

// Charte graphique : toutes les valeurs viennent de src/config/theme.json.
// Ne pas utiliser les palettes Tailwind brutes (gray-*, black, blue-*...) :
// passer par les tokens ci-dessous.
const { theme_color, text_color, state_color } = theme.colors.default;
const { font_family, font_size } = theme.fonts;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  // .container est defini une seule fois dans src/styles/components.scss.
  corePlugins: {
    container: false,
  },
  theme: {
    screens: {
      sm: "540px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    // Deux rayons : 6px (controles, boutons, tags), 12px (cartes, images,
    // panneaux). Les alias md/xl/2xl pointent sur ces deux valeurs.
    borderRadius: {
      none: "0",
      sm: "4px",
      DEFAULT: "6px",
      md: "6px",
      lg: "12px",
      xl: "12px",
      "2xl": "12px",
      full: "9999px",
    },
    // Trois niveaux : sm (champs), DEFAULT (cartes), lg (surcouches).
    boxShadow: {
      none: "none",
      sm: "0 1px 2px rgba(4, 4, 4, 0.05)",
      DEFAULT: "0 4px 24px rgba(4, 4, 4, 0.06)",
      lg: "0 12px 40px rgba(4, 4, 4, 0.14)",
    },
    extend: {
      colors: {
        text: text_color.default,
        light: text_color.light,
        dark: text_color.dark,
        primary: {
          DEFAULT: theme_color.primary,
          dark: theme_color.primary_dark,
        },
        accent: {
          DEFAULT: theme_color.accent,
          strong: theme_color.accent_strong,
        },
        body: theme_color.body,
        border: theme_color.border,
        surface: theme_color.surface,
        success: {
          DEFAULT: state_color.success,
          light: state_color.success_light,
        },
        error: {
          DEFAULT: state_color.error,
          light: state_color.error_light,
        },
      },
      fontSize: {
        base: font_size.base + "px",
        h1: font_size.h1,
        "h1-sm": font_size.h1_sm,
        h2: font_size.h2,
        "h2-sm": font_size.h2_sm,
        h3: font_size.h3,
        "h3-sm": font_size.h3_sm,
        h4: font_size.h4,
        "h4-sm": font_size.h4_sm,
        h5: font_size.h5,
        h6: font_size.h6,
      },
      fontFamily: {
        primary: [font_family.primary, font_family.primary_type],
        secondary: [font_family.secondary, font_family.secondary_type],
      },
      maxWidth: {
        measure: "70ch",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("tailwind-bootstrap-grid")({
      generateContainer: false,
      gridGutterWidth: "2rem",
      gridGutters: {
        1: "0.25rem",
        2: "0.5rem",
        3: "1rem",
        4: "1.5rem",
        5: "3rem",
      },
    }),
  ],
};
