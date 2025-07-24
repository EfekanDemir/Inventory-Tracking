// 🚀 NORMALIZE EDİLMİŞ ENVANTER TAKİP SİSTEMİ
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AddBox as AddBoxIcon,
  List as ListIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  People as PeopleIcon
} from '@mui/icons-material';

// Supabase
import { supabase } from './config/supabase';

// 🎨 Tema
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' }
  }
});

// 📋 Tab Panel
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// 📊 Dashboard
function Dashboard() {
  const [stats, setStats] = useState({ toplam: 0, musait: 0, kullanimda: 0, arizali: 0 });
  const [lokasyonStats, setLokasyonStats] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Temel istatistikler
        const { data: statsData } = await supabase.from('ekipman_stats').select('*');
        if (statsData && statsData[0]) {
          setStats(statsData[0]);
        }

        // Lokasyon dağılımı
        const { data: lokasyonData } = await supabase.from('lokasyon_dagilimi').select('*');
        setLokasyonStats(lokasyonData || []);
      } catch (error) {
        console.log('Stats yüklenemedi:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>📊 Dashboard</Typography>
      
      {/* Ana İstatistikler */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">Toplam</Typography>
            <Typography variant="h3">{stats.toplam_ekipman || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">Müsait</Typography>
            <Typography variant="h3">{stats.musait || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">Kullanımda</Typography>
            <Typography variant="h3">{stats.kullanimda || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">Arızalı</Typography>
            <Typography variant="h3">{stats.arizali || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Lokasyon Dağılımı */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>📍 Lokasyon Dağılımı</Typography>
        {lokasyonStats.map((lok) => (
          <Box key={lok.lokasyon_adi} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
            <Typography variant="subtitle1">{lok.lokasyon_adi}</Typography>
            <Typography variant="body2" color="textSecondary">
              Toplam: {lok.ekipman_sayisi} | Müsait: {lok.musait_sayisi} | Kullanımda: {lok.kullanimda_sayisi}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

// 📝 Ekipman Ekleme (Normalize edilmiş)
function EkipmanEkle() {
  const [formData, setFormData] = useState({
    marka_id: '',
    model_id: '',
    lokasyon_id: '',
    atanan_personel_id: '',
    seri_no: '',
    mac_adresi: '',
    barkod: '',
    aciklama: ''
  });
  
  const [markalar, setMarkalar] = useState([]);
  const [modeller, setModeller] = useState([]);
  const [filteredModeller, setFilteredModeller] = useState([]);
  const [lokasyonlar, setLokasyonlar] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    // Marka değiştiğinde modelleri filtrele
    if (formData.marka_id) {
      const filtered = modeller.filter(m => m.marka_id === parseInt(formData.marka_id));
      setFilteredModeller(filtered);
      setFormData(prev => ({ ...prev, model_id: '' })); // Model seçimini sıfırla
    } else {
      setFilteredModeller([]);
    }
  }, [formData.marka_id, modeller]);

  const fetchDropdownData = async () => {
    try {
      const [markaRes, modelRes, lokasyonRes, personelRes] = await Promise.all([
        supabase.from('markalar').select('*').order('marka_adi'),
        supabase.from('modeller').select('*').order('model_adi'),
        supabase.from('lokasyonlar').select('*').order('lokasyon_adi'),
        supabase.from('personel').select('*').order('ad_soyad')
      ]);

      setMarkalar(markaRes.data || []);
      setModeller(modelRes.data || []);
      setLokasyonlar(lokasyonRes.data || []);
      setPersoneller(personelRes.data || []);
    } catch (error) {
      console.log('Dropdown verileri yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = { ...formData };
      // Boş string'leri null'a çevir
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      const { error } = await supabase
        .from('ekipman_envanteri')
        .insert([submitData]);
      
      if (error) throw error;
      
      setMessage('✅ Ekipman başarıyla eklendi!');
      setFormData({
        marka_id: '', model_id: '', lokasyon_id: '', atanan_personel_id: '',
        seri_no: '', mac_adresi: '', barkod: '', aciklama: ''
      });
    } catch (error) {
      setMessage('❌ Hata: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>➕ Ekipman Ekle</Typography>
      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Marka</InputLabel>
                <Select
                  value={formData.marka_id}
                  onChange={(e) => setFormData({...formData, marka_id: e.target.value})}
                >
                  {markalar.map((marka) => (
                    <MenuItem key={marka.id} value={marka.id}>
                      {marka.marka_adi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!formData.marka_id}>
                <InputLabel>Model</InputLabel>
                <Select
                  value={formData.model_id}
                  onChange={(e) => setFormData({...formData, model_id: e.target.value})}
                >
                  {filteredModeller.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.model_adi} ({model.kategori})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Lokasyon</InputLabel>
                <Select
                  value={formData.lokasyon_id}
                  onChange={(e) => setFormData({...formData, lokasyon_id: e.target.value})}
                >
                  {lokasyonlar.map((lokasyon) => (
                    <MenuItem key={lokasyon.id} value={lokasyon.id}>
                      {lokasyon.lokasyon_adi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Personel</InputLabel>
                <Select
                  value={formData.atanan_personel_id}
                  onChange={(e) => setFormData({...formData, atanan_personel_id: e.target.value})}
                >
                  {personeller.map((personel) => (
                    <MenuItem key={personel.id} value={personel.id}>
                      {personel.ad_soyad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Seri Numarası"
                value={formData.seri_no}
                onChange={(e) => setFormData({...formData, seri_no: e.target.value})}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="MAC Adresi"
                value={formData.mac_adresi}
                onChange={(e) => setFormData({...formData, mac_adresi: e.target.value})}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Barkod"
                value={formData.barkod}
                onChange={(e) => setFormData({...formData, barkod: e.target.value})}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                multiline
                rows={3}
                value={formData.aciklama}
                onChange={(e) => setFormData({...formData, aciklama: e.target.value})}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
              >
                {loading ? '⏳ Ekleniyor...' : '✅ Ekle'}
              </Button>
            </Grid>
          </Grid>
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

// 📋 Ekipman Listesi (JOIN'li)
function EkipmanListesi() {
  const [ekipmanlar, setEkipmanlar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEkipmanlar();
  }, []);

  const fetchEkipmanlar = async () => {
    try {
      const { data, error } = await supabase
        .from('ekipman_detay')
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

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>📋 Ekipman Listesi</Typography>
      {ekipmanlar.length === 0 ? (
        <Alert severity="info">Henüz ekipman eklenmemiş.</Alert>
      ) : (
        <Grid container spacing={2}>
          {ekipmanlar.map((ekipman) => (
            <Grid item xs={12} md={6} lg={4} key={ekipman.id}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" color="primary">
                  {ekipman.marka_adi} {ekipman.model_adi}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Seri: {ekipman.seri_no || 'Belirtilmemiş'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  MAC: {ekipman.mac_adresi || 'Yok'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Lokasyon: {ekipman.lokasyon_adi || 'Belirtilmemiş'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Atanan: {ekipman.atanan_personel || 'Atanmamış'}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: 1, 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1, 
                    backgroundColor: 
                      ekipman.durum === 'MUSAIT' ? '#e8f5e8' : 
                      ekipman.durum === 'KULLANIMDA' ? '#fff3e0' : 
                      ekipman.durum === 'ARIZALI' ? '#ffebee' : '#f3e5f5',
                    color:
                      ekipman.durum === 'MUSAIT' ? '#2e7d32' : 
                      ekipman.durum === 'KULLANIMDA' ? '#ed6c02' : 
                      ekipman.durum === 'ARIZALI' ? '#d32f2f' : '#7b1fa2'
                  }}
                >
                  {ekipman.durum || 'Belirtilmemiş'}
                </Typography>
                {ekipman.aciklama && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    {ekipman.aciklama}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

// 🏢 Yönetim Sekmesi
function Yonetim() {
  const [activeTab, setActiveTab] = useState(0);
  const [markalar, setMarkalar] = useState([]);
  const [lokasyonlar, setLokasyonlar] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [markaRes, lokasyonRes, personelRes] = await Promise.all([
        supabase.from('markalar').select('*').order('marka_adi'),
        supabase.from('lokasyonlar').select('*').order('lokasyon_adi'),
        supabase.from('personel').select('*').order('ad_soyad')
      ]);

      setMarkalar(markaRes.data || []);
      setLokasyonlar(lokasyonRes.data || []);
      setPersoneller(personelRes.data || []);
    } catch (error) {
      console.log('Yönetim verileri yüklenemedi:', error);
    }
  };

  const addMarka = async () => {
    if (!newItem.trim()) return;
    try {
      await supabase.from('markalar').insert([{ marka_adi: newItem.trim() }]);
      setNewItem('');
      fetchData();
    } catch (error) {
      console.log('Marka eklenemedi:', error);
    }
  };

  const addLokasyon = async () => {
    if (!newItem.trim()) return;
    try {
      await supabase.from('lokasyonlar').insert([{ lokasyon_adi: newItem.trim() }]);
      setNewItem('');
      fetchData();
    } catch (error) {
      console.log('Lokasyon eklenemedi:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>🏢 Yönetim</Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Markalar" />
          <Tab label="Lokasyonlar" />
          <Tab label="Personeller" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              placeholder="Yeni marka adı"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />
            <Button variant="contained" onClick={addMarka}>Ekle</Button>
          </Box>
          {markalar.map((marka) => (
            <Paper key={marka.id} sx={{ p: 1, mb: 1 }}>
              {marka.marka_adi}
            </Paper>
          ))}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              placeholder="Yeni lokasyon adı"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />
            <Button variant="contained" onClick={addLokasyon}>Ekle</Button>
          </Box>
          {lokasyonlar.map((lokasyon) => (
            <Paper key={lokasyon.id} sx={{ p: 1, mb: 1 }}>
              {lokasyon.lokasyon_adi}
            </Paper>
          ))}
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Personel listesi (toplam {personeller.length})
          </Typography>
          {personeller.map((personel) => (
            <Paper key={personel.id} sx={{ p: 1, mb: 1 }}>
              {personel.ad_soyad} {personel.email && `- ${personel.email}`}
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
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      const { data: markaData } = await supabase.from('markalar').select('count');
      const { data: ekipmanData } = await supabase.from('ekipman_envanteri').select('count');
      setDbStatus('ready');
    } catch {
      setDbStatus('error');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>⚙️ Sistem Kurulumu</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Normalize Edilmiş Veritabanı Durumu:</Typography>
        {dbStatus === 'checking' && <Alert severity="info">🔍 Kontrol ediliyor...</Alert>}
        {dbStatus === 'ready' && <Alert severity="success">✅ Normalize edilmiş veritabanı hazır!</Alert>}
        {dbStatus === 'error' && (
          <Alert severity="error">
            ❌ Veritabanı bağlantısı yok. minimal_normalized_database.sql dosyasını Supabase'de çalıştırın.
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            📋 Normalize edilmiş tablolar:
          </Typography>
          <ul>
            <li><strong>markalar</strong> - Marka yönetimi</li>
            <li><strong>modeller</strong> - Model yönetimi (marka ilişkili)</li>
            <li><strong>lokasyonlar</strong> - Lokasyon yönetimi</li>
            <li><strong>personel</strong> - Personel yönetimi</li>
            <li><strong>ekipman_envanteri</strong> - Ana envanter (ilişkisel)</li>
            <li><strong>ekipman_gecmisi</strong> - Değişiklik takibi</li>
          </ul>
          
          <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
            🔍 Kullanışlı view'lar:
          </Typography>
          <ul>
            <li><strong>ekipman_detay</strong> - JOIN'li detay görünüm</li>
            <li><strong>ekipman_stats</strong> - İstatistikler</li>
            <li><strong>lokasyon_dagilimi</strong> - Lokasyon bazlı dağılım</li>
          </ul>
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
              🏢 Normalize Edilmiş Envanter Sistemi
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
              <Tab icon={<DashboardIcon />} label="Dashboard" />
              <Tab icon={<AddBoxIcon />} label="Ekipman Ekle" />
              <Tab icon={<ListIcon />} label="Ekipman Listesi" />
              <Tab icon={<BusinessIcon />} label="Yönetim" />
              <Tab icon={<SettingsIcon />} label="Kurulum" />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}><Dashboard /></TabPanel>
          <TabPanel value={currentTab} index={1}><EkipmanEkle /></TabPanel>
          <TabPanel value={currentTab} index={2}><EkipmanListesi /></TabPanel>
          <TabPanel value={currentTab} index={3}><Yonetim /></TabPanel>
          <TabPanel value={currentTab} index={4}><Kurulum /></TabPanel>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;