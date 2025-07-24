// ✅ Düzeltilmiş App.jsx - React Router Future Flags ile
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import SetupWizard from './components/SetupWizard';
import AddInventory from './components/AddInventory';
import InventoryList from './components/InventoryList';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';

// ✅ Material-UI teması
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* ✅ React Router Future Flags eklendi */}
      <BrowserRouter 
        future={{
          v7_startTransition: true,        // React.startTransition kullanımı
          v7_relativeSplatPath: true       // Relative splat path çözümlemesi
        }}
      >
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<SetupWizard />} />
            <Route path="/add-inventory" element={<AddInventory />} />
            <Route path="/inventory" element={<InventoryList />} />
            {/* ✅ 404 sayfası için fallback */}
            <Route path="*" element={
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Sayfa Bulunamadı</h2>
                <p>Aradığınız sayfa mevcut değil.</p>
              </div>
            } />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;