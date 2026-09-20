import { THEME_NAMES, THEME_ORDER, type ThemeName, type ThemeOrUnclassified } from "@/config/themes";

type Rule = {
  theme: ThemeName;
  pattern: RegExp;
  weight: number;
};

const RULES: Rule[] = [
  {
    theme: "App Performance & UX",
    weight: 4,
    pattern:
      /\b(crash|crashes|crashing|bug|bugs|lag|laggy|slow|hang|hangs|freeze|frozen|anr|glitch|ui|ux|dashboard|dashboards|navigation|layout|notification|notifications|usability|interface|dark mode|loading|spinner|responsive|design)\b/i,
  },
  {
    theme: "App Performance & UX",
    weight: 5,
    pattern: /\b(not working|doesn't work|does not work|stopped working|app is slow|too slow)\b/i,
  },
  {
    theme: "Investing, Trading & Portfolio",
    weight: 5,
    pattern:
      /\b(stock|stocks|trade|trades|trading|order|orders|execution|portfolio|mutual fund|mutual funds|sip|us stock|us stocks|returns|holdings|broker)\b/i,
  },
  {
    theme: "Money Movement & Payments",
    weight: 5,
    pattern:
      /\b(withdraw|withdrawal|deposit|deposite|bank transfer|upi|refund|payment|payments|payout|add money|transfer|transfers|bank account|banks)\b/i,
  },
  {
    theme: "Support, Account & Verification",
    weight: 5,
    pattern:
      /\b(support|customer care|kyc|onboarding|login|log in|otp|verification|verify|account blocked|can't login|cannot login|password|sign in)\b/i,
  },
  {
    theme: "Features, Charges & Offers",
    weight: 4,
    pattern:
      /\b(fee|fees|charge|charges|brokerage|offer|offers|reward|rewards|pricing|price|commission|missing feature|feature request|subscription)\b/i,
  },
];

export function scoreReview(text: string): Record<ThemeName, number> {
  const scores = Object.fromEntries(THEME_NAMES.map((name) => [name, 0])) as Record<ThemeName, number>;
  for (const rule of RULES) {
    const matches = text.match(new RegExp(rule.pattern, rule.pattern.flags.includes("g") ? rule.pattern.flags : `${rule.pattern.flags}g`));
    if (matches && matches.length > 0) {
      scores[rule.theme] += rule.weight * matches.length;
    }
  }
  return scores;
}

export function classifyReview(text: string): ThemeOrUnclassified {
  const scores = scoreReview(text);
  let best: ThemeOrUnclassified = "Unclassified";
  let bestScore = 0;
  for (const name of THEME_NAMES) {
    const score = scores[name];
    if (score > bestScore) {
      best = name;
      bestScore = score;
    } else if (score === bestScore && score > 0 && THEME_ORDER[name] < THEME_ORDER[best]) {
      best = name;
    }
  }
  return bestScore > 0 ? best : "Unclassified";
}
