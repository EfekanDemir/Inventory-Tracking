// ✅ ANA UYGULAMA - COMPLETE SUPABASE ENTEGRASYONU
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';

// Ana uygulama bileşeni
import InventoryApp from './components/InventoryApp';

// ✅ Tema konfigürasyonu
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#fff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingX: 16,
          paddingY: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          '&:hover': {
            boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f5f5f5',
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

// ✅ Global styles
const globalStyles = (
  <GlobalStyles
    styles={{
      '*': {
        boxSizing: 'border-box',
      },
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        height: '100%',
        width: '100%',
      },
      body: {
        height: '100%',
        width: '100%',
        margin: 0,
        padding: 0,
      },
      '#root': {
        height: '100%',
        width: '100%',
      },
      // Scrollbar styling
      '*::-webkit-scrollbar': {
        width: '8px',
      },
      '*::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '4px',
      },
      '*::-webkit-scrollbar-thumb': {
        background: '#c1c1c1',
        borderRadius: '4px',
        '&:hover': {
          background: '#a8a8a8',
        },
      },
      // Loading animation
      '@keyframes fadeIn': {
        from: {
          opacity: 0,
          transform: 'translateY(20px)',
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)',
        },
      },
      '.fade-in': {
        animation: 'fadeIn 0.5s ease-in-out',
      },
    }}
  />
);

// ✅ Ana uygulama bileşeni
function App() {
  // Hata yakalama
  const handleError = (error, errorInfo) => {
    console.error('Uygulama hatası:', error, errorInfo);
  };

  return (
    <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ThemeProvider theme={theme}>
        <LocalizationProvider 
          dateAdapter={AdapterDateFns} 
          adapterLocale={tr}
        >
          <CssBaseline />
          {globalStyles}
          
          {/* Ana uygulama */}
          <div className="App">
            <InventoryApp />
          </div>
          
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

// ✅ Debugging ve development yardımcıları
if (process.env.NODE_ENV === 'development') {
  // Development ortamında yararlı console mesajları
  console.log('🚀 Envanter Takip Sistemi başlatılıyor...');
  console.log('📊 Veritabanı: Supabase PostgreSQL');
  console.log('🎨 UI Framework: Material-UI v5');
  console.log('⚛️ React Router: v6 (Future Flags aktif)');
  console.log('📅 Date Picker: MUI X Date Pickers');
  console.log('🌍 Yerelleştirme: Türkçe (tr)');
  
  // Global hata yakalama
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Yakalanmamış Promise hatası:', event.reason);
  });
  
  window.addEventListener('error', (event) => {
    console.error('Global JavaScript hatası:', event.error);
  });
}

// ✅ Service Worker registration (opsiyonel)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW kayıt başarılı: ', registration.scope);
      })
      .catch((registrationError) => {
        console.log('SW kayıt başarısız: ', registrationError);
      });
  });
}