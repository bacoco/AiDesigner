# AiDesigner NG — Chrome MCP × Gemini/Nano Banana Strategy Pack

Parfait — je reprends TOUT avec les nouvelles sources, j’intègre les contraintes (“jamais Playwright, uniquement Chrome DevTools MCP”), j’exploite Gemini 2.5 Flash Image / Nano Banana, SuperDesign, Drawbridge, et la liste Awesome UI Component Library. Tu obtiens ci-dessous :

1. **Un top-ideas concret** (impact × faisabilité)
2. **Un PRD actionnable** (Personae, KPIs, scénarios)
3. **Une Tech Spec prête pour dev** (schémas JSON, flows MCP, playbooks de tests, rapports)

---

## 1. Short-list des meilleures idées

1. **Token Inference + Evidence Pack** — Extraire tokens et générer un evidence pack complet depuis Chrome MCP (DOM/CSSOM/a11y, captures multi-états, heatmaps répétition) pour garantir confiance.
2. **Contrats “Design-Locked”** — Chaque génération (image → UI → code) contrainte par `tokens.json` + `components.map.json` avec validateurs (contraste, spacing, grille).
3. **Nano Banana comme “UI Vision Oracle”** — Décrire précisément les écrans (composants, hiérarchie) et croiser ces faits avec les données MCP.
4. **“Visual-to-HTML” assisté** — Convertir concepts (Nano Banana/Gemini) en HTML/React mappé sur Shadcn/MUI/Ant/Chakra.
5. **Chrome MCP Debug Loop** — Inspection et autocorrection via `dom_snapshot`, `cssom_dump`, `console_get_messages`, `performance_trace`.
6. **Drawbridge-style edits, MCP-native** — Annoter l’UI dans le navigateur et générer des patches AST diff.
7. **Intégration SuperDesign** — Prompts enrichis par tokens pour générer variations, mappées aux composants.
8. **Graphe interne** — Tokens ⇄ Components ⇄ Pages ⇄ Tests pour impact analysis & journey checks.
9. **Bench & coûts réalistes** — Latence & coûts cibles pour Gemini/Nano Banana.
10. **Sécurité/IP (“Legal-Safe Mode”)** — Sandboxing MCP, SynthID, distillation de style.

---

## 2. PRD — AiDesigner NG (Chrome MCP × Gemini/Nano Banana)

### Objectif

Créer le designer + debugger UI de référence : récupération de styles, génération design-locked, validation en boucle via Chrome MCP.

### Personae & Jobs-to-be-Done

- **UI Designer** — Comprendre le système visuel et itérer on-brand.
- **Front Dev** — Recevoir du code propre mappé sur la lib UI cible, avec tests.
- **Lead/QA** — Vérifier respect accessibilité, responsive, tokens.

### Capabilités clé (MVP+)

1. URL → Tokens/Patterns (MVP)
2. Image/Mockup → Concepts design-locked (MVP)
3. Concept → HTML/React mappé (MVP+)
4. Chrome MCP Debug Loop (MVP+)
5. Evidence Pack & Rapports (MVP)
6. Graph Impact View (V2)

### KPIs

- Time-to-first-prototype ↓ 60 %
- Générations “design-locked” ≥ 80 %
- Drift visuel ≤ 5 % (P95)
- 0 erreur console bloquante après auto-correction
- Adoption lib UI : ≥ 2 cibles (Shadcn + MUI)

### Scénarios prioritaires

S1: Aspirer un style depuis URL → tokens + evidence.
S2: Transformer un concept image en page HTML.
S3: Ouvrir l’URL, corriger erreurs console & contrastes via MCP.
S4: Exporter React + Stories + tests visuels/a11y.

### Hors-scope MVP

Pas de Playwright, pas de backend/state, respect des politiques d’images.

---

## 3. Tech Spec prête pour dev

### Architecture logique

- **Inspector (MCP)** — Collecte DOM/CSSOM/a11y/console/perf, inférence tokens, evidence pack.
- **Designer (Vision)** — Nano Banana/Gemini : concepts, descriptions, cohérence multi-images.
- **Builder (Codegen)** — Spéc canonique → HTML/React mappé libs, Stories, tests, patches.
- **Orchestrateur** — Séquence déterministe, artefacts, métriques.

### Schémas de contrats (JSON)

- `tokens.json` — palette, typo, spacing, modes, contraintes.
- `components.map.json` — détection, variants, states, a11y, mappings.
- `evidence.manifest.json` — artefacts (screenshots, css dumps, console, perf, diffs).

### Flows Chrome MCP (pseudo API)

1. Analyse URL → `browser.open`, `devtools.dom_snapshot`, `devtools.cssom_dump`, `devtools.capture_screenshot`, `devtools.console_get_messages`, `devtools.performance_start_trace`/`stop_trace`, inférence tokens, validateurs.
2. Génération contrainte → `vision.describe`, enrichissement prompt, `vision.generate`, codegen, validation.
3. Debug/autofix → lecture console, corrections AST, revalidation, before/after.

### Prompting (Nano Banana / Gemini)

- Contraintes dures injectées (palette, typo, spacing, grid, contrast).
- Cohérence multi-images, style transfer contrôlé, edits localisés.

### Mapping libs UI

- Registry pour Shadcn/MUI/Ant/Chakra, aligné sur awesome list.
- Codemods assurant parité props (`intent`→`variant`/`color`, suppression inline styles, injection tokens).

### Graph interne

- Nœuds : Token, Component, Page, Test, Defect, Edit.
- Arêtes : uses, violates, generates, fixes, impacts.
- Usages : impact analysis, journey coherence, gating QA.

### Sécurité/Compliance

- Sandbox Chrome MCP, egress control, storage éphémère.
- Sanitisation anti prompt-injection.
- Legal-Safe Mode : distillation style, SynthID.

---

## 4. Playbooks de tests & qualité

1. **URL → Tokens** — Stabilité ≥ 90 %, coverage composants ≥ 85 %, evidence complet.
2. **Image → HTML/React** — Drift ≤ 5 %, contraste ≥ 4.5:1, hit area ≥ 44 px, lint/TS OK, Stories/tests générés.
3. **Debug Loop MCP** — 0 erreurs console, pas de régression perf (CLS/LCP), rapport before/after.

---

## 5. Rapports exemples

- **Design Debt Report** — Violations tokens, drift spacing, issues a11y.
- **Evidence Pack** — Screenshots desktop/mobile/dark, console errors avant/après, perf trace, diffs CSS/HTML.

---

## 6. Roadmap (8–12 semaines)

1. S1-2 — Foundations MCP & inférence tokens.
2. S3-4 — Vision contrainte (prompts, validateurs).
3. S5-7 — Codegen & mapping libs.
4. S8-10 — Drawbridge-like overlay & diff.
5. S11-12 — Graph & reporting consolidé.

---

## 7. Modules & APIs internes

- Packages : `mcp-inspector`, `inference`, `vision`, `canonical-spec`, `mappers`, `validators`, `codegen`, `apps/aidesigner`.
- APIs TypeScript : `analyzeUrl`, `describeUI`, `generateConcepts`, `buildReact`, `validateAll`, `autofixConsole`.

---

## 8. Résumé stakeholder (deck)

- Vision : “Le navigateur devient l’atelier de design intelligent.”
- Différenciateurs : Token inference + Design-Locked generation + MCP debug loop.
- ROI : −60 % TTFP, −40 % retours QA, +80 % parité design/code.
- Risques : IP, prompt-injection, mapping incomplet → garde-fous (Legal-Safe, sandbox, validators).
- Preuves : Evidence packs, rapports de drift, Stories/tests.

---

## 9. Références clés

- Chrome DevTools MCP — blog, repo server.
- Gemini 2.5 Flash Image / Nano Banana — doc, pricing, latence.
- UX Planet — techniques d’édition Nano Banana.
- SuperDesign — design agent open-source.
- Drawbridge — workflow d’annotation visuelle.
- Awesome UI Component Library — mapping libs.
- Dataïads — contexte Nano Banana.
