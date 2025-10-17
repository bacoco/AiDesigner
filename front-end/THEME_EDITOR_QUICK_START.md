# Theme Editor Pro - Quick Start Guide

Get started with the Theme Editor in 5 minutes!

## 🚀 1. Launch the Editor

```bash
cd front-end
npm install
npm run dev
```

Open: **http://localhost:5173** → Click **"Theme Editor"** tab

## 🎨 2. Edit Your First Color

1. Click **"Colors"** tab (top)
2. Click **"Tokens"** sub-tab
3. Click any color square
4. Pick a new color
5. See it update instantly! ✨

## 🎯 3. Try AI Suggestions

1. Click **"Generate"** tab
2. Enter a base color (e.g., `#3b82f6`)
3. Click **"Generate Suggestions"**
4. Click **"Apply"** on any palette
5. Watch your theme transform! 🤖

## 🌙 4. Create Dark Mode

1. Go to **"Generate"** → **"Dark Mode"**
2. Click **"Generate Dark Theme"**
3. Review the dark version
4. Click **"Apply Dark Theme"**
5. Dark mode ready! 🌙

## 📤 5. Export Your Theme

1. Go to **"Colors"** → **"Export"**
2. Choose format:
   - **CSS** - for custom projects
   - **JSON** - for config files
   - **Tailwind** - for Tailwind CSS
3. Click **"Copy to Clipboard"**
4. Paste into your project! 📋

## 🎬 Bonus: Apply a Preset

1. Click **"Theme"** tab
2. Choose a preset (Ocean, Forest, Sunset, etc.)
3. Click it
4. Instant beautiful theme! 🎨

## 📱 View on Different Devices

1. Look at the preview on the right
2. Click viewport buttons:
   - 📱 Mobile
   - 📱 Tablet
   - 🖥️ Desktop
3. See how it looks everywhere!

## 🎉 See the Showcase

Visit: **http://localhost:5173/showcase**

Or click the ExternalLink icon (🔗) in the main app header.

---

## 🆘 Need Help?

### Common Tasks

**Change background color**:  
Colors → Tokens → Click "Background" → Pick color

**Add rounded corners**:  
Other → Borders → Adjust "Border Radius"

**Make everything bigger**:  
Typography → Font Size → Increase values

**Undo a change**:  
Click ↶ Undo button (top left)

**Reset everything**:  
Click 🔄 Reset button (top)

### Keyboard Shortcuts

- **Ctrl/Cmd + Z** - Undo (when focused)
- **Ctrl/Cmd + Shift + Z** - Redo
- **Tab** - Navigate between inputs
- **Enter** - Apply changes

### Tips

💡 **Tip 1**: Colors update in real-time - no save button needed!  
💡 **Tip 2**: Use the contrast checker to ensure readability  
💡 **Tip 3**: Try the harmony generator for coordinated colors  
💡 **Tip 4**: Export frequently to save your work  
💡 **Tip 5**: Test on mobile before finalizing

---

## 📚 Learn More

- **Full Documentation**: See `THEME_EDITOR_COMPLETE.md`
- **Showcase Guide**: See `THEME_EDITOR_SHOWCASE.md`
- **API Reference**: Check inline code comments

---

## 🎯 Quick Reference

### All Tabs

1. **Theme** - Apply presets
2. **Colors** - Edit tokens, tools, harmonies, export
3. **Typography** - Fonts, sizes, weights
4. **Other** - Borders, spacing, shadows, animations
5. **Generate** - AI suggestions, dark mode, marketplace

### Color Tokens (24 total)

**Background & Surfaces**:

- background, foreground
- card, card-foreground
- popover, popover-foreground

**Brand Colors**:

- primary, primary-foreground
- secondary, secondary-foreground
- accent, accent-foreground

**Semantic**:

- destructive, destructive-foreground
- muted, muted-foreground

**Interactive**:

- border, input, ring

**Charts**:

- chart-1 through chart-5

### Export Formats

```css
/* CSS Variables */
:root {
  --background: #ffffff;
}
```

```json
// JSON
{
  "colors": {
    "background": "#ffffff"
  }
}
```

```js
// Tailwind
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
      },
    },
  },
};
```

---

## ✅ Checklist

Your first theme in 10 steps:

- [ ] Launch app (npm run dev)
- [ ] Open Theme Editor tab
- [ ] Pick a preset (optional)
- [ ] Edit 3-5 key colors
- [ ] Check contrast (Colors → Tools)
- [ ] Adjust typography if needed
- [ ] Test on mobile/tablet/desktop
- [ ] Generate dark mode
- [ ] Export theme
- [ ] Use in your project!

---

**Time to complete**: ~5 minutes  
**Difficulty**: Beginner-friendly  
**Result**: Professional custom theme! 🎨✨
