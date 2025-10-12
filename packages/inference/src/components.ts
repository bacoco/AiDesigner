import type { ComponentMap, InspectionArtifacts } from '@aidesigner/shared-types';

type AttributeMap = Record<string, string>;

// Component detection constants
const MAX_CLASSES_LIKE_BUTTON = 6;
const MAX_CLASSES_LIKE_CARD = 8;
const MAX_CLASSES_LIKE_INPUT = 6;
const MIN_CONTENT_LENGTH_FOR_LABELLED = 12; // Distinguish text buttons from icon-only buttons

export function detectComponents(artifacts: InspectionArtifacts): ComponentMap {
  const html = artifacts.domSnapshot.html;
  const css = artifacts.cssom.aggregated;

  const components: ComponentMap = {};

  const buttonMeta = analyzeButtons(html, css);
  if (buttonMeta) {
    components.Button = buttonMeta;
  }

  const cardMeta = analyzeCards(html);
  if (cardMeta) {
    components.Card = cardMeta;
  }

  const inputMeta = analyzeInputs(html, css);
  if (inputMeta) {
    components.Input = inputMeta;
  }

  return components;
}

function analyzeButtons(html: string, css: string): ComponentMap['Button'] | undefined {
  const buttonRegex = /<button([^>]*)>([\s\S]*?)<\/button>/gi;
  const linkRegex = /<a([^>]*)>([\s\S]*?)<\/a>/gi;
  const inputRegex = /<input([^>]*)(?:\/?)>/gi;

  const roles = new Set<string>();
  const classTokens = new Set<string>();
  const patterns = new Set<string>();
  const intents = new Set<string>();
  const sizes = new Set<string>();
  let found = false;

  let match: RegExpExecArray | null;
  while ((match = buttonRegex.exec(html))) {
    found = true;
    const attrs = parseAttributes(match[1] ?? '');
    roles.add('button');
    collectButtonMetadata(attrs, match[2] ?? '', classTokens, patterns, intents, sizes);
  }

  while ((match = linkRegex.exec(html))) {
    const attrs = parseAttributes(match[1] ?? '');
    const role = attrs.role?.toLowerCase();
    if (role === 'button' || classLooksLikeButton(attrs.class)) {
      found = true;
      roles.add(role ?? 'button');
      collectButtonMetadata(attrs, match[2] ?? '', classTokens, patterns, intents, sizes);
    }
  }

  while ((match = inputRegex.exec(html))) {
    const attrs = parseAttributes(match[1] ?? '');
    const type = attrs.type?.toLowerCase();
    if (type === 'button' || type === 'submit' || type === 'reset') {
      found = true;
      roles.add('button');
      collectButtonMetadata(attrs, attrs.value ?? '', classTokens, patterns, intents, sizes);
    }
  }

  if (!found) {
    return undefined;
  }

  const states = detectStates(css, classTokens, ['hover', 'focus', 'active', 'disabled']);

  return {
    detect: {
      role: Array.from(roles),
      classesLike: Array.from(classTokens).slice(0, MAX_CLASSES_LIKE_BUTTON),
      patterns: Array.from(patterns),
    },
    variants:
      intents.size > 0 || sizes.size > 0
        ? {
            ...(intents.size > 0 ? { intent: Array.from(intents) } : {}),
            ...(sizes.size > 0 ? { size: Array.from(sizes) } : {}),
          }
        : undefined,
    states: states.length > 0 ? states : undefined,
    mappings: buildButtonMappings(intents.size > 0, sizes.size > 0),
  };
}

function collectButtonMetadata(
  attrs: AttributeMap,
  content: string,
  classTokens: Set<string>,
  patterns: Set<string>,
  intents: Set<string>,
  sizes: Set<string>,
) {
  const classes = (attrs.class ?? '')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  for (const cls of classes) {
    classTokens.add(cls);
    if (/(primary|secondary|danger|success|warning|info|outline|ghost|link)/i.test(cls)) {
      const match = cls.match(/(primary|secondary|danger|success|warning|info|outline|ghost|link)/i);
      if (match) {
        intents.add(match[1].toLowerCase());
      }
    }
    if (/(xs|sm|md|lg|xl|2xl|3xl|small|large)/i.test(cls)) {
      const match = cls.match(/(xs|sm|md|lg|xl|2xl|3xl|small|large)/i);
      if (match) {
        sizes.add(normalizeSize(match[1].toLowerCase()));
      }
    }
    if (/rounded|pill|circle/i.test(cls)) {
      patterns.add('rounded');
    }
    if (/shadow/i.test(cls)) {
      patterns.add('shadow');
    }
  }

  if (/border-radius/i.test(attrs.style ?? '')) {
    patterns.add('rounded');
  }
  if (/box-shadow/i.test(attrs.style ?? '')) {
    patterns.add('shadow');
  }
  if (content.trim().length > MIN_CONTENT_LENGTH_FOR_LABELLED) {
    patterns.add('labelled');
  }
}

function buildButtonMappings(hasIntent: boolean, hasSize: boolean): { [target: string]: string } {
  const variantProp = hasIntent ? ' variant="{intent}"' : '';
  const sizeProp = hasSize ? ' size="{size}"' : '';
  return {
    shadcn: `<Button${variantProp}${sizeProp}>{slot}</Button>`,
    mui: `<Button${hasIntent ? ' color="{intent}"' : ''}${hasSize ? ' size="{size}"' : ''}>{slot}</Button>`,
  };
}

function analyzeCards(html: string): ComponentMap['Card'] | undefined {
  const containerRegex = /<div([^>]*)>([\s\S]*?)<\/div>/gi;
  const classTokens = new Set<string>();
  const patterns = new Set<string>();
  let found = false;

  let match: RegExpExecArray | null;
  while ((match = containerRegex.exec(html))) {
    const attrs = parseAttributes(match[1] ?? '');
    const classes = (attrs.class ?? '')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
    if (classes.some((cls) => /(card|panel|box|tile|surface|container)/i.test(cls))) {
      found = true;
      for (const cls of classes) {
        if (/shadow/i.test(cls)) {
          patterns.add('shadow');
        }
        if (/rounded|radius/i.test(cls)) {
          patterns.add('rounded');
        }
        classTokens.add(cls);
      }
      if (/border-radius/i.test(attrs.style ?? '')) {
        patterns.add('rounded');
      }
      if (/box-shadow/i.test(attrs.style ?? '')) {
        patterns.add('shadow');
      }
    }
  }

  if (!found) {
    return undefined;
  }

  return {
    detect: {
      classesLike: Array.from(classTokens).slice(0, MAX_CLASSES_LIKE_CARD),
      patterns: Array.from(patterns),
    },
    mappings: {
      shadcn:
        '<Card><CardHeader>{header}</CardHeader><CardContent>{content}</CardContent></Card>',
      mui: '<Card><CardHeader title={header} /><CardContent>{content}</CardContent></Card>',
    },
  };
}

function analyzeInputs(html: string, css: string): ComponentMap['Input'] | undefined {
  const inputRegex = /<(input|textarea)([^>]*)>/gi;
  const classTokens = new Set<string>();
  const patterns = new Set<string>();
  const roles = new Set<string>();
  let found = false;

  let match: RegExpExecArray | null;
  while ((match = inputRegex.exec(html))) {
    const tag = match[1].toLowerCase();
    const attrs = parseAttributes(match[2] ?? '');
    const type = attrs.type?.toLowerCase();
    if (tag === 'textarea' || ['text', 'email', 'password', 'search', 'number'].includes(type ?? '')) {
      found = true;
      roles.add(tag === 'textarea' ? 'textbox' : 'input');
      const classes = (attrs.class ?? '')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);
      for (const cls of classes) {
        classTokens.add(cls);
        if (/rounded|pill/i.test(cls)) {
          patterns.add('rounded');
        }
        if (/shadow/i.test(cls)) {
          patterns.add('shadow');
        }
      }
      if (/border-radius/i.test(attrs.style ?? '')) {
        patterns.add('rounded');
      }
    }
  }

  if (!found) {
    return undefined;
  }

  const states = detectStates(css, classTokens, ['focus', 'disabled']);

  return {
    detect: {
      role: Array.from(roles),
      classesLike: Array.from(classTokens).slice(0, MAX_CLASSES_LIKE_INPUT),
      patterns: Array.from(patterns),
    },
    states: states.length > 0 ? states : undefined,
    mappings: {
      shadcn: '<Input placeholder="{placeholder}" />',
      mui: '<TextField label={label} placeholder={placeholder} />',
    },
  };
}

function detectStates(css: string, classTokens: Set<string>, states: string[]): string[] {
  const detected = new Set<string>();
  for (const state of states) {
    const regexes: RegExp[] = [];
    for (const cls of classTokens) {
      // Escape the literal dot and add word boundaries to prevent over-matching
      regexes.push(new RegExp(`\\.${escapeRegExp(cls)}:${state}\\b`, 'i'));
      regexes.push(new RegExp(`\\.${escapeRegExp(cls)}\\.${state}\\b`, 'i'));
    }
    regexes.push(new RegExp(`\\bbutton:${state}\\b`, 'i'));
    regexes.push(new RegExp(`\\binput:${state}\\b`, 'i'));
    regexes.push(new RegExp(`\\btextarea:${state}\\b`, 'i'));
    if (regexes.some((re) => re.test(css))) {
      detected.add(state);
    }
  }
  return Array.from(detected);
}

function parseAttributes(fragment: string): AttributeMap {
  const attributes: AttributeMap = {};
  const attrRegex = /([\w-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(fragment))) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attributes[key.toLowerCase()] = value;
  }
  return attributes;
}

function classLooksLikeButton(classAttr: string | undefined): boolean {
  if (!classAttr) {
    return false;
  }
  return /(btn|button|cta|primary|secondary)/i.test(classAttr);
}

function normalizeSize(token: string): string {
  switch (token) {
    case 'small':
      return 'sm';
    case 'large':
      return 'lg';
    default:
      return token;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
