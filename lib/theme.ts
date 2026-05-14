/**
 * BuildFlow — Design Tokens
 * 
 * A clean, modern blue palette with deep navy sidebar,
 * neutral surfaces, and a vibrant blue primary.
 */

export const theme = {
  colors: {
    // Primary brand
    primary: '#4A6BFF',        // Vibrant blue
    primaryHover: '#3B5AE0',   // Deeper blue
    primaryMuted: '#E8EEFF',   // Blue wash (backgrounds)
    primaryFaint: '#F0F4FF',   // Barely-there blue tint

    // Surfaces
    background: '#FAFAFA',     // App background
    surface: '#FFFFFF',        // Cards, panels
    surfaceAlt: '#F4F4F5',    // Alternate surface (file sidebar)
    surfaceRaised: '#FFFFFF',  // Elevated cards

    // Text
    textPrimary: '#111827',    // Headings, strong text
    textSecondary: '#374151',  // Body text
    textMuted: '#6B7280',      // Labels, captions
    textFaint: '#9CA3AF',      // Placeholders

    // Borders
    border: '#E5E7EB',         // Default border
    borderLight: '#F3F4F6',    // Subtle separator
    borderFocus: '#4A6BFF',    // Focus ring

    // Sidebar (deep navy)
    sidebarBg: '#0C1222',
    sidebarSurface: '#141C2E',
    sidebarText: '#B8C4D6',
    sidebarTextMuted: '#4B5975',
    sidebarBorder: '#1A2438',
    sidebarActive: '#1A2438',
    sidebarAccent: '#4A6BFF',

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
    focus: '0 0 0 3px rgba(74,107,255,0.15)',
  },
} as const;

export type Theme = typeof theme;
