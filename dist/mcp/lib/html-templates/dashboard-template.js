/**
 * Generate HTML for dashboard screen variations
 * @param {Object} specs - Design specifications
 * @param {string} variationName - Variation name (Minimal, Analytics, DataRich)
 * @returns {string} HTML string
 */
module.exports.generateDashboardHTML = function (specs, variationName) {
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

  // Different styles based on variation
  const styles = {
    Minimal: {
      statsLayout: 'grid-template-columns: repeat(2, 1fr)',
      showCharts: false,
      showTable: false,
      cardPadding: '1.5rem',
    },
    Analytics: {
      statsLayout: 'grid-template-columns: repeat(4, 1fr)',
      showCharts: true,
      showTable: false,
      cardPadding: '1.25rem',
    },
    DataRich: {
      statsLayout: 'grid-template-columns: repeat(4, 1fr)',
      showCharts: true,
      showTable: true,
      cardPadding: '1.5rem',
    },
  };

  const style = styles[variationName] || styles.Minimal;

  return `
<div style="min-height: 100%; background: ${bg}; padding: 2rem; font-family: ${fontFamily}, sans-serif;">
  <!-- Header -->
  <div style="margin-bottom: 2rem;">
    <h1 style="margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 700; color: #111827;">
      Tableau de bord
    </h1>
    <p style="margin: 0; color: ${neutral}; font-size: 0.875rem;">
      Vue d'ensemble de votre activité
    </p>
  </div>

  <!-- Stats Cards -->
  <div style="display: grid; ${style.statsLayout}; gap: 1.5rem; margin-bottom: 2rem;">
    <!-- Stat 1 -->
    <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: ${style.cardPadding}; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'};">
      <div style="font-size: 0.875rem; color: ${neutral}; margin-bottom: 0.5rem;">
        Utilisateurs actifs
      </div>
      <div style="font-size: 1.875rem; font-weight: 700; color: #111827; margin-bottom: 0.25rem;">
        2,543
      </div>
      <div style="font-size: 0.75rem; color: ${accent};">
        ↑ 12% ce mois
      </div>
    </div>

    <!-- Stat 2 -->
    <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: ${style.cardPadding}; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'};">
      <div style="font-size: 0.875rem; color: ${neutral}; margin-bottom: 0.5rem;">
        Revenus
      </div>
      <div style="font-size: 1.875rem; font-weight: 700; color: #111827; margin-bottom: 0.25rem;">
        45,231€
      </div>
      <div style="font-size: 0.75rem; color: ${accent};">
        ↑ 8% ce mois
      </div>
    </div>

    ${
      variationName !== 'Minimal'
        ? `
    <!-- Stat 3 -->
    <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: ${style.cardPadding}; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'};">
      <div style="font-size: 0.875rem; color: ${neutral}; margin-bottom: 0.5rem;">
        Taux conversion
      </div>
      <div style="font-size: 1.875rem; font-weight: 700; color: #111827; margin-bottom: 0.25rem;">
        3.2%
      </div>
      <div style="font-size: 0.75rem; color: #EF4444;">
        ↓ 2% ce mois
      </div>
    </div>

    <!-- Stat 4 -->
    <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: ${style.cardPadding}; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'};">
      <div style="font-size: 0.875rem; color: ${neutral}; margin-bottom: 0.5rem;">
        Satisfaction
      </div>
      <div style="font-size: 1.875rem; font-weight: 700; color: #111827; margin-bottom: 0.25rem;">
        4.8
      </div>
      <div style="font-size: 0.75rem; color: ${accent};">
        ↑ 0.3 ce mois
      </div>
    </div>
    `
        : ''
    }
  </div>

  ${
    style.showCharts
      ? `
  <!-- Charts Section -->
  <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
    <!-- Main Chart -->
    <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: 1.5rem; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'};">
      <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 600; color: #111827;">
        Évolution du CA
      </h3>
      <div style="height: 200px; background: linear-gradient(to top, ${primary}20, transparent); border-radius: 8px; display: flex; align-items: flex-end; justify-content: space-around; padding: 1rem;">
        <div style="width: 40px; background: ${primary}; border-radius: 4px 4px 0 0;" data-height="60%"></div>
        <div style="width: 40px; background: ${primary}; border-radius: 4px 4px 0 0;" data-height="80%"></div>
        <div style="width: 40px; background: ${primary}; border-radius: 4px 4px 0 0;" data-height="70%"></div>
        <div style="width: 40px; background: ${primary}; border-radius: 4px 4px 0 0;" data-height="90%"></div>
        <div style="width: 40px; background: ${primary}; border-radius: 4px 4px 0 0;" data-height="85%"></div>
      </div>
    </div>

    <!-- Pie Chart -->
    <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: 1.5rem; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'};">
      <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 600; color: #111827;">
        Sources
      </h3>
      <div style="height: 120px; width: 120px; margin: 0 auto 1rem; border-radius: 50%; background: conic-gradient(${primary} 0% 40%, ${accent} 40% 70%, #E5E7EB 70% 100%);"></div>
      <div style="font-size: 0.75rem;">
        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
          <div style="width: 12px; height: 12px; background: ${primary}; border-radius: 2px; margin-right: 0.5rem;"></div>
          <span style="color: ${neutral};">Direct: 40%</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
          <div style="width: 12px; height: 12px; background: ${accent}; border-radius: 2px; margin-right: 0.5rem;"></div>
          <span style="color: ${neutral};">Référents: 30%</span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 12px; height: 12px; background: #E5E7EB; border-radius: 2px; margin-right: 0.5rem;"></div>
          <span style="color: ${neutral};">Autres: 30%</span>
        </div>
      </div>
    </div>
  </div>
  `
      : ''
  }

  ${
    style.showTable
      ? `
  <!-- Recent Activity Table -->
  <div style="background: white; border-radius: ${card.borderRadius || '12px'}; padding: 1.5rem; box-shadow: ${card.shadow || '0 1px 3px rgba(0,0,0,0.1)'};">
    <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 600; color: #111827;">
      Activité récente
    </h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <th style="text-align: left; padding: 0.75rem 0; font-size: 0.75rem; font-weight: 600; color: ${neutral}; text-transform: uppercase;">
            Utilisateur
          </th>
          <th style="text-align: left; padding: 0.75rem 0; font-size: 0.75rem; font-weight: 600; color: ${neutral}; text-transform: uppercase;">
            Action
          </th>
          <th style="text-align: left; padding: 0.75rem 0; font-size: 0.75rem; font-weight: 600; color: ${neutral}; text-transform: uppercase;">
            Date
          </th>
          <th style="text-align: right; padding: 0.75rem 0; font-size: 0.75rem; font-weight: 600; color: ${neutral}; text-transform: uppercase;">
            Statut
          </th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 0.75rem 0; font-size: 0.875rem; color: #111827;">
            Marie Dupont
          </td>
          <td style="padding: 0.75rem 0; font-size: 0.875rem; color: ${neutral};">
            Nouvel achat
          </td>
          <td style="padding: 0.75rem 0; font-size: 0.875rem; color: ${neutral};">
            Il y a 2h
          </td>
          <td style="padding: 0.75rem 0; text-align: right;">
            <span style="background: ${accent}20; color: ${accent}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
              Validé
            </span>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 0.75rem 0; font-size: 0.875rem; color: #111827;">
            Jean Martin
          </td>
          <td style="padding: 0.75rem 0; font-size: 0.875rem; color: ${neutral};">
            Inscription
          </td>
          <td style="padding: 0.75rem 0; font-size: 0.875rem; color: ${neutral};">
            Il y a 5h
          </td>
          <td style="padding: 0.75rem 0; text-align: right;">
            <span style="background: ${primary}20; color: ${primary}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
              Actif
            </span>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 0.75rem 0; font-size: 0.875rem; color: #111827;">
            Sophie Bernard
          </td>
          <td style="padding: 0.75rem 0; font-size: 0.875rem; color: ${neutral};">
            Retour produit
          </td>
          <td style="padding: 0.75rem 0; font-size: 0.875rem; color: ${neutral};">
            Hier
          </td>
          <td style="padding: 0.75rem 0; text-align: right;">
            <span style="background: #FEF3C7; color: #92400E; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
              En cours
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  `
      : ''
  }
</div>
  `.trim();
};
