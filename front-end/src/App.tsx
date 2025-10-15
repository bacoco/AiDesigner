import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import DOMPurify from 'dompurify';
import {
  Send,
  Sparkles,
  Eye,
  Terminal,
  Settings,
  Github,
  Info,
  Wifi,
  WifiOff,
  Package,
  Palette,
  Loader2,
  CheckCircle2,
  XCircle,
  Boxes,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { apiClient } from './api/client';
import { wsClient } from './api/websocket';
import type {
  Message,
  ProjectState,
  InstalledComponent,
  UIRegistryComponent,
  UITheme,
  UIPreview,
} from './api/types';
import './App.css';

const THEME_SYNC_DEBOUNCE_MS = 350;
type ThemeField = 'primary' | 'accent' | 'background';
const THEME_FIELD_LABELS: Array<[ThemeField, string]> = [
  ['primary', 'Primary'],
  ['accent', 'Accent'],
  ['background', 'Background'],
];

const readCssVariable = (variable: string, fallback: string): string => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable);
  return value?.trim() || fallback;
};

const normalizeHex = (value: string): string => {
  if (!value) {
    return value;
  }
  const trimmed = value.trim();
  const raw = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;

  if (!/^[0-9a-fA-F]+$/.test(raw)) {
    return trimmed; // Not a valid hex character sequence, return original.
  }

  if (raw.length === 3) {
    return `#${raw.split('').map((char) => char + char).join('')}`;
  }
  if (raw.length === 6) {
    return `#${raw}`;
  }
  if (raw.length === 8) {
    return `#${raw.slice(0, 6)}`;
  }

  return trimmed; // Return original if not a supported length.
};

const hexToRgba = (value: string, alpha = 1): string => {
  const normalized = normalizeHex(value);
  if (!normalized.startsWith('#')) {
    return value;
  }
  const raw = normalized.slice(1);
  if (raw.length !== 6) {
    return normalized;
  }
  const int = Number.parseInt(raw, 16);
  if (Number.isNaN(int)) {
    return normalized;
  }
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ensureValidHex = (value: string, fallback: string): string => {
  const normalized = normalizeHex(value);
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
};

const createBackgroundStyle = (theme: UITheme): CSSProperties => ({
  background: `radial-gradient(circle at 15% 15%, ${hexToRgba(theme.primary, 0.45)}, transparent 55%), radial-gradient(circle at 85% 0%, ${hexToRgba(theme.accent, 0.35)}, transparent 60%), linear-gradient(135deg, ${theme.background}, #020617 80%)`,
});

const areThemesEqual = (a?: UITheme, b?: UITheme): boolean => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.primary === b.primary && a.accent === b.accent && a.background === b.background;
};

function App() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectState, setProjectState] = useState<ProjectState>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryComponents, setRegistryComponents] = useState<UIRegistryComponent[]>([]);
  const [installedComponents, setInstalledComponents] = useState<InstalledComponent[]>([]);
  const [installationStatus, setInstallationStatus] = useState<Record<string, 'idle' | 'installing' | 'success' | 'error'>>({});
  const [registryFeedback, setRegistryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewState, setPreviewState] = useState<UIPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const initialTheme = useMemo<UITheme>(() => ({
    primary: readCssVariable('--theme-primary', '#7c3aed'),
    accent: readCssVariable('--theme-accent', '#ec4899'),
    background: readCssVariable('--theme-background', '#0f172a'),
  }), []);
  const [themeSettings, setThemeSettings] = useState<UITheme>(initialTheme);
  const [backgroundStyle, setBackgroundStyle] = useState<CSSProperties>(() => createBackgroundStyle(initialTheme));
  const [isThemeSaving, setIsThemeSaving] = useState(false);
  const [themeSyncError, setThemeSyncError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRegistryRef = useRef<Set<string>>(new Set());
  const themeSyncTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createMessageKey = (message: { role: string; content: string }) => {
    return `${message.role}:${message.content}`;
  };

  const registerMessage = (message: Message) => {
    messageRegistryRef.current.add(createMessageKey(message));
  };

  const hasMessage = (message: { role: string; content: string }) => {
    return messageRegistryRef.current.has(createMessageKey(message));
  };

  const removeMessage = (message: { role: string; content: string }) => {
    messageRegistryRef.current.delete(createMessageKey(message));
  };

  const applyTheme = useCallback((theme: UITheme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', theme.primary);
      root.style.setProperty('--theme-accent', theme.accent);
      root.style.setProperty('--theme-background', theme.background);
    }
    setBackgroundStyle(createBackgroundStyle(theme));
  }, []);

  const scheduleThemeSync = useCallback((theme: UITheme) => {
    if (!projectId) {
      return;
    }
    if (themeSyncTimeoutRef.current) {
      globalThis.clearTimeout(themeSyncTimeoutRef.current);
    }
    themeSyncTimeoutRef.current = globalThis.setTimeout(async () => {
      try {
        setIsThemeSaving(true);
        const response = await apiClient.updateUITheme(projectId, theme);
        const nextTheme = response?.theme ?? theme;
        setProjectState(prev => ({
          ...prev,
          ui: {
            ...(prev.ui ?? {}),
            theme: nextTheme,
          },
        }));
        setThemeSyncError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setThemeSyncError(`Failed to sync theme: ${message}`);
        console.error('Failed to sync theme:', err);
      } finally {
        setIsThemeSaving(false);
      }
    }, THEME_SYNC_DEBOUNCE_MS);
  }, [projectId]);

  const refreshInstalledComponents = useCallback(async (id: string) => {
    try {
      const response = await apiClient.getUIComponents(id);
      const components = response.components ?? [];
      setInstalledComponents(components);
      if (response.preview) {
        setPreviewState(response.preview);
        setPreviewError(null);
      }
      setProjectState(prev => ({
        ...prev,
        ui: {
          ...(prev.ui ?? {}),
          components,
          preview: response.preview ?? prev.ui?.preview,
        },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setPreviewError(`Failed to load installed components: ${message}`);
      console.error('Failed to load installed components:', err);
    }
  }, []);

  const refreshUIPreview = useCallback(async (id: string) => {
    setIsPreviewLoading(true);
    try {
      const preview = await apiClient.getUIPreview(id);
      setPreviewState(preview);
      setPreviewError(null);
      setProjectState(prev => ({
        ...prev,
        ui: {
          ...(prev.ui ?? {}),
          preview,
        },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setPreviewError(`Failed to load UI preview: ${message}`);
      console.error('Failed to load UI preview:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

  const loadThemeFromServer = useCallback(async (id: string) => {
    try {
      const { theme } = await apiClient.getUITheme(id);
      if (theme) {
        setThemeSettings((prev) => (areThemesEqual(prev, theme) ? prev : theme));
      }
      setProjectState(prev => ({
        ...prev,
        ui: {
          ...(prev.ui ?? {}),
          theme: theme ?? prev.ui?.theme,
        },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setThemeSyncError(`Failed to load theme: ${message}`);
      console.error('Failed to fetch UI theme:', err);
    }
  }, []);

  const loadRegistry = useCallback(async () => {
    if (registryComponents.length > 0) {
      return;
    }
    setRegistryLoading(true);
    try {
      const response = await apiClient.listUIRegistry();
      setRegistryComponents(response.components ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setRegistryFeedback({ type: 'error', message: `Failed to load registry: ${message}` });
      console.error('Failed to load registry:', err);
    } finally {
      setRegistryLoading(false);
    }
  }, [registryComponents.length]);

  const handleInstallComponent = useCallback(async (component: UIRegistryComponent) => {
    if (!projectId) {
      setRegistryFeedback({ type: 'error', message: 'Project is not ready yet. Please wait for initialization.' });
      return;
    }
    const identifier = component.id || component.name;
    setInstallationStatus(prev => ({ ...prev, [identifier]: 'installing' }));
    try {
      await apiClient.installUIComponent(projectId, component.id);
      setRegistryFeedback({ type: 'success', message: `${component.name} installation requested.` });
      await refreshInstalledComponents(projectId);
      await refreshUIPreview(projectId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setInstallationStatus(prev => ({ ...prev, [identifier]: 'error' }));
      setRegistryFeedback({ type: 'error', message: `Failed to install ${component.name}: ${message}` });
      console.error('Failed to install component:', err);
    }
  }, [projectId, refreshInstalledComponents, refreshUIPreview]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    applyTheme(themeSettings);
  }, [themeSettings, applyTheme]);

  useEffect(() => {
    if (projectState.ui?.components) {
      setInstalledComponents(projectState.ui.components);
    }
    if (projectState.ui?.preview) {
      setPreviewState(projectState.ui.preview);
    }
    if (projectState.ui?.theme && !areThemesEqual(projectState.ui.theme, themeSettings)) {
      setThemeSettings(projectState.ui.theme);
    }
  }, [projectState.ui]);

  useEffect(() => {
    let isMounted = true;
    let createdProjectId: string | null = null;
    const cleanupFns: Array<() => void> = [];

    const initializeProject = async () => {
      try {
        const result = await apiClient.createProject('Web UI Project');
        if (!isMounted) {
          return;
        }

        createdProjectId = result.projectId;
        setProjectId(result.projectId);
        setProjectState(result.state ?? {});

        wsClient.connect();
        setIsConnected(true);
        wsClient.joinProject(result.projectId);

        cleanupFns.push(
          wsClient.onStateUpdated((data) => {
            setProjectState(prev => ({ ...prev, ...data.changes }));
          }),
          wsClient.onMessageAdded((data) => {
            const eventMessage = {
              role: data.role,
              content: data.content,
            };

            if (hasMessage(eventMessage)) {
              removeMessage(eventMessage);
              return;
            }

            const newMessage: Message = {
              id: Date.now().toString(),
              role: data.role as 'user' | 'assistant' | 'system',
              content: data.content,
              timestamp: new Date(data.timestamp),
              phase: data.phase,
            };

            registerMessage(newMessage);
            setMessages(prev => [...prev, newMessage]);
          }),
          wsClient.onDeliverableCreated((data) => {
            console.log('Deliverable created:', data);
          }),
          wsClient.onUIComponentsChanged((data) => {
            if (data.components) {
              setInstalledComponents(data.components);
              setProjectState(prev => ({
                ...prev,
                ui: {
                  ...(prev.ui ?? {}),
                  components: data.components,
                  preview: data.preview ?? prev.ui?.preview,
                },
              }));
            }
            if (data.preview) {
              setPreviewState(data.preview);
              setPreviewError(null);
              setIsPreviewLoading(false);
            }
          }),
          wsClient.onUIThemeUpdated((data) => {
            setProjectState(prev => ({
              ...prev,
              ui: {
                ...(prev.ui ?? {}),
                theme: data.theme,
              },
            }));
            setThemeSettings(data.theme);
          }),
        );

        messageRegistryRef.current.clear();

        const systemMessage: Message = {
          id: '1',
          role: 'system',
          content:
            'Welcome to AiDesigner Web UI! I can help you design and build applications through natural conversation. What would you like to create today?',
          timestamp: new Date(),
        };

        registerMessage(systemMessage);
        setMessages([systemMessage]);

        await Promise.allSettled([
          refreshInstalledComponents(result.projectId),
          refreshUIPreview(result.projectId),
          loadThemeFromServer(result.projectId),
        ]);
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to initialize: ${message}`);
        console.error('Initialization error:', err);
      }
    };

    initializeProject();

    return () => {
      isMounted = false;
      cleanupFns.forEach(fn => fn());
      if (createdProjectId) {
        wsClient.leaveProject(createdProjectId);
      }
      wsClient.disconnect();
      setIsConnected(false);
      if (themeSyncTimeoutRef.current) {
        globalThis.clearTimeout(themeSyncTimeoutRef.current);
      }
    };
  }, [loadThemeFromServer, refreshInstalledComponents, refreshUIPreview]);

  useEffect(() => {
    if (!registryFeedback) {
      return;
    }
    const timer = window.setTimeout(() => setRegistryFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [registryFeedback]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isProcessing || !projectId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    registerMessage(userMessage);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setError(null);

    const currentPhase = projectState.currentPhase;
    const hasProjectName = Boolean(projectState.projectName);

    try {
      await apiClient.addMessage(projectId, 'user', userMessage.content, {
        phase: currentPhase,
      });

      setTimeout(async () => {
        const assistantContent = `I understand you want to: "${trimmedInput}". I'm analyzing your requirements and will help you build this. Let me start by gathering more information...`;
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
          phase: currentPhase || 'analyst',
          toolCalls: [
            {
              name: 'get_project_context',
              args: {},
              result: 'Retrieved project context',
              duration: 120,
            },
          ],
        };

        try {
          await apiClient.addMessage(projectId, 'assistant', assistantMessage.content, {
            phase: assistantMessage.phase,
            toolCalls: assistantMessage.toolCalls,
          });

          registerMessage(assistantMessage);
          setMessages((prev) => [...prev, assistantMessage]);

          if (trimmedInput.toLowerCase().includes('build') && !hasProjectName) {
            await apiClient.updateState(projectId, {
              projectName: 'New Project',
              currentPhase: 'analyst',
            });
          }
        } catch (assistantError: unknown) {
          const message = assistantError instanceof Error ? assistantError.message : String(assistantError);
          setError(`Failed to send assistant message: ${message}`);
          console.error('Error sending assistant message:', assistantError);
        } finally {
          setIsProcessing(false);
        }
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to send message: ${message}`);
      console.error('Error sending message:', err);
      setIsProcessing(false);
    }
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

  const handleRegistryOpenChange = (open: boolean) => {
    setRegistryOpen(open);
    if (open) {
      loadRegistry();
    }
  };

  const handleThemeFieldChange = (field: ThemeField, value: string) => {
    const raw = value.startsWith('#') ? value : `#${value}`;
    const fallback = themeSettings[field] ?? initialTheme[field];
    const sanitized = ensureValidHex(raw.replace(/[^0-9a-fA-F#]/g, ''), fallback);
    const nextTheme = { ...themeSettings, [field]: sanitized } as UITheme;
    setThemeSyncError(null);
    setThemeSettings(nextTheme);
    scheduleThemeSync(nextTheme);
  };

  const previewHtml = useMemo(() => {
    if (!previewState?.html) {
      return null;
    }
    const safePrimary = ensureValidHex(themeSettings.primary, initialTheme.primary);
    const safeAccent = ensureValidHex(themeSettings.accent, initialTheme.accent);
    const safeBackground = ensureValidHex(themeSettings.background, initialTheme.background);
    const themeStyle = `<style>:root { --theme-primary: ${safePrimary}; --theme-accent: ${safeAccent}; --theme-background: ${safeBackground}; }</style>`;
    const sanitizedHtml =
      typeof window === 'undefined'
        ? previewState.html
        : DOMPurify.sanitize(previewState.html, { USE_PROFILES: { html: true, svg: true } });
    return `${themeStyle}${sanitizedHtml}`;
  }, [
    previewState?.html,
    themeSettings.primary,
    themeSettings.accent,
    themeSettings.background,
    initialTheme.primary,
    initialTheme.accent,
    initialTheme.background,
  ]);

  const previewFrameKey = previewState?.updatedAt ?? previewState?.url ?? `preview-${installedComponents.length}`;

  return (
    <div className="flex h-screen" style={backgroundStyle}>
      <div className="flex-1 flex flex-col bg-slate-950/80 backdrop-blur-xl">
        <header className="bg-slate-900/70 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-300" />
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
              <div className="flex items-center gap-2 text-slate-400">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-xs">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-xs">Disconnected</span>
                  </>
                )}
              </div>
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

        {error && (
          <Alert className="m-4 border-red-600 bg-red-950/60 text-red-100">
            <Info className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-200">Error</AlertTitle>
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        <Alert className="m-4 border-green-600 bg-green-900/30 text-green-100">
          <Info className="h-4 w-4 text-green-300" />
          <AlertTitle className="text-green-200">Real Backend Connected!</AlertTitle>
          <AlertDescription className="text-green-100">
            This UI is now connected to the actual AiDesigner API server. All data is real, no mocks! Project ID: {projectId || 'Initializing...'}
          </AlertDescription>
        </Alert>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <div className="bg-slate-900/70 border-b border-slate-800 px-6">
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
                              ? 'bg-purple-900/60 border-purple-700/80 ml-12'
                              : message.role === 'system'
                              ? 'bg-slate-900/70 border-slate-800'
                              : 'bg-slate-900/70 border-slate-800 mr-12'
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
                                  {new Date(message.timestamp).toLocaleTimeString()}
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
                                      className="bg-slate-950/60 rounded px-3 py-2 text-xs border border-slate-800"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono text-purple-300">
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
                      <Card className="p-4 bg-slate-900/70 border-slate-800 mr-12">
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

                <div className="border-t border-slate-800 p-4 bg-slate-900/70">
                  <div className="max-w-4xl mx-auto flex gap-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Describe what you want to build..."
                      className="flex-1 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500"
                      disabled={isProcessing || !projectId}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isProcessing || !projectId}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ui-preview" className="flex-1 flex flex-col m-0 p-0">
                <div className="flex flex-1 overflow-hidden border-t border-slate-800">
                  <aside className="hidden lg:flex w-72 flex-col border-r border-slate-800 bg-slate-950/60">
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Boxes className="w-4 h-4 text-purple-300" />
                        Installed Components
                      </div>
                      <Badge variant="outline" className="text-xs border-slate-700 text-slate-300">
                        {installedComponents.length}
                      </Badge>
                    </div>
                    <ScrollArea className="flex-1 px-3 py-4">
                      {installedComponents.length === 0 ? (
                        <Card className="p-4 bg-slate-950/60 border-slate-800 text-slate-400 text-sm">
                          No components installed yet. Use the registry to bring in UI building blocks.
                        </Card>
                      ) : (
                        <div className="space-y-3 pr-1">
                          {installedComponents.map((component) => (
                            <Card key={component.id ?? component.name} className="p-3 bg-slate-950/70 border-slate-800">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-semibold text-white">{component.name}</h4>
                                  {component.description && (
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-3">
                                      {component.description}
                                    </p>
                                  )}
                                </div>
                                <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-[10px]">
                                  {component.status?.toUpperCase() || 'INSTALLED'}
                                </Badge>
                              </div>
                              {component.tags && component.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {component.tags.map((tag) => (
                                    <Badge
                                      key={`${component.id}-${tag}`}
                                      variant="secondary"
                                      className="text-[10px] bg-slate-900 text-slate-300 border border-slate-800"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="p-4 border-t border-slate-800">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-700 text-slate-200"
                        onClick={() => handleRegistryOpenChange(true)}
                      >
                        <Package className="w-4 h-4 mr-2" /> Browse Registry
                      </Button>
                    </div>
                  </aside>
                  <div className="flex-1 relative bg-slate-950/60">
                    {isPreviewLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading preview...</span>
                      </div>
                    ) : previewState?.url || previewHtml ? (
                      <iframe
                        key={previewFrameKey}
                        src={previewState?.url}
                        srcDoc={previewState?.url ? undefined : previewHtml || undefined}
                        title="UI Preview"
                        className="w-full h-full border-0 bg-transparent"
                        sandbox="allow-scripts"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 px-6 text-center">
                        <Eye className="w-16 h-16 opacity-50" />
                        <p className="text-lg font-medium text-white">Install components to render a live preview</p>
                        <p className="text-sm text-slate-400 max-w-sm">
                          Use the registry to add shadcn/Kibo components. Once installed, they will appear here instantly.
                        </p>
                        <Button variant="outline" onClick={() => handleRegistryOpenChange(true)} className="border-slate-700 text-slate-200">
                          <Package className="w-4 h-4 mr-2" /> Browse Registry
                        </Button>
                      </div>
                    )}
                    {previewError && (
                      <div className="absolute bottom-4 right-4 max-w-md">
                        <Alert className="border-red-500/60 bg-red-900/40 text-red-200">
                          <XCircle className="h-4 w-4 text-red-300" />
                          <AlertTitle className="text-red-200">Preview Error</AlertTitle>
                          <AlertDescription className="text-sm">{previewError}</AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tools" className="flex-1 m-0 p-6 overflow-auto">
                <div className="max-w-5xl mx-auto space-y-6">
                  <Card className="p-6 bg-slate-950/70 border-slate-800">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-white text-lg font-semibold">
                          <Palette className="w-5 h-5 text-purple-300" />
                          Theme Editor
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                          Tune the project palette. Changes sync to the backend and apply instantly to the preview.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isThemeSaving ? (
                          <Badge className="bg-amber-500/20 text-amber-200 border border-amber-500/40 flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Saving...
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">Synced</Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                      {THEME_FIELD_LABELS.map(([field, label]) => (
                        <div key={field} className="space-y-3">
                          <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={themeSettings[field]}
                              onChange={(event) => handleThemeFieldChange(field, event.target.value)}
                              className="h-10 w-10 rounded border border-slate-700 bg-transparent"
                            />
                            <Input
                              value={themeSettings[field]}
                              onChange={(event) => handleThemeFieldChange(field, event.target.value)}
                              className="bg-slate-950/80 border-slate-800 text-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {themeSyncError && (
                      <Alert className="mt-6 border-red-500/60 bg-red-900/30 text-red-200">
                        <XCircle className="h-4 w-4 text-red-300" />
                        <AlertDescription>{themeSyncError}</AlertDescription>
                      </Alert>
                    )}
                  </Card>

                  <Card className="p-6 bg-slate-950/70 border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white text-lg font-semibold">
                        <Package className="w-5 h-5 text-purple-300" />
                        Component Registry
                      </div>
                      <Button
                        variant="outline"
                        className="border-slate-700 text-slate-200"
                        onClick={() => handleRegistryOpenChange(true)}
                      >
                        Manage Components
                      </Button>
                    </div>
                    <p className="text-sm text-slate-400 mt-3">
                      Browse and install components from the merged shadcn/Kibo registry. Installed components are displayed in the preview tab.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Card className="p-4 bg-slate-950/80 border-slate-800">
                        <div className="text-xs text-slate-400 uppercase">Installed</div>
                        <div className="text-2xl font-bold text-white">{installedComponents.length}</div>
                      </Card>
                      <Card className="p-4 bg-slate-950/80 border-slate-800">
                        <div className="text-xs text-slate-400 uppercase">Registry Components</div>
                        <div className="text-2xl font-bold text-white">{registryComponents.length || '—'}</div>
                      </Card>
                    </div>
                  </Card>

                  <Separator className="bg-slate-800" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Available MCP Tools
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'get_project_context', description: 'Retrieves current project state' },
                        { name: 'detect_phase', description: 'Analyzes context to infer next phase' },
                        { name: 'transition_phase', description: 'Moves between project phases' },
                        { name: 'generate_deliverable', description: 'Creates PRDs, architecture, stories' },
                        { name: 'load_agent_persona', description: 'Retrieves agent instructions' },
                        { name: 'record_decision', description: 'Logs key decisions with rationale' },
                      ].map((tool, idx) => (
                        <Card key={idx} className="p-4 bg-slate-950/70 border-slate-800">
                          <h4 className="text-sm font-mono text-purple-300 mb-2">{tool.name}</h4>
                          <p className="text-xs text-slate-400">{tool.description}</p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-slate-800" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Project State (Live)</h3>
                    <Card className="p-4 bg-slate-950/70 border-slate-800">
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

      <Dialog open={registryOpen} onOpenChange={handleRegistryOpenChange}>
        <DialogContent className="max-w-4xl bg-slate-950 text-slate-100 border border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-300" />
              Component Registry
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Browse the merged shadcn/Kibo catalog and request installations for this project.
            </DialogDescription>
          </DialogHeader>
          {registryFeedback && (
            <Alert
              className={`border ${
                registryFeedback.type === 'success'
                  ? 'border-emerald-500/50 bg-emerald-900/20 text-emerald-200'
                  : 'border-red-500/60 bg-red-900/30 text-red-200'
              }`}
            >
              {registryFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{registryFeedback.message}</AlertDescription>
            </Alert>
          )}
          <div className="mt-4">
            {registryLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-300 gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading registry...</span>
              </div>
            ) : (
              <ScrollArea className="max-h-[60vh] pr-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  {(() => {
                    const installedIds = new Set(installedComponents.map(c => c.id));
                    const installedNames = new Set(installedComponents.map(c => c.name));
                    return registryComponents.map((component) => {
                      const identifier = component.id || component.name;
                      const installState = installationStatus[identifier] ?? 'idle';
                      const alreadyInstalled = installedIds.has(component.id) || installedNames.has(component.name);
                      const disabled = installState === 'installing' || alreadyInstalled;
                      const buttonLabel = alreadyInstalled
                        ? 'Installed'
                        : installState === 'installing'
                        ? 'Installing...'
                        : installState === 'error'
                        ? 'Retry Install'
                        : 'Install Component';

                      return (
                      <Card key={identifier} className="p-4 bg-slate-950/80 border border-slate-800 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-white">{component.name}</h4>
                            {component.description && (
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {component.description}
                              </p>
                            )}
                          </div>
                          <Badge
                            className={`text-[10px] border ${
                              alreadyInstalled
                                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                                : installState === 'installing'
                                ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                                : installState === 'error'
                                ? 'bg-red-500/20 text-red-200 border-red-500/40'
                                : 'bg-slate-900 text-slate-300 border-slate-700'
                            }`}
                          >
                            {alreadyInstalled
                              ? 'INSTALLED'
                              : installState === 'installing'
                              ? 'INSTALLING'
                              : installState === 'error'
                              ? 'FAILED'
                              : 'AVAILABLE'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          {component.source && (
                            <Badge variant="outline" className="border-slate-700 text-slate-300 uppercase">
                              {component.source}
                            </Badge>
                          )}
                          {component.framework && (
                            <Badge variant="outline" className="border-slate-700 text-slate-300">
                              {component.framework}
                            </Badge>
                          )}
                          {component.tags?.map((tag) => (
                            <Badge key={`${identifier}-${tag}`} variant="secondary" className="bg-slate-900 border-slate-700">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          {component.previewUrl ? (
                            <Button variant="link" size="sm" asChild className="px-0 text-purple-300">
                              <a href={component.previewUrl} target="_blank" rel="noopener noreferrer">
                                View Preview
                              </a>
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-500">No preview available</span>
                          )}
                          <Button
                            size="sm"
                            disabled={disabled}
                            onClick={() => handleInstallComponent(component)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60"
                          >
                            {installState === 'installing' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : alreadyInstalled ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                            <span className="ml-2 text-xs font-semibold">{buttonLabel}</span>
                          </Button>
                        </div>
                      </Card>
                      );
                    });
                  })()}
                  {registryComponents.length === 0 && !registryLoading && (
                    <Card className="p-6 bg-slate-950/80 border border-slate-800 text-center text-slate-400">
                      The registry is empty or unavailable. Please try again later.
                    </Card>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
