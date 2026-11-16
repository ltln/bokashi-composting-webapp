import type { Config } from "tailwindcss";

/**
 * Design tokens, extracted from the boards in docs/design/ (PLAN §1, §4.2).
 * Use these instead of ad-hoc hex values, e.g. `bg-bk-ground text-bk-ink`,
 * `rounded-bk-card`, `fill-bk-illo-can-red`, `motion-safe:animate-drop`.
 *
 * Animations touch only transform/opacity. Always apply them with the
 * `motion-safe:` variant; globals.css also disables them under
 * prefers-reduced-motion as a backstop.
 */

const faqTint = (bg: string, fg: string) => ({ bg, fg });

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bk: {
          // Core UI
          ground: "#F6F7F2", // page background
          surface: "#FFFFFF", // cards, nav bar
          ink: "#1E2B22", // body text
          muted: "#56635A", // secondary text
          primary: "#2F6B45",
          "primary-dark": "#1F4D31", // hover, text on tints
          "surface-tint": "#E8EFE2", // animation stage background
          "nav-active": "#E3EEDF", // active bottom-nav tab
          border: "#D3DCCB",
          divider: "#E1E6DC", // nav top border
          "input-border": "#C9D2C1",
          leaf: "#BFE0A8", // logo leaf
          accent: "#E07A2E", // orange: "current" sub-step, progress fill
          "accent-tint": "#FBF1E8", // highlighted checklist row
          "accent-dark": "#B4531B", // warnings
          brown: "#8A7350", // upcoming badge border
          "brown-dark": "#5B4A33", // upcoming badge text, step badge text
            "brown-tint": "#F3EAD7", // step badge background
            "pill-neutral": "#EEF1EA", // neutral compare tag / letter marker
            olive: "#6B7A1F", // stage badge "before" state (FAQ 1)
          // Per-FAQ tint pairs: bg-bk-faq-smell-bg text-bk-faq-smell-fg
          faq: {
            smell: faqTint("#F6E6D2", "#9A4F16"),
            maggots: faqTint("#E7E3F3", "#4F3F85"),
            liquid: faqTint("#DCEAF6", "#1F5C94"),
            mold: faqTint("#E4ECDF", "#2F5B38"),
            disposal: faqTint("#E3EEDF", "#24563A"),
          },
          // Illustration palette for the SVG cross-sections (fill-*/stroke-*)
          illo: {
            "bin-wall": "#A9BCC0",
            "bin-inner": "#F8FBF9",
            "bin-handle": "#8FA6AB",
            bag: "#7FB6CC", // bag / lid outline
            label: "#3F4B43", // SVG annotation text
            "can-red": "#C0392B",
            "can-blue": "#2E86C1",
            "can-yellow": "#D4A017",
            "can-green": "#2F8F5B",
            "can-purple": "#7D5BA6",
            "can-rim": "#CBD2D6",
            paper: "#ECE7DC", // newspaper balls
            "paper-edge": "#B4AC9C",
            cardboard: "#C79B5B",
            "cardboard-line": "#E7D6A2",
            bran: "#E3B04B", // bokashi bran
            "bran-light": "#EADBA9",
            "bran-dark": "#3E3022",
            organic: "#5C4630", // food-waste layer
            "organic-leaf": "#7FA04A",
            "organic-green": "#9BB35A",
            "organic-peel": "#D9822B",
            "fly-body": "#1E2420",
            "fly-wing": "#DDE6F0",
            // Shared illustration props (parts.tsx): liquids, metal, skin, mold, pot.
            water: "#4F9BD3",
            "water-light": "#6DB3E8",
            "water-pale": "#DCE9F4",
            metal: "#A9C4D6",
            "metal-light": "#C9D8E0",
            "metal-dark": "#6E8391",
            skin: "#F2C9A0",
            "skin-line": "#C98D5B",
            bottle: "#F3E5B8",
            pot: "#C8693A",
            "pot-rim": "#B05A2F",
            "lid-handle": "#24563A",
            "mold-pale": "#F6F3EA",
            "mold-pale-edge": "#D6CFBE",
            "mold-mid": "#5B8A4D",
            "mold-green": "#2F6B3A",
            "mold-dark": "#1E2420",
            // Household waste bag + collection bin (FAQ 5b).
            "waste-bag": "#2C3A33",
            "waste-bag-light": "#46574D",
            "waste-bag-shade": "#56685D",
            "waste-bin-green": "#4E8A61",
          },
        },
      },
      borderRadius: {
        "bk-sm": "12px", // step switcher buttons, checklist row
        "bk-md": "14px", // caption bubble, nav tab, FAQ icon tile
        "bk-lg": "18px", // FAQ list rows
        "bk-card": "20px", // checklist card
        "bk-stage": "24px", // animation stage
      },
      fontFamily: {
        sans: ["var(--font-be-vietnam-pro)", "system-ui", "sans-serif"],
      },
      spacing: {
        touch: "44px", // minimum touch target
      },
      minWidth: { touch: "44px" },
      minHeight: { touch: "44px" },
      backgroundSize: { motif: "280px 280px" },
      keyframes: {
        drop: {
          "0%": { transform: "translateY(-70px)", opacity: "0" },
          "15%": { opacity: "1" },
          "70%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "0" },
        },
        fall: {
          "0%": { transform: "translateY(-16px)", opacity: "0" },
          "20%": { opacity: "1" },
          "80%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "0" },
        },
        rise: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "30%": { opacity: ".85" },
          "100%": { transform: "translateY(-22px)", opacity: "0" },
        },
        hover: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shake: {
          "0%, 100%": { transform: "rotate(-28deg)" },
          "50%": { transform: "rotate(-40deg)" },
        },
        buzz: {
          "0%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(5px, -3px)" },
          "50%": { transform: "translate(-2px, -6px)" },
          "75%": { transform: "translate(-5px, -1px)" },
          "100%": { transform: "translate(0, 0)" },
        },
        wiggle: {
          "0%, 100%": { transform: "scaleX(1)" },
          "50%": { transform: "scaleX(.75)" },
        },
        outL: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "75%": { opacity: "1" },
          "100%": { transform: "translateX(-62px)", opacity: "0" },
        },
        outR: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "75%": { opacity: "1" },
          "100%": { transform: "translateX(62px)", opacity: "0" },
        },
        lid: {
          "0%, 30%": { transform: "translateY(-24px)" },
          "70%, 100%": { transform: "translateY(-6px)" },
        },
        // Extra keyframes used by individual boards (FAQ / step 3).
        press: {
          "0%, 100%": { transform: "translateY(-6px)" },
          "50%": { transform: "translateY(2px)" },
        },
        pulse: {
          "0%, 100%": { opacity: ".35" },
          "50%": { opacity: "1" },
        },
        seep: {
          "0%": { transform: "translateY(0)", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { transform: "translateY(120px)", opacity: "0" },
        },
        grow: {
          "0%, 100%": { transform: "scale(.85)" },
          "50%": { transform: "scale(1.1)" },
        },
        sprout: {
          "0%, 100%": { transform: "scale(.8)" },
          "50%": { transform: "scale(1.08)" },
        },
        hop: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(8px)" },
        },
        // Setup step boards (Step2 "fall" and Step3 "lidDown" differ from the FAQ ones above).
        sprinkle: {
          "0%": { transform: "translateY(-50px)", opacity: "0" },
          "20%": { opacity: "1" },
          "75%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "0" },
        },
        settle: {
          "0%": { transform: "translateY(-70px)", opacity: "0" },
          "15%": { opacity: "1" },
          "70%, 90%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "0" },
        },
        spread: {
          "0%": { transform: "scaleY(.3)", opacity: ".6" },
          "55%, 100%": { transform: "scaleY(1)", opacity: "1" },
        },
        // FAQ 3 board: paper balls drop in and stay (unlike `drop`, which fades out).
        faqDrop: {
          "0%": { transform: "translateY(-40px)", opacity: "0" },
          "20%": { opacity: "1" },
          "75%, 100%": { transform: "translateY(0)", opacity: "1" },
        },
        lidSeal: {
          "0%, 30%": { transform: "translateY(-24px)" },
          "70%, 100%": { transform: "translateY(0)" },
        },
        // FAQ 3 board: the bucket's water level rises as the leachate pours in.
        fillUp: {
          "0%": { transform: "scaleY(.08)" },
          "100%": { transform: "scaleY(.85)" },
        },
        // FAQ 3 board: tilt / drain are animations, not transitions, so the
        // player's pause (anim-paused) and reduced motion both stop them.
        tilt: {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "100%": { transform: "rotate(10deg) scale(.78)" },
        },
        untilt: {
          "0%": { transform: "rotate(10deg) scale(.78)" },
          "100%": { transform: "rotate(0deg) scale(1)" },
        },
        drain: {
          "0%": { transform: "scaleY(1)" },
          "100%": { transform: "scaleY(.35)" },
        },
      },
      animation: {
        drop: "drop 2.4s cubic-bezier(.5,0,.9,.6) infinite",
        fall: "fall 1.4s ease-in infinite",
        rise: "rise 2.8s ease-out infinite",
        hover: "hover 2.6s ease-in-out infinite",
        float: "float 3.2s ease-in-out infinite",
        shake: "shake .7s ease-in-out infinite",
        buzz: "buzz 1.1s linear infinite",
        wiggle: "wiggle .8s ease-in-out infinite",
        outL: "outL 2.2s ease-in-out infinite",
        outR: "outR 2.2s ease-in-out infinite",
        lid: "lid 2.6s ease-in-out infinite alternate",
        press: "press 1.2s ease-in-out infinite",
        pulse: "pulse 1.6s ease-in-out infinite",
        seep: "seep 2.6s ease-in infinite",
        grow: "grow 2.4s ease-in-out infinite",
        sprout: "sprout 2.4s ease-in-out infinite",
        hop: "hop 1.6s ease-in-out infinite",
        sprinkle: "sprinkle 1.8s ease-in infinite",
        settle: "settle 2.6s cubic-bezier(.5,0,.9,.6) infinite",
        spread: "spread 2.4s ease-out infinite",
        faqDrop: "faqDrop 2.2s ease-in infinite",
        lidSeal: "lidSeal 2.6s ease-in-out infinite alternate",
        fillUp: "fillUp 2.4s ease-out forwards",
        tilt: "tilt .7s ease-in-out forwards",
        untilt: "untilt .7s ease-in-out forwards",
        drain: "drain 2.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
