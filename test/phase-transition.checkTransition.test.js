describe("checkTransition", () => {
  let phaseTransition;

  beforeEach(() => {
    jest.resetModules();
    phaseTransition = require("../hooks/phase-transition");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("executes a transition when the detector returns a valid payload", async () => {
    const executeTransitionResult = { newPhase: "pm", context: { foo: "bar" } };
    const executeTransitionSpy = jest
      .spyOn(phaseTransition, "executeTransition")
      .mockResolvedValue(executeTransitionResult);
    const triggerAgent = jest
      .fn()
      .mockResolvedValue({ detected_phase: "pm", confidence: 0.95 });

    phaseTransition.bindDependencies({ triggerAgent });

    const conversationContext = { history: [] };
    const result = await phaseTransition.checkTransition(
      conversationContext,
      "Let's plan",
      "analyst"
    );

    expect(triggerAgent).toHaveBeenCalledWith("phase-detector", {
      context: conversationContext,
      userMessage: "Let's plan",
      currentPhase: "analyst",
    });
    expect(executeTransitionSpy).toHaveBeenCalledWith("analyst", "pm", conversationContext);
    expect(result).toBe(executeTransitionResult);
  });

  it("returns null and avoids transition when the detector response is malformed", async () => {
    const executeTransitionSpy = jest.spyOn(phaseTransition, "executeTransition");
    const triggerAgent = jest.fn().mockResolvedValue({
      error: "Failed to parse response",
      rawResponse: "not-json",
    });

    phaseTransition.bindDependencies({ triggerAgent });

    const conversationContext = { history: [] };
    const result = await phaseTransition.checkTransition(
      conversationContext,
      "Still in analyst",
      "analyst"
    );

    expect(triggerAgent).toHaveBeenCalled();
    expect(executeTransitionSpy).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
