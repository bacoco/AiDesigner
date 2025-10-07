/**
 * Generate HTML for signup screen variations
 * @param {Object} specs - Design specifications
 * @param {string} variationName - Variation name (Minimal, Social, Progressive)
 * @returns {string} HTML string
 */
module.exports.generateSignupHTML = function (specs, variationName) {
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
      showSocial: false,
      showProgress: false,
      fieldLayout: 'single',
    },
    Social: {
      containerPadding: '2.5rem',
      inputSpacing: '1.25rem',
      showSocial: true,
      showProgress: false,
      fieldLayout: 'single',
    },
    Progressive: {
      containerPadding: '3rem',
      inputSpacing: '1.5rem',
      showSocial: false,
      showProgress: true,
      fieldLayout: 'grid',
    },
  };

  const style = styles[variationName] || styles.Minimal;

  return `
<div style="min-height: 100%; display: flex; align-items: center; justify-content: center; background: ${bg}; padding: 2rem; font-family: ${fontFamily}, sans-serif;">
  <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: ${style.containerPadding}; box-shadow: ${card.shadow || '0 4px 6px rgba(0,0,0,0.1)'}; max-width: ${style.fieldLayout === 'grid' ? '600px' : '400px'}; width: 100%;">

    <h1 style="margin: 0 0 0.5rem 0; font-size: 1.75rem; font-weight: 700; color: ${neutral};">
      Créer un compte
    </h1>
    <p style="margin: 0 0 ${style.inputSpacing} 0; color: ${neutral}; font-size: 0.875rem;">
      Commencez gratuitement dès aujourd'hui
    </p>

    ${
      style.showProgress
        ? `
    <div style="margin-bottom: 2rem;">
      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
        <div style="flex: 1; height: 4px; background: ${primary}; border-radius: 2px;"></div>
        <div style="flex: 1; height: 4px; background: #E5E7EB; border-radius: 2px;"></div>
        <div style="flex: 1; height: 4px; background: #E5E7EB; border-radius: 2px;"></div>
      </div>
      <p style="margin: 0; font-size: 0.75rem; color: ${neutral};">
        Étape 1 sur 3 - Informations de base
      </p>
    </div>
    `
        : ''
    }

    ${
      style.showSocial
        ? `
    <div style="margin-bottom: 1.5rem;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <button style="padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: ${button.borderRadius || '8px'}; background: white; font-size: 0.875rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Google
        </button>
        <button style="padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: ${button.borderRadius || '8px'}; background: white; font-size: 0.875rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <svg width="18" height="18" viewBox="0 0 16 16"><path fill="#333" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          GitHub
        </button>
      </div>
      <div style="text-align: center; margin-bottom: 1rem; color: #9CA3AF; font-size: 0.875rem; position: relative;">
        <span style="background: white; padding: 0 1rem; position: relative; z-index: 1;">ou avec email</span>
        <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #E5E7EB; z-index: 0;"></div>
      </div>
    </div>
    `
        : ''
    }

    <form>
      <div style="${style.fieldLayout === 'grid' ? 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;' : ''} margin-bottom: ${style.inputSpacing};">
        <div ${style.fieldLayout === 'single' ? `style="margin-bottom: ${style.inputSpacing};"` : ''}>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
            Prénom
          </label>
          <input
            type="text"
            placeholder="Jean"
            style="width: 100%; height: ${input.height || '40px'}; padding: 0 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem;"
          />
        </div>

        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: ${neutral};">
            Nom
          </label>
          <input
            type="text"
            placeholder="Dupont"
            style="width: 100%; height: ${input.height || '40px'}; padding: 0 1rem; border: ${input.border || '1px solid #E5E7EB'}; border-radius: ${input.borderRadius || '6px'}; font-size: 0.875rem;"
          />
        </div>
      </div>

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
        <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; color: ${neutral};">
          Au moins 8 caractères avec lettres et chiffres
        </p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label style="display: flex; align-items: start; cursor: pointer;">
          <input type="checkbox" style="margin-top: 0.25rem; margin-right: 0.5rem;" />
          <span style="font-size: 0.75rem; color: ${neutral};">
            J'accepte les <a href="#" style="color: ${primary}; text-decoration: none;">conditions d'utilisation</a> et la <a href="#" style="color: ${primary}; text-decoration: none;">politique de confidentialité</a>
          </span>
        </label>
      </div>

      <button
        type="submit"
        style="width: 100%; height: ${button.height || '40px'}; background: ${primary}; color: white; border: none; border-radius: ${button.borderRadius || '8px'}; font-weight: 600; font-size: 0.9375rem; cursor: pointer; margin-bottom: 1rem;"
      >
        ${style.showProgress ? 'Continuer' : 'Créer mon compte'}
      </button>

      <div style="text-align: center; font-size: 0.875rem; color: ${neutral};">
        Vous avez déjà un compte?
        <a href="#" style="color: ${primary}; text-decoration: none; font-weight: 600;">
          Se connecter
        </a>
      </div>
    </form>

  </div>
</div>
  `.trim();
};
