# Quick Designer v4 - Guide Complet 🚀

## Lancement Rapide

```bash
# Lancer Quick Designer avec Claude CLI
./launch-quick-designer.sh
```

## Commandes Disponibles

### 1. `quick_designer_instant` - Génération Instantanée

Génère un écran avec 3 variations automatiquement.

```
> Use quick_designer_instant with request "modern login screen"
> Use quick_designer_instant with request "dashboard with analytics"
> Use quick_designer_instant with request "pricing page minimal style"
```

### 2. `quick_designer_generate_with_ai` - Génération IA (MAX 8 Variations!)

Utilise Claude pour générer jusqu'à 8 variations distinctes.

```
> Use quick_designer_generate_with_ai with screenType "dashboard", style "modern", variations 8
> Use quick_designer_generate_with_ai with screenType "login", style "gradient", variations 5, inspiration "Linear"
```

**Paramètres:**

- `screenType`: login, dashboard, pricing, landing, signup, settings, profile, checkout, search
- `style`: minimal, modern, bold, playful, professional, gradient, dark
- `variations`: 1-8 (nombre de variations)
- `features`: Liste de fonctionnalités (optionnel)
- `inspiration`: Site de référence (Linear, Stripe, Notion, etc.)

### 3. `quick_designer_batch_generate` - Génération en Batch

Génère plusieurs écrans d'un coup pour créer une app complète.

```
> Use quick_designer_batch_generate with screens [{"type": "login", "style": "modern"}, {"type": "dashboard", "style": "modern"}, {"type": "settings", "style": "modern"}]
```

### 4. `quick_designer_refine` - Raffiner

Ajoute des variations ou applique des ajustements.

```
> Use quick_designer_refine with addVariations 3
> Use quick_designer_refine with adjustments "darker colors, more spacing"
```

### 5. `quick_designer_validate` - Valider

Marque une variation comme validée et met à jour le Design System.

```
> Use quick_designer_validate with variationIndex 0
> Use quick_designer_validate with variationIndex 2, pageIndex 1
```

### 6. `quick_designer_show_system` - Afficher Design System

Montre le Design System actuel.

```
> Use quick_designer_show_system
```

### 7. `quick_designer_open_mockup` - Ouvrir Mockup

Ouvre la maquette interactive dans le navigateur.

```
> Use quick_designer_open_mockup
```

## Exemples de Workflows

### Workflow 1: App Complète Rapide

```
1. Use quick_designer_batch_generate with screens [{"type": "login"}, {"type": "dashboard"}, {"type": "profile"}, {"type": "settings"}]
2. Use quick_designer_open_mockup
3. Use quick_designer_validate with variationIndex 0
```

### Workflow 2: Design Inspiré de Linear

```
1. Use quick_designer_generate_with_ai with screenType "dashboard", inspiration "Linear", variations 6
2. Use quick_designer_refine with adjustments "add dark mode"
3. Use quick_designer_open_mockup
```

### Workflow 3: Landing Page avec 8 Variations

```
1. Use quick_designer_generate_with_ai with screenType "landing", style "gradient", variations 8, features ["hero section", "pricing cards", "testimonials", "footer"]
2. Use quick_designer_open_mockup
3. Use quick_designer_validate with variationIndex 3
```

## Architecture Technique

### Serveur MCP

- **Nom**: quick-designer-v4
- **Port**: Géré par Claude CLI
- **Config**: `mcp/aidesigner-config.json`

### Stockage

- **Sessions**: `.design-library/sessions/`
- **Design Systems**: `.design-library/library/`
- **Mockups**: `docs/ui/mockup.html`

### Technologies

- Pattern Remix pour génération rapide (sans LLM)
- Claude AI pour génération avancée (avec ton plan MAX)
- Chrome MCP pour extraction de design
- Persistence layer pour sauvegarder les sessions

## Features Clés

### 🎨 Design System Unifié

- Cohérence entre toutes les pages
- Extraction depuis URLs de référence
- Persistence entre sessions

### ⚡ Génération Multi-Variations

- Jusqu'à 8 variations par écran
- Layouts distincts, pas juste des changements de couleurs
- Approches UX différentes

### 🔄 Workflow Conversationnel

- Raffinage progressif
- Validation de variations
- Export HTML/CSS

### 🌐 Mockup Interactif

- Editeur de Design System live
- Navigation par tabs
- Preview temps réel

## Troubleshooting

### "Command not found"

```bash
# Rebuild MCP
npm run build:mcp
```

### "Server not starting"

```bash
# Check logs
tail -f ~/.claude/logs/quick-designer-v4.log
```

### "No variations generated"

- Vérifiez que le screenType est valide
- Utilisez des descriptions plus détaillées

## Notes Importantes

1. **Avec plan MAX**: Utilisez `quick_designer_generate_with_ai` pour 8 variations
2. **Sans plan MAX**: Utilisez `quick_designer_instant` (3 variations pattern-based)
3. **Batch mode**: Générez toute une app en une commande
4. **Persistence**: Les sessions sont sauvegardées automatiquement

## Support

- Issues: https://github.com/loic/BMAD-invisible/issues
- Docs: https://docs.aidesigner.com/quick-designer-v4

---

**Quick Designer v4** - _Génération d'UI instantanée avec Claude CLI_
