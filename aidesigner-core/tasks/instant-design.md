---
id: instant-design
title: Génération Instantanée d'Écran UI
phase: ui-instant
elicit: true
---

# Génération Instantanée d'Écran UI

## Purpose

Générer instantanément un écran UI complet avec:

- Concepts visuels via Gemini (3 variations)
- Extraction automatique des specs de design
- Génération dans UN SEUL fichier HTML avec tabs
- Preview live avec comparaison côte à côte
- Sélection interactive et Design System évolutif

## Prerequisites

- Chrome DevTools MCP installé (recommandé mais optionnel)
- Navigateur disponible pour preview

## Workflow

### Step 1: Analyser la demande utilisateur

**Parse la demande pour identifier:**

1. **Type d'écran**: login, signup, dashboard, settings, profile, search, checkout, pricing, etc.
2. **Référence de style**: URL fournie (Linear.app, Stripe.com, etc.) ou description
3. **Contexte applicatif**: B2B, B2C, SaaS, e-commerce, mobile, etc.

**Exemples:**

```
"écran de login comme Linear"
→ Type: login
→ Référence: Linear.app
→ Contexte: B2B SaaS

"dashboard analytics pour app e-commerce"
→ Type: dashboard
→ Contexte: e-commerce

"page de pricing comme Stripe avec 3 tiers"
→ Type: pricing
→ Référence: Stripe.com
```

**Si information manquante, poser 1 question max:**
"C'est pour quel type d'app? (B2B SaaS / E-commerce / Mobile / Autre)"

### Step 2: Extraction de référence (si URL fournie)

**Execute:** `extract_design_tokens_from_url`

```javascript
{
  url: 'https://linear.app';
}
```

**Confirmer:**
"✅ Tokens extraits de Linear.app:

- Couleurs: #5E6AD2 (primary), #3D9970 (accent)
- Police: Inter
- Espacement: grille 4px"

### Step 3: Vérifier Design System existant

**Execute:** `get_ui_context`

**Si Design System existe:**
"📋 Design System v1.0 détecté (depuis 'login')
Réutilisation pour cohérence."

**Si pas de Design System:**
"✨ Premier écran! Création du Design System v1.0"

### Step 4: Générer prompt Gemini optimisé

**Créer prompt optimisé selon le type d'écran:**

```markdown
Generate 3 DISTINCT visual concept variations for a [TYPE] screen.

## Visual Constraints

Colors: [Primary], [Accent], [Neutral]
Typography: [Font], sizes, weights
Spacing: [Base unit], scale
Components: [Specific requirements]

## Variations

1. Minimal - Clean, spacious, simple
2. Friendly - Welcoming, rounded, soft
3. Professional - Structured, formal, high contrast

Output: 4 mobile screens per variation (2x2 grid)
```

### Step 5: Générer concepts via Gemini

**Execute:** `automate_gemini_concepts`

```javascript
{
  prompt: "[Prompt Step 4]",
  iterationNumber: 1,
  modelPreference: "auto"
}
```

**Confirmer:**
"⏳ Génération via Gemini... (max 60s)
✅ 3 variations générées!"

### Step 6: Extraire specs de design

**Execute:** `extract_design_specs_from_concepts`

```javascript
{
  imageUrls: ["url1", "url2", "url3"],
  screenType: "login",
  designSystem: {...} // Si existe
}
```

**Résultat:**

```json
{
  "variations": [
    {
      "id": 1,
      "name": "Minimal",
      "specs": {
        "colors": {...},
        "typography": {...},
        "components": {...}
      }
    },
    // ... variations 2 et 3
  ]
}
```

### Step 7: Générer/Mettre à jour le fichier mockup.html

**Execute:** `update_mockup`

```javascript
{
  action: "add_page",
  page: {
    name: "login",
    type: "login",
    variations: [
      { id: 1, name: "Minimal", specs: {...}, html: "..." },
      { id: 2, name: "Friendly", specs: {...}, html: "..." },
      { id: 3, name: "Professional", specs: {...}, html: "..." }
    ]
  },
  designSystem: {...}
}
```

**Cet outil va:**

1. Créer `docs/ui/mockup.html` si n'existe pas
2. Ajouter tab "Login" dans la navigation
3. Générer les 3 variations inline dans le HTML
4. Injecter le CSS du Design System
5. Ajouter scripts de navigation et sélection

**Fichier créé:** `docs/ui/mockup.html` (UN SEUL fichier!)

### Step 8: Ouvrir dans navigateur

**Execute:** `open_mockup_in_browser`

```javascript
{
  mockupPath: "docs/ui/mockup.html",
  activePage: "login"
}
```

**Via Chrome MCP:**

```javascript
navigate_page({ url: 'file:///.../docs/ui/mockup.html#login' });
```

**Confirmer:**
"✅ Maquette ouverte!

📄 Page: Login
🎨 3 variations côte à côte
👉 Clique sur 'Sélectionner' sous ta variation préférée!"

### Step 9: Attendre sélection utilisateur

**Le navigateur affiche:**

```
┌─────────────────────────────────────────────────┐
│ Tabs: [Design System] [Login*]                  │
├─────────────────────────────────────────────────┤
│                                                  │
│ Page: Login                                     │
│                                                  │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│ │ Var 1   │  │ Var 2   │  │ Var 3   │         │
│ │ Minimal │  │ Friendly│  │ Profess.│         │
│ │         │  │         │  │         │         │
│ │ [Login] │  │ [Login] │  │ [Login] │         │
│ │         │  │         │  │         │         │
│ │[Select] │  │[Select] │  │[Select] │         │
│ └─────────┘  └─────────┘  └─────────┘         │
└─────────────────────────────────────────────────┘
```

**Ask:**
"Quelle variation préfères-tu? (1, 2 ou 3)

Ou:

- 'refine' pour ajuster
- 'next [type]' pour passer à l'écran suivant (ex: 'next dashboard')"

### Step 10: Valider sélection

**Si user choisit "3":**

**Execute:** `update_mockup`

```javascript
{
  action: "select_variation",
  page: "login",
  variationId: 3
}
```

**Cet outil va:**

1. Marquer variation 3 avec ✓
2. Mettre à jour tab Design System avec specs de var 3
3. Refresh navigateur (montre ✓ sur variation 3)

**Execute:** Stocker dans project state

```javascript
store_ui_iteration({
  iterationNumber: 1,
  promptsUsed: 'login-prompt',
  userFeedback: 'Variation 3 sélectionnée',
  status: 'validated',
});
```

**Confirmer:**
"✅ Variation 3 'Professional' sélectionnée!

📦 Design System v1.0 mis à jour:

- Couleurs: #5E6AD2, #3D9970
- Police: Inter 400/600/700
- Espacement: 8px grid

✨ Tab 'Design System' actualisé dans la maquette.

**Quel écran maintenant?**
(ex: 'dashboard', 'settings', 'profile')"

### Step 11: Écran suivant avec cohérence

**User:** "dashboard"

**Workflow:**

1. Retour Step 1 avec type "dashboard"
2. Step 3 charge Design System v1.0 → Réutilise specs
3. Génère concepts cohérents
4. Execute `update_mockup` avec action "add_page"
5. Ajoute tab "Dashboard" dans mockup.html
6. Refresh navigateur auto

**Navigateur montre:**

```
┌─────────────────────────────────────────────────┐
│ Tabs: [Design System] [✓Login] [Dashboard*]    │
├─────────────────────────────────────────────────┤
│ Page: Dashboard                                 │
│                                                  │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│ │Dashboard│  │Dashboard│  │Dashboard│         │
│ │ Stats   │  │ Charts  │  │ Tables  │         │
│ │         │  │         │  │         │         │
│ │[Select] │  │[Select] │  │[Select] │         │
│ └─────────┘  └─────────┘  └─────────┘         │
│                                                  │
│ Design: Cohérent avec Login (✓)                │
└─────────────────────────────────────────────────┘
```

**Cohérence automatique:**

- Mêmes couleurs #5E6AD2, #3D9970
- Même police Inter
- Même grille 8px
- Même style de boutons/cards

## Output

### Un seul fichier: `docs/ui/mockup.html`

Structure interne:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Maquette AiDesigner</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      /* Design System CSS */
      :root {
        --primary: #5e6ad2;
        --accent: #3d9970;
        /* etc. */
      }
    </style>
  </head>
  <body>
    <!-- Navigation Tabs -->
    <nav class="tabs">
      <button data-page="design-system">Design System</button>
      <button data-page="login" class="active">✓ Login</button>
      <button data-page="dashboard">Dashboard</button>
    </nav>

    <!-- Page: Design System -->
    <div id="page-design-system" class="page hidden">
      <h1>🎨 Design System v1.0</h1>
      <div class="design-specs">
        <!-- Couleurs, typo, spacing, components -->
      </div>
    </div>

    <!-- Page: Login -->
    <div id="page-login" class="page">
      <h2>Login - Sélectionnez une variation</h2>
      <div class="variation-grid">
        <!-- Variation 1 -->
        <div class="variation-card" data-variation="1">
          <h3>Minimal</h3>
          <div class="preview">
            <!-- HTML inline du login minimal -->
          </div>
          <button onclick="selectVariation('login', 1)">Sélectionner</button>
        </div>
        <!-- Variations 2 et 3... -->
      </div>
    </div>

    <!-- Page: Dashboard -->
    <div id="page-dashboard" class="page hidden">
      <!-- Même structure -->
    </div>

    <script>
      // Navigation entre tabs
      // Sélection de variations
      // Mise à jour Design System
    </script>
  </body>
</html>
```

### Design System persistant

`.aidesigner/design-system.json`:

```json
{
  "version": "1.0.0",
  "colors": {...},
  "typography": {...},
  "spacing": {...},
  "components": {...},
  "pages": [
    {
      "name": "login",
      "selectedVariation": 3,
      "status": "validated"
    },
    {
      "name": "dashboard",
      "selectedVariation": 1,
      "status": "validated"
    }
  ]
}
```

## Notes

### Avantages de l'approche un seul fichier

✅ **Comparaison immédiate**: 3 variations côte à côte
✅ **Navigation facile**: Tabs pour switcher entre pages
✅ **Sélection interactive**: Click sur bouton "Sélectionner"
✅ **Design System live**: Tab dédié qui se met à jour automatiquement
✅ **Pas de gestion de fichiers**: Tout dans mockup.html
✅ **Partageable**: Un seul fichier à envoyer/ouvrir
✅ **Évolutif**: Ajout de pages = ajout de tabs + sections

### Types d'écrans supportés

**Auth:** login, signup, forgot-password, verify-email
**Dashboard:** dashboard, analytics, reports, stats
**Settings:** settings, profile, account, preferences
**E-commerce:** products, cart, checkout, confirmation
**Content:** search, browse, detail
**Marketing:** pricing, landing, features, about

---

**Version**: 1.0.0
**Last Updated**: 2025-10-07
**Status**: ✅ Production Ready
