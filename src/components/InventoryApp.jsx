// ✅ ANA ENVANTER UYGULAMASI - COMPLETE SUPABASE İLE ENTEGRE
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
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  AddBox as AddBoxIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

// Components
import DashboardView from './DashboardView';
import SetupWizard from './SetupWizard';
import AddInventory from './AddInventory';
import InventoryList from './InventoryList';
import PersonelView from './PersonelView';
import DepartmanView from './DepartmanView';

// Supabase
import { supabase } from '../supabaseClient';

// Tab panel bileşeni
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const InventoryApp = () => {
  // State yönetimi
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [systemStats, setSystemStats] = useState({
    departmanlar: 0,
    personel: 0,
    lokasyonlar: 0,
    markalar: 0,
    modeller: 0,
    ekipman: 0
  });

  // Sistem istatistiklerini yükle
  const loadSystemStats = async () => {
    try {
      setLoading(true);
      
      const [
        { count: departmanCount },
        { count: personelCount },
        { count: lokasyonCount },
        { count: markaCount },
        { count: modelCount },
        { count: ekipmanCount }
      ] = await Promise.all([
        supabase.from('departmanlar').select('*', { count: 'exact', head: true }),
        supabase.from('personel').select('*', { count: 'exact', head: true }),
        supabase.from('lokasyonlar').select('*', { count: 'exact', head: true }),
        supabase.from('markalar').select('*', { count: 'exact', head: true }),
        supabase.from('modeller').select('*', { count: 'exact', head: true }),
        supabase.from('ekipman_envanteri').select('*', { count: 'exact', head: true })
      ]);

      setSystemStats({
        departmanlar: departmanCount || 0,
        personel: personelCount || 0,
        lokasyonlar: lokasyonCount || 0,
        markalar: markaCount || 0,
        modeller: modelCount || 0,
        ekipman: ekipmanCount || 0
      });

    } catch (error) {
      console.error('Sistem istatistikleri yükleme hatası:', error);
      setError('Sistem verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Veritabanı bağlantısını test et
  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('departmanlar')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      console.log('✅ Veritabanı bağlantısı başarılı');
      return true;
    } catch (error) {
      console.error('❌ Veritabanı bağlantı hatası:', error);
      setError(`Veritabanı bağlantı hatası: ${error.message}`);
      return false;
    }
  };

  // Tab değişikliği
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Snackbar kapatma
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Başarı mesajı göster
  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  // Hata mesajı göster
  const showError = (message) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  // Component mount edildiğinde
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Envanter uygulaması başlatılıyor...');
      
      // Veritabanı bağlantısını test et
      const connectionOk = await testDatabaseConnection();
      
      if (connectionOk) {
        // Sistem istatistiklerini yükle
        await loadSystemStats();
        showSuccess('Sistem başarıyla yüklendi');
      }
    };

    initializeApp();
  }, []);

  // Real-time güncellemeler için subscription
  useEffect(() => {
    const subscriptions = [];

    // Tüm tabloları dinle
    const tableNames = ['departmanlar', 'personel', 'lokasyonlar', 'markalar', 'modeller', 'ekipman_envanteri'];
    
    tableNames.forEach(tableName => {
      const subscription = supabase
        .channel(`public:${tableName}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            console.log(`${tableName} tablosunda değişiklik:`, payload);
            // İstatistikleri yeniden yükle
            loadSystemStats();
          }
        )
        .subscribe();

      subscriptions.push(subscription);
    });

    // Cleanup
    return () => {
      subscriptions.forEach(sub => {
        supabase.removeChannel(sub);
      });
    };
  }, []);

  // Loading durumu
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Envanter sistemi yükleniyor...
        </Typography>
      </Container>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => window.location.reload()}>
            Yenile
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Ana AppBar */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <InventoryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Envanter Takip Sistemi
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Toplam Ekipman: {systemStats.ekipman}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sistem özet kartları */}
      <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <BusinessIcon color="primary" />
                <Typography variant="h6">{systemStats.departmanlar}</Typography>
                <Typography variant="caption" color="textSecondary">
                  Departman
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <PeopleIcon color="primary" />
                <Typography variant="h6">{systemStats.personel}</Typography>
                <Typography variant="caption" color="textSecondary">
                  Personel
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <BusinessIcon color="primary" />
                <Typography variant="h6">{systemStats.lokasyonlar}</Typography>
                <Typography variant="caption" color="textSecondary">
                  Lokasyon
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <InventoryIcon color="primary" />
                <Typography variant="h6">{systemStats.markalar}</Typography>
                <Typography variant="caption" color="textSecondary">
                  Marka
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <InventoryIcon color="primary" />
                <Typography variant="h6">{systemStats.modeller}</Typography>
                <Typography variant="caption" color="textSecondary">
                  Model
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <InventoryIcon color="success" />
                <Typography variant="h6">{systemStats.ekipman}</Typography>
                <Typography variant="caption" color="textSecondary">
                  Ekipman
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Ana tab navigation */}
      <Container maxWidth="xl">
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="inventory navigation tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Dashboard" 
              id="inventory-tab-0"
              aria-controls="inventory-tabpanel-0"
            />
            <Tab 
              icon={<SettingsIcon />} 
              label="Sistem Kurulum" 
              id="inventory-tab-1"
              aria-controls="inventory-tabpanel-1"
            />
            <Tab 
              icon={<AddBoxIcon />} 
              label="Ekipman Ekle" 
              id="inventory-tab-2"
              aria-controls="inventory-tabpanel-2"
            />
            <Tab 
              icon={<InventoryIcon />} 
              label="Envanter Listesi" 
              id="inventory-tab-3"
              aria-controls="inventory-tabpanel-3"
            />
            <Tab 
              icon={<PeopleIcon />} 
              label="Personel" 
              id="inventory-tab-4"
              aria-controls="inventory-tabpanel-4"
            />
            <Tab 
              icon={<BusinessIcon />} 
              label="Departmanlar" 
              id="inventory-tab-5"
              aria-controls="inventory-tabpanel-5"
            />
          </Tabs>

          {/* Tab içerikleri */}
          <TabPanel value={currentTab} index={0}>
            <DashboardView 
              systemStats={systemStats}
              onRefresh={loadSystemStats}
              showSuccess={showSuccess}
              showError={showError}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <SetupWizard 
              onDataChange={loadSystemStats}
              showSuccess={showSuccess}
              showError={showError}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <AddInventory 
              onInventoryAdded={loadSystemStats}
              showSuccess={showSuccess}
              showError={showError}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <InventoryList 
              onInventoryChange={loadSystemStats}
              showSuccess={showSuccess}
              showError={showError}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={4}>
            <PersonelView 
              onPersonelChange={loadSystemStats}
              showSuccess={showSuccess}
              showError={showError}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={5}>
            <DepartmanView 
              onDepartmanChange={loadSystemStats}
              showSuccess={showSuccess}
              showError={showError}
            />
          </TabPanel>
        </Paper>
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryApp;