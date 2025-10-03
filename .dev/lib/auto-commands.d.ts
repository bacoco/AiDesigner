export declare const COMMAND_PHASE_MAP: Record<string, string>;
export declare function resolveAutoCommandPhase(command: string): string;
export declare function executeAutoCommand(
  command: string,
  context: any,
  bridge: { executePhaseWorkflow?: (phase: string, context: any) => any }
): Promise<any>;
