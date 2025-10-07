/**
 * Generate HTML for pricing screen variations
 * @param {Object} specs - Design specifications
 * @param {string} variationName - Variation name (Simple, Featured, Detailed)
 * @returns {string} HTML string
 */
module.exports.generatePricingHTML = function (specs, variationName) {
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
  const card = components.card || {};

  // Different styles based on variation
  const styles = {
    Simple: {
      tierCount: 2,
      showFeatureDetails: false,
      highlightPopular: false,
      cardPadding: '2rem',
    },
    Featured: {
      tierCount: 3,
      showFeatureDetails: false,
      highlightPopular: true,
      cardPadding: '2rem',
    },
    Detailed: {
      tierCount: 3,
      showFeatureDetails: true,
      highlightPopular: true,
      cardPadding: '2.5rem',
    },
  };

  const style = styles[variationName] || styles.Simple;

  const tiers = [
    {
      name: 'Gratuit',
      price: '0€',
      period: '/mois',
      description: 'Pour commencer',
      features: ['5 projets', '1 Go stockage', 'Support communautaire', 'Accès de base'],
      popular: false,
    },
    {
      name: 'Pro',
      price: '29€',
      period: '/mois',
      description: 'Pour professionnels',
      features: [
        'Projets illimités',
        '100 Go stockage',
        'Support prioritaire',
        'Toutes les fonctionnalités',
        'Analyses avancées',
        'Intégrations',
      ],
      popular: true,
    },
    {
      name: 'Entreprise',
      price: '99€',
      period: '/mois',
      description: 'Pour équipes',
      features: [
        'Tout de Pro',
        'Stockage illimité',
        'Support dédié 24/7',
        'SLA garanti',
        'Sécurité avancée',
        'Onboarding personnalisé',
      ],
      popular: false,
    },
  ];

  const displayTiers = style.tierCount === 2 ? [tiers[0], tiers[1]] : tiers;

  return `
<div style="min-height: 100%; background: ${bg}; padding: 4rem 2rem; font-family: ${fontFamily}, sans-serif;">
  <div style="max-width: 1200px; margin: 0 auto;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 4rem;">
      <h1 style="margin: 0 0 1rem 0; font-size: 2.5rem; font-weight: 700; color: #111827;">
        Tarifs simples et transparents
      </h1>
      <p style="margin: 0; color: ${neutral}; font-size: 1.125rem; max-width: 600px; margin-left: auto; margin-right: auto;">
        Choisissez le plan qui correspond à vos besoins. Changez ou annulez à tout moment.
      </p>
    </div>

    <!-- Billing Toggle (for Featured and Detailed) -->
    ${
      style.tierCount >= 3
        ? `
    <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 3rem;">
      <span style="font-size: 0.875rem; color: ${neutral};">Mensuel</span>
      <label style="position: relative; display: inline-block; width: 52px; height: 28px;">
        <input type="checkbox" style="opacity: 0; width: 0; height: 0;">
        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: ${primary}; border-radius: 28px; transition: 0.2s;"></span>
      </label>
      <span style="font-size: 0.875rem; color: ${neutral};">
        Annuel <span style="background: ${accent}20; color: ${accent}; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">-20%</span>
      </span>
    </div>
    `
        : ''
    }

    <!-- Pricing Cards -->
    <div style="display: grid; grid-template-columns: repeat(${style.tierCount}, 1fr); gap: 2rem; max-width: ${style.tierCount === 2 ? '800px' : '1200px'}; margin: 0 auto;">
      ${displayTiers
        .map(
          (tier, index) => `
        <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: ${style.cardPadding}; box-shadow: ${card.shadow || '0 2px 8px rgba(0,0,0,0.1)'}; ${style.highlightPopular && tier.popular ? `border: 2px solid ${primary}; position: relative; transform: scale(1.05);` : 'border: 1px solid #E5E7EB;'}">

          ${
            style.highlightPopular && tier.popular
              ? `
          <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: ${primary}; color: white; padding: 0.25rem 1rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
            POPULAIRE
          </div>
          `
              : ''
          }

          <div style="text-align: center; margin-bottom: 2rem;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: #111827;">
              ${tier.name}
            </h3>
            <p style="margin: 0 0 1.5rem 0; color: ${neutral}; font-size: 0.875rem;">
              ${tier.description}
            </p>
            <div style="display: flex; align-items: baseline; justify-content: center; margin-bottom: 1.5rem;">
              <span style="font-size: 3rem; font-weight: 700; color: #111827;">
                ${tier.price.replace('€', '')}
              </span>
              <span style="font-size: 1.25rem; color: ${neutral};">
                €${tier.period}
              </span>
            </div>
            <button style="width: 100%; height: ${button.height || '44px'}; background: ${tier.popular ? primary : 'white'}; color: ${tier.popular ? 'white' : primary}; border: ${tier.popular ? 'none' : `2px solid ${primary}`}; border-radius: ${button.borderRadius || '8px'}; font-weight: 600; font-size: 0.9375rem; cursor: pointer;">
              ${tier.name === 'Gratuit' ? 'Commencer gratuitement' : tier.name === 'Entreprise' ? 'Nous contacter' : "Démarrer l'essai"}
            </button>
          </div>

          <div style="border-top: 1px solid #E5E7EB; padding-top: 2rem;">
            ${
              style.showFeatureDetails
                ? `
            <h4 style="margin: 0 0 1rem 0; font-size: 0.875rem; font-weight: 600; color: #111827; text-transform: uppercase; letter-spacing: 0.05em;">
              Fonctionnalités
            </h4>
            `
                : ''
            }

            <ul style="list-style: none; padding: 0; margin: 0;">
              ${tier.features
                .map(
                  (feature) => `
                <li style="display: flex; align-items: start; margin-bottom: ${style.showFeatureDetails ? '1rem' : '0.75rem'};">
                  <svg style="flex-shrink: 0; width: 20px; height: 20px; margin-right: 0.75rem; margin-top: 0.125rem;" viewBox="0 0 20 20" fill="${tier.popular ? primary : accent}">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span style="font-size: ${style.showFeatureDetails ? '0.9375rem' : '0.875rem'}; color: ${style.showFeatureDetails ? '#111827' : neutral};">
                    ${feature}
                  </span>
                </li>
              `,
                )
                .join('')}
            </ul>
          </div>

        </div>
      `,
        )
        .join('')}
    </div>

    <!-- FAQ / Additional Info -->
    ${
      style.showFeatureDetails
        ? `
    <div style="margin-top: 4rem; text-align: center;">
      <p style="color: ${neutral}; font-size: 0.875rem; margin-bottom: 1rem;">
        Tous les plans incluent une garantie satisfait ou remboursé de 30 jours
      </p>
      <div style="display: flex; justify-content: center; gap: 2rem; font-size: 0.875rem;">
        <a href="#" style="color: ${primary}; text-decoration: none; font-weight: 600;">
          Comparer tous les plans
        </a>
        <a href="#" style="color: ${primary}; text-decoration: none; font-weight: 600;">
          FAQ
        </a>
        <a href="#" style="color: ${primary}; text-decoration: none; font-weight: 600;">
          Nous contacter
        </a>
      </div>
    </div>
    `
        : ''
    }

  </div>
</div>
  `.trim();
};
