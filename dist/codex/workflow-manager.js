'use strict';
/**
 * Workflow Manager Module
 * Handles interactive design conversations and progressive UI building
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.mergeDesignSystemsTool =
  exports.applyFeedbackTool =
  exports.capturePreferenceTool =
  exports.DesignWorkflow =
  exports.WorkflowState =
    void 0;
var WorkflowState;
(function (WorkflowState) {
  WorkflowState['INITIAL_BRIEF'] = 'initial_brief';
  WorkflowState['COLLECTING_REFERENCES'] = 'collecting_references';
  WorkflowState['ANALYZING_DESIGN'] = 'analyzing_design';
  WorkflowState['GENERATING_VARIANTS'] = 'generating_variants';
  WorkflowState['REFINING_OUTPUT'] = 'refining_output';
  WorkflowState['BUILDING_PAGES'] = 'building_pages';
  WorkflowState['EXPORT_READY'] = 'export_ready';
})(WorkflowState || (exports.WorkflowState = WorkflowState = {}));
class DesignWorkflow {
  constructor(sessionId) {
    this.session = this.initializeSession(sessionId);
    this.designLibrary = new Map();
    this.componentLibrary = new Map();
  }
  /**
   * Initialize a new workflow session
   */
  initializeSession(sessionId) {
    return {
      id: sessionId || this.generateSessionId(),
      state: WorkflowState.INITIAL_BRIEF,
      startTime: new Date(),
      lastUpdate: new Date(),
      designSpec: null,
      references: [],
      generatedPages: [],
      userPreferences: {},
      conversationHistory: [],
    };
  }
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `design-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Process user input and determine next action
   */
  async processUserInput(input) {
    // Log conversation
    this.addConversationEntry('user', input);
    // Analyze input intent
    const intent = this.analyzeIntent(input);
    // Process based on current state and intent
    let response;
    let action;
    let suggestions;
    switch (this.session.state) {
      case WorkflowState.INITIAL_BRIEF:
        ({ response, action, suggestions } = await this.handleInitialBrief(input, intent));
        break;
      case WorkflowState.COLLECTING_REFERENCES:
        ({ response, action, suggestions } = await this.handleReferenceCollection(input, intent));
        break;
      case WorkflowState.ANALYZING_DESIGN:
        ({ response, action, suggestions } = await this.handleDesignAnalysis(input, intent));
        break;
      case WorkflowState.GENERATING_VARIANTS:
        ({ response, action, suggestions } = await this.handleVariantGeneration(input, intent));
        break;
      case WorkflowState.REFINING_OUTPUT:
        ({ response, action, suggestions } = await this.handleRefinement(input, intent));
        break;
      case WorkflowState.BUILDING_PAGES:
        ({ response, action, suggestions } = await this.handlePageBuilding(input, intent));
        break;
      default:
        response = "I'm ready to help you create a UI. What would you like to build?";
        suggestions = this.getSuggestionsForState(this.session.state);
    }
    // Log assistant response
    this.addConversationEntry('assistant', response, action);
    // Update session
    this.session.lastUpdate = new Date();
    return { response, action, suggestions };
  }
  /**
   * Analyze user input to determine intent
   */
  analyzeIntent(input) {
    const lowercased = input.toLowerCase();
    // URL detection
    if (
      lowercased.includes('http://') ||
      lowercased.includes('https://') ||
      lowercased.includes('.com')
    ) {
      return 'provide_url';
    }
    // Image reference
    if (
      lowercased.includes('screenshot') ||
      lowercased.includes('image') ||
      lowercased.includes('photo')
    ) {
      return 'provide_image';
    }
    // Style preferences
    if (
      lowercased.includes('like') ||
      lowercased.includes('prefer') ||
      lowercased.includes('want')
    ) {
      return 'express_preference';
    }
    // Feedback
    if (
      lowercased.includes('change') ||
      lowercased.includes('modify') ||
      lowercased.includes('update')
    ) {
      return 'provide_feedback';
    }
    // Navigation
    if (
      lowercased.includes('next') ||
      lowercased.includes('continue') ||
      lowercased.includes('proceed')
    ) {
      return 'navigate_forward';
    }
    // Page request
    if (
      lowercased.includes('page') ||
      lowercased.includes('screen') ||
      lowercased.includes('add')
    ) {
      return 'request_page';
    }
    return 'general';
  }
  /**
   * Handle initial brief state
   */
  async handleInitialBrief(input, intent) {
    if (intent === 'provide_url') {
      const urls = this.extractURLs(input);
      this.session.state = WorkflowState.COLLECTING_REFERENCES;
      return {
        response: `Great! I'll analyze ${urls[0]} to extract the design system. This will help us create something inspired by it.`,
        action: {
          type: 'extract_url',
          params: { url: urls[0] },
        },
        suggestions: [
          'Add more reference sites',
          'Focus on specific components',
          'Proceed with extraction',
        ],
      };
    }
    return {
      response:
        "Let's start by understanding what you want to build. You can share URLs, images, or describe the style you're looking for.",
      suggestions: [
        "I want something like Stripe's website",
        'Create a modern SaaS dashboard',
        'Build a minimal portfolio site',
      ],
    };
  }
  /**
   * Handle reference collection state
   */
  async handleReferenceCollection(input, intent) {
    if (intent === 'provide_url') {
      const urls = this.extractURLs(input);
      return {
        response: `Adding ${urls[0]} to our references. I now have ${this.session.references.length + 1} reference(s).`,
        action: {
          type: 'extract_url',
          params: { url: urls[0] },
        },
        suggestions: [
          'Add another reference',
          'Start generating designs',
          'Focus on specific components',
        ],
      };
    }
    if (intent === 'navigate_forward' || input.toLowerCase().includes('generate')) {
      this.session.state = WorkflowState.GENERATING_VARIANTS;
      return {
        response: "Perfect! I'll now generate design variants based on your references.",
        action: {
          type: 'generate_variant',
          params: { count: 3 },
        },
      };
    }
    return {
      response: 'You can add more references or we can start generating designs.',
      suggestions: [
        'Add another website for inspiration',
        'Start generating variants',
        'Specify which components to focus on',
      ],
    };
  }
  /**
   * Handle design analysis state
   */
  async handleDesignAnalysis(input, intent) {
    // Implementation for analyzing extracted designs
    return {
      response: "I'm analyzing the design patterns from your references...",
      action: {
        type: 'merge_designs',
        params: { references: this.session.references },
      },
    };
  }
  /**
   * Handle variant generation state
   */
  async handleVariantGeneration(input, intent) {
    if (intent === 'express_preference') {
      const variantNumber = this.extractVariantNumber(input);
      if (variantNumber) {
        this.session.state = WorkflowState.REFINING_OUTPUT;
        return {
          response: `Excellent choice! Variant ${variantNumber} will be our base. What would you like to adjust?`,
          suggestions: [
            'Make the colors darker',
            'Increase spacing',
            'Change the font',
            'Add more pages',
          ],
        };
      }
    }
    return {
      response: "I've generated 3 variants. Which one do you prefer?",
      suggestions: [
        'I prefer variant 1',
        'Variant 2 but with darker colors',
        'Generate more options',
      ],
    };
  }
  /**
   * Handle refinement state
   */
  async handleRefinement(input, intent) {
    if (intent === 'provide_feedback') {
      return {
        response: "I'll apply those changes to the design.",
        action: {
          type: 'apply_feedback',
          params: { feedback: input },
        },
        suggestions: ['Make another adjustment', 'Looks good, add more pages', 'Export the design'],
      };
    }
    if (intent === 'request_page') {
      this.session.state = WorkflowState.BUILDING_PAGES;
      return {
        response: "Let's add more pages to your design. What page would you like next?",
        suggestions: ['Add a pricing page', 'Create a dashboard', 'Build a settings page'],
      };
    }
    return {
      response: 'The design has been updated. What would you like to do next?',
      suggestions: ['Make another change', 'Add more pages', 'Export the design'],
    };
  }
  /**
   * Handle page building state
   */
  async handlePageBuilding(input, intent) {
    const pageType = this.extractPageType(input);
    if (pageType) {
      return {
        response: `Creating a ${pageType} page using your design system...`,
        action: {
          type: 'generate_variant',
          params: {
            screenType: pageType,
            designSpec: this.session.designSpec,
          },
        },
        suggestions: ['Add another page', 'Modify this page', 'Export all pages'],
      };
    }
    return {
      response: 'What type of page would you like to add?',
      suggestions: ['Dashboard', 'Pricing page', 'Settings', 'Profile page'],
    };
  }
  /**
   * Get suggestions for current state
   */
  getSuggestionsForState(state) {
    const suggestions = {
      [WorkflowState.INITIAL_BRIEF]: [
        'I want a modern SaaS dashboard',
        'Create something like Linear.app',
        'Build a minimal portfolio',
      ],
      [WorkflowState.COLLECTING_REFERENCES]: [
        'Add another reference site',
        'I have enough references',
        'Focus on navigation components',
      ],
      [WorkflowState.ANALYZING_DESIGN]: [
        'Show me the extracted colors',
        'What components did you find?',
        'Continue to generation',
      ],
      [WorkflowState.GENERATING_VARIANTS]: [
        'Generate more variants',
        'I like variant 2',
        'Combine variant 1 and 3',
      ],
      [WorkflowState.REFINING_OUTPUT]: [
        'Make it darker',
        'Increase spacing',
        'Change primary color',
        'Add more pages',
      ],
      [WorkflowState.BUILDING_PAGES]: [
        'Add dashboard page',
        'Create pricing section',
        'Build settings page',
      ],
      [WorkflowState.EXPORT_READY]: [
        'Export as HTML',
        'Generate React components',
        'Download design tokens',
      ],
    };
    return suggestions[state] || [];
  }
  /**
   * Apply user feedback to current design
   */
  applyFeedback(feedback) {
    if (!this.session.designSpec) return null;
    // Apply feedback logic here
    // This would modify the design spec based on the feedback
    return this.session.designSpec;
  }
  /**
   * Merge multiple design references
   */
  mergeReferences() {
    if (this.session.references.length === 0) return null;
    // Merge logic here
    // This would combine multiple design specs with weights
    return this.session.designSpec;
  }
  /**
   * Add conversation entry
   */
  addConversationEntry(role, content, action) {
    this.session.conversationHistory.push({
      role,
      content,
      action,
      timestamp: new Date(),
    });
  }
  /**
   * Extract URLs from text
   */
  extractURLs(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }
  /**
   * Extract variant number from text
   */
  extractVariantNumber(text) {
    const match = text.match(/variant\s*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }
  /**
   * Extract page type from text
   */
  extractPageType(text) {
    const pageTypes = ['dashboard', 'pricing', 'settings', 'profile', 'landing', 'login', 'signup'];
    const lowercased = text.toLowerCase();
    for (const type of pageTypes) {
      if (lowercased.includes(type)) {
        return type;
      }
    }
    return null;
  }
  /**
   * Get current session state
   */
  getSession() {
    return this.session;
  }
  /**
   * Reset workflow to start
   */
  reset() {
    this.session = this.initializeSession();
  }
  /**
   * Export generated pages
   */
  exportPages(format) {
    const pages = this.session.generatedPages.filter((p) => p.approved);
    switch (format) {
      case 'html':
        return pages.map((p) => p.html);
      case 'react':
        // Convert to React components
        return pages.map((p) => this.convertToReact(p.html));
      case 'tokens':
        return this.session.designSpec;
      default:
        return pages;
    }
  }
  /**
   * Convert HTML to React component (placeholder)
   */
  convertToReact(html) {
    // This would convert HTML to React components
    return `
import React from 'react';

export default function Component() {
  return (
    <div dangerouslySetInnerHTML={{ __html: \`${html}\` }} />
  );
}
    `;
  }
}
exports.DesignWorkflow = DesignWorkflow;
/**
 * Tool definition for capturing user preferences
 */
exports.capturePreferenceTool = {
  name: 'capture_user_preference',
  description: 'Capture and store user design preferences',
  inputSchema: {
    type: 'object',
    properties: {
      preference: {
        type: 'string',
        description: 'The preference expressed by the user',
      },
      category: {
        type: 'string',
        enum: ['color', 'typography', 'spacing', 'style', 'component'],
        description: 'Category of preference',
      },
    },
    required: ['preference'],
  },
};
/**
 * Tool definition for applying design feedback
 */
exports.applyFeedbackTool = {
  name: 'apply_design_feedback',
  description: 'Apply user feedback to refine the design',
  inputSchema: {
    type: 'object',
    properties: {
      feedback: {
        type: 'string',
        description: 'The feedback to apply',
      },
      targetComponent: {
        type: 'string',
        description: 'Specific component to modify',
      },
      adjustment: {
        type: 'string',
        enum: ['darker', 'lighter', 'larger', 'smaller', 'more-spacing', 'less-spacing', 'custom'],
        description: 'Type of adjustment',
      },
      value: {
        type: 'string',
        description: 'Specific value for custom adjustment',
      },
    },
    required: ['feedback', 'adjustment'],
  },
};
/**
 * Tool definition for merging design systems
 */
exports.mergeDesignSystemsTool = {
  name: 'merge_design_systems',
  description: 'Merge multiple design systems with weighted ratios',
  inputSchema: {
    type: 'object',
    properties: {
      systems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            weight: { type: 'number' },
          },
        },
        description: 'Design systems to merge with weights',
      },
    },
    required: ['systems'],
  },
};
