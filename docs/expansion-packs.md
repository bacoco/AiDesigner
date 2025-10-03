# Expansion Pack Module Migration Notes

## V6 Module System Overview

- V6 consolidates the legacy `bmad-core/` tree into a `src/core/` and `src/modules/` layout and introduces a modular plugin system built around BMM, BMB, and CIS domains.【F:later-todo.md†L16-L24】【F:later-todo.md†L110-L112】
- Each module is intended to encapsulate its sub-agents and shared dependencies so they can be installed together through a single package surface.【F:later-todo.md†L16-L24】

## Current Expansion Pack Structure

- Expansion packs such as the Phaser 2D game dev pack ship as standalone folders with peer directories for agents, agent teams, tasks, templates, and data assets.【ae52bc†L1-L9】【34e834†L1-L1】【1818c6†L1-L2】
- Configuration metadata (for example `config.yaml`) lives at the root of each expansion pack and describes naming, versioning, and author metadata separate from any manifest system.【F:expansion-packs/bmad-2d-phaser-game-dev/config.yaml†L1-L9】

## Mapping Expansion Assets to Modules

- Agent definitions can move directly under a module-scoped `agents/` folder without modifications because each entry is already self-contained markdown used during orchestration.【75bc8b†L1-L3】
- Agent team compositions naturally map to a module-level `teams/` folder so they can be bundled alongside the agents they assemble.【6d6470†L1-L1】
- Workflow task markdown documents translate to a nested `workflows/tasks/` hierarchy that mirrors V6’s emphasis on workflow phases while keeping task content unchanged.【3d002c†L1-L3】【F:later-todo.md†L73-L101】
- Templates and reference data can be surfaced through dedicated `templates/` and `assets/data/` folders, making dependencies explicit for any bundler or installer.【34e834†L1-L1】【1818c6†L1-L2】

## Phaser 2D Module Prototype

- The prototype module keeps a manifest (`module.yaml`) that aligns with the existing expansion metadata while enumerating agents, teams, tasks, templates, and assets as module contents.【F:expansion-packs/modules-prototype/phaser-2d-game/module.yaml†L1-L39】
- Supporting directories follow the proposed V6-style layout and simply copy the original markdown files without modification, demonstrating that migration can occur without rewriting content.【F:expansion-packs/modules-prototype/phaser-2d-game/README.md†L1-L11】

## Evaluation

- Enumerating assets in `module.yaml` exposes the full dependency surface to tooling, which is harder to infer when files are only implied by folder naming in the legacy packs.【F:expansion-packs/modules-prototype/phaser-2d-game/module.yaml†L10-L33】
- The prototype confirms that a direct folder-to-folder migration is possible with minimal friction, suggesting the modular plugin system would benefit our expansion strategy by simplifying packaging and compatibility checks.【F:expansion-packs/modules-prototype/phaser-2d-game/module.yaml†L1-L39】【F:expansion-packs/modules-prototype/phaser-2d-game/README.md†L1-L11】
- Remaining follow-up work includes automating manifest generation and verifying how module registries will ingest these manifests once V6 stabilizes.【F:expansion-packs/modules-prototype/phaser-2d-game/module.yaml†L35-L39】

---

# The Power of BMad Expansion Packs

## Overview

BMad Method's expansion packs unlock the framework's true potential by extending its natural language AI orchestration to ANY domain. While the core framework focuses on software development, expansion packs transform BMad into a universal AI agent system.

## Why Expansion Packs?

### Keep Core Lean

The core BMad framework maintains its focus on software development, ensuring dev agents have maximum context for coding. Expansion packs handle everything else.

### Domain Expertise

Each expansion pack provides deep, specialized knowledge without bloating the core system. Install only what you need.

### Community Innovation

Anyone can create and share expansion packs, fostering a ecosystem of AI-powered solutions across all industries and interests.

## Technical Expansion Packs (Examples of possible expansions to come)

### Game Development Pack

Transform your AI into a complete game development studio:

- **Game Designer**: Mechanics, balance, progression systems
- **Level Designer**: Map layouts, puzzle design, difficulty curves
- **Narrative Designer**: Story arcs, dialog trees, lore creation
- **Art Director**: Visual style guides, asset specifications
- **Sound Designer**: Audio direction, music themes, SFX planning

### Mobile Development Pack

Specialized agents for mobile app creation:

- **iOS Specialist**: Swift/SwiftUI patterns, Apple guidelines
- **Android Expert**: Kotlin best practices, Material Design
- **Mobile UX Designer**: Touch interfaces, gesture patterns
- **App Store Optimizer**: ASO strategies, listing optimization
- **Performance Tuner**: Battery optimization, network efficiency

### DevOps/Infrastructure Pack

Complete infrastructure automation team:

- **Cloud Architect**: AWS/Azure/GCP design patterns
- **Security Specialist**: Zero-trust implementation, compliance
- **SRE Expert**: Monitoring, alerting, incident response
- **Container Orchestrator**: Kubernetes, Docker optimization
- **Cost Optimizer**: Cloud spend analysis, resource right-sizing

### Data Science Pack

AI-powered data analysis team:

- **Data Scientist**: Statistical analysis, ML model selection
- **Data Engineer**: Pipeline design, ETL processes
- **ML Engineer**: Model deployment, A/B testing
- **Visualization Expert**: Dashboard design, insight communication
- **Ethics Advisor**: Bias detection, fairness assessment

## Non-Technical Expansion Packs

### Business Strategy Pack

Complete business advisory team:

- **Strategy Consultant**: Market positioning, competitive analysis
- **Financial Analyst**: Projections, unit economics, funding strategies
- **Operations Manager**: Process optimization, efficiency improvements
- **Marketing Strategist**: Go-to-market plans, growth hacking
- **HR Advisor**: Talent strategies, culture building

### Creative Writing Pack

Your personal writing team:

- **Plot Architect**: Three-act structure, story beats, pacing
- **Character Psychologist**: Deep motivations, authentic dialog
- **World Builder**: Consistent universes, cultural systems
- **Editor**: Style consistency, grammar, flow
- **Beta Reader**: Feedback simulation, plot hole detection

### Health & Wellness Pack

Personal wellness coaching system:

- **Fitness Trainer**: Progressive overload, form correction
- **Nutritionist**: Macro planning, supplement guidance
- **Sleep Coach**: Circadian optimization, sleep hygiene
- **Stress Manager**: Coping strategies, work-life balance
- **Habit Engineer**: Behavior change, accountability systems

### Education Pack

Complete learning design system:

- **Curriculum Architect**: Learning objectives, scope & sequence
- **Instructional Designer**: Engagement strategies, multimedia learning
- **Assessment Specialist**: Rubrics, formative/summative evaluation
- **Differentiation Expert**: Adaptive learning, special needs
- **EdTech Integrator**: Tool selection, digital pedagogy

### Mental Health Support Pack

Therapeutic support system:

- **CBT Guide**: Cognitive restructuring, thought challenging
- **Mindfulness Teacher**: Meditation scripts, awareness exercises
- **Journal Therapist**: Reflective prompts, emotional processing
- **Crisis Support**: Coping strategies, safety planning
- **Habit Tracker**: Mood monitoring, trigger identification

### Legal Assistant Pack

Legal document and research support:

- **Contract Analyst**: Term review, risk assessment
- **Legal Researcher**: Case law, precedent analysis
- **Document Drafter**: Template customization, clause libraries
- **Compliance Checker**: Regulatory alignment, audit prep
- **IP Advisor**: Patent strategies, trademark guidance

### Real Estate Pack

Property investment and management:

- **Market Analyst**: Comparable analysis, trend prediction
- **Investment Calculator**: ROI modeling, cash flow analysis
- **Property Manager**: Tenant screening, maintenance scheduling
- **Flip Strategist**: Renovation ROI, project planning
- **Agent Assistant**: Listing optimization, showing prep

### Personal Development Pack

Complete personal growth system:

- **Life Coach**: Guides personal growth and transformation
- **Goal Strategist**: Helps achieve objectives with SMART goals
- **Habit Builder**: Creates lasting habits with accountability
- **Mindset Mentor**: Develops positive thinking patterns

Key tasks include:

- `goal-setting`: Defines SMART goals with action plans
- `habit-tracking`: Monitors habit formation progress
- `reflection-exercise`: Facilitates deep self-reflection

## Unique & Innovative Packs

### Role-Playing Game Master Pack

AI-powered tabletop RPG assistance:

- **World Master**: Dynamic world generation, NPC creation
- **Combat Referee**: Initiative tracking, rule clarification
- **Story Weaver**: Plot hooks, side quests, consequences
- **Character Builder**: Backstory generation, stat optimization
- **Loot Master**: Treasure generation, magic item creation

### Life Event Planning Pack

Major life event coordination:

- **Wedding Planner**: Vendor coordination, timeline creation
- **Event Designer**: Theme development, decoration plans
- **Budget Manager**: Cost tracking, vendor negotiation
- **Guest Coordinator**: RSVP tracking, seating arrangements
- **Timeline Keeper**: Day-of scheduling, contingency planning

### Hobby Mastery Pack

Deep dive into specific hobbies:

- **Garden Designer**: Plant selection, seasonal planning
- **Brew Master**: Recipe formulation, process optimization
- **Maker Assistant**: 3D printing, woodworking, crafts
- **Collection Curator**: Organization, valuation, trading
- **Photography Coach**: Composition, lighting, post-processing

### Scientific Research Pack

Research acceleration tools:

- **Literature Reviewer**: Paper summarization, gap analysis
- **Hypothesis Generator**: Research question formulation
- **Methodology Designer**: Experiment planning, control design
- **Statistical Advisor**: Test selection, power analysis
- **Grant Writer**: Proposal structure, impact statements

## Creating Your Own Expansion Pack

The next major release will include a new agent and expansion pack builder and a new expansion format.

## Remember

The BMad Method is more than a Software Development Agile Framework! Every expansion pack makes specialized knowledge and workflows more accessible to everyone.

**What expertise will you share with the world?**
