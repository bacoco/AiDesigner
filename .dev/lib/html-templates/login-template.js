/**
 * Generate HTML for login screen variations
 * @param {Object} specs - Design specifications
 * @param {string} variationName - Variation name (Minimal, Friendly, Professional)
 * @returns {string} HTML string
 */
module.exports.generateLoginHTML = function (specs, variationName) {
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
  const button = components.button || {};
  const input = components.input || {};
  const card = components.card || {};

  // Different styles based on variation
  const styles = {
    Minimal: {
      containerPadding: '3rem',
      inputSpacing: '1rem',
      buttonStyle: 'simple',
      showSocial: false,
    },
    Friendly: {
      containerPadding: '2.5rem',
      inputSpacing: '1.25rem',
      buttonStyle: 'rounded',
      showSocial: true,
    },
    Professional: {
      containerPadding: '3rem',
      inputSpacing: '1.5rem',
      buttonStyle: 'formal',
      showSocial: true,
    },
  };

  const style = styles[variationName] || styles.Minimal;

  return `
<div style="min-height: 100%; display: flex; align-items: center; justify-content: center; background: ${bg}; padding: 2rem; font-family: ${fontFamily}, sans-serif;">
  <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: ${style.containerPadding}; box-shadow: ${card.shadow || '0 4px 6px rgba(0,0,0,0.1)'}; max-width: 400px; width: 100%;">

    <h1 style="margin: 0 0 ${style.inputSpacing} 0; font-size: 1.75rem; font-weight: 700; color: ${neutral};">
      Connexion
    </h1>

    <form>
      <div style="margin-bottom: ${style.inputSpacing};">
        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
          Email
        </label>
        <input
          type="email"
          placeholder="vous@example.com"
          style="width: 100%; height: ${input.height || '40px'}; padding: 0 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem;"
        />
      </div>

      <div style="margin-bottom: ${style.inputSpacing};">
        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
          Mot de passe
        </label>
        <input
          type="password"
          placeholder="••••••••"
          style="width: 100%; height: ${input.height || '40px'}; padding: 0 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem;"
        />
      </div>

      <div style="margin-bottom: 1.5rem; text-align: right;">
        <a href="#" style="font-size: 0.875rem; color: ${primary}; text-decoration: none;">
          Mot de passe oublié?
        </a>
      </div>

      <button
        type="submit"
        style="width: 100%; height: ${button.height || '40px'}; background: ${primary}; color: white; border: none; border-radius: ${button.borderRadius || '8px'}; font-weight: 600; font-size: 0.9375rem; cursor: pointer;"
      >
        Se connecter
      </button>

      ${
        style.showSocial
          ? `
      <div style="margin-top: 1.5rem;">
        <div style="text-align: center; margin-bottom: 1rem; color: #9CA3AF; font-size: 0.875rem;">
          Ou continuer avec
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <button style="padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: ${button.borderRadius || '8px'}; background: white; font-size: 0.875rem; cursor: pointer;">
            Google
          </button>
          <button style="padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: ${button.borderRadius || '8px'}; background: white; font-size: 0.875rem; cursor: pointer;">
            GitHub
          </button>
        </div>
      </div>
      `
          : ''
      }

      <div style="margin-top: 2rem; text-align: center; font-size: 0.875rem; color: ${neutral};">
        Pas encore de compte?
        <a href="#" style="color: ${primary}; text-decoration: none; font-weight: 600;">
          S'inscrire
        </a>
      </div>
    </form>

  </div>
</div>
  `.trim();
};
