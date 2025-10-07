/**
 * Generate HTML for settings screen variations
 * @param {Object} specs - Design specifications
 * @param {string} variationName - Variation name (Minimal, Tabbed, Sidebar)
 * @returns {string} HTML string
 */
module.exports.generateSettingsHTML = function (specs, variationName) {
  const colors = specs.colors || {};
  const primary = colors.primary || '#5E6AD2';
  const accent = colors.accent || '#3D9970';
  const neutral = colors.neutral?.[0] || '#6B7280';
  const bg = colors.background || '#F3F4F6';

  const typography = specs.typography || {};
  const fontFamily = typography.fontFamily || 'Inter';

  const spacing = specs.spacing || {};
  const baseSpacing = spacing.unit || '8px';

  const components = specs.components || {};
  const card = components.card || {};
  const input = components.input || {};
  const button = components.button || {};

  // Different styles based on variation
  const styles = {
    Minimal: {
      layout: 'single-column',
      showSidebar: false,
      showTabs: false,
      sectionSpacing: '2rem',
    },
    Tabbed: {
      layout: 'with-tabs',
      showSidebar: false,
      showTabs: true,
      sectionSpacing: '1.5rem',
    },
    Sidebar: {
      layout: 'with-sidebar',
      showSidebar: true,
      showTabs: false,
      sectionSpacing: '1.5rem',
    },
  };

  const style = styles[variationName] || styles.Minimal;

  const sidebarHTML = style.showSidebar
    ? `
    <div style="width: 240px; background: white; border-radius: ${card.borderRadius || '12px'}; padding: 1.5rem; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'}; height: fit-content;">
      <nav>
        <a href="#" style="display: block; padding: 0.75rem 1rem; margin-bottom: 0.25rem; border-radius: 6px; background: ${primary}10; color: ${primary}; text-decoration: none; font-size: 0.875rem; font-weight: 600;">
          Profil
        </a>
        <a href="#" style="display: block; padding: 0.75rem 1rem; margin-bottom: 0.25rem; border-radius: 6px; color: ${neutral}; text-decoration: none; font-size: 0.875rem;">
          Compte
        </a>
        <a href="#" style="display: block; padding: 0.75rem 1rem; margin-bottom: 0.25rem; border-radius: 6px; color: ${neutral}; text-decoration: none; font-size: 0.875rem;">
          Sécurité
        </a>
        <a href="#" style="display: block; padding: 0.75rem 1rem; margin-bottom: 0.25rem; border-radius: 6px; color: ${neutral}; text-decoration: none; font-size: 0.875rem;">
          Notifications
        </a>
        <a href="#" style="display: block; padding: 0.75rem 1rem; border-radius: 6px; color: ${neutral}; text-decoration: none; font-size: 0.875rem;">
          Préférences
        </a>
      </nav>
    </div>
  `
    : '';

  const tabsHTML = style.showTabs
    ? `
    <div style="border-bottom: 2px solid #E5E7EB; margin-bottom: 2rem;">
      <div style="display: flex; gap: 2rem;">
        <button style="padding: 1rem 0; border: none; background: none; border-bottom: 2px solid ${primary}; margin-bottom: -2px; color: ${primary}; font-weight: 600; font-size: 0.875rem; cursor: pointer;">
          Profil
        </button>
        <button style="padding: 1rem 0; border: none; background: none; color: ${neutral}; font-weight: 500; font-size: 0.875rem; cursor: pointer;">
          Compte
        </button>
        <button style="padding: 1rem 0; border: none; background: none; color: ${neutral}; font-weight: 500; font-size: 0.875rem; cursor: pointer;">
          Sécurité
        </button>
        <button style="padding: 1rem 0; border: none; background: none; color: ${neutral}; font-weight: 500; font-size: 0.875rem; cursor: pointer;">
          Notifications
        </button>
      </div>
    </div>
  `
    : '';

  return `
<div style="min-height: 100%; background: ${bg}; padding: 2rem; font-family: ${fontFamily}, sans-serif;">
  <div style="${style.showSidebar ? 'display: flex; gap: 2rem; max-width: 1200px; margin: 0 auto;' : 'max-width: 800px; margin: 0 auto;'}">

    ${sidebarHTML}

    <div style="flex: 1;">
      <!-- Header -->
      <div style="margin-bottom: 2rem;">
        <h1 style="margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 700; color: #111827;">
          Paramètres
        </h1>
        <p style="margin: 0; color: ${neutral}; font-size: 0.875rem;">
          Gérez vos préférences et paramètres de compte
        </p>
      </div>

      ${tabsHTML}

      <!-- Profile Section -->
      <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: 2rem; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'}; margin-bottom: ${style.sectionSpacing};">
        <h2 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 600; color: #111827;">
          Informations du profil
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
              Prénom
            </label>
            <input
              type="text"
              value="Jean"
              style="width: 100%; height: ${input.height || '40px'}; padding: 0 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem;"
            />
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
              Nom
            </label>
            <input
              type="text"
              value="Dupont"
              style="width: 100%; height: ${input.height || '40px'}; padding: 0 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem;"
            />
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
            Email
          </label>
          <input
            type="email"
            value="jean.dupont@example.com"
            style="width: 100%; height: ${input.height || '40px'}; padding: 0 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem;"
          />
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
            Bio
          </label>
          <textarea
            rows="3"
            style="width: 100%; padding: 0.75rem 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem; font-family: ${fontFamily}, sans-serif; resize: vertical;"
          >Développeur passionné par les technologies web...</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
          <button style="height: ${button.height || '40px'}; padding: 0 1.5rem; background: white; color: ${neutral}; border: 1px solid #E5E7EB; border-radius: ${button.borderRadius || '8px'}; font-weight: 600; font-size: 0.875rem; cursor: pointer;">
            Annuler
          </button>
          <button style="height: ${button.height || '40px'}; padding: 0 1.5rem; background: ${primary}; color: white; border: none; border-radius: ${button.borderRadius || '8px'}; font-weight: 600; font-size: 0.875rem; cursor: pointer;">
            Enregistrer
          </button>
        </div>
      </div>

      <!-- Security Section -->
      <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: 2rem; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'}; margin-bottom: ${style.sectionSpacing};">
        <h2 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 600; color: #111827;">
          Sécurité
        </h2>

        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
            Mot de passe actuel
          </label>
          <input
            type="password"
            placeholder="••••••••"
            style="width: 100%; height: ${input.height || '40px'}; padding: 0 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem;"
          />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              style="width: 100%; height: ${input.height || '40px'}; padding: 0 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem;"
            />
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
              Confirmer mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              style="width: 100%; height: ${input.height || '40px'}; padding: 0 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem;"
            />
          </div>
        </div>

        <button style="height: ${button.height || '40px'}; padding: 0 1.5rem; background: ${primary}; color: white; border: none; border-radius: ${button.borderRadius || '8px'}; font-weight: 600; font-size: 0.875rem; cursor: pointer;">
          Mettre à jour le mot de passe
        </button>
      </div>

      <!-- Notifications Section -->
      <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: 2rem; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'};">
        <h2 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 600; color: #111827;">
          Notifications
        </h2>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #F3F4F6;">
          <div>
            <div style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem;">
              Notifications par email
            </div>
            <div style="font-size: 0.75rem; color: ${neutral};">
              Recevez des mises à jour par email
            </div>
          </div>
          <label style="position: relative; display: inline-block; width: 44px; height: 24px;">
            <input type="checkbox" checked style="opacity: 0; width: 0; height: 0;">
            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: ${primary}; border-radius: 24px; transition: 0.2s;"></span>
          </label>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #F3F4F6;">
          <div>
            <div style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem;">
              Notifications push
            </div>
            <div style="font-size: 0.75rem; color: ${neutral};">
              Notifications dans le navigateur
            </div>
          </div>
          <label style="position: relative; display: inline-block; width: 44px; height: 24px;">
            <input type="checkbox" style="opacity: 0; width: 0; height: 0;">
            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #E5E7EB; border-radius: 24px; transition: 0.2s;"></span>
          </label>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0;">
          <div>
            <div style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem;">
              Notifications marketing
            </div>
            <div style="font-size: 0.75rem; color: ${neutral};">
              Offres et actualités produit
            </div>
          </div>
          <label style="position: relative; display: inline-block; width: 44px; height: 24px;">
            <input type="checkbox" style="opacity: 0; width: 0; height: 0;">
            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #E5E7EB; border-radius: 24px; transition: 0.2s;"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</div>
  `.trim();
};
