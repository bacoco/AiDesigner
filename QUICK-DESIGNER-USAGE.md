# Quick Designer V4 - Guide d'utilisation

## ✅ LE SYSTÈME FONCTIONNE MAINTENANT !

Quick Designer V4 est un serveur MCP qui génère des variations d'UI à partir de **n'importe quel prompt**, maintient un **Design System cohérent**, et **ajoute progressivement** des variations à votre session.

## 🚀 Installation

### 1. Ajouter à Claude CLI

Ajoute ce serveur à ta config Claude (`~/.claude.json`) :

```json
{
  "mcpServers": {
    "quick-designer": {
      "command": "node",
      "args": ["/Users/loic/develop/BMAD-invisible/quick-designer-standalone.mjs"]
    }
  }
}
```

Ou utilise le script d'installation :

```bash
# Depuis le répertoire BMAD-invisible
node add-to-claude-config.mjs
```

### 2. Vérifier l'installation

```bash
# Test manuel
node test-quick-designer.mjs
```

## 💡 Utilisation avec Claude CLI

### Commandes disponibles

#### 1. `quick_designer_generate` - Générer des variations

Génère des variations d'UI à partir de **n'importe quel prompt**.

**Exemples :**

```bash
# Dashboard
claude "Use quick_designer_generate to create 3 variations of a SaaS analytics dashboard"

# Landing page
claude "Use quick_designer_generate with prompt 'modern startup landing page' and count 5"

# Login
claude "Use quick_designer_generate to make 3 login screens with different layouts"

# Pricing
claude "Use quick_designer_generate for a pricing page with 3 tiers"

# E-commerce
claude "Use quick_designer_generate to create product page variations"

# Custom
claude "Use quick_designer_generate with prompt 'portfolio website for photographer' and count 4"
```

**Paramètres :**

- `prompt` (requis) : Description de l'interface (texte libre)
- `count` (optionnel, défaut: 3) : Nombre de variations (1-8)

#### 2. `quick_designer_add` - Ajouter une variation

Ajoute une **nouvelle variation** à la session en cours avec un **nouveau prompt**.

**Exemples :**

```bash
# Après avoir généré un dashboard, ajoute une page de settings
claude "Use quick_designer_add with prompt 'settings page with user preferences'"

# Ajoute une variation différente
claude "Use quick_designer_add to create a profile page"

# Ajoute encore une autre page
claude "Use quick_designer_add for a notifications center"
```

**Le Design System est conservé** entre toutes les variations !

#### 3. `quick_designer_show` - Voir toutes les variations

Affiche **toutes les variations** de la session dans un viewer HTML avec tabs.

```bash
claude "Use quick_designer_show"
```

Ouvre automatiquement dans le navigateur avec :

- Tabs pour naviguer entre variations
- Navigation clavier (←→)
- Design System unifié

## 🎯 Workflow typique

```bash
# 1. Génère un dashboard
claude "Use quick_designer_generate to create 3 dashboard variations with analytics"

# Résultat: 3 variations de dashboard

# 2. Ajoute une page de pricing
claude "Use quick_designer_add with prompt 'pricing page'"

# Résultat: Maintenant 4 variations total (3 dashboards + 1 pricing)

# 3. Ajoute encore une page
claude "Use quick_designer_add for a contact form"

# Résultat: 5 variations total

# 4. Affiche tout
claude "Use quick_designer_show"

# Résultat: Viewer HTML avec les 5 variations dans des tabs
```

## ✨ Caractéristiques

### ✅ Accepte N'IMPORTE QUEL prompt

```bash
"modern SaaS dashboard"
"landing page for AI startup"
"login with social auth"
"pricing with 3 tiers"
"e-commerce product page"
"blog layout"
"portfolio for designer"
"admin panel"
"settings page"
```

### ✅ Ajoute progressivement des variations

Chaque appel à `quick_designer_add` **ajoute** une variation à la session :

```
Session start
  └─ generate (3 dashboards) → 3 variations
      └─ add (pricing) → 4 variations
          └─ add (contact) → 5 variations
              └─ add (about) → 6 variations
```

### ✅ Conserve le Design System

**Toutes les variations** utilisent les mêmes tokens :

- Couleurs (primary, secondary, accent, neutral...)
- Typographie (fontFamily, scale...)
- Spacing (unit, scale...)
- Components (borderRadius, shadows...)

### ✅ Session persistée

Les sessions sont automatiquement sauvegardées dans `.quick-designer-sessions/`.

Tu peux retrouver tes sessions plus tard.

## 📁 Fichiers générés

```
.quick-designer-sessions/
  └─ qd_1234567890_abc123.json    # Session data

qd-qd_123456789.html              # Viewer HTML (généré par show)
```

## 🧪 Tests

```bash
# Test complet
node test-quick-designer.mjs

# Test avec Claude CLI (si configuré)
claude "Use quick_designer_generate to test the system"
```

## 🎨 Types de pages supportées

Le système détecte automatiquement le type de page et génère le HTML approprié :

- **Dashboard** : Stats, charts, tables
- **Landing** : Hero, features, CTA
- **Auth** : Login, register forms
- **Pricing** : Tier cards, features
- **Form** : Input fields, validation
- **Generic** : Page basique avec header/content

Chaque type a **plusieurs layouts** possibles (cards, sidebar, grid, minimal, split...).

## 💪 Pourquoi ça marche maintenant

✅ **Serveur standalone** - Aucune dépendance complexe
✅ **Session management** - Persistance automatique
✅ **Design System unifié** - Appliqué à toutes les variations
✅ **Ajout progressif** - Construis ton application page par page
✅ **N'importe quel prompt** - Analyse intelligente du type de page

## 🚨 Troubleshooting

### Le serveur ne démarre pas

```bash
# Vérifie que le fichier est exécutable
chmod +x quick-designer-standalone.mjs

# Teste manuellement
node test-quick-designer.mjs
```

### Claude CLI ne voit pas les commandes

```bash
# Vérifie la config
cat ~/.claude.json | grep -A 5 "quick-designer"

# Redémarre Claude CLI
```

### Les variations ne s'affichent pas

```bash
# Le viewer HTML est créé dans le répertoire courant
# Cherche les fichiers qd-*.html
ls qd-*.html
```

## 🎉 C'EST TOUT !

Le système est **100% fonctionnel** :

- ✅ Accepte tous les prompts
- ✅ Génère des variations HTML
- ✅ Maintient le Design System
- ✅ Ajoute progressivement
- ✅ Affiche dans un viewer

**Teste-le maintenant avec Claude CLI !**
