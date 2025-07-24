// 🚀 BASİT ENVANTER TAKİP SİSTEMİ
import React, { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AddBox as AddBoxIcon,
  List as ListIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Supabase
import { supabase } from './config/supabase';

// 🎨 Basit tema
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' }
  }
});

// 📋 Tab Panel Bileşeni
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// 📊 Dashboard Bileşeni
function Dashboard() {
  const [stats, setStats] = useState({ toplam: 0, musait: 0, kullanimda: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await supabase.from('ekipman_envanteri').select('durum');
        const toplam = data?.length || 0;
        const musait = data?.filter(item => item.durum === 'MUSAIT').length || 0;
        const kullanimda = data?.filter(item => item.durum === 'KULLANIMDA').length || 0;
        setStats({ toplam, musait, kullanimda });
      } catch (error) {
        console.log('Stats yüklenemedi:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>📊 Dashboard</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 150 }}>
          <Typography variant="h6" color="primary">Toplam Ekipman</Typography>
          <Typography variant="h3">{stats.toplam}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 150 }}>
          <Typography variant="h6" color="success.main">Müsait</Typography>
          <Typography variant="h3">{stats.musait}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 150 }}>
          <Typography variant="h6" color="warning.main">Kullanımda</Typography>
          <Typography variant="h3">{stats.kullanimda}</Typography>
        </Paper>
      </Box>
    </Box>
  );
}

// 📝 Basit Ekipman Ekleme
function EkipmanEkle() {
  const [formData, setFormData] = useState({
    seri_no: '',
    mac_adresi: '',
    aciklama: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('ekipman_envanteri')
        .insert([formData]);
      
      if (error) throw error;
      
      setMessage('✅ Ekipman başarıyla eklendi!');
      setFormData({ seri_no: '', mac_adresi: '', aciklama: '' });
    } catch (error) {
      setMessage('❌ Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>➕ Ekipman Ekle</Typography>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <input
              type="text"
              placeholder="Seri Numarası"
              value={formData.seri_no}
              onChange={(e) => setFormData({...formData, seri_no: e.target.value})}
              style={{ padding: '12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
              required
            />
            <input
              type="text"
              placeholder="MAC Adresi"
              value={formData.mac_adresi}
              onChange={(e) => setFormData({...formData, mac_adresi: e.target.value})}
              style={{ padding: '12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <textarea
              placeholder="Açıklama"
              value={formData.aciklama}
              onChange={(e) => setFormData({...formData, aciklama: e.target.value})}
              style={{ padding: '12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical', minHeight: '80px' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Ekleniyor...' : '✅ Ekle'}
            </button>
          </Box>
        </form>
        {message && (
          <Alert severity={message.includes('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

// 📋 Basit Ekipman Listesi
function EkipmanListesi() {
  const [ekipmanlar, setEkipmanlar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEkipmanlar = async () => {
      try {
        const { data, error } = await supabase
          .from('ekipman_envanteri')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setEkipmanlar(data || []);
      } catch (error) {
        console.log('Ekipmanlar yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEkipmanlar();
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>📋 Ekipman Listesi</Typography>
      {ekipmanlar.length === 0 ? (
        <Alert severity="info">Henüz ekipman eklenmemiş.</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {ekipmanlar.map((ekipman) => (
            <Paper key={ekipman.id} sx={{ p: 2 }}>
              <Typography variant="h6">{ekipman.seri_no || 'Seri No Yok'}</Typography>
              <Typography color="textSecondary">MAC: {ekipman.mac_adresi || 'Yok'}</Typography>
              <Typography color="textSecondary">Durum: {ekipman.durum || 'Belirtilmemiş'}</Typography>
              {ekipman.aciklama && <Typography variant="body2">{ekipman.aciklama}</Typography>}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}

// 🔧 Kurulum
function Kurulum() {
  const [dbStatus, setDbStatus] = useState('checking');

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const { data, error } = await supabase.from('ekipman_envanteri').select('count');
        setDbStatus(error ? 'error' : 'ready');
      } catch {
        setDbStatus('error');
      }
    };
    checkDatabase();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>⚙️ Sistem Kurulumu</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Veritabanı Durumu:</Typography>
        {dbStatus === 'checking' && <Alert severity="info">🔍 Kontrol ediliyor...</Alert>}
        {dbStatus === 'ready' && <Alert severity="success">✅ Veritabanı hazır!</Alert>}
        {dbStatus === 'error' && (
          <Alert severity="error">
            ❌ Veritabanı bağlantısı yok. simplified_database_setup.sql dosyasını Supabase'de çalıştırın.
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            📋 Kurulum adımları:
          </Typography>
          <ol>
            <li>Supabase paneline gidin</li>
            <li>SQL Editor'ü açın</li>
            <li><code>simplified_database_setup.sql</code> dosyasını çalıştırın</li>
            <li>Bu sayfayı yenileyin</li>
          </ol>
        </Box>
      </Paper>
    </Box>
  );
}

// 🏠 ANA UYGULAMA
function App() {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🏢 Basit Envanter Sistemi
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
              <Tab icon={<DashboardIcon />} label="Dashboard" />
              <Tab icon={<AddBoxIcon />} label="Ekipman Ekle" />
              <Tab icon={<ListIcon />} label="Ekipman Listesi" />
              <Tab icon={<SettingsIcon />} label="Kurulum" />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}><Dashboard /></TabPanel>
          <TabPanel value={currentTab} index={1}><EkipmanEkle /></TabPanel>
          <TabPanel value={currentTab} index={2}><EkipmanListesi /></TabPanel>
          <TabPanel value={currentTab} index={3}><Kurulum /></TabPanel>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;