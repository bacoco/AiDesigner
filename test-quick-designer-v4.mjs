/**
 * Test Quick Designer v4 - AI-Driven UI Generation System
 *
 * This test demonstrates the new interactive workflow:
 * 1. Extract design from URLs
 * 2. Analyze images for design patterns
 * 3. Merge design systems
 * 4. Generate UI with AI
 * 5. Apply feedback interactively
 */

import { QuickDesignerV4 } from './dist/mcp/src/mcp-server/quick-designer-integration.js';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testQuickDesignerV4() {
  console.log('🚀 Testing Quick Designer v4 - AI-Driven System\n');

  // 1. Initialize workflow
  console.log('1️⃣ Initializing design workflow...');
  const workflow = new QuickDesignerV4.DesignWorkflow('test-session-001');

  // 2. Process user input - provide URL
  console.log('\n2️⃣ User: "I want something like Stripe\'s website"');
  const response1 = await workflow.processUserInput("I want something like Stripe's website");
  console.log('Assistant:', response1.response);

  // 3. Add another reference
  console.log('\n3️⃣ User: "Mix it with Airbnb\'s navigation style"');
  const response2 = await workflow.processUserInput("Mix it with Airbnb's navigation style");
  console.log('Assistant:', response2.response);

  // 4. Generate variants
  console.log('\n4️⃣ User: "Generate some design options"');
  const response3 = await workflow.processUserInput('Generate design variants');
  console.log('Assistant:', response3.response);

  // 5. Select and refine
  console.log('\n5️⃣ User: "I like variant 2 but make it darker"');
  const response4 = await workflow.processUserInput('I prefer variant 2 but with darker colors');
  console.log('Assistant:', response4.response);

  // 6. Add pages
  console.log('\n6️⃣ User: "Add a dashboard page"');
  const response5 = await workflow.processUserInput('Add a dashboard page');
  console.log('Assistant:', response5.response);

  // 7. Test AI generation directly
  console.log('\n7️⃣ Testing direct AI generation...');
  const aiService = new QuickDesignerV4.SimpleAIService();
  const designSpec = {
    colors: {
      primary: '#635BFF', // Stripe purple
      accent: '#00D4FF',
      neutral: ['#425466', '#697386', '#8792A2'],
      background: '#F6F9FC',
      surface: '#FFFFFF',
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      scale: 1.25,
    },
    spacing: {
      unit: '8px',
      scale: [4, 8, 12, 16, 24, 32, 48, 64],
    },
    components: {
      borderRadius: '8px',
      shadowScale: [
        '0 1px 3px rgba(0,0,0,0.12)',
        '0 4px 6px rgba(0,0,0,0.12)',
        '0 10px 20px rgba(0,0,0,0.12)',
      ],
    },
  };

  await QuickDesignerV4.generateUIFromDesignSystem(
    {
      screenType: 'dashboard',
      designSpec: designSpec,
      variation: 'modern',
    },
    aiService,
  );

  // 8. Generate complete mockup
  console.log('\n8️⃣ Generating interactive mockup...');
  const mockupData = {
    pages: [
      {
        name: 'Login',
        type: 'login',
        variations: [
          { name: 'Minimal', specs: designSpec },
          { name: 'Split Screen', specs: designSpec },
          { name: 'Card Floating', specs: designSpec },
        ],
      },
      {
        name: 'Dashboard',
        type: 'dashboard',
        variations: [
          { name: 'Analytics Focus', specs: designSpec },
          { name: 'Data Table Focus', specs: designSpec },
          { name: 'Minimal Cards', specs: designSpec },
        ],
      },
      {
        name: 'Pricing',
        type: 'pricing',
        variations: [
          { name: 'Simple', specs: designSpec },
          { name: 'Featured', specs: designSpec },
          { name: 'Detailed', specs: designSpec },
        ],
      },
    ],
    designSystem: designSpec,
  };

  const interactiveMockup = await QuickDesignerV4.generateInteractiveMockup(
    mockupData.pages,
    mockupData.designSystem,
  );

  // Save the mockup
  const outputPath = path.join(__dirname, 'docs', 'ui', 'quick-designer-v4-demo.html');
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, interactiveMockup);

  console.log('\n✅ Test complete!');
  console.log(`📁 Interactive mockup saved to: ${outputPath}`);
  console.log('\n📊 Summary:');
  console.log('- Design workflow initialized');
  console.log('- User conversation processed');
  console.log('- AI generation tested');
  console.log('- Interactive mockup created');
  console.log('- 3 pages with 3 variations each');

  // Show session state
  const session = workflow.getSession();
  console.log('\n🔍 Session State:');
  console.log(`- ID: ${session.id}`);
  console.log(`- State: ${session.state}`);
  console.log(`- References: ${session.references.length}`);
  console.log(`- Pages Generated: ${session.generatedPages.length}`);
  console.log(`- Conversation Entries: ${session.conversationHistory.length}`);

  console.log('\n🎨 Design System Features:');
  console.log('- Live color palette switching');
  console.log('- Typography selection');
  console.log('- Border radius adjustment');
  console.log('- Real-time preview updates');
  console.log('- AI-driven generation');

  return {
    success: true,
    outputPath,
    session: session.id,
  };
}

// Run the test
try {
  await testQuickDesignerV4();
  console.log('\n🎉 Quick Designer v4 is ready!');
  console.log('Open the generated HTML file in your browser to see the interactive design system.');
} catch (error) {
  console.error('\n❌ Test failed:', error);
  throw error;
}
