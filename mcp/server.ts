import { createServer, Tool } from "@modelcontextprotocol/sdk/server";
import { z } from "zod";

// Minimal in-memory store; replace with DB in production.
const memory: Record<string, any> = {};

const ProjectId = z.object({ projectId: z.string().min(1) });

async function generateFromTemplate(template: string, context: Record<string, any>) {
  // Super-simple templating for demo; hook your LLM/template engine here.
  return `${template}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
}

const tools: Record<string, Tool> = {
  get_project_context: {
    description: "Get complete project context for invisible orchestrator",
    schema: ProjectId,
    handler: async ({ projectId }) => {
      const ctx = memory[projectId];
      if (!ctx) throw new Error("PROJECT_NOT_FOUND");
      return [
        `Project Context:
- Name: ${ctx.name ?? "Untitled"}
- Current Phase: ${ctx.currentPhase ?? "unknown"}
- Requirements: ${JSON.stringify(ctx.requirements ?? {})}
- Decisions: ${JSON.stringify(ctx.decisions ?? {})}
- Next Steps: ${ctx.nextSteps ?? ""}
- User Prefs: ${JSON.stringify(ctx.userPreferences ?? {})}`
      ];
    }
  },
  update_phase_state: {
    description: "Update project phase state (silent)",
    schema: z.object({
      projectId: z.string(),
      newPhase: z.enum(["analyst","pm","architect","sm","dev","qa","ux","po"]),
      deliverables: z.record(z.any()).optional(),
      context: z.record(z.any()).optional()
    }),
    handler: async (p) => {
      memory[p.projectId] = {
        ...(memory[p.projectId] || {}),
        currentPhase: p.newPhase,
        deliverables: { ...(memory[p.projectId]?.deliverables || {}), ...(p.deliverables || {}) },
        context: { ...(memory[p.projectId]?.context || {}), ...(p.context || {}) },
        updatedAt: new Date().toISOString()
      };
      return [`Phase updated to ${p.newPhase}.`];
    }
  },
  generate_deliverable: {
    description: "Generate a user-friendly deliverable",
    schema: z.object({
      deliverableType: z.enum(["project_plan","user_stories","architecture","test_plan"]),
      context: z.record(z.any()),
      userFriendly: z.boolean().default(true)
    }),
    handler: async ({ deliverableType, context }) => {
      const templates: Record<string,string> = {
        project_plan: "Here is your development roadmap:",
        user_stories: "Here are the key features to build:",
        architecture: "Here is the recommended technical approach:",
        test_plan: "Here is how to validate your project:"
      };
      return [await generateFromTemplate(templates[deliverableType], context)];
    }
  },
  detect_user_intent: {
    description: "Analyze message for phase needs",
    schema: z.object({
      userMessage: z.string(),
      conversationHistory: z.array(z.any()).default([]),
      currentPhase: z.string().optional()
    }),
    handler: async (p) => {
      // Naive baseline; replace with LLM classifier if desired.
      const m = p.userMessage.toLowerCase();
      let suggestedPhase: any = "analyst";
      if (m.includes("timeline") || m.includes("plan")) suggestedPhase = "pm";
      else if (m.includes("stack") || m.includes("architecture")) suggestedPhase = "architect";
      else if (m.includes("build") || m.includes("implement")) suggestedPhase = "dev";
      const intent = {
        suggestedPhase,
        confidence: 0.7,
        reasoning: "Keyword heuristic baseline",
        suggestedResponse: "Thanks—let me move things forward."
      };
      return [
        `Intent Analysis:
- Detected Phase: ${intent.suggestedPhase}
- Confidence: ${intent.confidence}
- Reasoning: ${intent.reasoning}
- Suggested Response: ${intent.suggestedResponse}`
      ];
    }
  }
};

const server = createServer({
  name: "bmad-invisible-orchestrator",
  version: "2025-06-01",
  tools
});

server.start();

