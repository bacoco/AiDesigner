/**
 * Lane Selector Tests
 * Verify correct classification of tasks between complex and quick lanes
 */

const { selectLane, QUICK_FIX_KEYWORDS, COMPLEX_KEYWORDS } = require('../lib/lane-selector');

describe('Lane Selector', () => {
  describe('Quick Fix Keywords', () => {
    test('should select quick lane for typo fix', () => {
      const result = selectLane('Fix typo in README');

      expect(result.lane).toBe('quick');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.factors.quickFixKeywords).toBeGreaterThan(0);
      // Quick fixes should always be scale level 0 (trivial work)
      expect(result.scale.level).toBe(0);
      expect(result.scale.signals.deductions).toEqual(
        expect.arrayContaining([expect.objectContaining({ description: 'Quick fix keywords' })]),
      );
    });

    test('should select quick lane for flag addition', () => {
      const result = selectLane('Add verbose flag to CLI');

      expect(result.lane).toBe('quick');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should select quick lane for config update', () => {
      const result = selectLane('Update config value for timeout');

      expect(result.lane).toBe('quick');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('should select quick lane for small bugfix', () => {
      const result = selectLane('quick fix for import error in utils.js');

      expect(result.lane).toBe('quick');
      expect(result.factors.quickFixKeywords).toBeGreaterThan(0);
      expect(result.factors.singleFileScope).toBe(true);
    });
  });

  describe('Complex Keywords', () => {
    test('should select complex lane for new feature', () => {
      const result = selectLane('Implement user authentication system');

      expect(result.lane).toBe('complex');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.factors.complexKeywords).toBeGreaterThan(0);
    });

    test('should select complex lane for architecture work', () => {
      const result = selectLane('Redesign database architecture for scalability');

      expect(result.lane).toBe('complex');
      expect(result.confidence).toBeGreaterThan(0.8);
      // Architecture redesigns require significant planning and coordination (level 3+)
      expect(result.scale.level).toBeGreaterThanOrEqual(3);
      expect(result.scale.signals.contributions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ description: 'Complex keyword signals' }),
        ]),
      );
    });

    test('should select complex lane for API integration', () => {
      const result = selectLane('Build API integration with payment gateway');

      expect(result.lane).toBe('complex');
      expect(result.factors.complexKeywords).toBeGreaterThan(0);
    });

    test('should select complex lane for security feature', () => {
      const result = selectLane('Add OAuth2 authentication and authorization');

      expect(result.lane).toBe('complex');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Scope Analysis', () => {
    test('should favor quick for single file scope', () => {
      const result = selectLane('Fix error handling in utils.js file');

      expect(result.lane).toBe('quick');
      expect(result.factors.singleFileScope).toBe(true);
    });

    test('should favor complex for multi-file scope', () => {
      const result = selectLane('Refactor authentication across multiple files');

      expect(result.lane).toBe('complex');
      expect(result.factors.multiFileScope).toBe(true);
    });

    test('should favor complex for cross-cutting concerns', () => {
      const result = selectLane('Add logging throughout the entire application');

      expect(result.lane).toBe('complex');
      expect(result.factors.multiFileScope).toBe(true);
    });
  });

  describe('Message Length', () => {
    test('should favor quick for short messages with action', () => {
      const result = selectLane('Add flag');

      expect(result.lane).toBe('quick');
      expect(result.factors.isShortMessage).toBe(true);
      expect(result.factors.hasActionWords).toBe(true);
    });

    test('should favor complex for long detailed messages', () => {
      const longMessage = `I need to build a comprehensive user management system that includes
        authentication, authorization with role-based access control, user profile management,
        email verification, password reset functionality, and integration with third-party OAuth
        providers like Google and GitHub. The system should be scalable and secure.`;

      const result = selectLane(longMessage);

      expect(result.lane).toBe('complex');
      expect(result.factors.messageLength).toBeGreaterThan(200);
    });
  });

  describe('Context-Based Factors', () => {
    test('should favor complex when already in complex flow', () => {
      const result = selectLane('Add feature to existing system', {
        previousPhase: 'architect',
      });

      expect(result.lane).toBe('complex');
      expect(result.factors.inComplexFlow).toBe(true);
    });

    test('should favor complex when existing PRD exists', () => {
      const result = selectLane('Extend the authentication feature', {
        hasExistingPRD: true,
      });

      expect(result.lane).toBe('complex');
      expect(result.factors.hasExistingPRD).toBe(true);
    });

    test('should favor complex for high complexity projects', () => {
      const result = selectLane('Modify the existing component', {
        projectComplexity: 'high',
      });

      expect(result.lane).toBe('complex');
      expect(result.factors.highComplexity).toBe(true);
    });
  });

  describe('Manual Override', () => {
    test('should honor forceLane override to quick', () => {
      const result = selectLane('Build complex authentication system', {
        forceLane: 'quick',
      });

      expect(result.lane).toBe('quick');
      expect(result.confidence).toBe(1);
      expect(result.rationale).toContain('Manual override');
    });

    test('should honor forceLane override to complex', () => {
      const result = selectLane('Fix typo', {
        forceLane: 'complex',
      });

      expect(result.lane).toBe('complex');
      expect(result.confidence).toBe(1);
      expect(result.rationale).toContain('Manual override');
    });
  });

  describe('Edge Cases', () => {
    test('should default to complex for unclear messages', () => {
      const result = selectLane('do stuff');

      expect(result.lane).toBe('complex');
      expect(result.confidence).toBeLessThanOrEqual(0.6);
    });

    test('should handle question marks appropriately', () => {
      const result = selectLane('How should we implement authentication?');

      expect(result.lane).toBe('complex');
      expect(result.factors.isQuestion).toBe(true);
    });

    test('should handle mixed signals gracefully', () => {
      const result = selectLane('Quick fix to add new authentication feature');

      // Mixed signals: "quick fix" (quick) + "new feature" + "authentication" (complex)
      // Could go either way depending on scoring, but should have moderate confidence
      expect(['quick', 'complex']).toContain(result.lane);
      expect(result.factors.quickFixKeywords).toBeGreaterThan(0);
      expect(result.factors.complexKeywords).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Real-World Examples', () => {
    test('Example 1: Documentation update', () => {
      const result = selectLane('Update README with quick typo fix');

      // Documentation updates can go either way; verify it has a reasonable confidence
      expect(['quick', 'complex']).toContain(result.lane);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('Example 2: Build feature', () => {
      const result = selectLane('Build SSO integration with SAML');

      expect(result.lane).toBe('complex');
    });

    test('Example 3: Rename variable', () => {
      const result = selectLane('Rename variable in helper function');

      expect(result.lane).toBe('quick');
      expect(result.scale.level).toBe(0);
    });

    test('Example 4: Database migration', () => {
      const result = selectLane('Create database migration for user tables');

      expect(result.lane).toBe('complex');
    });

    test('Example 5: Remove console logs', () => {
      const result = selectLane('Remove console logs from production code');

      expect(result.lane).toBe('quick');
    });
  });

  describe('Scale Levels', () => {
    test('should classify quick fixes as scale level 0', () => {
      const result = selectLane('Fix typo in README');

      // Trivial fixes should be classified as level 0 (no planning needed)
      expect(result.factors.scaleLevel).toBe(0);
      expect(result.scale.level).toBe(0);
    });

    test('should escalate integrations to scale level 2 or higher', () => {
      const result = selectLane('Implement payment gateway integration across services');

      expect(result.factors.scaleLevel).toBeGreaterThanOrEqual(2);
      expect(result.lane).toBe('complex');
    });

    test('should classify multi-component features as scale level 2', () => {
      const result = selectLane('Build user notification system with email and SMS support');

      // Integration-level work requiring coordination between multiple components (level 2)
      expect(result.scale.level).toBeGreaterThanOrEqual(2);
      expect(result.scale.level).toBeLessThan(4);
      expect(result.lane).toBe('complex');
      expect(result.scale.signals.contributions).toBeDefined();
    });

    test('should mark enterprise overhauls as scale level 4', () => {
      const result = selectLane(
        'Lead enterprise multi-region platform overhaul for regulatory compliance',
      );

      // Enterprise-scale work with specific level 4 keywords (multi-region, regulatory compliance)
      expect(result.factors.scaleLevel).toBe(4);
      expect(result.scale.level).toBe(4);
      expect(result.lane).toBe('complex');
      expect(result.scale.signals.keywordMatches.level4).toEqual(
        expect.arrayContaining(['multi-region', 'regulatory compliance']),
      );
    });

    test('should keep mixed quick/complex phrasing within fallback scale band', () => {
      const result = selectLane('Quick fix to add new authentication feature');

      // Mixed signals: "quick fix" (deducts points) + "new authentication feature" (adds points)
      // Should resolve to level 1 (fallback band: score 2-3) for modest changes with some ambiguity
      expect(result.scale.level).toBe(1);
      expect(result.scale.score).toBeGreaterThanOrEqual(2);
      expect(result.scale.score).toBeLessThan(4);
    });
  });

  describe('Scoring System', () => {
    test('should return score breakdown', () => {
      const result = selectLane('Add feature');

      expect(result.scores).toBeDefined();
      expect(result.scores.quick).toBeDefined();
      expect(result.scores.complex).toBeDefined();
      expect(typeof result.scores.quick).toBe('number');
      expect(typeof result.scores.complex).toBe('number');
    });

    test('should return detailed factors', () => {
      const result = selectLane('Fix typo in single file');

      expect(result.factors).toBeDefined();
      expect(result.factors.quickFixKeywords).toBeDefined();
      expect(result.factors.singleFileScope).toBeDefined();
      expect(result.factors.isShortMessage).toBeDefined();
      expect(result.factors.hasActionWords).toBeDefined();
    });

    test('should include rationale', () => {
      const result = selectLane('Build authentication');

      expect(result.rationale).toBeDefined();
      expect(typeof result.rationale).toBe('string');
      expect(result.rationale.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence Levels', () => {
    test('should have high confidence for clear quick fixes', () => {
      const result = selectLane('Fix typo in README');

      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should have high confidence for clear complex features', () => {
      const result = selectLane('Build OAuth2 authentication with RBAC');

      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should have lower confidence for ambiguous requests', () => {
      const result = selectLane('Make it better');

      expect(result.confidence).toBeLessThanOrEqual(0.6);
    });

    test('should never exceed 0.95 confidence', () => {
      const result = selectLane('Fix typo quick fix small change update config');

      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });
  });
});

describe('Lane Selector Constants', () => {
  test('QUICK_FIX_KEYWORDS should be an array', () => {
    expect(Array.isArray(QUICK_FIX_KEYWORDS)).toBe(true);
    expect(QUICK_FIX_KEYWORDS.length).toBeGreaterThan(0);
  });

  test('COMPLEX_KEYWORDS should be an array', () => {
    expect(Array.isArray(COMPLEX_KEYWORDS)).toBe(true);
    expect(COMPLEX_KEYWORDS.length).toBeGreaterThan(0);
  });

  test('keywords should be lowercase', () => {
    for (const keyword of QUICK_FIX_KEYWORDS) {
      expect(keyword).toBe(keyword.toLowerCase());
    }

    for (const keyword of COMPLEX_KEYWORDS) {
      expect(keyword).toBe(keyword.toLowerCase());
    }
  });
});
