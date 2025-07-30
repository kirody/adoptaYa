import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const GreenPreset = definePreset(Aura, {
  // 2. AHORA USA TU PALETA
  semantic: {
    primary: {
      // Conecta "primary" con tu paleta "mygreen"
      50: '#eaf3e7',
      100: '#d6e7cf',
      200: '#c2dbbe',
      300: '#aecfad',
      400: '#9ac39d',
      // --- ESTE ES TU COLOR PRINCIPAL ---
      500: '#88b78a',
      // ---------------------------------
      600: '#729f74',
      700: '#5d875f',
      800: '#476f49',
      900: '#325734',
      950: '#213f23',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          inverseColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.500}',
          focusBackground: '{primary.700}',
          color: '#ffffff',
          focusColor: '#ffffff',
        }
      },
    },
  },
});

export { GreenPreset };
