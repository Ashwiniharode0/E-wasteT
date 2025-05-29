/**
 * Theme configuration for the E-Waste Tracking System
 * A clean, minimalist design system with professional colors
 */

const theme = {
  // Color palette
  colors: {
    // Primary colors
    primary: {
      main: '#2D6A4F',     // Deep green - main brand color
      light: '#74C69D',    // Light green - secondary elements
      dark: '#1B4332',     // Dark green - important UI elements
      contrast: '#ffffff'  // White - text on primary colors
    },
    
    // Secondary accent colors
    secondary: {
      main: '#457B9D',    // Teal blue - alternative accent
      light: '#A8DADC',   // Light blue - subtle highlights
      dark: '#1D3557',    // Dark blue - contrast elements
      contrast: '#ffffff' // White - text on secondary colors
    },
    
    // Neutrals - for backgrounds, text, borders
    neutral: {
      100: '#ffffff',   // White
      200: '#f8f9fa',   // Off-white / light gray
      300: '#e9ecef',   // Light gray
      400: '#dee2e6',   // Medium light gray
      500: '#adb5bd',   // Medium gray
      600: '#6c757d',   // Dark gray
      700: '#495057',   // Very dark gray
      800: '#343a40',   // Near black
      900: '#212529'    // Black
    },
    
    // Status colors
    status: {
      success: '#52b788',    // Green - success/processed
      warning: '#ffca3a',    // Yellow - warnings/pending
      error: '#e76f51',      // Red - errors/non-compliant
      info: '#457b9d'        // Blue - informational
    },
    
    // Role-specific colors
    roles: {
      producer: '#264653',   // Dark teal
      recycler: '#2a9d8f',   // Teal
      logistics: '#e9c46a',  // Gold
      regulator: '#f4a261'   // Orange
    }
  },
  
  // Typography
  typography: {
    fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
    heading: {
      fontWeight: 600
    },
    body: {
      fontWeight: 400
    }
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  // Borders and rounded corners
  borders: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      round: '50%'
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '4px'
    }
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    lg: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out'
  },
  
  // Layout
  layout: {
    maxWidth: '1200px',
    headerHeight: '70px',
    sidebarWidth: '250px'
  },
  
  // Component-specific styles
  components: {
    // Button variants
    button: {
      primary: {
        bg: '#2D6A4F',
        text: '#ffffff',
        border: 'none',
        hoverBg: '#1B4332'
      },
      secondary: {
        bg: '#ffffff',
        text: '#2D6A4F',
        border: '1px solid #2D6A4F',
        hoverBg: '#f8f9fa'
      },
      danger: {
        bg: '#e76f51',
        text: '#ffffff',
        border: 'none',
        hoverBg: '#d65f41'
      },
      ghost: {
        bg: 'transparent',
        text: '#495057',
        border: 'none',
        hoverBg: '#f8f9fa'
      }
    },
    
    // Card styles
    card: {
      bg: '#ffffff',
      border: 'none',
      shadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      radius: '8px',
      padding: '24px'
    },
    
    // Form styles
    form: {
      input: {
        bg: '#ffffff',
        border: '1px solid #dee2e6',
        radius: '6px',
        padding: '10px 14px',
        focusBorder: '#74C69D',
        shadow: 'none',
        focusShadow: '0 0 0 3px rgba(116, 198, 157, 0.25)'
      },
      label: {
        color: '#495057',
        fontWeight: 500,
        margin: '0 0 8px 0'
      }
    },
    
    // Table styles
    table: {
      headerBg: '#f8f9fa',
      headerText: '#495057',
      rowBorder: '1px solid #e9ecef',
      rowHover: '#f8f9fa',
      cellPadding: '12px 16px'
    }
  }
};

export default theme;