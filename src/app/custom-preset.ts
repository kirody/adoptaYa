import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

const GreenPreset = definePreset(Lara, {
  // Definición de colores para el esquema CLARO
  light: {
    primary: {
      50: '#e0f2e0', // Verde muy claro
      100: '#c8e6c9',
      200: '#a5d6a7',
      300: '#81c784',
      400: '#66bb6a',
      500: '#4CAF50', // Verde principal
      600: '#388E3C',
      700: '#2E7D32',
      800: '#1B5E20',
      900: '#004D40', // Verde muy oscuro
      950: '#013a2d',
    },
    surface: {
      0: '#f5fbf5', // Fondo general muy claro (casi blanco con matiz verde)
      50: '#effaf0', // Fondo de cards/paneles
      100: '#e0f2e0',
      200: '#c8e6c9',
      300: '#a5d6a7',
      400: '#81c784',
      500: '#66bb6a',
      600: '#4CAF50',
      700: '#388E3C',
      800: '#2E7D32',
      900: '#1B5E20',
      950: '#004D40',
    },
    text: {
      default: '#212121', // Texto principal oscuro
      secondary: '#424242', // Texto secundario
    },
    on: {
      primary: '#ffffff', // Texto blanco sobre fondos primarios/oscuros
    },
    state: {
      success: '#4CAF50',
      info: '#2196F3',
      warn: '#FFC107',
      danger: '#F44336',
    },
    border: {
      light: '#BDBDBD',
      focus: '#4CAF50',
    },
    shadow: {
      default: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
  },
  // Definición de colores para el esquema OSCURO
  dark: {
    primary: {
      50: '#c8e6c9', // Verde claro para el modo oscuro
      100: '#a5d6a7',
      200: '#81c784',
      300: '#66bb6a',
      400: '#4CAF50',
      500: '#388E3C', // Verde principal oscuro
      600: '#2E7D32',
      700: '#1B5E20',
      800: '#004D40',
      900: '#013a2d',
      950: '#002920',
    },
    surface: {
      0: '#1a1a1a', // Fondo general muy oscuro
      50: '#212121',
      100: '#2e2e2e',
      200: '#3a3a3a',
      300: '#4d4d4d',
      400: '#606060',
      500: '#737373',
      600: '#858585',
      700: '#999999',
      800: '#b0b0b0',
      900: '#d4d4d4',
      950: '#eeeeee',
    },
    text: {
      default: '#d4d4d4', // Texto claro para fondos oscuros
      secondary: '#a0a0a0', // Texto secundario claro
    },
    on: {
      primary: '#212121', // Texto oscuro sobre fondos primarios oscuros
    },
    state: {
      success: '#8BC34A',
      info: '#64B5F6',
      warn: '#FFEB3B',
      danger: '#E57373',
    },
    border: {
      light: '#4d4d4d',
      focus: '#388E3C',
    },
    shadow: {
      default: '0 2px 4px rgba(0, 0, 0, 0.4)',
    },
  },
});

export default GreenPreset;
