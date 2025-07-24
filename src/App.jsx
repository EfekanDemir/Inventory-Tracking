// 🚀 KAPSAMLI NORMALIZE EDİLMİŞ ENVANTER TAKİP SİSTEMİ
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
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AddBox as AddBoxIcon,
  List as ListIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon
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
  const [stats, setStats] = useState({
    toplam_ekipman: 0,
    aktif_ekipman: 0,
    kullanimdaki_ekipman: 0,
    toplam_deger: 0
  });
  const [departmanStats, setDepartmanStats] = useState([]);
  const [kategoriStats, setKategoriStats] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Genel istatistikler - v_envanter_ozet view'ını kullan
      const { data: envanterData } = await supabase.from('v_envanter_ozet').select('*');
      
      if (envanterData && envanterData.length > 0) {
        const totals = envanterData.reduce((acc, item) => ({
          toplam_ekipman: acc.toplam_ekipman + (item.toplam_ekipman || 0),
          aktif_ekipman: acc.aktif_ekipman + (item.aktif_ekipman || 0),
          kullanimdaki_ekipman: acc.kullanimdaki_ekipman + (item.kullanimdaki_ekipman || 0),
          toplam_deger: acc.toplam_deger + (item.toplam_deger || 0)
        }), { toplam_ekipman: 0, aktif_ekipman: 0, kullanimdaki_ekipman: 0, toplam_deger: 0 });
        
        setStats(totals);
        
        // Departman bazlı istatistikler
        const deptStats = envanterData.reduce((acc, item) => {
          const existing = acc.find(d => d.departman_adi === item.departman_adi);
          if (existing) {
            existing.toplam_ekipman += item.toplam_ekipman || 0;
            existing.toplam_deger += item.toplam_deger || 0;
          } else {
            acc.push({
              departman_adi: item.departman_adi,
              toplam_ekipman: item.toplam_ekipman || 0,
              toplam_deger: item.toplam_deger || 0
            });
          }
          return acc;
        }, []);
        setDepartmanStats(deptStats);

        // Kategori bazlı istatistikler
        const katStats = envanterData.reduce((acc, item) => {
          const existing = acc.find(k => k.kategori === item.kategori);
          if (existing) {
            existing.toplam_ekipman += item.toplam_ekipman || 0;
          } else {
            acc.push({
              kategori: item.kategori,
              toplam_ekipman: item.toplam_ekipman || 0
            });
          }
          return acc;
        }, []);
        setKategoriStats(katStats);
      }
    } catch (error) {
      console.log('Dashboard verileri yüklenemedi:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>📊 Dashboard</Typography>
      
      {/* Ana İstatistikler */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">Toplam Ekipman</Typography>
              <Typography variant="h3">{stats.toplam_ekipman}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">Aktif</Typography>
              <Typography variant="h3">{stats.aktif_ekipman}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">Kullanımda</Typography>
              <Typography variant="h3">{stats.kullanimdaki_ekipman}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="info.main">Toplam Değer</Typography>
              <Typography variant="h5">₺{stats.toplam_deger?.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Departman Dağılımı */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>🏢 Departman Dağılımı</Typography>
              {departmanStats.map((dept, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="subtitle1">{dept.departman_adi || 'Bilinmeyen'}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Ekipman: {dept.toplam_ekipman} | Değer: ₺{dept.toplam_deger?.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Kategori Dağılımı */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>📱 Kategori Dağılımı</Typography>
              {kategoriStats.map((kat, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="subtitle1">{kat.kategori}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Ekipman Sayısı: {kat.toplam_ekipman}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// 📝 Ekipman Ekleme
function EkipmanEkle() {
  const [formData, setFormData] = useState({
    marka_id: '',
    model_id: '',
    lokasyon_id: '',
    atanan_personel_id: '',
    barkod: '',
    satin_alma_tarihi: '',
    satin_alma_fiyati: '',
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
      setFormData(prev => ({ ...prev, model_id: '' }));
    } else {
      setFilteredModeller([]);
    }
  }, [formData.marka_id, modeller]);

  const fetchDropdownData = async () => {
    try {
      const [markaRes, modelRes, lokasyonRes, personelRes] = await Promise.all([
        supabase.from('markalar').select('*').eq('aktif', true).order('marka_adi'),
        supabase.from('modeller').select('*').eq('aktif', true).order('model_adi'),
        supabase.from('lokasyonlar').select('*').eq('aktif', true).order('lokasyon_adi'),
        supabase.from('personel').select('*').eq('aktif', true).order('ad', { ascending: true })
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

      // Fiyatı number'a çevir
      if (submitData.satin_alma_fiyati) {
        submitData.satin_alma_fiyati = parseFloat(submitData.satin_alma_fiyati);
      }

      const { error } = await supabase
        .from('ekipman_envanteri')
        .insert([submitData]);
      
      if (error) throw error;
      
      setMessage('✅ Ekipman başarıyla eklendi!');
      setFormData({
        marka_id: '', model_id: '', lokasyon_id: '', atanan_personel_id: '',
        barkod: '', satin_alma_tarihi: '', satin_alma_fiyati: '', aciklama: ''
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
      <Card sx={{ maxWidth: 800 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Marka *</InputLabel>
                  <Select
                    value={formData.marka_id}
                    onChange={(e) => setFormData({...formData, marka_id: e.target.value})}
                    required
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
                  <InputLabel>Model *</InputLabel>
                  <Select
                    value={formData.model_id}
                    onChange={(e) => setFormData({...formData, model_id: e.target.value})}
                    required
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
                  <InputLabel>Lokasyon *</InputLabel>
                  <Select
                    value={formData.lokasyon_id}
                    onChange={(e) => setFormData({...formData, lokasyon_id: e.target.value})}
                    required
                  >
                    {lokasyonlar.map((lokasyon) => (
                      <MenuItem key={lokasyon.id} value={lokasyon.id}>
                        {lokasyon.lokasyon_adi} ({lokasyon.lokasyon_tipi})
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
                    <MenuItem value="">Atanmamış</MenuItem>
                    {personeller.map((personel) => (
                      <MenuItem key={personel.id} value={personel.id}>
                        {personel.ad} {personel.soyad} ({personel.sicil_no})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Barkod *"
                  value={formData.barkod}
                  onChange={(e) => setFormData({...formData, barkod: e.target.value})}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Satın Alma Fiyatı (₺)"
                  type="number"
                  value={formData.satin_alma_fiyati}
                  onChange={(e) => setFormData({...formData, satin_alma_fiyati: e.target.value})}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Satın Alma Tarihi"
                  type="date"
                  value={formData.satin_alma_tarihi}
                  onChange={(e) => setFormData({...formData, satin_alma_tarihi: e.target.value})}
                  InputLabelProps={{ shrink: true }}
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
                  size="large"
                >
                  {loading ? '⏳ Ekleniyor...' : '✅ Ekipman Ekle'}
                </Button>
              </Grid>
            </Grid>
          </form>
          
          {message && (
            <Alert severity={message.includes('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// 📋 Ekipman Listesi
function EkipmanListesi() {
  const [ekipmanlar, setEkipmanlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEkipmanlar();
  }, []);

  const fetchEkipmanlar = async () => {
    try {
      const { data, error } = await supabase
        .from('v_ekipman_detay')
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

  const filteredEkipmanlar = ekipmanlar.filter(ekipman =>
    ekipman.envanter_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ekipman.barkod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ekipman.marka_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ekipman.model_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ekipman.atanan_personel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>📋 Ekipman Listesi</Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Arama (Envanter No, Barkod, Marka, Model, Personel...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      {filteredEkipmanlar.length === 0 ? (
        <Alert severity="info">
          {searchTerm ? 'Arama kriterlerine uygun ekipman bulunamadı.' : 'Henüz ekipman eklenmemiş.'}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredEkipmanlar.map((ekipman) => (
            <Grid item xs={12} md={6} lg={4} key={ekipman.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {ekipman.marka_adi} {ekipman.model_adi}
                  </Typography>
                  
                  <Box sx={{ mb: 1 }}>
                    <Chip 
                      label={ekipman.kategori} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={ekipman.ekipman_durumu} 
                      size="small" 
                      color={ekipman.ekipman_durumu === 'AKTIF' ? 'success' : 'default'}
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary">
                    <strong>Envanter No:</strong> {ekipman.envanter_no || 'Belirtilmemiş'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Barkod:</strong> {ekipman.barkod || 'Yok'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Seri No:</strong> {ekipman.seri_no || 'Yok'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>MAC:</strong> {ekipman.mac_adresi || 'Yok'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Lokasyon:</strong> {ekipman.lokasyon_adi || 'Belirtilmemiş'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Departman:</strong> {ekipman.departman_adi || 'Belirtilmemiş'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Atanan:</strong> {ekipman.atanan_personel || 'Atanmamış'}
                  </Typography>
                  
                  {ekipman.aciklama && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      {ekipman.aciklama}
                    </Typography>
                  )}
                </CardContent>
              </Card>
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
  const [data, setData] = useState({
    markalar: [],
    lokasyonlar: [],
    personeller: [],
    departmanlar: []
  });
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [markaRes, lokasyonRes, personelRes, departmanRes] = await Promise.all([
        supabase.from('markalar').select('*').order('marka_adi'),
        supabase.from('lokasyonlar').select('*, departmanlar(departman_adi)').order('lokasyon_adi'),
        supabase.from('personel').select('*, departmanlar(departman_adi)').order('ad'),
        supabase.from('departmanlar').select('*').order('departman_adi')
      ]);

      setData({
        markalar: markaRes.data || [],
        lokasyonlar: lokasyonRes.data || [],
        personeller: personelRes.data || [],
        departmanlar: departmanRes.data || []
      });
    } catch (error) {
      console.log('Yönetim verileri yüklenemedi:', error);
    }
  };

  const addMarka = async () => {
    if (!newItem.trim()) return;
    try {
      const markaKodu = newItem.trim().toUpperCase().substring(0, 10);
      await supabase.from('markalar').insert([{ 
        marka_kodu: markaKodu,
        marka_adi: newItem.trim() 
      }]);
      setNewItem('');
      fetchData();
    } catch (error) {
      console.log('Marka eklenemedi:', error);
    }
  };

  const addLokasyon = async () => {
    if (!newItem.trim()) return;
    try {
      const lokasyonKodu = 'LOK-' + Date.now();
      await supabase.from('lokasyonlar').insert([{ 
        lokasyon_kodu: lokasyonKodu,
        lokasyon_adi: newItem.trim(),
        lokasyon_tipi: 'OFIS'
      }]);
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
          <Tab label="Departmanlar" />
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
          <Grid container spacing={1}>
            {data.markalar.map((marka) => (
              <Grid item xs={12} sm={6} md={4} key={marka.id}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">{marka.marka_adi}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Kod: {marka.marka_kodu}
                  </Typography>
                  <Chip 
                    label={marka.aktif ? 'Aktif' : 'Pasif'} 
                    color={marka.aktif ? 'success' : 'default'}
                    size="small"
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
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
          <Grid container spacing={1}>
            {data.lokasyonlar.map((lokasyon) => (
              <Grid item xs={12} sm={6} md={4} key={lokasyon.id}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">{lokasyon.lokasyon_adi}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tip: {lokasyon.lokasyon_tipi}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Departman: {lokasyon.departmanlar?.departman_adi || 'Atanmamış'}
                  </Typography>
                  <Chip 
                    label={lokasyon.aktif ? 'Aktif' : 'Pasif'} 
                    color={lokasyon.aktif ? 'success' : 'default'}
                    size="small"
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Toplam {data.personeller.length} personel
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sicil No</TableCell>
                  <TableCell>Ad Soyad</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Departman</TableCell>
                  <TableCell>Durum</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.personeller.map((personel) => (
                  <TableRow key={personel.id}>
                    <TableCell>{personel.sicil_no}</TableCell>
                    <TableCell>{personel.ad} {personel.soyad}</TableCell>
                    <TableCell>{personel.email}</TableCell>
                    <TableCell>{personel.departmanlar?.departman_adi}</TableCell>
                    <TableCell>
                      <Chip 
                        label={personel.aktif ? 'Aktif' : 'Pasif'} 
                        color={personel.aktif ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Grid container spacing={2}>
            {data.departmanlar.map((departman) => (
              <Grid item xs={12} sm={6} md={4} key={departman.id}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">{departman.departman_adi}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Kod: {departman.departman_kodu}
                  </Typography>
                  {departman.aciklama && (
                    <Typography variant="body2">{departman.aciklama}</Typography>
                  )}
                  <Chip 
                    label={departman.aktif ? 'Aktif' : 'Pasif'} 
                    color={departman.aktif ? 'success' : 'default'}
                    size="small"
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

// 🔧 Kurulum
function Kurulum() {
  const [dbStatus, setDbStatus] = useState('checking');
  const [tableStats, setTableStats] = useState({});

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      // Temel tabloları kontrol et
      const tables = ['departmanlar', 'personel', 'lokasyonlar', 'markalar', 'modeller', 'ekipman_envanteri'];
      const stats = {};
      
      for (const table of tables) {
        try {
          const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
          stats[table] = count || 0;
        } catch (error) {
          stats[table] = 'Hata';
        }
      }
      
      setTableStats(stats);
      setDbStatus('ready');
    } catch (error) {
      setDbStatus('error');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>⚙️ Sistem Kurulumu</Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Kapsamlı Normalize Edilmiş Veritabanı Durumu:</Typography>
          {dbStatus === 'checking' && <Alert severity="info">🔍 Kontrol ediliyor...</Alert>}
          {dbStatus === 'ready' && <Alert severity="success">✅ Kapsamlı normalize edilmiş veritabanı hazır!</Alert>}
          {dbStatus === 'error' && (
            <Alert severity="error">
              ❌ Veritabanı bağlantısı yok.
            </Alert>
          )}
          
          {dbStatus === 'ready' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>📊 Tablo İstatistikleri:</Typography>
              <Grid container spacing={2}>
                {Object.entries(tableStats).map(([table, count]) => (
                  <Grid item xs={12} sm={6} md={4} key={table}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">{table}</Typography>
                      <Typography variant="h4">{count}</Typography>
                      <Typography variant="body2" color="textSecondary">kayıt</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" gutterBottom>
              🏗️ <strong>Mevcut Veritabanı Yapısı:</strong>
            </Typography>
            <ul>
              <li><strong>departmanlar</strong> - Departman yönetimi (otomatik kodlama)</li>
              <li><strong>personel</strong> - Personel yönetimi (otomatik sicil no)</li>
              <li><strong>lokasyonlar</strong> - Lokasyon yönetimi (tip bazlı)</li>
              <li><strong>markalar</strong> - Marka yönetimi (kod sistemi)</li>
              <li><strong>modeller</strong> - Model yönetimi (kategori bazlı)</li>
              <li><strong>mac_adresleri</strong> - MAC adres havuzu</li>
              <li><strong>seri_numaralari</strong> - Seri numara havuzu</li>
              <li><strong>ekipman_envanteri</strong> - Ana envanter (otomatik envanter no)</li>
            </ul>
            
            <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
              🔍 <strong>Gelişmiş View'lar:</strong>
            </Typography>
            <ul>
              <li><strong>v_ekipman_detay</strong> - Tam JOIN'li detay görünüm</li>
              <li><strong>v_envanter_ozet</strong> - Departman/kategori bazlı özet</li>
            </ul>

            <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
              ⚡ <strong>Otomatik Özellikler:</strong>
            </Typography>
            <ul>
              <li>Sicil numarası otomatik oluşturma</li>
              <li>Envanter numarası otomatik oluşturma</li>
              <li>MAC adresi normalleştirme</li>
              <li>Veri bütünlük kontrolleri</li>
              <li>Row Level Security (RLS)</li>
              <li>Performance indeksleri</li>
            </ul>
          </Box>
        </CardContent>
      </Card>
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
              🏢 Kapsamlı Envanter Yönetim Sistemi
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