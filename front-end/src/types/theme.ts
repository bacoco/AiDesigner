export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  fontSize: {
    base: string;
    scale: number;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface ThemeBorderRadius {
  default: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeSpacing {
  base: string;
  scale: number[];
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface ThemeAnimations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    default: string;
    in: string;
    out: string;
    inOut: string;
  };
}

export interface ThemeConfiguration {
  id: string;
  projectId: string;
  name: string;
  version: string;
  mode: 'light' | 'dark';
  baseTheme: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  animations: ThemeAnimations;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
  tags: string[];
}

export type ThemeTab = 'theme' | 'colors' | 'typography' | 'other' | 'generate';
export type PreviewViewport = 'mobile' | 'tablet' | 'desktop';
