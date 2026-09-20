export const THEMES = [
  {
    id: 1,
    name: "App Performance & UX",
    definition:
      "Speed, crashes, bugs, navigation, layout, dashboards, notifications, general usability",
  },
  {
    id: 2,
    name: "Investing, Trading & Portfolio",
    definition:
      "Buying and selling, order execution, US stocks, mutual funds, portfolio views, returns",
  },
  {
    id: 3,
    name: "Money Movement & Payments",
    definition:
      "Deposits, withdrawals, bank transfers, UPI, failed or delayed payments, refunds",
  },
  {
    id: 4,
    name: "Support, Account & Verification",
    definition:
      "Customer support, KYC, onboarding, login and OTP, account access",
  },
  {
    id: 5,
    name: "Features, Charges & Offers",
    definition:
      "Missing features, fees and charges, offers, rewards, pricing",
  },
] as const;

export const UNCLASSIFIED = "Unclassified" as const;

export type ThemeName = (typeof THEMES)[number]["name"];
export type ThemeOrUnclassified = ThemeName | typeof UNCLASSIFIED;

export const THEME_NAMES: ThemeName[] = THEMES.map((theme) => theme.name);

export const THEME_ORDER: Record<ThemeOrUnclassified, number> = {
  "App Performance & UX": 1,
  "Investing, Trading & Portfolio": 2,
  "Money Movement & Payments": 3,
  "Support, Account & Verification": 4,
  "Features, Charges & Offers": 5,
  Unclassified: 99,
};

export function isOfficialTheme(value: string): value is ThemeName {
  return THEME_NAMES.includes(value as ThemeName);
}

export function themeByName(name: ThemeName) {
  return THEMES.find((theme) => theme.name === name)!;
}
