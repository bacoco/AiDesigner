'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.runOrchestratorServer = runOrchestratorServer;
const index_js_1 = require('@modelcontextprotocol/sdk/server/index.js');
const stdio_js_1 = require('@modelcontextprotocol/sdk/server/stdio.js');
const types_js_1 = require('@modelcontextprotocol/sdk/types.js');
const node_fs_1 = require('node:fs');
const fs = __importStar(require('fs-extra'));
const path = __importStar(require('node:path'));
const node_os_1 = require('node:os');
const observability_js_1 = require('./observability.js');
const lib_resolver_js_1 = require('./lib-resolver.js');
const { executeAutoCommand } = (0, lib_resolver_js_1.requireLibModule)('auto-commands.js');
const { generateHTML, getVariationNames, isScreenTypeSupported } = (0,
lib_resolver_js_1.requireLibModule)('html-templates/index.js');
/**
 * Builds a structured parse error for agent trigger failures.
 *
 * @param agentId - The ID of the agent that failed to parse
 * @param rawResponse - The unparsable response from the agent
 * @param error - The error that occurred during parsing
 * @param context - The context passed to the agent
 * @param guidance - Optional custom guidance message for the error
 * @returns A structured AgentTriggerParseError with debugging metadata
 */
function buildParseError({ agentId, rawResponse, error, context, guidance }) {
  let stringified = '';
  if (typeof rawResponse === 'string') {
    stringified = rawResponse;
  } else if (rawResponse != null) {
    try {
      stringified = JSON.stringify(rawResponse);
    } catch {
      stringified = '[unserializable payload]';
    }
  }
  const snippet = stringified.slice(0, 200);
  const cause =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : {
          message: String(error),
        };
  const contextMetadata = (() => {
    if (!context || typeof context !== 'object') {
      return { provided: Boolean(context) };
    }
    try {
      return {
        provided: true,
        keys: Object.keys(context).slice(0, 12),
      };
    } catch {
      return { provided: true };
    }
  })();
  return {
    ok: false,
    errorType: 'agent_parse_error',
    agentId,
    message: `Failed to parse response from agent ${agentId}`,
    rawSnippet: snippet,
    rawResponse,
    guidance: guidance ?? 'Ensure the agent returns valid JSON matching the documented contract.',
    cause,
    contextMetadata,
  };
}
function stringifyValue(value) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => `- ${stringifyValue(item)}`).join('\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => `- ${key}: ${stringifyValue(val)}`)
      .join('\n');
  }
  return JSON.stringify(value, null, 2);
}
function buildDeveloperContextSections(projectState) {
  if (!projectState) {
    return [];
  }
  const sections = [];
  const state = typeof projectState.getState === 'function' ? projectState.getState() : {};
  const story =
    typeof projectState.getDeliverable === 'function'
      ? projectState.getDeliverable('sm', 'story')
      : null;
  const structuredStory =
    typeof projectState.getStory === 'function'
      ? projectState.getStory(story?.storyId)
      : story?.structured || story?.structuredStory || null;
  if (structuredStory) {
    const overviewBody = [];
    if (structuredStory.title) {
      overviewBody.push(`Story: ${structuredStory.title}`);
    }
    if (structuredStory.epicNumber != null && structuredStory.storyNumber != null) {
      overviewBody.push(`Sequence: ${structuredStory.epicNumber}.${structuredStory.storyNumber}`);
    }
    if (structuredStory.summary) {
      overviewBody.push(structuredStory.summary);
    } else if (structuredStory.description) {
      overviewBody.push(structuredStory.description);
    }
    const acceptanceCriteria = Array.isArray(structuredStory.acceptanceCriteria)
      ? structuredStory.acceptanceCriteria
      : [];
    if (acceptanceCriteria.length > 0) {
      overviewBody.push(
        '',
        'Acceptance Criteria:',
        ...acceptanceCriteria.map((item) => `- ${String(item)}`),
      );
    }
    sections.push({
      title: 'Current Story Overview',
      body: overviewBody.filter(Boolean).join('\n'),
      priority: 'high',
    });
  } else if (story?.content) {
    sections.push({
      title: 'Current Story Overview',
      body: typeof story.content === 'string' ? story.content : stringifyValue(story.content),
      priority: 'high',
    });
  }
  if (state?.requirements && Object.keys(state.requirements).length > 0) {
    sections.push({
      title: 'Key Requirements Snapshot',
      body: stringifyValue(state.requirements),
      priority: 'high',
    });
  }
  if (state?.decisions && Object.keys(state.decisions).length > 0) {
    sections.push({
      title: 'Relevant Decisions',
      body: stringifyValue(
        Object.fromEntries(
          Object.entries(state.decisions).map(([key, entry]) => [key, entry?.value ?? entry]),
        ),
      ),
      priority: 'medium',
    });
  }
  if (state?.nextSteps) {
    sections.push({
      title: 'Next Steps from SM',
      body: stringifyValue(state.nextSteps),
      priority: 'medium',
    });
  }
  const recentConversation =
    typeof projectState.getConversation === 'function' ? projectState.getConversation(5) : [];
  if (Array.isArray(recentConversation) && recentConversation.length > 0) {
    const conversationBody = recentConversation
      .map((msg) => {
        const role = msg?.role ?? 'unknown';
        const phase = msg?.phase ? ` [${msg.phase}]` : '';
        const content = msg?.content ?? '';
        return `- ${role}${phase}: ${content}`;
      })
      .join('\n');
    sections.push({
      title: 'Recent Conversation Signals',
      body: conversationBody,
      priority: 'low',
    });
  }
  return sections;
}
function createDeveloperContextInjector(projectState) {
  return async function developerContextInjector({ agentId }) {
    if (agentId !== 'dev') {
      return null;
    }
    const sections = buildDeveloperContextSections(projectState);
    if (!sections.length) {
      return null;
    }
    return {
      sections,
    };
  };
}
const QUICK_LANE_FALLBACK_REASON = 'Quick lane unavailable or not initialized';
const REVIEW_CHECKPOINTS = {
  pm_plan_review: {
    title: 'Plan Quality Gate',
    sourcePhase: 'pm',
    agent: 'po',
    lane: 'review',
    deliverableKeys: ['prd', 'project_plan', 'timeline'],
    instructions:
      'You are acting as an independent reviewer validating the product plan. Review the provided planning deliverables, identify risks or gaps, and respond with JSON {"status": "approve"|"revise"|"block", "summary": string, "risks": string[], "follow_up": string[]}.',
  },
  architecture_design_review: {
    title: 'Architecture Design Review',
    sourcePhase: 'architect',
    agent: 'architect',
    lane: 'review',
    deliverableKeys: ['architecture', 'system_design', 'tech_stack'],
    instructions:
      'You are a principal architect performing a design review. Inspect the architecture deliverables for feasibility, scalability, and alignment with requirements. Respond with JSON {"status": "approve"|"revise"|"block", "summary": string, "risks": string[], "follow_up": string[]}.',
  },
  story_scope_review: {
    title: 'Story Scope Review',
    sourcePhase: 'sm',
    agent: 'qa',
    lane: 'review',
    deliverableKeys: ['user_stories', 'epics', 'sprint_plan'],
    instructions:
      'You are a senior QA reviewer validating story readiness. Evaluate the backlog deliverables for clarity, testability, and risk. Respond with JSON {"status": "approve"|"revise"|"block", "summary": string, "risks": string[], "follow_up": string[]}.',
  },
};
const STORY_CONTEXT_VALIDATION_CHECKPOINT = 'story_context_validation';
const REVIEW_CHECKPOINT_NAMES = Object.freeze(Object.keys(REVIEW_CHECKPOINTS));
/**
 * Generate complete mockup.html from mockup data
 */
async function generateMockupHTML(mockupData) {
  const { pages = [], designSystem = {} } = mockupData;
  const ds = designSystem.colors || {};
  const primary = ds.primary || '#5E6AD2';
  const accent = ds.accent || '#3D9970';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maquette AiDesigner</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary: ${primary};
      --accent: ${accent};
      --neutral: ${ds.neutral?.[0] || '#6B7280'};
      --bg: ${ds.background || '#F3F4F6'};
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ${designSystem.typography?.fontFamily || 'Inter, sans-serif'}; }
    .tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; background: white; padding: 0 2rem; }
    .tabs button { padding: 1rem 1.5rem; background: none; border: none; cursor: pointer; font-weight: 500; border-bottom: 3px solid transparent; margin-bottom: -2px; color: #6b7280; }
    .tabs button.active { color: var(--primary); border-bottom-color: var(--primary); }
    .tabs button.validated::before { content: "✓ "; color: var(--accent); }
    .page { display: none; padding: 2rem; }
    .page.active { display: block; }
    .variation-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-top: 2rem; }
    .variation-card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; transition: all 0.2s; }
    .variation-card.selected { border-color: var(--primary); background: rgba(94, 106, 210, 0.05); }
    .variation-card h3 { margin: 0 0 1rem 0; font-size: 1.125rem; }
    .variation-preview { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 2rem; min-height: 400px; margin-bottom: 1rem; }
    .variation-card button { width: 100%; padding: 0.75rem; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; background: var(--primary); color: white; }
    .variation-card.selected button { background: var(--accent); }
    .design-system-panel { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2rem; }
    .color-swatch { display: inline-block; width: 40px; height: 40px; border-radius: 6px; margin-right: 0.5rem; border: 1px solid #e5e7eb; }
    .spec-section { margin-bottom: 2rem; }
    .spec-section h3 { font-size: 1.25rem; margin: 0 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb; }
  </style>
</head>
<body>
  <nav class="tabs">
    <button data-page="design-system" ${pages.length === 0 ? 'class="active"' : ''}>Design System</button>
    ${pages.map((p, i) => `<button data-page="${p.name}" ${p.selectedVariation ? 'class="validated' + (i === 0 && pages.length > 0 ? ' active' : '') + '"' : i === 0 && pages.length > 0 ? 'class="active"' : ''}>${p.name.charAt(0).toUpperCase() + p.name.slice(1)}</button>`).join('\n    ')}
  </nav>

  <!-- Design System Page -->
  <div id="page-design-system" class="page ${pages.length === 0 ? 'active' : ''}">
    <h1 style="font-size: 2rem; margin: 0 0 2rem 0;">🎨 Design System v${designSystem.version || '1.0'}</h1>
    <div class="design-system-panel">
      ${
        designSystem.colors
          ? `
      <div class="spec-section">
        <h3>Couleurs</h3>
        <div>
          ${Object.entries(designSystem.colors)
            .map(([key, val]) => {
              if (Array.isArray(val)) {
                return val
                  .map(
                    (v) =>
                      `<span class="color-swatch" style="background: ${v}" title="${key}: ${v}"></span>`,
                  )
                  .join('');
              }
              return `<span class="color-swatch" style="background: ${val}" title="${key}: ${val}"></span> <strong>${key}:</strong> ${val}<br/>`;
            })
            .join('')}
        </div>
      </div>
      `
          : ''
      }

      ${
        designSystem.typography
          ? `
      <div class="spec-section">
        <h3>Typographie</h3>
        <p><strong>Police:</strong> ${designSystem.typography.fontFamily || 'Inter'}</p>
        <p><strong>Poids:</strong> ${designSystem.typography.weights?.join(', ') || '400, 600, 700'}</p>
        ${
          designSystem.typography.sizes
            ? `<p><strong>Tailles:</strong> ${Object.entries(designSystem.typography.sizes)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ')}</p>`
            : ''
        }
      </div>
      `
          : ''
      }

      ${
        designSystem.spacing
          ? `
      <div class="spec-section">
        <h3>Espacement</h3>
        <p><strong>Base:</strong> ${designSystem.spacing.unit || '8px'}</p>
        <p><strong>Échelle:</strong> ${designSystem.spacing.scale?.join(', ') || '8, 16, 24, 32, 48'}</p>
      </div>
      `
          : ''
      }

      ${
        pages.length > 0
          ? `
      <div class="spec-section">
        <h3>Pages Générées</h3>
        <ul style="list-style: none; padding: 0;">
          ${pages.map((p) => `<li style="padding: 0.5rem 0;">${p.selectedVariation ? '✓' : '⏳'} ${p.name.charAt(0).toUpperCase() + p.name.slice(1)} ${p.selectedVariation ? `(Variation ${p.selectedVariation})` : '(en cours)'}</li>`).join('')}
        </ul>
      </div>
      `
          : '<p style="color: #6b7280;">Aucune page générée pour l\'instant. Générez votre première page pour voir les specs s\'afficher ici!</p>'
      }
    </div>
  </div>

  ${pages
    .map(
      (page, pageIdx) => `
  <!-- Page: ${page.name} -->
  <div id="page-${page.name}" class="page ${pageIdx === 0 && pages.length > 0 ? 'active' : ''}">
    <h2 style="font-size: 1.75rem; margin: 0 0 1rem 0;">${page.name.charAt(0).toUpperCase() + page.name.slice(1)} - Sélectionnez une variation</h2>
    <div class="variation-grid">
      ${
        page.variations
          ?.map(
            (v) => `
      <div class="variation-card ${page.selectedVariation === v.id ? 'selected' : ''}" data-variation="${v.id}">
        <h3>${v.name} ${page.selectedVariation === v.id ? '✓' : ''}</h3>
        <div class="variation-preview">
          ${v.html || `<p style="color: #6b7280; text-align: center; padding: 2rem;">Preview de ${v.name}</p>`}
        </div>
        <button onclick="selectVariation('${page.name}', ${v.id})">${page.selectedVariation === v.id ? '✓ Sélectionnée' : 'Sélectionner'}</button>
      </div>
      `,
          )
          .join('') || '<p>Aucune variation disponible</p>'
      }
    </div>
  </div>
  `,
    )
    .join('\n')}

  <script>
    const MOCKUP_DATA = ${JSON.stringify(mockupData)};

    // Tab navigation
    document.querySelectorAll('.tabs button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pageName = e.target.dataset.page;
        document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + pageName).classList.add('active');
      });
    });

    // Variation selection
    function selectVariation(pageName, variationId) {
      console.log('Selected variation', variationId, 'for page', pageName);
      // In real implementation, this would call back to MCP to update selection
      // For now, just visually update
      const pageData = MOCKUP_DATA.pages.find(p => p.name === pageName);
      if (pageData) {
        pageData.selectedVariation = variationId;
        // Update UI
        document.querySelectorAll(\`#page-\${pageName} .variation-card\`).forEach(card => {
          card.classList.remove('selected');
          const btn = card.querySelector('button');
          btn.textContent = 'Sélectionner';
          btn.style.background = 'var(--primary)';
        });
        const selectedCard = document.querySelector(\`#page-\${pageName} .variation-card[data-variation="\${variationId}"]\`);
        if (selectedCard) {
          selectedCard.classList.add('selected');
          const btn = selectedCard.querySelector('button');
          btn.textContent = '✓ Sélectionnée';
          btn.style.background = 'var(--accent)';
        }
        // Update tab
        const tab = document.querySelector(\`button[data-page="\${pageName}"]\`);
        if (tab && !tab.classList.contains('validated')) {
          tab.classList.add('validated');
        }
      }
    }
  </script>
</body>
</html>`;
}
async function getDefaultLLMClientCtor() {
  const mod = await (0, lib_resolver_js_1.importLibModule)('llm-client.js');
  return mod.LLMClient;
}
async function runOrchestratorServer(options = {}) {
  const serverName = options.serverInfo?.name ?? 'aidesigner-orchestrator';
  const serverVersion = options.serverInfo?.version ?? '1.0.0';
  const logger =
    options.logger ??
    (0, observability_js_1.createStructuredLogger)({
      name: serverName,
      base: { component: 'mcp-orchestrator' },
    });
  const textLog = options.log ?? ((message) => logger.info('runtime_log', { message }));
  const ensureOperationAllowed =
    options.ensureOperationAllowed ??
    (async () => {
      /* no-op */
    });
  let quickLane;
  let quickLaneEnabled = true;
  let quickLaneDisabledReason;
  const disableQuickLane = (stage, error) => {
    if (!quickLaneEnabled) {
      return;
    }
    quickLaneEnabled = false;
    quickLane = undefined;
    quickLaneDisabledReason = error instanceof Error ? error.message : String(error);
    logger.warn('quick_lane_disabled', {
      operation: stage,
      reason: quickLaneDisabledReason,
    });
  };
  let defaultLLMCtor;
  const createLLMClient = async (lane) => {
    try {
      if (options.createLLMClient) {
        const result = await options.createLLMClient(lane);
        return result;
      }
      if (!defaultLLMCtor) {
        defaultLLMCtor = await getDefaultLLMClientCtor();
      }
      return new defaultLLMCtor();
    } catch (error) {
      if (lane === 'quick') {
        disableQuickLane('create_llm_client', error);
        return undefined;
      }
      throw error;
    }
  };
  let ProjectState;
  let AidesignerBridge;
  let DeliverableGenerator;
  let BrownfieldAnalyzer;
  let QuickLane;
  let LaneSelector;
  let phaseTransitionHooks;
  let contextPreservation;
  let storyContextValidator;
  let projectState;
  let aidesignerBridge;
  let deliverableGen;
  let brownfieldAnalyzer;
  const laneDecisions = [];
  let developerContextInjectorRegistered = false;
  const developerLaneConfig = {
    validateStoryContext: false,
    validationLane: 'review',
  };
  async function loadDependencies() {
    if (!ProjectState) {
      ({ ProjectState } = await (0, lib_resolver_js_1.importLibModule)('project-state.js'));
    }
    if (!AidesignerBridge) {
      ({ AidesignerBridge } = await (0, lib_resolver_js_1.importLibModule)('aidesigner-bridge.js'));
    }
    if (!DeliverableGenerator) {
      ({ DeliverableGenerator } = await (0, lib_resolver_js_1.importLibModule)(
        'deliverable-generator.js',
      ));
    }
    if (!BrownfieldAnalyzer) {
      ({ BrownfieldAnalyzer } = await (0, lib_resolver_js_1.importLibModule)(
        'brownfield-analyzer.js',
      ));
    }
    if (!QuickLane) {
      ({ QuickLane } = await (0, lib_resolver_js_1.importLibModule)('quick-lane.js'));
    }
    if (!LaneSelector) {
      LaneSelector = await (0, lib_resolver_js_1.importLibModule)('lane-selector.js');
    }
    if (!phaseTransitionHooks) {
      phaseTransitionHooks = await (0, lib_resolver_js_1.importFromPackageRoot)(
        'hooks',
        'phase-transition.js',
      );
    }
    if (!contextPreservation) {
      contextPreservation = await (0, lib_resolver_js_1.importFromPackageRoot)(
        'hooks',
        'context-preservation.js',
      );
    }
    if (!storyContextValidator) {
      const module = await (0, lib_resolver_js_1.importLibModule)('story-context-validator.js');
      storyContextValidator = module?.default ?? module;
    }
  }
  async function initializeProject(projectPath = process.cwd()) {
    if (!projectState) {
      projectState = new ProjectState(projectPath);
      await projectState.initialize();
    }
    if (!aidesignerBridge) {
      const llmClient = await createLLMClient('default');
      aidesignerBridge = new AidesignerBridge({ llmClient });
      await aidesignerBridge.initialize();
      const environmentInfo =
        typeof aidesignerBridge.getEnvironmentInfo === 'function'
          ? aidesignerBridge.getEnvironmentInfo()
          : null;
      if (environmentInfo?.mode === 'v6-modules') {
        logger.info('environment_detected', {
          operation: 'detect_environment',
          mode: environmentInfo.mode,
          modulesRoot: environmentInfo.modulesRoot || environmentInfo.root,
          moduleCount: environmentInfo.catalog?.moduleCount ?? 0,
        });
      }
    }
    if (!deliverableGen) {
      deliverableGen = new DeliverableGenerator(projectPath, { aidesignerBridge });
      await deliverableGen.initialize();
    }
    if (!brownfieldAnalyzer) {
      brownfieldAnalyzer = new BrownfieldAnalyzer(projectPath);
    }
    if (quickLaneEnabled && !quickLane) {
      try {
        const quickLaneLLM = await createLLMClient('quick');
        // Guard against race condition where quickLaneEnabled was flipped to false
        // during the async createLLMClient call (e.g., if it failed and called disableQuickLane)
        if (!quickLaneEnabled) {
          // Quick lane already disabled, skip initialization but continue with complex lane setup
        } else {
          quickLane = new QuickLane(projectPath, { llmClient: quickLaneLLM });
          await quickLane.initialize();
        }
      } catch (error) {
        disableQuickLane('initialize_quick_lane', error);
      }
    }
    phaseTransitionHooks.bindDependencies({
      // triggerAgent removed - phase detection now uses heuristics, no LLM calls
      triggerCommand: async (command, context) => {
        await ensureOperationAllowed('execute_auto_command', { command });
        logger.info('auto_command_execute', {
          operation: 'execute_auto_command',
          command,
        });
        return executeAutoCommand(command, context, aidesignerBridge);
      },
      updateProjectState: async (updates) => {
        await projectState.updateState(updates);
      },
      saveDeliverable: async (type, content) => {
        await ensureOperationAllowed('save_deliverable', { type });
        await projectState.storeDeliverable(type, content);
      },
      loadPhaseContext: async (phase, context) =>
        contextPreservation.preserveContext(
          projectState.state.currentPhase,
          phase,
          context,
          async (p) => projectState.getPhaseDeliverables(p),
        ),
    });
  }
  async function runStoryContextValidationHook({ notes, trigger } = {}) {
    if (!storyContextValidator?.runStoryContextValidation) {
      await loadDependencies();
    }
    const validationModule = storyContextValidator?.default
      ? storyContextValidator.default
      : storyContextValidator;
    if (!validationModule?.runStoryContextValidation) {
      throw new Error('Story context validator not available');
    }
    const lane = developerLaneConfig.validationLane ?? 'review';
    return validationModule.runStoryContextValidation({
      projectState,
      createLLMClient,
      AidesignerBridge,
      lane,
      notes,
      trigger,
      log: textLog,
    });
  }
  async function ensureStoryContextReadyForDevelopment({ notes, trigger } = {}) {
    if (!storyContextValidator) {
      await loadDependencies();
    }
    const validationModule = storyContextValidator?.default
      ? storyContextValidator.default
      : storyContextValidator;
    if (validationModule?.ensureStoryContextReadyForDevelopment) {
      const lane = developerLaneConfig.validationLane ?? 'review';
      return validationModule.ensureStoryContextReadyForDevelopment({
        projectState,
        createLLMClient,
        AidesignerBridge,
        lane,
        notes,
        trigger,
        log: textLog,
      });
    }
    return runStoryContextValidationHook({ notes, trigger });
  }
  const server = new index_js_1.Server(
    {
      name: serverName,
      version: serverVersion,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_project_context',
        description:
          'Get complete project context including phase, requirements, decisions, and conversation history',
        inputSchema: {
          type: 'object',
          properties: {
            includeConversation: {
              type: 'boolean',
              description: 'Include recent conversation history',
              default: true,
            },
            conversationLimit: {
              type: 'number',
              description: 'Number of recent messages to include',
              default: 10,
            },
          },
        },
      },
      {
        name: 'load_agent_persona',
        description: 'Load aidesigner agent persona for the current or specified phase',
        inputSchema: {
          type: 'object',
          properties: {
            phase: {
              type: 'string',
              enum: ['analyst', 'pm', 'architect', 'sm', 'dev', 'qa', 'ux', 'po'],
              description: 'Phase to load agent for (defaults to current phase)',
            },
          },
        },
      },
      {
        name: 'transition_phase',
        description: 'Safely transition to a new project phase with validation',
        inputSchema: {
          type: 'object',
          properties: {
            toPhase: {
              type: 'string',
              enum: ['analyst', 'pm', 'architect', 'sm', 'dev', 'qa', 'ux', 'po'],
              description: 'Target phase',
            },
            context: {
              type: 'object',
              description: 'Context to carry forward',
            },
            userValidated: {
              type: 'boolean',
              description: 'Whether user has validated the transition',
              default: false,
            },
          },
          required: ['toPhase'],
        },
      },
      {
        name: 'configure_developer_lane',
        description: 'Configure developer lane behavior including story context validation toggles',
        inputSchema: {
          type: 'object',
          properties: {
            validateStoryContext: {
              type: 'boolean',
              description:
                'Enable or disable story context validation before developer transitions',
            },
            validationLane: {
              type: 'string',
              description: 'Lane key to use for story context validation reviewer bridge',
            },
          },
        },
      },
      {
        name: 'run_story_context_validation',
        description: 'Re-run story context enrichment in isolation and record the audit checkpoint',
        inputSchema: {
          type: 'object',
          properties: {
            notes: {
              type: 'string',
              description: 'Additional notes to attach to the validation record',
            },
          },
        },
      },
      {
        name: 'generate_deliverable',
        description:
          'Generate aidesigner deliverable (PRD, architecture, story, etc.) and save to docs/',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['brief', 'prd', 'architecture', 'epic', 'story', 'qa_assessment'],
              description: 'Type of deliverable to generate',
            },
            context: {
              type: 'object',
              description: 'Context data for the deliverable',
            },
          },
          required: ['type', 'context'],
        },
      },
      {
        name: 'record_decision',
        description: 'Record a project decision for future reference',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: "Decision identifier (e.g., 'tech_stack', 'architecture_pattern')",
            },
            value: {
              type: 'string',
              description: 'The decision made',
            },
            rationale: {
              type: 'string',
              description: 'Why this decision was made',
            },
          },
          required: ['key', 'value'],
        },
      },
      {
        name: 'add_conversation_message',
        description: 'Add a message to the conversation history',
        inputSchema: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'assistant'],
              description: 'Message role',
            },
            content: {
              type: 'string',
              description: 'Message content',
            },
          },
          required: ['role', 'content'],
        },
      },
      {
        name: 'get_project_summary',
        description: 'Get a high-level summary of project status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_aidesigner_agents',
        description: 'List all available aidesigner agents',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'execute_aidesigner_workflow',
        description: 'Execute a complete aidesigner workflow for a phase',
        inputSchema: {
          type: 'object',
          properties: {
            phase: {
              type: 'string',
              enum: ['analyst', 'pm', 'architect', 'sm', 'dev', 'qa', 'ux', 'po'],
              description: 'Phase workflow to execute',
            },
            context: {
              type: 'object',
              description: 'Workflow context',
            },
          },
          required: ['phase'],
        },
      },
      {
        name: 'run_review_checkpoint',
        description:
          'Run an independent reviewer model against a validation checkpoint and capture the outcome',
        inputSchema: {
          type: 'object',
          properties: {
            checkpoint: {
              type: 'string',
              enum: REVIEW_CHECKPOINT_NAMES,
              description: 'Review checkpoint identifier',
            },
            notes: {
              type: 'string',
              description: 'Additional context or concerns for the reviewer',
            },
          },
          required: ['checkpoint'],
        },
      },
      {
        name: 'scan_codebase',
        description:
          'Scan existing codebase structure, tech stack, and architecture (for brownfield projects)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'detect_existing_docs',
        description:
          'Find and load existing aidesigner documentation (brief, prd, architecture, stories)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'load_previous_state',
        description: 'Load state from previous aidesigner session to resume work',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_codebase_summary',
        description:
          'Get comprehensive codebase analysis including structure, tech stack, and existing aidesigner docs',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'select_development_lane',
        description:
          'Analyze user message to determine whether to use complex (multi-agent) or quick (template-based) lane',
        inputSchema: {
          type: 'object',
          properties: {
            userMessage: {
              type: 'string',
              description: "User's message/request to analyze",
            },
            context: {
              type: 'object',
              description: 'Additional context (previousPhase, projectComplexity, forceLane, etc.)',
            },
          },
          required: ['userMessage'],
        },
      },
      {
        name: 'execute_workflow',
        description:
          'Execute development workflow - automatically routes between quick and complex lanes, outputs to docs/',
        inputSchema: {
          type: 'object',
          properties: {
            userRequest: {
              type: 'string',
              description: "User's feature request or task description",
            },
            context: {
              type: 'object',
              description: 'Additional context (forceLane, projectComplexity, etc.)',
            },
          },
          required: ['userRequest'],
        },
      },
      {
        name: 'search_mcp_servers',
        description:
          'Search for MCP servers in the registry by keyword. Returns matching servers with installation info.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: "Search query (e.g., 'database', 'browser', 'github')",
            },
            category: {
              type: 'string',
              description: 'Optional category filter',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'suggest_mcp_servers',
        description:
          'Get intelligent MCP server suggestions based on project context (dependencies, tech stack, etc.)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'install_mcp_server',
        description:
          'Install and configure an MCP server from the registry. Handles environment variables interactively.',
        inputSchema: {
          type: 'object',
          properties: {
            serverId: {
              type: 'string',
              description: "Server ID or name (e.g., 'github', 'postgres', 'puppeteer')",
            },
            config: {
              type: 'string',
              enum: ['claude', 'aidesigner', 'both', 'bmad'],
              description: 'Target configuration (default: claude, legacy alias: bmad)',
              default: 'claude',
            },
            envVars: {
              type: 'object',
              description: 'Environment variables as key-value pairs',
            },
          },
          required: ['serverId'],
        },
      },
      {
        name: 'list_mcp_servers',
        description:
          'List all currently configured MCP servers with their status and configuration source',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_mcp_health',
        description:
          'Check health status of all configured MCP servers. Returns detailed diagnostics.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'browse_mcp_registry',
        description: 'Browse all available MCP servers in the registry, organized by category',
        inputSchema: {
          type: 'object',
          properties: {
            refresh: {
              type: 'boolean',
              description: 'Force refresh the registry cache',
              default: false,
            },
          },
        },
      },
      {
        name: 'generate_nano_banana_prompts',
        description:
          'Generate Nano Banana (Gemini) visual concept prompts for UI design exploration. Creates docs/ui/nano-banana-brief.md with ready-to-use prompts for Google AI Studio.',
        inputSchema: {
          type: 'object',
          properties: {
            productName: {
              type: 'string',
              description: 'Name of the product',
            },
            productDescriptor: {
              type: 'string',
              description: 'One-sentence product description',
            },
            primaryPersona: {
              type: 'string',
              description: "Main user type (e.g., 'remote team managers')",
            },
            screens: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of screen names to generate concepts for',
              default: ['Search', 'Write/Compose', 'Sign Up', 'Sign In'],
            },
            visualStyle: {
              type: 'string',
              description: "Desired visual style (e.g., 'modern SaaS', 'minimalist')",
              default: 'modern SaaS',
            },
            brandPalette: {
              type: 'string',
              description: 'Color palette with hex codes',
            },
            designTokens: {
              type: 'object',
              description: 'Optional design tokens extracted from reference URLs',
            },
          },
          required: ['productName', 'productDescriptor', 'primaryPersona'],
        },
      },
      {
        name: 'generate_ui_designer_prompts',
        description:
          'Generate per-screen UI designer prompts for conversational design flow. Creates docs/ui/ui-designer-screen-prompts.md with tailored prompts for each journey step.',
        inputSchema: {
          type: 'object',
          properties: {
            journey: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  screenName: { type: 'string' },
                  purpose: { type: 'string' },
                  userGoal: { type: 'string' },
                },
              },
              description: 'User journey steps with screen definitions',
            },
            visualContext: {
              type: 'object',
              description: 'Visual design context and constraints',
            },
          },
          required: ['journey'],
        },
      },
      {
        name: 'check_chrome_mcp_available',
        description:
          'Check if Chrome DevTools MCP is installed and available. Returns availability status and installation instructions if needed.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'extract_design_tokens_from_url',
        description:
          'Extract design tokens (colors, typography, spacing) from a reference URL using Chrome DevTools MCP. Requires chrome-devtools MCP to be installed.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to extract design tokens from (e.g., https://linear.app)',
            },
            selectors: {
              type: 'array',
              items: { type: 'string' },
              description:
                'CSS selectors to analyze (default: body, h1-h6, button, a, .primary, .accent)',
              default: ['body', 'h1', 'h2', 'h3', 'button', 'a', '.primary', '.accent'],
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'store_design_evidence',
        description:
          'Store extracted design tokens and evidence packs to docs/ui/chrome-mcp/ for reuse in prompt generation.',
        inputSchema: {
          type: 'object',
          properties: {
            sourceUrl: {
              type: 'string',
              description: 'Source URL that evidence was extracted from',
            },
            evidence: {
              type: 'object',
              description: 'Design evidence (colors, typography, spacing, cssVariables)',
            },
          },
          required: ['sourceUrl', 'evidence'],
        },
      },
      {
        name: 'analyze_gemini_concepts',
        description:
          'Analyze Gemini-generated concept images and extract visual patterns, colors, layouts. Stores analysis for iterative refinement.',
        inputSchema: {
          type: 'object',
          properties: {
            imageUrls: {
              type: 'array',
              items: { type: 'string' },
              description: 'URLs or paths to Gemini concept screenshots',
            },
            userFeedback: {
              type: 'string',
              description: "User's feedback on the generated concepts",
            },
            iterationNumber: {
              type: 'number',
              description: 'Current iteration number',
            },
          },
          required: ['iterationNumber'],
        },
      },
      {
        name: 'refine_design_prompts',
        description:
          'Refine UI designer prompts based on user feedback from Gemini concepts. Creates updated prompts and stores iteration history.',
        inputSchema: {
          type: 'object',
          properties: {
            iterationNumber: {
              type: 'number',
              description: 'Current iteration number',
            },
            keepElements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Design elements to keep from previous iteration',
            },
            avoidElements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Design elements to avoid in next iteration',
            },
            adjustments: {
              type: 'string',
              description: 'Specific adjustments to make to the prompts',
            },
          },
          required: ['iterationNumber', 'keepElements', 'avoidElements', 'adjustments'],
        },
      },
      {
        name: 'store_ui_iteration',
        description:
          'Store a complete UI design iteration with prompts, outputs, and feedback. Tracks iteration history and marks validated designs.',
        inputSchema: {
          type: 'object',
          properties: {
            iterationNumber: {
              type: 'number',
              description: 'Iteration number',
            },
            promptsUsed: {
              type: 'string',
              description: 'Path to prompts file used in this iteration',
            },
            geminiOutputs: {
              type: 'array',
              items: { type: 'string' },
              description: 'Paths to Gemini-generated concept images',
            },
            userFeedback: {
              type: 'string',
              description: "User's feedback on this iteration",
            },
            refinements: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of refinements made in this iteration',
            },
            status: {
              type: 'string',
              enum: ['in_progress', 'validated', 'rejected'],
              description: 'Status of this iteration',
            },
          },
          required: ['iterationNumber', 'promptsUsed', 'userFeedback', 'refinements', 'status'],
        },
      },
      {
        name: 'get_ui_context',
        description:
          'Get all UI design context for other agents (CSS tokens, journey, concepts, iterations). Allows Architect, UX Expert, and other agents to reference validated design decisions.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'automate_gemini_concepts',
        description:
          'Automate Gemini/Nano Banana visual concept generation via Chrome MCP. Opens Google AI Studio, submits prompt, waits for generation, and retrieves output images. Requires chrome-devtools-mcp to be installed.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The complete UI designer prompt to send to Gemini',
            },
            iterationNumber: {
              type: 'number',
              description: 'Current iteration number for file naming',
            },
            modelPreference: {
              type: 'string',
              enum: ['gemini-2.0-flash-exp', 'gemini-2.5-flash', 'auto'],
              description: 'Preferred Gemini model (default: auto)',
            },
          },
          required: ['prompt', 'iterationNumber'],
        },
      },
      {
        name: 'extract_design_specs_from_concepts',
        description:
          'Extract design specifications (colors, typography, spacing, components) from generated Gemini concept images. Returns normalized specs for each variation.',
        inputSchema: {
          type: 'object',
          properties: {
            imageUrls: {
              type: 'array',
              items: { type: 'string' },
              description: 'URLs or paths to Gemini-generated concept images',
            },
            screenType: {
              type: 'string',
              description: 'Type of screen (login, dashboard, settings, etc.)',
            },
            designSystem: {
              type: 'object',
              description: 'Existing design system to maintain coherence (optional)',
            },
          },
          required: ['imageUrls', 'screenType'],
        },
      },
      {
        name: 'update_mockup',
        description:
          'Create or update the single mockup.html file with new pages, variations, and design system. Handles tab navigation, variation selection, and live preview.',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['add_page', 'select_variation', 'update_design_system'],
              description: 'Action to perform on mockup',
            },
            page: {
              type: 'object',
              description: 'Page data with name, type, and variations',
            },
            variationId: {
              type: 'number',
              description: 'Variation ID to select (for select_variation action)',
            },
            pageName: {
              type: 'string',
              description: 'Page name (for select_variation action)',
            },
            designSystem: {
              type: 'object',
              description: 'Design system specs to inject',
            },
          },
          required: ['action'],
        },
      },
    ],
  }));
  server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolLogger = logger.child({ tool: name });
    const stopToolTimer = logger.startTimer();
    const outcomeFields = { operation: name };
    try {
      if (!ProjectState) {
        await loadDependencies();
      }
      await initializeProject();
      let response;
      switch (name) {
        case 'get_project_context': {
          const params = args;
          const state = projectState.getState();
          const context = {
            projectId: state.projectId,
            projectName: state.projectName,
            currentPhase: state.currentPhase,
            requirements: state.requirements,
            decisions: state.decisions,
            userPreferences: state.userPreferences,
            nextSteps: state.nextSteps,
            phaseHistory: state.phaseHistory,
          };
          if (params.includeConversation !== false) {
            context.recentConversation = projectState.getConversation(
              params.conversationLimit || 10,
            );
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(context, null, 2),
              },
            ],
          };
          break;
        }
        case 'load_agent_persona': {
          const params = args;
          const phase = params.phase || projectState.state.currentPhase;
          const agent = await aidesignerBridge.loadAgent(`${phase}`);
          response = {
            content: [
              {
                type: 'text',
                text: agent.content,
              },
            ],
          };
          break;
        }
        case 'transition_phase': {
          const params = args;
          let storyContextValidationResult = null;
          if (params.toPhase === 'dev' && developerLaneConfig.validateStoryContext) {
            await ensureOperationAllowed('run_story_context_validation', {
              checkpoint: STORY_CONTEXT_VALIDATION_CHECKPOINT,
              mode: 'pre_transition',
              lane: developerLaneConfig.validationLane,
            });
            storyContextValidationResult = await ensureStoryContextReadyForDevelopment({
              notes: params.context?.validationNotes,
              trigger: 'phase_transition',
            });
          }
          const transitionResult = await phaseTransitionHooks.handleTransition(
            projectState,
            params.toPhase,
            params.context || {},
            params.userValidated || false,
          );
          if (transitionResult && storyContextValidationResult?.record) {
            transitionResult.storyContextValidation = storyContextValidationResult.record;
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(transitionResult, null, 2),
              },
            ],
          };
          break;
        }
        case 'configure_developer_lane': {
          const params = args;
          await ensureOperationAllowed('configure_developer_lane', params || {});
          if (typeof params.validateStoryContext === 'boolean') {
            developerLaneConfig.validateStoryContext = params.validateStoryContext;
          }
          if (params.validationLane) {
            developerLaneConfig.validationLane = params.validationLane;
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    validateStoryContext: developerLaneConfig.validateStoryContext,
                    validationLane: developerLaneConfig.validationLane,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'run_story_context_validation': {
          const params = args;
          await ensureOperationAllowed('run_story_context_validation', {
            checkpoint: STORY_CONTEXT_VALIDATION_CHECKPOINT,
            lane: developerLaneConfig.validationLane,
            mode: 'manual',
          });
          const result = await runStoryContextValidationHook({
            notes: params.notes,
            trigger: 'manual_tool',
          });
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    checkpoint: result.checkpoint,
                    status: result.status,
                    issues: result.issues,
                    record: result.record,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'generate_deliverable': {
          const params = args;
          await ensureOperationAllowed('generate_deliverable', {
            type: params.type,
          });
          let result;
          switch (params.type) {
            case 'brief':
              result = await deliverableGen.generateBrief(params.context);
              break;
            case 'prd':
              result = await deliverableGen.generatePRD(params.context);
              break;
            case 'architecture':
              result = await deliverableGen.generateArchitecture(params.context);
              break;
            case 'epic':
              result = await deliverableGen.generateEpic(params.context);
              break;
            case 'story':
              result = await deliverableGen.generateStory(params.context);
              break;
            case 'qa_assessment':
              result = await deliverableGen.generateQAAssessment(params.context);
              break;
            default:
              throw new Error(`Unknown deliverable type: ${params.type}`);
          }
          const metadata = {};
          if (result?.path) {
            metadata.path = result.path;
          }
          if (params.type === 'story') {
            if (result?.storyId) {
              metadata.storyId = result.storyId;
            }
            if (result?.epicNumber != null) {
              metadata.epicNumber = result.epicNumber;
            }
            if (result?.storyNumber != null) {
              metadata.storyNumber = result.storyNumber;
            }
            if (result?.structured) {
              metadata.structuredStory = result.structured;
              const structuredStory = result.structured;
              if (structuredStory?.title) {
                metadata.title = structuredStory.title;
              }
              if (structuredStory?.persona) {
                metadata.persona = structuredStory.persona;
              }
              if (structuredStory?.acceptanceCriteria) {
                metadata.acceptanceCriteria = structuredStory.acceptanceCriteria;
              }
              if (structuredStory?.definitionOfDone) {
                metadata.definitionOfDone = structuredStory.definitionOfDone;
              }
              if (structuredStory?.testingStrategy) {
                metadata.testingStrategy = structuredStory.testingStrategy;
              }
              if (structuredStory?.technicalDetails) {
                metadata.technicalDetails = structuredStory.technicalDetails;
              }
            }
          }
          await projectState.storeDeliverable(params.type, result.content, metadata);
          response = {
            content: [
              {
                type: 'text',
                text: `Deliverable generated: ${result.path}\n\nPreview:\n${result.content.substring(0, 500)}...`,
              },
            ],
          };
          break;
        }
        case 'record_decision': {
          const params = args;
          await projectState.recordDecision(params.key, params.value, params.rationale || '');
          response = {
            content: [
              {
                type: 'text',
                text: `Decision recorded: ${params.key} = ${params.value}`,
              },
            ],
          };
          break;
        }
        case 'add_conversation_message': {
          const params = args;
          await projectState.addMessage(params.role, params.content);
          response = {
            content: [
              {
                type: 'text',
                text: 'Message added to conversation history',
              },
            ],
          };
          break;
        }
        case 'get_project_summary': {
          const summary = projectState.getSummary();
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(summary, null, 2),
              },
            ],
          };
          break;
        }
        case 'list_aidesigner_agents': {
          const agents = await aidesignerBridge.listAgents();
          response = {
            content: [
              {
                type: 'text',
                text: `Available aidesigner agents:\n${agents.map((a) => `- ${a}`).join('\n')}`,
              },
            ],
          };
          break;
        }
        case 'execute_aidesigner_workflow': {
          const params = args;
          const result = await aidesignerBridge.executePhaseWorkflow(
            params.phase,
            params.context || {},
          );
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
          break;
        }
        case 'run_review_checkpoint': {
          const params = args;
          const config = REVIEW_CHECKPOINTS[params.checkpoint];
          if (!config) {
            throw new Error(`Unknown review checkpoint: ${params.checkpoint}`);
          }
          await ensureOperationAllowed('run_review_checkpoint', {
            checkpoint: params.checkpoint,
            phase: config.sourcePhase,
          });
          const lane = config.lane ?? 'review';
          logger.info('review_checkpoint_started', {
            operation: 'run_review_checkpoint',
            checkpoint: params.checkpoint,
            reviewer: config.agent,
            lane,
          });
          const reviewLLM = await createLLMClient(lane);
          const reviewBridge = new AidesignerBridge({ llmClient: reviewLLM });
          await reviewBridge.initialize();
          const projectSnapshot = projectState.exportForLLM();
          const phaseDeliverables = projectState.getPhaseDeliverables(config.sourcePhase);
          const deliverables =
            config.deliverableKeys && config.deliverableKeys.length > 0
              ? Object.fromEntries(
                  config.deliverableKeys
                    .map((key) => [key, phaseDeliverables?.[key]])
                    .filter(([, value]) => value != null),
                )
              : phaseDeliverables;
          const reviewContext = {
            task: config.instructions,
            checkpoint: params.checkpoint,
            reviewerTitle: config.title,
            project: projectSnapshot,
            phaseDeliverables: deliverables,
            additionalNotes: params.notes ?? '',
          };
          const reviewResult = await reviewBridge.runAgent(config.agent, reviewContext);
          let parsedOutcome = reviewResult?.response;
          if (typeof parsedOutcome === 'string') {
            try {
              parsedOutcome = JSON.parse(parsedOutcome);
            } catch (error) {
              parsedOutcome = {
                status: 'revise',
                summary: 'Reviewer response was not valid JSON.',
                raw: reviewResult?.response,
              };
            }
          }
          if (parsedOutcome == null || typeof parsedOutcome !== 'object') {
            parsedOutcome = {
              status: 'revise',
              summary: 'Reviewer response unavailable.',
              raw: reviewResult?.response,
            };
          }
          if (!parsedOutcome.status) {
            parsedOutcome.status = 'revise';
          }
          const record = await projectState.recordReviewOutcome(params.checkpoint, {
            phase: config.sourcePhase,
            reviewer: config.agent,
            lane,
            status: parsedOutcome.status,
            summary: parsedOutcome.summary ?? parsedOutcome.notes ?? '',
            risks: parsedOutcome.risks ?? [],
            followUp: parsedOutcome.follow_up ?? parsedOutcome.actions ?? [],
            additionalNotes: params.notes ?? undefined,
            outcome: parsedOutcome,
          });
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    checkpoint: params.checkpoint,
                    record,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'scan_codebase': {
          const codebase = await brownfieldAnalyzer.scanCodebase();
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(codebase, null, 2),
              },
            ],
          };
          break;
        }
        case 'detect_existing_docs': {
          const docs = await brownfieldAnalyzer.detectExistingDocs();
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(docs, null, 2),
              },
            ],
          };
          break;
        }
        case 'load_previous_state': {
          const previousState = await brownfieldAnalyzer.detectPreviousState();
          if (previousState.exists && previousState.state) {
            await projectState.updateState(previousState.state);
            response = {
              content: [
                {
                  type: 'text',
                  text: `Previous session loaded successfully!\n\nLast Phase: ${previousState.lastPhase}\nLast Updated: ${previousState.lastUpdated}\n\n${JSON.stringify(previousState.state, null, 2)}`,
                },
              ],
            };
            break;
          }
          response = {
            content: [
              {
                type: 'text',
                text: 'No previous aidesigner session found. Starting fresh.',
              },
            ],
          };
          break;
        }
        case 'get_codebase_summary': {
          const summary = await brownfieldAnalyzer.generateCodebaseSummary();
          response = {
            content: [
              {
                type: 'text',
                text: summary.summary,
              },
            ],
          };
          break;
        }
        case 'select_development_lane': {
          const params = args;
          const context = {
            ...params.context,
            previousPhase: projectState.state.currentPhase,
            hasExistingPRD: Object.keys(projectState.deliverables).length > 0,
          };
          const selectionTimer = logger.startTimer();
          const decision = await LaneSelector.selectLaneWithLog(
            params.userMessage,
            context,
            projectState.projectPath,
          );
          const selectionDurationMs = selectionTimer();
          const scaleLevel = decision.level ?? decision.scale?.level;
          const scaleScore = decision.scale?.score;
          const scaleSignals = decision.scale?.signals;
          const levelRationale = decision.levelRationale;
          logger.info('lane_selection_completed', {
            operation: 'select_development_lane',
            lane: decision.lane,
            confidence: decision.confidence,
            level: scaleLevel,
            levelScore: scaleScore,
            levelSignals: scaleSignals,
            levelRationale,
            durationMs: selectionDurationMs,
          });
          logger.recordTiming('mcp.lane.selection.duration_ms', selectionDurationMs, {
            operation: 'select_development_lane',
            lane: decision.lane,
          });
          await projectState.recordLaneDecision(
            decision.lane,
            decision.rationale,
            decision.confidence,
            params.userMessage,
            {
              level: scaleLevel,
              levelScore: scaleScore,
              levelSignals: scaleSignals,
              levelRationale,
            },
          );
          laneDecisions.push({
            lane: decision.lane,
            rationale: decision.rationale,
            confidence: decision.confidence,
            trigger: params.userMessage,
            level: scaleLevel,
            levelScore: scaleScore,
            levelSignals: scaleSignals,
            levelRationale,
          });
          outcomeFields.lane = decision.lane;
          outcomeFields.confidence = decision.confidence;
          outcomeFields.trigger = params.userMessage;
          if (scaleLevel !== undefined) {
            outcomeFields.level = scaleLevel;
          }
          if (scaleScore !== undefined) {
            outcomeFields.levelScore = scaleScore;
          }
          if (scaleSignals !== undefined) {
            outcomeFields.levelSignals = scaleSignals;
          }
          if (levelRationale) {
            outcomeFields.levelRationale = levelRationale;
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(decision, null, 2),
              },
            ],
          };
          break;
        }
        case 'execute_workflow': {
          const params = args;
          const context = {
            ...params.context,
            previousPhase: projectState.state.currentPhase,
            hasExistingPRD: Object.keys(projectState.deliverables).length > 0,
          };
          const selectionTimer = logger.startTimer();
          const decision = await LaneSelector.selectLaneWithLog(
            params.userRequest,
            context,
            projectState.projectPath,
          );
          const selectionDurationMs = selectionTimer();
          const scaleLevel = decision.level ?? decision.scale?.level;
          const scaleScore = decision.scale?.score;
          const scaleSignals = decision.scale?.signals;
          const levelRationale = decision.levelRationale;
          logger.info('lane_selection_completed', {
            operation: 'execute_workflow',
            lane: decision.lane,
            confidence: decision.confidence,
            level: scaleLevel,
            levelScore: scaleScore,
            levelSignals: scaleSignals,
            levelRationale,
            durationMs: selectionDurationMs,
          });
          logger.recordTiming('mcp.lane.selection.duration_ms', selectionDurationMs, {
            operation: 'execute_workflow',
            lane: decision.lane,
          });
          await projectState.recordLaneDecision(
            decision.lane,
            decision.rationale,
            decision.confidence,
            params.userRequest,
            {
              level: scaleLevel,
              levelScore: scaleScore,
              levelSignals: scaleSignals,
              levelRationale,
            },
          );
          laneDecisions.push({
            lane: decision.lane,
            rationale: decision.rationale,
            confidence: decision.confidence,
            trigger: params.userRequest,
            level: scaleLevel,
            levelScore: scaleScore,
            levelSignals: scaleSignals,
            levelRationale,
          });
          let result;
          const quickLaneActive = quickLaneEnabled && typeof quickLane?.execute === 'function';
          const selectedQuickLane = decision.lane === 'quick';
          const executedLane = selectedQuickLane && quickLaneActive ? 'quick' : 'complex';
          outcomeFields.lane = decision.lane;
          outcomeFields.executedLane = executedLane;
          outcomeFields.confidence = decision.confidence;
          outcomeFields.request = params.userRequest;
          if (scaleLevel !== undefined) {
            outcomeFields.level = scaleLevel;
          }
          if (scaleScore !== undefined) {
            outcomeFields.levelScore = scaleScore;
          }
          if (scaleSignals !== undefined) {
            outcomeFields.levelSignals = scaleSignals;
          }
          if (levelRationale) {
            outcomeFields.levelRationale = levelRationale;
          }
          if (selectedQuickLane && !quickLaneActive) {
            outcomeFields.quickLaneAvailable = false;
            if (quickLaneDisabledReason) {
              outcomeFields.quickLaneDisabledReason = quickLaneDisabledReason;
            }
          }
          if (executedLane === 'quick') {
            await ensureOperationAllowed('execute_quick_lane', {
              decision,
              request: params.userRequest,
            });
            logger.info('lane_workflow_started', {
              operation: 'execute_workflow',
              lane: 'quick',
              request: params.userRequest,
            });
            const laneTimer = logger.startTimer();
            result = await quickLane.execute(params.userRequest, context);
            const laneDurationMs = laneTimer();
            logger.info('lane_workflow_completed', {
              operation: 'execute_workflow',
              lane: 'quick',
              confidence: decision.confidence,
              durationMs: laneDurationMs,
            });
            logger.recordTiming('mcp.lane.workflow.duration_ms', laneDurationMs, {
              operation: 'execute_workflow',
              lane: 'quick',
            });
            outcomeFields.workflowDurationMs = laneDurationMs;
            result.lane = 'quick';
            result.decision = decision;
          } else {
            if (selectedQuickLane && !quickLaneActive) {
              logger.info('quick_lane_execution_skipped', {
                operation: 'execute_workflow',
                fallbackLane: 'complex',
                reason: quickLaneDisabledReason ?? QUICK_LANE_FALLBACK_REASON,
              });
            }
            await ensureOperationAllowed('execute_complex_lane', {
              decision,
              request: params.userRequest,
            });
            logger.info('lane_workflow_started', {
              operation: 'execute_workflow',
              lane: 'complex',
              request: params.userRequest,
            });
            const laneTimer = logger.startTimer();
            await aidesignerBridge.executePhaseWorkflow('analyst', {
              userMessage: params.userRequest,
              ...context,
            });
            await aidesignerBridge.executePhaseWorkflow('pm', context);
            await aidesignerBridge.executePhaseWorkflow('architect', context);
            await aidesignerBridge.executePhaseWorkflow('sm', context);
            result = {
              lane: 'complex',
              decision,
              files: ['docs/prd.md', 'docs/architecture.md', 'docs/stories/*.md'],
              message: 'Complex workflow executed through aidesigner agents',
            };
            if (selectedQuickLane && !quickLaneActive) {
              result.quickLane = {
                available: false,
                reason: quickLaneDisabledReason,
              };
            }
            const laneDurationMs = laneTimer();
            logger.info('lane_workflow_completed', {
              operation: 'execute_workflow',
              lane: 'complex',
              confidence: decision.confidence,
              durationMs: laneDurationMs,
            });
            logger.recordTiming('mcp.lane.workflow.duration_ms', laneDurationMs, {
              operation: 'execute_workflow',
              lane: 'complex',
            });
            outcomeFields.workflowDurationMs = laneDurationMs;
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
          break;
        }
        case 'search_mcp_servers': {
          const params = args;
          const McpRegistry = (0, lib_resolver_js_1.requireLibModule)('../tools/mcp-registry.js');
          const registry = new McpRegistry();
          const results = await registry.search(params.query, {
            category: params.category,
          });
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    query: params.query,
                    results: results.map((s) => ({
                      id: s.id,
                      name: s.name,
                      category: s.category,
                      description: s.description,
                      envVars: s.envVars || [],
                      installCommand: `install_mcp_server with serverId: ${s.id}`,
                    })),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'suggest_mcp_servers': {
          const McpRegistry = (0, lib_resolver_js_1.requireLibModule)('../tools/mcp-registry.js');
          const registry = new McpRegistry();
          const suggestions = await registry.suggestForProject(projectState.projectPath);
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    suggestions: suggestions.map((s) => ({
                      server: {
                        id: s.server.id,
                        name: s.server.name,
                        category: s.server.category,
                        description: s.server.description,
                        envVars: s.server.envVars || [],
                      },
                      reason: s.reason,
                      installCommand: `install_mcp_server with serverId: ${s.server.id}`,
                    })),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'install_mcp_server': {
          const params = args;
          await ensureOperationAllowed('install_mcp_server', { serverId: params.serverId });
          const McpRegistry = (0, lib_resolver_js_1.requireLibModule)('../tools/mcp-registry.js');
          const McpManager = (0, lib_resolver_js_1.requireLibModule)('../tools/mcp-manager.js');
          const registry = new McpRegistry();
          const manager = new McpManager({ rootDir: projectState.projectPath });
          const server = await registry.getServer(params.serverId);
          if (!server) {
            throw new Error(`MCP server "${params.serverId}" not found in registry`);
          }
          const serverConfig = {
            command: server.installType === 'npx' ? 'npx' : server.command,
            args: server.installType === 'npx' ? ['-y', server.name] : server.args || [],
            disabled: false,
          };
          if (params.envVars && Object.keys(params.envVars).length > 0) {
            serverConfig.env = params.envVars;
          }
          const requestedConfig = params.config || 'aidesigner';
          const normalisedRequest = requestedConfig.toLowerCase();
          // Validate config parameter
          const validConfigs = ['aidesigner', 'claude', 'both', 'bmad'];
          if (!validConfigs.includes(normalisedRequest)) {
            throw new Error(
              `Invalid config parameter: "${params.config}". Valid options are: "aidesigner" (default), "claude", "both", or "bmad" (legacy alias for "aidesigner")`,
            );
          }
          const legacyAliasUsed = normalisedRequest === 'bmad';
          const effectiveConfig = legacyAliasUsed ? 'aidesigner' : normalisedRequest;
          const applyClaudeConfig = normalisedRequest === 'claude' || normalisedRequest === 'both';
          const applyaidesignerConfig =
            effectiveConfig === 'aidesigner' || normalisedRequest === 'both';
          if (applyClaudeConfig) {
            const config = manager.loadClaudeConfig();
            config.mcpServers = config.mcpServers || {};
            config.mcpServers[params.serverId] = serverConfig;
            manager.saveClaudeConfig(config);
          }
          if (applyaidesignerConfig) {
            const config = manager.loadaidesignerConfig();
            config.mcpServers = config.mcpServers || {};
            config.mcpServers[params.serverId] = serverConfig;
            manager.saveaidesignerConfig(config);
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    serverId: params.serverId,
                    serverName: server.name,
                    targetConfig: effectiveConfig,
                    requestedConfig,
                    message: `Successfully installed ${server.name} to ${effectiveConfig} configuration${legacyAliasUsed ? ' (legacy alias: bmad)' : ''}`,
                    restartRequired: true,
                    restartMessage:
                      'Please restart your chat session for the MCP server to be loaded and available.',
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'list_mcp_servers': {
          const McpManager = (0, lib_resolver_js_1.requireLibModule)('../tools/mcp-manager.js');
          const manager = new McpManager({ rootDir: projectState.projectPath });
          const claudeConfig = manager.loadClaudeConfig();
          const aidesignerConfig = manager.loadaidesignerConfig();
          const allServers = new Map();
          for (const [name, config] of Object.entries(claudeConfig.mcpServers || {})) {
            allServers.set(name, { ...config, source: 'claude' });
          }
          for (const [name, config] of Object.entries(aidesignerConfig.mcpServers || {})) {
            if (!allServers.has(name)) {
              allServers.set(name, { ...config, source: 'aidesigner' });
            } else {
              allServers.get(name).source = 'both';
            }
          }
          const serverList = Array.from(allServers.entries()).map(([name, config]) => ({
            name,
            command: config.command,
            args: config.args || [],
            disabled: config.disabled || false,
            source: config.source,
            hasEnv: config.env && Object.keys(config.env).length > 0,
          }));
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    servers: serverList,
                    total: serverList.length,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'get_mcp_health': {
          const McpManager = (0, lib_resolver_js_1.requireLibModule)('../tools/mcp-manager.js');
          const manager = new McpManager({ rootDir: projectState.projectPath });
          const claudeConfig = manager.loadClaudeConfig();
          const aidesignerConfig = manager.loadaidesignerConfig();
          const allServers = new Map();
          for (const [name, config] of Object.entries(claudeConfig.mcpServers || {})) {
            allServers.set(name, config);
          }
          for (const [name, config] of Object.entries(aidesignerConfig.mcpServers || {})) {
            if (!allServers.has(name)) {
              allServers.set(name, config);
            }
          }
          const healthResults = [];
          for (const [name, config] of allServers) {
            if (config.disabled) {
              healthResults.push({ name, status: 'disabled' });
              continue;
            }
            try {
              const result = await manager.testServer(name, config);
              healthResults.push(result);
            } catch (error) {
              healthResults.push({
                name,
                status: 'error',
                message: error instanceof Error ? error.message : String(error),
              });
            }
          }
          const healthy = healthResults.filter((r) => r.status === 'healthy').length;
          const total = healthResults.length;
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    summary: `${healthy}/${total} servers healthy`,
                    healthy,
                    total,
                    servers: healthResults,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'browse_mcp_registry': {
          const params = args;
          const McpRegistry = (0, lib_resolver_js_1.requireLibModule)('../tools/mcp-registry.js');
          const registry = new McpRegistry();
          const servers = await registry.getServers(params.refresh || false);
          const categories = await registry.getCategories();
          const grouped = {};
          for (const category of categories) {
            grouped[category] = servers.filter((s) => s.category === category);
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    total: servers.length,
                    categories,
                    servers: grouped,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'generate_nano_banana_prompts': {
          const params = args;
          // Read template
          const templatePath = path.join(
            aidesignerBridge.aidesignerCorePath,
            'templates',
            'nano-banana-prompt.md',
          );
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          // Populate template with context
          const productContext = {
            concept_variations: '3',
            product_name: params.productName,
            product_descriptor: params.productDescriptor,
            primary_persona: params.primaryPersona,
            search_goal: `finding relevant ${params.productName} items`,
            write_goal: `creating new content in ${params.productName}`,
            signup_value_prop: `joining ${params.productName} community`,
            signin_security_needs: 'secure authentication',
            brand_palette: params.brandPalette || 'Modern blue and white palette',
            typography: 'Clean sans-serif fonts',
            illustration_style: params.visualStyle || 'Modern SaaS design',
            experience_tone: 'Professional yet approachable',
            layout_principles: 'Card-based layouts with clear hierarchy',
            voice_guidelines: 'Concise and action-oriented',
          };
          let populatedPrompt = templateContent;
          for (const [key, value] of Object.entries(productContext)) {
            populatedPrompt = populatedPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
          }
          // Create docs/ui directory if it doesn't exist
          const docsUiDir = path.join(
            projectState.state.projectRoot || process.cwd(),
            'docs',
            'ui',
          );
          await fs.ensureDir(docsUiDir);
          // Write brief file
          const briefPath = path.join(docsUiDir, 'nano-banana-brief.md');
          const briefContent = `# Nano Banana Visual Concept Brief

## Project: ${params.productName}

${params.productDescriptor}

## Target Users
${params.primaryPersona}

## Ready-to-Use Prompt for Google AI Studio

Copy the prompt below and paste it into https://aistudio.google.com/ (Gemini 2.5 Flash)

---

${populatedPrompt}

---

## Next Steps

1. Visit https://aistudio.google.com/
2. Select Gemini 2.5 Flash model
3. Copy and paste the prompt above
4. Generate visual concepts
5. Review the 3 concepts and select your preferred direction
6. Save your selected concept images to docs/mockups/

${params.designTokens ? `\n## Design Tokens\n\n${JSON.stringify(params.designTokens, null, 2)}\n` : ''}
`;
          await fs.writeFile(briefPath, briefContent, 'utf-8');
          response = {
            content: [
              {
                type: 'text',
                text: `✓ Created Nano Banana prompts in ${briefPath}\n\nNext: Copy the prompt from that file and paste it into https://aistudio.google.com/`,
              },
            ],
          };
          break;
        }
        case 'generate_ui_designer_prompts': {
          const params = args;
          // Generate per-screen prompts
          const screenPrompts = params.journey
            .map(
              (step, index) => `
## Screen ${index + 1}: ${step.screenName}

**Purpose:** ${step.purpose}

**User Goal:** ${step.userGoal}

**Design Prompt:**

Create a visual mockup for the ${step.screenName} screen. This screen should help users ${step.userGoal.toLowerCase()}.

Key requirements:
- Clear visual hierarchy
- Accessible contrast ratios
- Mobile-first responsive design
- Consistent with overall product design language
- Prominent primary actions

${params.visualContext ? `**Visual Context:**\n${JSON.stringify(params.visualContext, null, 2)}` : ''}
`,
            )
            .join('\n---\n');
          // Create docs/ui directory
          const docsUiDir = path.join(
            projectState.state.projectRoot || process.cwd(),
            'docs',
            'ui',
          );
          await fs.ensureDir(docsUiDir);
          // Write prompts file
          const promptsPath = path.join(docsUiDir, 'ui-designer-screen-prompts.md');
          const promptsContent = `# UI Designer Screen Prompts

## User Journey Overview

${params.journey.map((s, i) => `${i + 1}. ${s.screenName} - ${s.purpose}`).join('\n')}

---

${screenPrompts}

---

## Usage

Use these prompts with:
- Gemini 2.5 Flash (https://aistudio.google.com/)
- Midjourney
- DALL-E
- Figma AI
- Your preferred design tool

Generate concepts for each screen, then refine based on user feedback.
`;
          await fs.writeFile(promptsPath, promptsContent, 'utf-8');
          response = {
            content: [
              {
                type: 'text',
                text: `✓ Created UI designer prompts in ${promptsPath}\n\nGenerated ${params.journey.length} screen-specific design prompts.`,
              },
            ],
          };
          break;
        }
        case 'check_chrome_mcp_available': {
          try {
            // Check if chrome-devtools-mcp is in the MCP config
            const McpManager = (0, lib_resolver_js_1.requireLibModule)('../tools/mcp-manager.js');
            const manager = new McpManager({ rootDir: projectState.projectPath });
            const claudeConfig = manager.loadClaudeConfig();
            const aidesignerConfig = manager.loadaidesignerConfig();
            const hasChromeInClaude = claudeConfig.mcpServers?.['chrome-devtools'] != null;
            const hasChromeInAidesigner = aidesignerConfig.mcpServers?.['chrome-devtools'] != null;
            const isAvailable = hasChromeInClaude || hasChromeInAidesigner;
            if (isAvailable) {
              response = {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        available: true,
                        message: 'Chrome DevTools MCP is installed and available',
                        source: hasChromeInClaude ? 'claude' : 'aidesigner',
                      },
                      null,
                      2,
                    ),
                  },
                ],
              };
            } else {
              response = {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        available: false,
                        message: 'Chrome DevTools MCP is not installed',
                        installInstructions: {
                          step1: 'Add to .mcp.json or .claude/mcp-config.json:',
                          config: {
                            mcpServers: {
                              'chrome-devtools': {
                                command: 'npx',
                                args: ['-y', 'chrome-devtools-mcp'],
                                disabled: false,
                              },
                            },
                          },
                          step2: 'Or run: npm run mcp:install chrome-devtools',
                          step3: 'Restart your chat session',
                        },
                      },
                      null,
                      2,
                    ),
                  },
                ],
              };
            }
          } catch (error) {
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      available: false,
                      error: 'Could not check Chrome MCP availability',
                      message: error instanceof Error ? error.message : String(error),
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          break;
        }
        case 'extract_design_tokens_from_url': {
          const params = args;
          const selectors = params.selectors || [
            'body',
            'h1',
            'h2',
            'h3',
            'button',
            'a',
            '.primary',
            '.accent',
          ];
          try {
            // NOTE: This is a proxy - it expects Chrome MCP to be available in the same session
            // Claude/Codex CLI will have both aidesigner MCP and chrome-devtools MCP loaded
            // We instruct the LLM to call Chrome MCP tools directly, then we parse the response
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      action: 'chrome_mcp_required',
                      instructions: `To extract design tokens from ${params.url}, you need to:

1. Use the Chrome DevTools MCP server tools (if available):
   - Call chrome_navigate with url: "${params.url}"
   - Call chrome_get_computed_styles with selectors: ${JSON.stringify(selectors)}
   - Call chrome_get_css_variables to extract CSS custom properties

2. Parse the response to extract:
   - Color palette (all unique color values)
   - Typography (font-family, font-size, font-weight)
   - Spacing tokens (margin, padding values)
   - CSS variables (--color-*, --font-*, --space-*)

3. Format the extracted tokens as:
   {
     "cssVariables": { "--color-primary": "#...", "--font-base": "..." },
     "palette": ["#...", "#..."],
     "typography": { "headingFont": "...", "bodyFont": "...", "scale": {...} },
     "spacingScale": [8, 16, 24, ...],
     "sourceUrl": "${params.url}"
   }

4. Store the evidence using store_design_evidence tool

If Chrome MCP tools are not available, inform the user and provide manual extraction instructions.`,
                      url: params.url,
                      selectors: selectors,
                      manualFallback: {
                        message: 'If Chrome MCP is not available, you can:',
                        options: [
                          '1. Install Chrome MCP: npm run mcp:install chrome-devtools',
                          '2. Manually inspect the site and provide color/font information',
                          '3. Use browser DevTools to extract CSS variables and share them',
                        ],
                      },
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          } catch (error) {
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      error: 'Failed to prepare token extraction',
                      message: error instanceof Error ? error.message : String(error),
                      fallback: 'Provide colors and fonts manually, or install Chrome DevTools MCP',
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          break;
        }
        case 'store_design_evidence': {
          const params = args;
          try {
            // Create docs/ui/chrome-mcp directory
            const evidenceDir = path.join(
              projectState.state.projectRoot || process.cwd(),
              'docs',
              'ui',
              'chrome-mcp',
            );
            await fs.ensureDir(evidenceDir);
            // Generate filename from URL
            const urlSlug = params.sourceUrl
              .replace(/^https?:\/\//, '')
              .replace(/[^a-z0-9]/gi, '-')
              .toLowerCase()
              .slice(0, 50);
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${urlSlug}-${timestamp}.json`;
            const filepath = path.join(evidenceDir, filename);
            // Store evidence with metadata
            const evidencePack = {
              sourceUrl: params.sourceUrl,
              extractedAt: new Date().toISOString(),
              evidence: params.evidence,
              metadata: {
                extractionMethod: 'chrome-mcp',
                toolVersion: '1.0.0',
              },
            };
            await fs.writeFile(filepath, JSON.stringify(evidencePack, null, 2), 'utf-8');
            // Also update a manifest file
            const manifestPath = path.join(evidenceDir, 'evidence-manifest.json');
            let manifest = {};
            if (await fs.pathExists(manifestPath)) {
              manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
            }
            manifest[params.sourceUrl] = {
              filename,
              extractedAt: evidencePack.extractedAt,
              hasColors: !!params.evidence.palette?.length,
              hasTypography: !!params.evidence.typography,
              hasCssVariables:
                !!params.evidence.cssVariables &&
                Object.keys(params.evidence.cssVariables).length > 0,
            };
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Design evidence stored successfully`,
                      filepath,
                      evidencePack: {
                        sourceUrl: params.sourceUrl,
                        colorsExtracted: params.evidence.palette?.length || 0,
                        cssVariablesExtracted: Object.keys(params.evidence.cssVariables || {})
                          .length,
                        typographyExtracted: !!params.evidence.typography,
                      },
                      usage: `This evidence will be automatically used when generating UI designer prompts. The tokens are stored in ${evidenceDir}/`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          } catch (error) {
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: false,
                      error: 'Failed to store design evidence',
                      message: error instanceof Error ? error.message : String(error),
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          break;
        }
        case 'analyze_gemini_concepts': {
          const params = args;
          try {
            const analysis = {
              iterationNumber: params.iterationNumber,
              concepts: [],
              extractedPatterns: {
                colorPalettes: [],
                layoutStyles: [],
                componentPatterns: [],
              },
              userFeedback: params.userFeedback || '',
            };
            // If images provided, store URLs for future vision analysis
            if (params.imageUrls && params.imageUrls.length > 0) {
              analysis.concepts = params.imageUrls.map((url, index) => ({
                conceptId: `concept-${index + 1}`,
                imageUrl: url,
                analyzed: false, // Vision analysis would happen here in production
              }));
            }
            // Store analysis in deliverables
            const iterationDir = path.join(
              projectState.state.projectRoot || process.cwd(),
              'docs',
              'ui',
              'iterations',
            );
            await fs.ensureDir(iterationDir);
            const analysisFile = path.join(
              iterationDir,
              `iteration-${params.iterationNumber}-analysis.json`,
            );
            await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 2), 'utf-8');
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      analysis,
                      storedAt: analysisFile,
                      message: `Analysis for iteration ${params.iterationNumber} stored successfully`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          } catch (error) {
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: false,
                      error: error instanceof Error ? error.message : String(error),
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          break;
        }
        case 'refine_design_prompts': {
          const params = args;
          try {
            const promptsPath = path.join(
              projectState.state.projectRoot || process.cwd(),
              'docs',
              'ui',
              'ui-designer-screen-prompts.md',
            );
            // Read current prompt if exists
            let currentPrompt = '';
            if (await fs.pathExists(promptsPath)) {
              currentPrompt = await fs.readFile(promptsPath, 'utf-8');
            }
            // Add refinements section
            const refinedPrompt = `${currentPrompt}

---

## Iteration ${params.iterationNumber} Refinements

**Keep:**
${params.keepElements.map((e) => `- ${e}`).join('\n')}

**Avoid:**
${params.avoidElements.map((e) => `- ${e}`).join('\n')}

**Adjustments:**
${params.adjustments}
`;
            // Save updated version
            await fs.writeFile(promptsPath, refinedPrompt, 'utf-8');
            // Copy to iterations/ for history
            const iterationDir = path.join(
              projectState.state.projectRoot || process.cwd(),
              'docs',
              'ui',
              'iterations',
            );
            await fs.ensureDir(iterationDir);
            const iterationFile = path.join(
              iterationDir,
              `iteration-${params.iterationNumber}-prompts.md`,
            );
            await fs.writeFile(iterationFile, refinedPrompt, 'utf-8');
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Prompts refined successfully for iteration ${params.iterationNumber}`,
                      updatedFile: promptsPath,
                      iterationFile,
                      refinements: {
                        keep: params.keepElements,
                        avoid: params.avoidElements,
                        adjustments: params.adjustments,
                      },
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          } catch (error) {
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: false,
                      error: error instanceof Error ? error.message : String(error),
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          break;
        }
        case 'store_ui_iteration': {
          const params = args;
          try {
            // Load or create iterations history
            const iterationsPath = path.join(
              projectState.state.projectRoot || process.cwd(),
              'docs',
              'ui',
              'design-iterations.json',
            );
            let iterations = { iterations: [] };
            if (await fs.pathExists(iterationsPath)) {
              iterations = JSON.parse(await fs.readFile(iterationsPath, 'utf-8'));
            }
            // Create new iteration record
            const iteration = {
              number: params.iterationNumber,
              date: new Date().toISOString(),
              promptsFile: params.promptsUsed,
              geminiOutputs: params.geminiOutputs || [],
              userFeedback: params.userFeedback,
              refinements: params.refinements,
              status: params.status,
            };
            // Update or add iteration
            const existingIndex = iterations.iterations.findIndex(
              (it) => it.number === params.iterationNumber,
            );
            if (existingIndex >= 0) {
              iterations.iterations[existingIndex] = iteration;
            } else {
              iterations.iterations.push(iteration);
            }
            // If validated, mark as final
            if (params.status === 'validated') {
              iterations.finalDesign = {
                iterationNumber: params.iterationNumber,
                validatedDate: new Date().toISOString(),
                promptsFile: params.promptsUsed,
              };
            }
            // Save to file
            await fs.ensureDir(path.dirname(iterationsPath));
            await fs.writeFile(iterationsPath, JSON.stringify(iterations, null, 2), 'utf-8');
            // Store in project state decisions
            await projectState.recordDecision(
              `ui_iteration_${params.iterationNumber}`,
              iteration,
              `Iteration ${params.iterationNumber}: ${params.status}`,
            );
            // If validated, store visual concept decision
            if (params.status === 'validated') {
              await projectState.recordDecision(
                'visual_concept',
                {
                  iterationNumber: params.iterationNumber,
                  validatedDate: new Date().toISOString(),
                  promptsFile: params.promptsUsed,
                  userFeedback: params.userFeedback,
                },
                'Final validated UI concept',
              );
            }
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      iteration,
                      storedAt: iterationsPath,
                      message: `Iteration ${params.iterationNumber} stored with status: ${params.status}`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          } catch (error) {
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: false,
                      error: error instanceof Error ? error.message : String(error),
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          break;
        }
        case 'get_ui_context': {
          try {
            // Retrieve UI context from project state
            const cssTokens = projectState.getDecision('css_tokens');
            const uiJourney = projectState.getDecision('ui_journey');
            const visualConcept = projectState.getDecision('visual_concept');
            // Load iterations history if exists
            const iterationsPath = path.join(
              projectState.state.projectRoot || process.cwd(),
              'docs',
              'ui',
              'design-iterations.json',
            );
            let iterations = null;
            if (await fs.pathExists(iterationsPath)) {
              iterations = JSON.parse(await fs.readFile(iterationsPath, 'utf-8'));
            }
            const context = {
              cssTokens: cssTokens?.value || null,
              uiJourney: uiJourney?.value || null,
              visualConcept: visualConcept?.value || null,
              iterations,
              hasDesignContext: !!(cssTokens || uiJourney || visualConcept),
            };
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(context, null, 2),
                },
              ],
            };
          } catch (error) {
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      hasDesignContext: false,
                      error: error instanceof Error ? error.message : String(error),
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          break;
        }
        case 'automate_gemini_concepts': {
          const params = args;
          try {
            // NOTE: This tool orchestrates Chrome MCP tools to automate Google AI Studio interaction
            // The LLM receives detailed instructions to execute the automation workflow
            const automationWorkflow = {
              action: 'chrome_automation_workflow',
              instructions: `# Automated Gemini Concept Generation Workflow

This workflow automates visual concept generation via Google AI Studio using Chrome MCP tools.

## Prerequisites Check

1. **Verify Chrome MCP availability**:
   - Chrome DevTools MCP must be installed and running
   - If not available, fallback to manual workflow (user copies prompt to AI Studio)

## Automation Steps

### Step 1: Navigate to Google AI Studio
\`\`\`
Call: navigate_page
Args: { url: "https://aistudio.google.com/" }
\`\`\`

### Step 2: Wait for page load
\`\`\`
Call: wait_for
Args: { selector: "body", timeout: 5000 }
\`\`\`

### Step 3: Check if logged in
- Use evaluate_script to check if user is logged in (look for chat interface)
- If not logged in, return error and ask user to log in manually first

### Step 4: Create new chat or use existing
\`\`\`
Call: click
Args: { selector: "[data-test-id='new-chat-button']" } // Adjust selector based on AI Studio UI
\`\`\`

Alternative: If "New chat" button not found, use existing chat interface.

### Step 5: Select model (if ${params.modelPreference || 'auto'} preference specified)
- Look for model selector dropdown
- Click and select appropriate Gemini model
- Default to Gemini 2.0 Flash Exp or latest available Flash model

### Step 6: Fill prompt
\`\`\`
Call: fill
Args: {
  selector: "textarea[placeholder*='Enter a prompt']", // Adjust based on AI Studio UI
  value: ${JSON.stringify(params.prompt)}
}
\`\`\`

### Step 7: Submit prompt
\`\`\`
Call: click
Args: { selector: "button[aria-label='Send message']" } // Adjust selector
\`\`\`

### Step 8: Wait for generation to complete
\`\`\`
Call: wait_for
Args: {
  selector: "img[src*='googleusercontent']", // Wait for generated images
  timeout: 60000 // 60 seconds for image generation
}
\`\`\`

### Step 9: Capture generated concepts
\`\`\`
Call: take_screenshot
Args: { fullPage: true }
\`\`\`

Store screenshot at: docs/ui/iterations/iteration-${params.iterationNumber}-gemini-output.png

### Step 10: Extract image URLs (optional)
\`\`\`
Call: evaluate_script
Args: {
  script: "Array.from(document.querySelectorAll('img[src*=\"googleusercontent\"]')).map(img => img.src)"
}
\`\`\`

This returns array of direct image URLs for download.

### Step 11: Download images (if direct URLs available)
For each image URL:
- Save to docs/ui/iterations/iteration-${params.iterationNumber}-concept-{N}.png
- Store image paths in iteration record

## Error Handling

If any step fails:
1. Take screenshot of current state
2. Return error with context
3. Provide manual fallback instructions

## Fallback: Manual Workflow

If Chrome MCP unavailable or automation fails:

1. Open https://aistudio.google.com/
2. Create new chat or use existing
3. Copy this prompt:

\`\`\`
${params.prompt}
\`\`\`

4. Paste into AI Studio
5. Wait for generation
6. Screenshot results
7. Save to docs/ui/iterations/iteration-${params.iterationNumber}-gemini-output.png
8. Return to CLI and provide image path

## Next Steps After Automation

Once concepts are generated and captured:
1. Call analyze_gemini_concepts with image paths
2. Show user the generated concepts
3. Elicit feedback (keep/avoid/adjust)
4. If user validates, call store_ui_iteration with status "validated"
5. If user wants refinement, call refine_design_prompts and repeat
`,
              prompt: params.prompt,
              iterationNumber: params.iterationNumber,
              outputPath: `docs/ui/iterations/iteration-${params.iterationNumber}-gemini-output.png`,
              modelPreference: params.modelPreference || 'auto',
            };
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(automationWorkflow, null, 2),
                },
              ],
            };
          } catch (error) {
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: false,
                      error: error instanceof Error ? error.message : String(error),
                      fallback: 'Use manual workflow: Copy prompt to https://aistudio.google.com/',
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          break;
        }
        case 'extract_design_specs_from_concepts': {
          const params = args;
          try {
            // NOTE: This tool analyzes Gemini-generated images and extracts design specs
            // For now, it returns a structured template that the LLM should populate
            // based on visual analysis of the images
            const extractionInstructions = {
              action: 'analyze_and_extract_specs',
              screenType: params.screenType,
              imageCount: params.imageUrls.length,
              instructions: `# Design Spec Extraction Instructions

Analyze the ${params.imageUrls.length} Gemini-generated concept images for "${params.screenType}" screen.

## For Each Variation (1, 2, 3):

### Extract Colors:
- Primary color (buttons, CTAs, links)
- Accent color (highlights, success states)
- Neutral colors (text, backgrounds, borders)
- Semantic colors (success, error, warning if visible)

### Extract Typography:
- Font family (or closest web-safe alternative)
- Font weights used (400, 600, 700, etc.)
- Font sizes (heading, body, labels)

### Extract Spacing:
- Base spacing unit (4px, 8px, etc.)
- Common spacing values used
- Padding in containers/cards
- Margins between elements

### Extract Components:
For each component visible (button, input, card, etc.):
- Dimensions (height, width if applicable)
- Border radius
- Padding
- Border style
- Shadow (if any)
- States visible (hover, focus, active)

## Output Format:

Return a JSON structure like this:

\`\`\`json
{
  "variations": [
    {
      "id": 1,
      "name": "Minimal",
      "specs": {
        "colors": {
          "primary": "#...",
          "accent": "#...",
          "neutral": ["#...", "#..."],
          "background": "#..."
        },
        "typography": {
          "fontFamily": "Inter",
          "weights": [400, 600, 700],
          "sizes": {
            "xs": "12px",
            "sm": "14px",
            "base": "16px",
            "lg": "18px",
            "xl": "24px"
          }
        },
        "spacing": {
          "unit": "8px",
          "scale": [8, 16, 24, 32, 48]
        },
        "components": {
          "button": {
            "height": "40px",
            "borderRadius": "8px",
            "padding": "12px 24px"
          },
          "input": {
            "height": "40px",
            "borderRadius": "6px",
            "border": "1px solid #..."
          },
          "card": {
            "borderRadius": "12px",
            "padding": "24px",
            "shadow": "0 4px 6px rgba(0,0,0,0.1)"
          }
        }
      }
    },
    // ... variations 2 and 3
  ]
}
\`\`\`

${params.designSystem ? `## Maintain Coherence:\n\nExisting Design System detected. Ensure extracted specs are COHERENT with:\n- Colors: ${JSON.stringify(params.designSystem.colors)}\n- Typography: ${JSON.stringify(params.designSystem.typography)}\n- Spacing: ${JSON.stringify(params.designSystem.spacing)}` : ''}
`,
              imageUrls: params.imageUrls,
            };
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(extractionInstructions, null, 2),
                },
              ],
            };
          } catch (error) {
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: false,
                      error: error instanceof Error ? error.message : String(error),
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          break;
        }
        case 'update_mockup': {
          const params = args;
          try {
            const mockupPath = path.join(
              projectState.state.projectRoot || process.cwd(),
              'docs',
              'ui',
              'mockup.html',
            );
            // Ensure directory exists
            await fs.ensureDir(path.dirname(mockupPath));
            let mockupExists = await fs.pathExists(mockupPath);
            let mockupData = {
              pages: [],
              designSystem: params.designSystem || {},
            };
            // Load existing mockup if exists
            if (mockupExists) {
              // Read existing mockup and parse data from script tag
              const existingHTML = await fs.readFile(mockupPath, 'utf-8');
              const dataMatch = existingHTML.match(/const MOCKUP_DATA = ({[\s\S]*?});/);
              if (dataMatch) {
                mockupData = JSON.parse(dataMatch[1]);
              }
            }
            // Handle different actions
            if (params.action === 'add_page' && params.page) {
              // Generate HTML for variations if not provided
              if (
                params.page.variations &&
                isScreenTypeSupported(params.page.type || params.page.name)
              ) {
                const variationNames = getVariationNames(params.page.type || params.page.name);
                params.page.variations = params.page.variations.map((variation, index) => {
                  if (!variation.html && variation.specs) {
                    const varName = variationNames[index] || variation.name;
                    try {
                      variation.html = generateHTML(
                        params.page.type || params.page.name,
                        variation.specs,
                        varName,
                      );
                    } catch (error) {
                      console.warn(
                        `Failed to generate HTML for ${params.page.name} - ${varName}:`,
                        error,
                      );
                      variation.html = `<div style="padding: 2rem; text-align: center;">HTML generation failed for ${varName}</div>`;
                    }
                  }
                  return variation;
                });
              }
              // Add or update page
              const existingPageIndex = mockupData.pages.findIndex(
                (p) => p.name === params.page.name,
              );
              if (existingPageIndex >= 0) {
                mockupData.pages[existingPageIndex] = params.page;
              } else {
                mockupData.pages.push(params.page);
              }
            } else if (
              params.action === 'select_variation' &&
              params.pageName &&
              params.variationId
            ) {
              // Mark variation as selected
              const pageIndex = mockupData.pages.findIndex((p) => p.name === params.pageName);
              if (pageIndex >= 0) {
                mockupData.pages[pageIndex].selectedVariation = params.variationId;
                // Update design system with selected variation specs
                if (mockupData.pages[pageIndex].variations) {
                  const selectedVar = mockupData.pages[pageIndex].variations.find(
                    (v) => v.id === params.variationId,
                  );
                  if (selectedVar && selectedVar.specs) {
                    mockupData.designSystem = {
                      ...mockupData.designSystem,
                      ...selectedVar.specs,
                      version: (parseFloat(mockupData.designSystem.version || '1.0') + 0.1).toFixed(
                        1,
                      ),
                      lastUpdated: new Date().toISOString(),
                    };
                  }
                }
              }
            } else if (params.action === 'update_design_system' && params.designSystem) {
              mockupData.designSystem = params.designSystem;
            }
            // Generate mockup HTML
            const mockupHTML = await generateMockupHTML(mockupData);
            // Write to file
            await fs.writeFile(mockupPath, mockupHTML, 'utf-8');
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      mockupPath,
                      action: params.action,
                      pagesCount: mockupData.pages.length,
                      message: `Mockup ${mockupExists ? 'updated' : 'created'} successfully`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          } catch (error) {
            response = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: false,
                      error: error instanceof Error ? error.message : String(error),
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          break;
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      const durationMs = stopToolTimer();
      toolLogger.info('tool_completed', { ...outcomeFields, durationMs });
      logger.recordTiming(`mcp.tool.${name}.duration_ms`, durationMs, {
        tool: name,
        operation: name,
        status: 'ok',
      });
      return response;
    } catch (error) {
      const durationMs = stopToolTimer();
      toolLogger.error('tool_failed', {
        ...outcomeFields,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      });
      logger.recordTiming(`mcp.tool.${name}.duration_ms`, durationMs, {
        tool: name,
        operation: name,
        status: 'error',
      });
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });
  await loadDependencies();
  const smokeTestCompleted = await runBundledToolsSmokeCheck({
    ensureOperationAllowed,
    logger,
  });
  if (smokeTestCompleted) {
    return;
  }
  const transport = options.transport ?? new stdio_js_1.StdioServerTransport();
  await server.connect(transport);
  logger.info('server_started', {
    operation: 'startup',
    server: serverName,
    version: serverVersion,
    transport: 'stdio',
    lanesTracked: laneDecisions.length,
  });
  if (options.onServerReady) {
    await options.onServerReady(server);
  }
}
/**
 * Runs a smoke test for bundled MCP tools to verify they can be loaded and used.
 *
 * This test validates that:
 * - MCP registry and manager modules can be successfully loaded from the bundle
 * - Registry search functionality works correctly
 * - Server installation and configuration can be performed
 * - Both Claude and aidesigner config files are properly generated
 *
 * The smoke test is enabled by setting aidesigner_MCP_SMOKE_TEST=1 environment variable.
 * When enabled, the test runs at server startup and exits early (returns true) to
 * prevent the server from continuing to run, making it suitable for CI/CD validation.
 *
 * @param ensureOperationAllowed - Security callback to validate operations
 * @param logger - Structured logger for recording test results
 * @returns true if smoke test was enabled and completed, false if disabled
 * @throws Error if smoke test fails (module not found, search fails, etc.)
 */
async function runBundledToolsSmokeCheck({ ensureOperationAllowed, logger }) {
  if (process.env.aidesigner_MCP_SMOKE_TEST !== '1') {
    return false;
  }
  const McpRegistry = (0, lib_resolver_js_1.requireLibModule)('mcp-registry.js');
  const McpManager = (0, lib_resolver_js_1.requireLibModule)('mcp-manager.js');
  const smokeRoot =
    process.env.aidesigner_MCP_SMOKE_ROOT ??
    (0, node_fs_1.mkdtempSync)(path.join((0, node_os_1.tmpdir)(), 'aidesigner-mcp-smoke-'));
  const cleanupRoot = !process.env.aidesigner_MCP_SMOKE_ROOT;
  const profile = process.env.MCP_PROFILE ?? 'default';
  try {
    const registry = new McpRegistry();
    const manager = new McpManager({ rootDir: smokeRoot, profile });
    const searchResults = await registry.search('filesystem', {});
    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      throw new Error('MCP smoke test failed: registry search returned no results');
    }
    const targetServer = await registry.getServer(searchResults[0].id);
    if (!targetServer) {
      throw new Error('MCP smoke test failed: unable to resolve server from registry');
    }
    await ensureOperationAllowed('install_mcp_server', { serverId: targetServer.id });
    const serverConfig = {
      command: targetServer.installType === 'npx' ? 'npx' : targetServer.command,
      args:
        targetServer.installType === 'npx'
          ? ['-y', targetServer.name]
          : Array.isArray(targetServer.args)
            ? targetServer.args
            : [],
      disabled: false,
    };
    if (targetServer.envVars && targetServer.envVars.length > 0) {
      const placeholderEnv = {};
      for (const key of targetServer.envVars) {
        placeholderEnv[key] = `set-${key.toLowerCase()}`;
      }
      serverConfig.env = placeholderEnv;
    }
    const claudeConfig = manager.loadClaudeConfig();
    claudeConfig.mcpServers = claudeConfig.mcpServers || {};
    claudeConfig.mcpServers[targetServer.id] = serverConfig;
    manager.saveClaudeConfig(claudeConfig);
    const aidesignerConfig = manager.loadaidesignerConfig();
    aidesignerConfig.mcpServers = aidesignerConfig.mcpServers || {};
    aidesignerConfig.mcpServers[targetServer.id] = serverConfig;
    manager.saveaidesignerConfig(aidesignerConfig);
    logger.info('mcp_smoke_test_completed', {
      operation: 'smoke_test',
      serverId: targetServer.id,
    });
    return true;
  } catch (error) {
    logger.error('mcp_smoke_test_failed', {
      operation: 'smoke_test',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  } finally {
    if (cleanupRoot) {
      (0, node_fs_1.rmSync)(smokeRoot, { recursive: true, force: true });
    }
  }
}
