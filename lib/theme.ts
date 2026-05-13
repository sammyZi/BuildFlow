/**
 * AI Architect Hub — Premium Design Tokens
 * 
 * A refined, editorial palette with deep navy sidebar,
 * warm off-white surfaces, and a rich violet primary.
 */

export const theme = {
  colors: {
    // Primary brand
    primary: '#7C5CFC',        // Rich violet
    primaryHover: '#6A4CE0',   // Deeper violet
    primaryMuted: '#EDE9FE',   // Violet wash (backgrounds)
    primaryFaint: '#F5F3FF',   // Barely-there violet tint

    // Surfaces
    background: '#FAFAFA',     // App background
    surface: '#FFFFFF',        // Cards, panels
    surfaceAlt: '#F4F4F5',    // Alternate surface (file sidebar)
    surfaceRaised: '#FFFFFF',  // Elevated cards

    // Text
    textPrimary: '#18181B',    // Headings, strong text
    textSecondary: '#3F3F46',  // Body text
    textMuted: '#71717A',      // Labels, captions
    textFaint: '#A1A1AA',      // Placeholders

    // Borders
    border: '#E4E4E7',         // Default border
    borderLight: '#F4F4F5',    // Subtle separator
    borderFocus: '#7C5CFC',    // Focus ring

    // Sidebar (deep navy)
    sidebarBg: '#0C1222',
    sidebarSurface: '#141C2E',
    sidebarText: '#B8C4D6',
    sidebarTextMuted: '#4B5975',
    sidebarBorder: '#1A2438',
    sidebarActive: '#1A2438',
    sidebarAccent: '#7C5CFC',

    // Status
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    lg: '0 4px 16px rgba(0,0,0,0.08)',
    focus: '0 0 0 3px rgba(124,92,252,0.15)',
  },
} as const;

export type Theme = typeof theme;
