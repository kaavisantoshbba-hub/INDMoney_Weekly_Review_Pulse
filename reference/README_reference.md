# INDMoney Weekly Review Pulse

A one-page weekly pulse built from public App Store + Google Play reviews, plus a draft email to go with it.

## Workflow

```
Import  →  Group  →  Generate note  →  Draft email
```

1. **Import.** Load the review export (`Platform, Date, Rating, Title, Review`), keep the last 8–12 weeks, and redact personal identifiers.
2. **Group.** Assign reviews to the five-theme taxonomy below during the run. The input has no theme column. Generic or insufficiently detailed reviews are not forced into a theme. The pulse reports the top 3.
3. **Generate note.** One page, 250 words or fewer: top 3 themes with review counts and shares, 3 verbatim user quotes, 3 recommended actions.
4. **Draft email.** A plain-text draft (subject + body) to paste into Gmail and leave unsent.

A person should review the theme counts, the quote choices and the actions before anything is sent. The final interactive prototype adds an AI/prompting layer to the Generate note stage (see [AI / prompting layer](#ai--prompting-layer)).

## What's in this package

| Path | Purpose |
|---|---|
| `data/INDmoney_Reviews_Clean.csv` | Cleaned input: the five columns only (no `Theme` column), all 1,323 reviews |
| `weekly_pulse.py` | Script that runs the workflow above |
| `themes.py` | Keyword rules used by the script's first-pass grouping |
| `quotes_pinned.json` | The three selected quotes, in full and exactly as written in the reviews |
| `actions.json` | The recommended actions |
| `assets/` | Note styling and embedded fonts (Newsreader, IBM Plex Sans; SIL OFL, licenses included) |

The Weekly Pulse (PDF) and the Email Draft (TXT) are delivered alongside this package.

## Dataset

| | |
|---|---|
| Reviews | 1,323 |
| Window | 27 June – 18 September 2026 (12 weeks) |
| Platforms | Google Play 1,195 · App Store 128 |
| Columns | `Platform, Date, Rating, Title, Review` |
| Titles | Blank for every Google Play review |
| Encoding | UTF-8 with BOM, so Excel shows emoji and Hindi text correctly (208 reviews contain emoji or Hindi script) |

The cleaned prototype input contains only `Platform, Date, Rating, Title, Review`. There is no `Theme` column; themes are assigned as part of the workflow.

## Validated theme counts (as reported in the Weekly Pulse)

| # | Theme | Reviews | Share |
|---|---|---|---|
| 01 | App Performance & UX | 272 | 20.6% |
| 02 | Investing, Trading & Portfolio | 207 | 15.6% |
| 03 | Money Movement & Payments | 105 | 7.9% |

Shares are of the 1,323 reviews analyzed. The pulse reports only the validated Top 3; no counts are reported for themes 4 and 5.

## Theme legend

The project uses this five-theme taxonomy (maximum 5 themes):

1. App Performance & UX
2. Investing, Trading & Portfolio
3. Money Movement & Payments
4. Support, Account & Verification
5. Features, Charges & Offers

- **Reported.** The current weekly pulse reports the Top 3 (themes 1–3) with the counts above.
- **Not forced.** Generic or insufficiently detailed reviews are left out of the themes rather than assigned to one.
- **Current script.** The keyword rules in `themes.py` come from an early prototype. They do not yet implement this taxonomy (themes 4 and 5 use earlier names), so a run of the current script will not reproduce the counts above. Theme assignment in the interactive prototype will follow this taxonomy.

## AI / prompting layer

Challenge 5 tests LLMs and prompting: summarization, quote selection and tone control. The final interactive prototype will demonstrate an AI/prompting layer for the Generate note stage. The scripts in this package do not call an LLM yet: themes are assigned by keyword rules, and quotes are pinned by hand or picked by simple rules.

## Re-run for a new week

1. **Export** the latest 8–12 weeks of public reviews from the App Store and Google Play into one CSV with only the columns `Platform, Date, Rating, Title, Review` (no `Theme` column). `Date` is `dd-mm-yyyy hh:mm:ss`; `Title` may be blank. Use public exports only.
2. **Put the file in `data/`** (for example `data/reviews_week_38.csv`). Review it for privacy: redact PII where necessary, and skim for identifiers the automatic rules can miss, such as partially masked transaction IDs.
3. **Review quote selection.** Delete the entries in `quotes_pinned.json` (or the file) so last week's quotes are not reused. Pinned quotes must appear word for word in the data, or the run stops. With no pins, three quotes are picked automatically as a fallback. Whichever route you use, check each quote against its source review and confirm it is shown in full (see Quotes).
4. **Run:**
   ```bash
   pip install -r requirements.txt        # pandas; add playwright + `playwright install chromium` for --pdf
   python weekly_pulse.py --input data/reviews_week_38.csv --weeks 12 --sender Kavya --pdf
   ```
   `--weeks` sets the look-back window (8–12 weeks). Use `--as-of 2026-09-18` to end the window on a set date.
5. **Check the console summary:** window dates, theme counts, PII redactions, quote source (`pinned` or `auto`) and note length. The run fails if the note goes over 250 words.
6. **Review, then paste** `email_draft.txt` into a new Gmail compose window and leave it unsent.

A run writes these files to `output/`:

| File | What it is |
|---|---|
| `weekly_pulse.pdf` / `.html` / `.md` | The one-page note (A4) |
| `email_draft.txt` | Subject line + body |
| `reviews_themed_redacted.csv` | Working output with an extra `Theme` column. Never an input, and not the cleaned dataset |

## Privacy

- Public review exports only. The source export uses only the columns `Platform, Date, Rating, Title, Review`; identifiers can still appear within review text and are redacted where necessary.
- `INDmoney_Reviews_Clean.csv` was made from the original export without changing it. All 1,323 rows are kept, and every date, rating, title and platform is identical to the original. Four review cells were changed to remove identifier-like text: one email address, two @-handles and one partially masked transaction ID. They now read `[email]`, `[handle]` and `[id]`. The email and one handle belong to the company, not a reviewer. The remaining review text is untouched.
- When run, the script also redacts email addresses, links, @-handles and phone-length digit strings before grouping.
- The note and email contain no usernames, emails, IDs or other unnecessary personal identifiers. PII is redacted where necessary.

## Quotes

- Exactly 3 real user quotes are used in the weekly pulse.
- Quotes come directly from the review dataset.
- Each selected quote is shown in full.
- Quotes are reproduced verbatim: spelling, grammar, capitalization and punctuation are preserved.
- No truncating, paraphrasing, summarizing, rewriting or cleaning up the wording.

The three quotes in the current weekly pulse are full review texts and remain verbatim. The script checks that each pinned quote appears word for word in the data; confirming that a quote is the full review is a manual step.
