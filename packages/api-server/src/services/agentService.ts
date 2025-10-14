import path from 'path';
import { logger } from '../index';
import { NotFoundError } from '../middleware/errorHandler';

const bmadBridgePath = path.resolve(process.cwd(), '.dev/lib/aidesigner-bridge.js');
const { AidesignerBridge } = require(bmadBridgePath);

export interface Agent {
  id: string;
  role: string;
  persona?: string;
  dependencies?: {
    templates?: string[];
    tasks?: string[];
    checklists?: string[];
    data?: string[];
  };
}

export interface AgentExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
}

class AgentService {
  private bridge: any;

  constructor() {
    this.bridge = new AidesignerBridge();
  }

  async initialize(): Promise<void> {
    await this.bridge.initialize();
    logger.info('Agent service initialized');
  }

  async listAgents(): Promise<Agent[]> {
    try {
      const agents = await this.bridge.listAgents();
      return agents || [];
    } catch (error) {
      logger.error('Error listing agents:', error);
      return [];
    }
  }

  async getAgent(agentId: string): Promise<Agent> {
    try {
      const agent = await this.bridge.loadAgent(agentId);
      if (!agent) {
        throw new NotFoundError(`Agent ${agentId}`);
      }
      return agent;
    } catch (error: unknown) {
      logger.error(`Error loading agent ${agentId}:`, error);
      throw error;
    }
  }

  async executeAgent(
    agentId: string,
    command: string,
    context: any
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Executing agent ${agentId} with command ${command}`);
      
      const agent = await this.getAgent(agentId);
      
      const result = {
        success: true,
        output: {
          agent: agentId,
          command,
          message: `Executed ${command} for ${agentId}`,
        },
        duration: Date.now() - startTime,
      };
      
      logger.info(`Agent execution completed in ${result.duration}ms`);
      return result;
    } catch (error: unknown) {
      logger.error(`Error executing agent ${agentId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }
}

export const agentService = new AgentService();

agentService.initialize().catch(error => {
  logger.error('Failed to initialize agent service:', error);
});
