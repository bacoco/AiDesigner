'use strict';

const { selectLane } = require('../lane-selector');

const QUICK_PHASE_PROGRESSION = [
  {
    id: 'analysis',
    variant: 'lite',
    focus: 'Clarify request and confirm scope without full research sprint.',
  },
  {
    id: 'development',
    variant: 'single-pass-story',
    focus: 'Implement change directly with lightweight validation.',
  },
];

const COMPLEX_PHASE_PROGRESSION = [
  {
    id: 'analysis',
    variant: 'deep-dive',
    focus: 'Full research, brainstorming, and product brief generation.',
  },
  {
    id: 'planning',
    variant: 'full-stack',
    focus: 'Produce PRD, architecture, and tech spec artifacts.',
  },
  {
    id: 'development',
    variant: 'iterative-epic-cycle',
    focus: 'Story-by-story development with dedicated review steps.',
  },
];

function buildEntryCriteria(phase, lane) {
  if (phase.id === 'analysis') {
    return lane === 'quick'
      ? 'Confirm intent and dependencies in under one cycle.'
      : 'Complete research artifacts and validate problem framing.';
  }

  if (phase.id === 'planning') {
    return 'PRD.md, Architecture.md, and tech spec ready for next epic.';
  }

  if (phase.id === 'development') {
    return lane === 'quick'
      ? 'Single implement-and-verify pass with optional reviewer.'
      : 'Story backlog prepared; review agent assigned for each story.';
  }

  return 'Follow V6 standard entry checklist.';
}

function normalizePhases(phases, lane) {
  return phases.map((phase, index) => ({
    ...phase,
    order: index + 1,
    entryCriteria: buildEntryCriteria(phase, lane),
  }));
}

function createLaneSelectionModule(options = {}) {
  const quickPhases = normalizePhases(options.quickPhases || QUICK_PHASE_PROGRESSION, 'quick');
  const complexPhases = normalizePhases(
    options.complexPhases || COMPLEX_PHASE_PROGRESSION,
    'complex',
  );

  function planPhaseProgression(workItem, context = {}) {
    if (!workItem || typeof workItem.description !== 'string') {
      throw new Error('workItem.description (string) is required to plan phases.');
    }

    const decision = selectLane(workItem.description, context);
    const phases = decision.lane === 'quick' ? quickPhases : complexPhases;

    return {
      ...decision,
      phases,
    };
  }

  return {
    id: 'v6.lane-selection-prototype',
    version: '0.1.0',
    capabilities: ['phase-progression', 'lane-routing'],
    planPhaseProgression,
    getPhaseBlueprint(lane = 'complex') {
      return lane === 'quick' ? quickPhases : complexPhases;
    },
  };
}

module.exports = {
  createLaneSelectionModule,
  QUICK_PHASE_PROGRESSION,
  COMPLEX_PHASE_PROGRESSION,
};
