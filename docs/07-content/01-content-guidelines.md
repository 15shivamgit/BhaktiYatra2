# Temple Content Guidelines

Content quality is the product. These rules apply to anyone writing or reviewing temple, circuit and tour content, and to any AI-assisted drafting.

**Who writes:** Claude drafts all launch content from research during Phase 3; the owner reviews and approves before publishing (ADR-015).

## Principles

1. **Accurate and sourced.** Timings, fees and rules change. Note the source and date checked in the admin `notes` field (internal). When unsure, write "Timings may vary on festival days; confirm with the temple office" rather than inventing precision.
2. **Respectful and neutral.** Describe beliefs as beliefs ("devotees believe…", "according to the Skanda Purana…"). No ranking of deities or traditions, no political commentary.
3. **Useful first.** A reader with 10 seconds should get: where it is, when it's open, how to reach. Narrative comes after.
4. **Original text.** No copying from Wikipedia or other sites. Paraphrase facts; write descriptions fresh. Keep a sources list internally.
5. **Images with rights.** Only images we own, have licence for, or that are clearly licensed for commercial reuse (CC BY / CC BY-SA with attribution stored in `alt`/notes, or CC0). Record source per image in the upload manifest.

## Required fields to publish (minimum viable temple page)

| Field | Guidance |
|---|---|
| name | Common English name + city qualifier if ambiguous ("Kashi Vishwanath Temple") |
| deity, religion | From suggested lists |
| state, city | Official spellings (Varanasi, not Benares; mention alternate names in description) |
| location | Verified coordinates (Google Maps / OSM); precision 5 decimals |
| shortDescription | 1–2 sentences, ≤ 300 chars, factual; appears in cards and meta |
| description | 200–600 words: what it is, where, why significant, what to expect |
| timings | At least one entry; label seasons if they differ |
| images | ≥ 1, ideally 4–6: exterior, sanctum approach (if photography allowed), surroundings, festival |
| alt text | Describe the image plainly: "Stone shikhara of Kedarnath temple with snow peaks behind" |

Strongly recommended: history (150–400 words), significance (100–300), aarti schedule, 2–5 festivals, best time to visit, how to reach (all four), 3–8 rules, entry fee, official website.

## Style

- British/Indian English spellings (colour, travelling). Sentence case headings.
- Transliteration: common forms (Shiva, Vishnu, Krishna, Ganesha, aarti, darshan, prasad). Italicise Sanskrit terms on first use only if uncommon; add a short gloss: "the *garbhagriha* (sanctum)".
- Numbers: words up to nine, numerals from 10; metres/kilometres; "8th century CE".
- Avoid superlatives without basis ("one of the most…" needs a reason). Avoid "must-visit", "breathtaking".
- Second person is fine for practical advice: "You can hire a pony or palanquin from Gaurikund."
- Paragraphs ≤ 4 sentences. Use H2 for the main sections (the UI adds its own H2s for structured sections; rich text should use H3 inside).

## Structured fields

- **Timings**: `label` like "Darshan (summer)", `open`/`close` 24 h, `note` for breaks ("Closed 12:00–16:00 for bhog").
- **Aarti**: name ("Mangala aarti"), time, note.
- **Festivals**: name, month (number) when fixed by month; `null` for lunar dates with the month range in description ("Maha Shivaratri, February/March").
- **How to reach**: nearest airport with distance ("Jolly Grant, Dehradun, 238 km"), railway, bus stand, road note (trek, pony, helicopter).
- **Rules**: one per line, imperative: "Leather items not allowed inside", "Photography prohibited in the sanctum".
- **Entry fee**: "Free" or itemised "Free; Sugam darshan ₹300".
- **Tags**: lowercase keywords: `jyotirlinga`, `char-dham`, `shakti-peeth`, `himalayan`, `coastal`, `unesco`.

## Circuit content

- Description 150–400 words: meaning of the circuit, traditional order, typical duration, season.
- Order temples in the traditional sequence (Char Dham: Yamunotri → Gangotri → Kedarnath → Badrinath).

## Tour content

- Title: "<Circuit/Place> Yatra — <n> Days from <City>" style, ≤ 70 chars.
- Summary ≤ 300 chars with duration, start city, key stops.
- Itinerary per day: title ("Day 3: Guptkashi to Kedarnath trek"), 60–150 words, meals (B/L/D), stay (town + category).
- Inclusions/exclusions as short noun phrases; be explicit about helicopter, pony, special darshan tickets.
- FAQs: 4–8 honest answers (fitness, weather, senior citizens, children, refunds).

## Review checklist before publish

- [ ] Facts cross-checked with at least one official or reputable source (temple trust site, state tourism, ASI).
- [ ] No copied sentences (spot check with a search).
- [ ] Alt text on all images; primary image chosen; images at least 1600 px wide.
- [ ] Coordinates open the right place in a map.
- [ ] Slug readable and unique.
- [ ] SEO title ≤ 60 chars, description ≤ 160 chars, both specific.
- [ ] Read once on a phone.
