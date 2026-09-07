/**
 * Centralized Design Tokens for PUSHPA Forest Intelligence Command Center.
 * 75% Professional GIS / 15% Forest Atmosphere / 10% Cinematic Red Sandalwood Identity.
 */

export const theme = {
  background: {
    primary: '#0B0907',      // Deep Obsidian Earth
    secondary: '#12100D',    // Dark Earth Surface
    panel: '#17130F',        // Tactical Card Background
    elevated: '#1D1813',     // Modal / Dropdown Surface
    overlay: 'rgba(11, 9, 7, 0.85)',
  },

  border: {
    subtle: 'rgba(154, 128, 101, 0.15)',
    normal: 'rgba(154, 128, 101, 0.28)',
    strong: 'rgba(142, 43, 24, 0.50)',
    active: '#D99A4A',
  },

  text: {
    primary: '#F1E7D5',      // High-contrast parchment white
    secondary: '#A99A87',    // Muted tactical sand
    muted: '#74695D',        // Dark metadata text
    accent: '#D99A4A',       // Warm gold
  },

  accent: {
    forest: '#718C48',       // Forest canopy green
    sandalwood: '#8E2B18',   // Red sandalwood core
    earth: '#4A3022',        // Earth brown
    amber: '#D99A4A',        // Warning / Highlight
    danger: '#D52B1E',       // Critical Disturbance Red
  },

  status: {
    critical: { bg: '#5C160F', text: '#F1E7D5', border: '#D52B1E' },
    veryHigh: { bg: '#8E2B18', text: '#F1E7D5', border: '#E0541E' },
    high: { bg: '#B65324', text: '#F1E7D5', border: '#D99A4A' },
    moderate: { bg: '#2B1C14', text: '#D99A4A', border: '#9A8065' },
    low: { bg: '#121A11', text: '#718C48', border: '#718C48' },
  },

  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  }
};
