import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Code, Eye, Terminal, Layout, FileCode, Settings, Github } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import './App.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  phase?: string;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  name: string;
  args: Record<string, any>;
  result?: string;
  duration?: number;
}

interface ProjectState {
  projectId?: string;
  projectName?: string;
  currentPhase?: string;
  requirements?: Record<string, any>;
  decisions?: Record<string, any>;
  nextSteps?: string;
}

interface GeneratedUI {
  id: string;
  name: string;
  html: string;
  timestamp: Date;
  phase?: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'Welcome to AiDesigner Web UI! I can help you design and build applications through natural conversation. What would you like to create today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectState, setProjectState] = useState<ProjectState>({});
  const [generatedUIs, setGeneratedUIs] = useState<GeneratedUI[]>([]);
  const [selectedUI, setSelectedUI] = useState<GeneratedUI | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(input),
        timestamp: new Date(),
        phase: projectState.currentPhase || 'analyst',
        toolCalls: generateMockToolCalls(input),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);

      updateProjectState(input);

      if (input.toLowerCase().includes('ui') || input.toLowerCase().includes('design')) {
        addGeneratedUI();
      }
    }, 1500);
  };

  const generateMockResponse = (userInput: string): string => {
    const responses = [
      "I understand you want to build that. Let me help you break this down into actionable steps. First, let's clarify the core requirements...",
      "Great idea! I'll start by analyzing the technical requirements and then move into the design phase. Here's what I'm thinking...",
      "I'll create a comprehensive plan for your project. Let me gather some more information about your target users and key features...",
      "Perfect! I'm transitioning to the architecture phase. I'll design a scalable solution that meets your needs...",
      "I've generated the initial UI designs based on your requirements. Would you like to review them or make any adjustments?",
    ];

    if (userInput.toLowerCase().includes('architecture')) {
      return "I'm analyzing the technical architecture for your project. Based on your requirements, I recommend a microservices architecture with React frontend, Node.js backend, and PostgreSQL database. Here are the key components...";
    }

    if (userInput.toLowerCase().includes('ui') || userInput.toLowerCase().includes('design')) {
      return "I've generated several UI design concepts for your application. You can view them in the 'UI Preview' tab. Each design follows modern best practices and is fully responsive. Would you like me to explain the design decisions?";
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateMockToolCalls = (userInput: string): ToolCall[] => {
    const tools: ToolCall[] = [];

    if (userInput.toLowerCase().includes('create') || userInput.toLowerCase().includes('build')) {
      tools.push({
        name: 'get_project_context',
        args: {},
        result: 'Retrieved project context',
        duration: 120,
      });
      tools.push({
        name: 'detect_phase',
        args: { context: 'user wants to create new app' },
        result: 'Phase: analyst',
        duration: 85,
      });
    }

    if (userInput.toLowerCase().includes('architecture')) {
      tools.push({
        name: 'generate_deliverable',
        args: { type: 'architecture' },
        result: 'Generated architecture document',
        duration: 450,
      });
    }

    if (userInput.toLowerCase().includes('ui') || userInput.toLowerCase().includes('design')) {
      tools.push({
        name: 'generate_deliverable',
        args: { type: 'ui-design' },
        result: 'Generated UI designs',
        duration: 320,
      });
    }

    return tools;
  };

  const updateProjectState = (userInput: string) => {
    setProjectState((prev) => {
      const newState = { ...prev };

      if (!prev.projectName && userInput.toLowerCase().includes('build')) {
        newState.projectName = 'New Project';
        newState.projectId = `proj-${Date.now()}`;
        newState.currentPhase = 'analyst';
      }

      if (userInput.toLowerCase().includes('architecture')) {
        newState.currentPhase = 'architect';
      }

      if (userInput.toLowerCase().includes('design') || userInput.toLowerCase().includes('ui')) {
        newState.currentPhase = 'ux';
      }

      return newState;
    });
  };

  const addGeneratedUI = () => {
    const newUI: GeneratedUI = {
      id: `ui-${Date.now()}`,
      name: `Dashboard Design v${generatedUIs.length + 1}`,
      html: generateMockHTML(),
      timestamp: new Date(),
      phase: projectState.currentPhase,
    };

    setGeneratedUIs((prev) => [...prev, newUI]);
    setSelectedUI(newUI);
  };

  const generateMockHTML = (): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated UI Design</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 32px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .content {
      padding: 32px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .stat-card h3 {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-card .value {
      font-size: 36px;
      font-weight: 700;
      color: #667eea;
    }
    
    .chart-area {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    
    .chart-placeholder {
      width: 100%;
      height: 300px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      font-weight: 600;
    }
    
    .actions {
      display: flex;
      gap: 16px;
    }
    
    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
    }
    
    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }
    
    .btn-secondary:hover {
      background: #667eea;
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Dashboard</h1>
      <p>Generated by AiDesigner - Modern, Responsive, Beautiful</p>
    </div>
    <div class="content">
      <div class="stats">
        <div class="stat-card">
          <h3>Total Users</h3>
          <div class="value">1,234</div>
        </div>
        <div class="stat-card">
          <h3>Active Sessions</h3>
          <div class="value">567</div>
        </div>
        <div class="stat-card">
          <h3>Conversion Rate</h3>
          <div class="value">23%</div>
        </div>
        <div class="stat-card">
          <h3>Revenue</h3>
          <div class="value">$89K</div>
        </div>
      </div>
      
      <div class="chart-area">
        <div class="chart-placeholder">
          📊 Analytics Chart Area
        </div>
      </div>
      
      <div class="actions">
        <button class="btn btn-primary">Get Started</button>
        <button class="btn btn-secondary">Learn More</button>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const getPhaseColor = (phase?: string): string => {
    const colors: Record<string, string> = {
      analyst: 'bg-blue-500',
      pm: 'bg-purple-500',
      architect: 'bg-green-500',
      ux: 'bg-pink-500',
      sm: 'bg-orange-500',
      dev: 'bg-red-500',
      qa: 'bg-yellow-500',
    };
    return colors[phase || 'analyst'] || 'bg-gray-500';
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex-1 flex flex-col">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">AiDesigner Web UI</h1>
                <p className="text-sm text-slate-400">From Idea to Shipped Product</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {projectState.currentPhase && (
                <Badge className={`${getPhaseColor(projectState.currentPhase)} text-white`}>
                  {projectState.currentPhase.toUpperCase()}
                </Badge>
              )}
              <a
                href="https://github.com/bacoco/AiDesigner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <div className="bg-slate-800 border-b border-slate-700 px-6">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="chat" className="gap-2">
                    <Terminal className="w-4 h-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="ui-preview" className="gap-2">
                    <Eye className="w-4 h-4" />
                    UI Preview
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Tools
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
                <ScrollArea className="flex-1 px-6 py-4">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-2">
                        <Card
                          className={`p-4 ${
                            message.role === 'user'
                              ? 'bg-purple-900 border-purple-700 ml-12'
                              : message.role === 'system'
                              ? 'bg-slate-800 border-slate-700'
                              : 'bg-slate-800 border-slate-700 mr-12'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.role === 'user'
                                  ? 'bg-purple-600'
                                  : message.role === 'system'
                                  ? 'bg-slate-600'
                                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
                              }`}
                            >
                              {message.role === 'user' ? (
                                <span className="text-white text-sm font-bold">U</span>
                              ) : (
                                <Sparkles className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">
                                  {message.role === 'user'
                                    ? 'You'
                                    : message.role === 'system'
                                    ? 'System'
                                    : 'AiDesigner'}
                                </span>
                                {message.phase && (
                                  <Badge variant="outline" className="text-xs">
                                    {message.phase}
                                  </Badge>
                                )}
                                <span className="text-xs text-slate-400">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm text-slate-200 leading-relaxed">
                                {message.content}
                              </p>
                              {message.toolCalls && message.toolCalls.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs text-slate-400 font-semibold">
                                    Tools Used:
                                  </p>
                                  {message.toolCalls.map((tool, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-slate-900 rounded px-3 py-2 text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono text-purple-400">
                                          {tool.name}
                                        </span>
                                        {tool.duration && (
                                          <span className="text-slate-500">
                                            {tool.duration}ms
                                          </span>
                                        )}
                                      </div>
                                      {tool.result && (
                                        <p className="text-slate-400 mt-1">{tool.result}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                    {isProcessing && (
                      <Card className="p-4 bg-slate-800 border-slate-700 mr-12">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500">
                            <Sparkles className="w-4 h-4 text-white animate-pulse" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-400">Thinking...</p>
                          </div>
                        </div>
                      </Card>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="border-t border-slate-700 p-4 bg-slate-800">
                  <div className="max-w-4xl mx-auto flex gap-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Describe what you want to build..."
                      className="flex-1 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                      disabled={isProcessing}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isProcessing}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ui-preview" className="flex-1 flex flex-col m-0 p-0">
                <div className="flex-1 flex">
                  <div className="w-64 border-r border-slate-700 bg-slate-800">
                    <div className="p-4 border-b border-slate-700">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Layout className="w-4 h-4" />
                        Generated UIs
                      </h3>
                    </div>
                    <ScrollArea className="h-full">
                      <div className="p-2 space-y-2">
                        {generatedUIs.length === 0 ? (
                          <p className="text-xs text-slate-500 p-2">
                            No UIs generated yet. Ask me to design something!
                          </p>
                        ) : (
                          generatedUIs.map((ui) => (
                            <button
                              key={ui.id}
                              onClick={() => setSelectedUI(ui)}
                              className={`w-full text-left p-3 rounded hover:bg-slate-700 transition-colors ${
                                selectedUI?.id === ui.id ? 'bg-slate-700' : 'bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <FileCode className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-medium text-white truncate">
                                  {ui.name}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                {ui.timestamp.toLocaleString()}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex-1 flex flex-col">
                    {selectedUI ? (
                      <>
                        <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-white font-semibold">{selectedUI.name}</h3>
                            {selectedUI.phase && (
                              <Badge className={getPhaseColor(selectedUI.phase)}>
                                {selectedUI.phase}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const blob = new Blob([selectedUI.html], {
                                  type: 'text/html',
                                });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${selectedUI.name}.html`;
                                a.click();
                              }}
                            >
                              <Code className="w-4 h-4 mr-2" />
                              Download HTML
                            </Button>
                          </div>
                        </div>
                        <iframe
                          srcDoc={selectedUI.html}
                          className="flex-1 bg-white"
                          title={selectedUI.name}
                        />
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-slate-900">
                        <div className="text-center text-slate-500">
                          <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No UI selected</p>
                          <p className="text-sm mt-2">
                            Generate a UI design through chat to preview it here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tools" className="flex-1 m-0 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Available Tools
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          name: 'get_project_context',
                          description: 'Retrieves current project state and context',
                        },
                        {
                          name: 'detect_phase',
                          description: 'Analyzes context to infer next BMAD phase',
                        },
                        {
                          name: 'transition_phase',
                          description: 'Safely moves between project phases',
                        },
                        {
                          name: 'generate_deliverable',
                          description: 'Creates PRDs, architecture, stories, or UI designs',
                        },
                        {
                          name: 'load_agent_persona',
                          description: 'Retrieves phase-specific agent instructions',
                        },
                        {
                          name: 'record_decision',
                          description: 'Logs key decisions with rationale',
                        },
                      ].map((tool, idx) => (
                        <Card key={idx} className="p-4 bg-slate-800 border-slate-700">
                          <h4 className="text-sm font-mono text-purple-400 mb-2">{tool.name}</h4>
                          <p className="text-xs text-slate-400">{tool.description}</p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Project State</h3>
                    <Card className="p-4 bg-slate-800 border-slate-700">
                      <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                        {JSON.stringify(projectState, null, 2)}
                      </pre>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
