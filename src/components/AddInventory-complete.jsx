// ✅ EKİPMAN EKLEME BİLEŞENİ - COMPLETE SUPABASE İLE TAM ENTEGRE
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  FormHelperText,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Clear as ClearIcon,
  QrCodeScanner as QrCodeIcon,
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';

import { supabase } from '../supabaseClient';

const steps = [
  'Temel Bilgiler',
  'Teknik Detaylar', 
  'Lokasyon ve Atama',
  'Mali Bilgiler'
];

const AddInventory = ({ onInventoryAdded, showSuccess, showError }) => {
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    // Temel bilgiler
    barkod: '',
    marka_id: '',
    model_id: '',
    
    // Teknik detaylar
    mac_adresi: '',
    seri_no: '',
    teknik_ozellikler: {},
    
    // Lokasyon ve atama
    lokasyon_id: '',
    atanan_personel_id: '',
    
    // Mali bilgiler
    satin_alma_tarihi: null,
    satin_alma_fiyati: '',
    garanti_bitis_tarihi: null,
    amortisman_suresi: '',
    
    // Diğer
    ekipman_durumu: 'AKTIF',
    aciklama: '',
    notlar: {}
  });

  // Dropdown data
  const [dropdownData, setDropdownData] = useState({
    markalar: [],
    modeller: [],
    lokasyonlar: [],
    personel: [],
    departmanlar: []
  });

  // State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [filteredModeller, setFilteredModeller] = useState([]);

  // Dropdown verilerini yükle
  const loadDropdownData = async () => {
    try {
      setLoading(true);

      const [
        markalarResult,
        modellerResult,
        lokasyonlarResult,
        personelResult,
        departmanlarResult
      ] = await Promise.all([
        supabase.from('markalar').select('*').eq('aktif', true).order('marka_adi'),
        supabase.from('modeller').select(`
          *,
          markalar:marka_id (
            id,
            marka_adi
          )
        `).eq('aktif', true).order('model_adi'),
        supabase.from('lokasyonlar').select(`
          *,
          departmanlar:departman_id (
            id,
            departman_adi
          )
        `).eq('aktif', true).order('lokasyon_adi'),
        supabase.from('personel').select(`
          *,
          departmanlar:departman_id (
            id,
            departman_adi
          )
        `).eq('aktif', true).order('ad'),
        supabase.from('departmanlar').select('*').eq('aktif', true).order('departman_adi')
      ]);

      if (markalarResult.error) throw markalarResult.error;
      if (modellerResult.error) throw modellerResult.error;
      if (lokasyonlarResult.error) throw lokasyonlarResult.error;
      if (personelResult.error) throw personelResult.error;
      if (departmanlarResult.error) throw departmanlarResult.error;

      setDropdownData({
        markalar: markalarResult.data || [],
        modeller: modellerResult.data || [],
        lokasyonlar: lokasyonlarResult.data || [],
        personel: personelResult.data || [],
        departmanlar: departmanlarResult.data || []
      });

      console.log('Dropdown verileri yüklendi:', {
        markalar: markalarResult.data?.length || 0,
        modeller: modellerResult.data?.length || 0,
        lokasyonlar: lokasyonlarResult.data?.length || 0,
        personel: personelResult.data?.length || 0
      });

    } catch (error) {
      console.error('Dropdown veri yükleme hatası:', error);
      showError(`Veri yükleme hatası: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Form field değişikliği
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Marka değiştiğinde modelleri filtrele
    if (field === 'marka_id') {
      const filtered = dropdownData.modeller.filter(model => 
        model.marka_id === parseInt(value)
      );
      setFilteredModeller(filtered);
      
      // Model seçimini temizle
      setFormData(prev => ({
        ...prev,
        model_id: ''
      }));
    }

    // Hataları temizle
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // MAC adresi formatı doğrulama
  const validateMacAddress = (mac) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  // Form doğrulama
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Temel bilgiler
        if (!formData.barkod.trim()) {
          newErrors.barkod = 'Barkod gereklidir';
        }
        if (!formData.marka_id) {
          newErrors.marka_id = 'Marka seçimi gereklidir';
        }
        if (!formData.model_id) {
          newErrors.model_id = 'Model seçimi gereklidir';
        }
        break;

      case 1: // Teknik detaylar
        if (formData.mac_adresi && !validateMacAddress(formData.mac_adresi)) {
          newErrors.mac_adresi = 'MAC adresi formatı geçersiz (örn: 00:11:22:33:44:55)';
        }
        if (!formData.seri_no.trim()) {
          newErrors.seri_no = 'Seri numarası gereklidir';
        }
        break;

      case 2: // Lokasyon
        if (!formData.lokasyon_id) {
          newErrors.lokasyon_id = 'Lokasyon seçimi gereklidir';
        }
        break;

      case 3: // Mali bilgiler
        if (formData.satin_alma_fiyati && isNaN(parseFloat(formData.satin_alma_fiyati))) {
          newErrors.satin_alma_fiyati = 'Geçerli bir fiyat girin';
        }
        if (formData.amortisman_suresi && isNaN(parseInt(formData.amortisman_suresi))) {
          newErrors.amortisman_suresi = 'Geçerli bir süre girin';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Benzersizlik kontrolü
  const checkUniqueness = async () => {
    try {
      // Barkod kontrolü
      const { data: existingBarcode } = await supabase
        .from('ekipman_envanteri')
        .select('id')
        .eq('barkod', formData.barkod)
        .maybeSingle();

      if (existingBarcode) {
        throw new Error('Bu barkod zaten kayıtlı');
      }

      // MAC adresi kontrolü (varsa)
      if (formData.mac_adresi) {
        const { data: existingMac } = await supabase
          .from('mac_adresleri')
          .select('id')
          .eq('mac_adresi', formData.mac_adresi.toUpperCase())
          .maybeSingle();

        if (existingMac) {
          throw new Error('Bu MAC adresi zaten kayıtlı');
        }
      }

      // Seri numarası kontrolü
      const { data: existingSerial } = await supabase
        .from('seri_numaralari')
        .select('id')
        .eq('seri_no', formData.seri_no.toUpperCase())
        .maybeSingle();

      if (existingSerial) {
        throw new Error('Bu seri numarası zaten kayıtlı');
      }

    } catch (error) {
      throw error;
    }
  };

  // Stepper navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Form gönderme
  const handleSubmit = async () => {
    try {
      if (!validateStep(activeStep)) {
        return;
      }

      setSubmitting(true);

      // Benzersizlik kontrolü
      await checkUniqueness();

      // Transaction başlat
      const { data: transaction } = await supabase.rpc('begin_transaction');

      try {
        let macAdresId = null;
        let seriNoId = null;

        // MAC adresi ekle (varsa)
        if (formData.mac_adresi) {
          const { data: macResult, error: macError } = await supabase
            .from('mac_adresleri')
            .insert({
              mac_adresi: formData.mac_adresi.trim().toUpperCase(),
              kullanim_durumu: 'KULLANIMDA'
            })
            .select('*')
            .single();

          if (macError) throw macError;
          macAdresId = macResult.id;
        }

        // Seri numarası ekle
        const { data: seriResult, error: seriError } = await supabase
          .from('seri_numaralari')
          .insert({
            seri_no: formData.seri_no.trim().toUpperCase(),
            kullanim_durumu: 'KULLANIMDA'
          })
          .select('*')
          .single();

        if (seriError) {
          // Rollback MAC adresi
          if (macAdresId) {
            await supabase.from('mac_adresleri').delete().eq('id', macAdresId);
          }
          throw seriError;
        }
        seriNoId = seriResult.id;

        // Envanter kaydını ekle
        const inventoryData = {
          barkod: formData.barkod.trim(),
          marka_id: parseInt(formData.marka_id),
          model_id: parseInt(formData.model_id),
          mac_adresi_id: macAdresId,
          seri_no_id: seriNoId,
          lokasyon_id: parseInt(formData.lokasyon_id),
          atanan_personel_id: formData.atanan_personel_id ? parseInt(formData.atanan_personel_id) : null,
          satin_alma_tarihi: formData.satin_alma_tarihi,
          satin_alma_fiyati: formData.satin_alma_fiyati ? parseFloat(formData.satin_alma_fiyati) : null,
          garanti_bitis_tarihi: formData.garanti_bitis_tarihi,
          amortisman_suresi: formData.amortisman_suresi ? parseInt(formData.amortisman_suresi) : null,
          ekipman_durumu: formData.ekipman_durumu,
          aciklama: formData.aciklama.trim() || null,
          notlar: Object.keys(formData.notlar).length > 0 ? formData.notlar : null
        };

        const { data: inventoryResult, error: inventoryError } = await supabase
          .from('ekipman_envanteri')
          .insert(inventoryData)
          .select(`
            *,
            markalar:marka_id (marka_adi),
            modeller:model_id (model_adi),
            lokasyonlar:lokasyon_id (lokasyon_adi)
          `)
          .single();

        if (inventoryError) {
          // Rollback önceki kayıtlar
          if (macAdresId) {
            await supabase.from('mac_adresleri').delete().eq('id', macAdresId);
          }
          if (seriNoId) {
            await supabase.from('seri_numaralari').delete().eq('id', seriNoId);
          }
          throw inventoryError;
        }

        // Commit transaction
        await supabase.rpc('commit_transaction');

        console.log('Envanter başarıyla eklendi:', inventoryResult);
        showSuccess(`Envanter kaydı başarıyla eklendi! Envanter No: ${inventoryResult.envanter_no}`);

        // Formu sıfırla
        resetForm();
        
        // Parent component'i bilgilendir
        if (onInventoryAdded) {
          onInventoryAdded();
        }

      } catch (error) {
        // Rollback transaction
        await supabase.rpc('rollback_transaction');
        throw error;
      }

    } catch (error) {
      console.error('Form gönderme hatası:', error);
      showError(`Kayıt ekleme hatası: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Formu sıfırla
  const resetForm = () => {
    setFormData({
      barkod: '',
      marka_id: '',
      model_id: '',
      mac_adresi: '',
      seri_no: '',
      teknik_ozellikler: {},
      lokasyon_id: '',
      atanan_personel_id: '',
      satin_alma_tarihi: null,
      satin_alma_fiyati: '',
      garanti_bitis_tarihi: null,
      amortisman_suresi: '',
      ekipman_durumu: 'AKTIF',
      aciklama: '',
      notlar: {}
    });
    setErrors({});
    setActiveStep(0);
    setFilteredModeller([]);
  };

  // Barkod otomatik oluştur
  const generateBarcode = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const barcode = `BRK${timestamp.slice(-6)}${random}`;
    handleInputChange('barkod', barcode);
  };

  // Component mount
  useEffect(() => {
    loadDropdownData();
  }, []);

  // Marka değiştiğinde modelleri filtrele
  useEffect(() => {
    if (formData.marka_id) {
      const filtered = dropdownData.modeller.filter(model => 
        model.marka_id === parseInt(formData.marka_id)
      );
      setFilteredModeller(filtered);
    } else {
      setFilteredModeller([]);
    }
  }, [formData.marka_id, dropdownData.modeller]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Veriler yükleniyor...
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Yeni Ekipman Ekle
          </Typography>
          
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Envantere yeni ekipman eklemek için aşağıdaki adımları takip edin.
          </Typography>

          <Stepper activeStep={activeStep} orientation="vertical">
            
            {/* ADIM 1: TEMEL BİLGİLER */}
            <Step>
              <StepLabel>
                <Box display="flex" alignItems="center">
                  <ComputerIcon sx={{ mr: 1 }} />
                  Temel Bilgiler
                </Box>
              </StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  
                  {/* Barkod */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Barkod"
                      value={formData.barkod}
                      onChange={(e) => handleInputChange('barkod', e.target.value)}
                      error={!!errors.barkod}
                      helperText={errors.barkod}
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={generateBarcode} edge="end">
                              <QrCodeIcon />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  {/* Marka */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.marka_id} required>
                      <InputLabel>Marka</InputLabel>
                      <Select
                        value={formData.marka_id}
                        onChange={(e) => handleInputChange('marka_id', e.target.value)}
                        label="Marka"
                      >
                        {dropdownData.markalar.map(marka => (
                          <MenuItem key={marka.id} value={marka.id}>
                            {marka.marka_adi}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.marka_id && <FormHelperText>{errors.marka_id}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  {/* Model */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.model_id} required>
                      <InputLabel>Model</InputLabel>
                      <Select
                        value={formData.model_id}
                        onChange={(e) => handleInputChange('model_id', e.target.value)}
                        label="Model"
                        disabled={!formData.marka_id}
                      >
                        {filteredModeller.map(model => (
                          <MenuItem key={model.id} value={model.id}>
                            <Box>
                              <Typography variant="body1">{model.model_adi}</Typography>
                              <Chip 
                                label={model.kategori} 
                                size="small" 
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.model_id && <FormHelperText>{errors.model_id}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  {/* Ekipman Durumu */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Ekipman Durumu</InputLabel>
                      <Select
                        value={formData.ekipman_durumu}
                        onChange={(e) => handleInputChange('ekipman_durumu', e.target.value)}
                        label="Ekipman Durumu"
                      >
                        <MenuItem value="AKTIF">Aktif</MenuItem>
                        <MenuItem value="PASIF">Pasif</MenuItem>
                        <MenuItem value="BAKIM">Bakımda</MenuItem>
                        <MenuItem value="BOZUK">Bozuk</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mr: 1 }}
                  >
                    Devam Et
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* ADIM 2: TEKNİK DETAYLAR */}
            <Step>
              <StepLabel>
                <Box display="flex" alignItems="center">
                  <MemoryIcon sx={{ mr: 1 }} />
                  Teknik Detaylar
                </Box>
              </StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  
                  {/* MAC Adresi */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="MAC Adresi"
                      value={formData.mac_adresi}
                      onChange={(e) => handleInputChange('mac_adresi', e.target.value)}
                      error={!!errors.mac_adresi}
                      helperText={errors.mac_adresi || 'Format: 00:11:22:33:44:55 (Opsiyonel)'}
                      placeholder="00:11:22:33:44:55"
                    />
                  </Grid>

                  {/* Seri Numarası */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Seri Numarası"
                      value={formData.seri_no}
                      onChange={(e) => handleInputChange('seri_no', e.target.value)}
                      error={!!errors.seri_no}
                      helperText={errors.seri_no}
                      required
                    />
                  </Grid>

                  {/* Açıklama */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={formData.aciklama}
                      onChange={(e) => handleInputChange('aciklama', e.target.value)}
                      multiline
                      rows={3}
                      placeholder="Ek açıklamalar ve notlar..."
                    />
                  </Grid>

                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mr: 1 }}
                  >
                    Devam Et
                  </Button>
                  <Button onClick={handleBack}>
                    Geri
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* ADIM 3: LOKASYON VE ATAMA */}
            <Step>
              <StepLabel>
                <Box display="flex" alignItems="center">
                  <LocationIcon sx={{ mr: 1 }} />
                  Lokasyon ve Atama
                </Box>
              </StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  
                  {/* Lokasyon */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.lokasyon_id} required>
                      <InputLabel>Lokasyon</InputLabel>
                      <Select
                        value={formData.lokasyon_id}
                        onChange={(e) => handleInputChange('lokasyon_id', e.target.value)}
                        label="Lokasyon"
                      >
                        {dropdownData.lokasyonlar.map(lokasyon => (
                          <MenuItem key={lokasyon.id} value={lokasyon.id}>
                            <Box>
                              <Typography variant="body1">{lokasyon.lokasyon_adi}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {lokasyon.departmanlar?.departman_adi} - {lokasyon.lokasyon_tipi}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.lokasyon_id && <FormHelperText>{errors.lokasyon_id}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  {/* Atanan Personel */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Atanan Personel (Opsiyonel)</InputLabel>
                      <Select
                        value={formData.atanan_personel_id}
                        onChange={(e) => handleInputChange('atanan_personel_id', e.target.value)}
                        label="Atanan Personel (Opsiyonel)"
                      >
                        <MenuItem value="">
                          <em>Seçim yapılmadı</em>
                        </MenuItem>
                        {dropdownData.personel.map(person => (
                          <MenuItem key={person.id} value={person.id}>
                            <Box>
                              <Typography variant="body1">
                                {person.ad} {person.soyad}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {person.sicil_no} - {person.departmanlar?.departman_adi}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mr: 1 }}
                  >
                    Devam Et
                  </Button>
                  <Button onClick={handleBack}>
                    Geri
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* ADIM 4: MALİ BİLGİLER */}
            <Step>
              <StepLabel>Mali Bilgiler</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  
                  {/* Satın Alma Tarihi */}
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Satın Alma Tarihi"
                      value={formData.satin_alma_tarihi}
                      onChange={(value) => handleInputChange('satin_alma_tarihi', value)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>

                  {/* Garanti Bitiş Tarihi */}
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Garanti Bitiş Tarihi"
                      value={formData.garanti_bitis_tarihi}
                      onChange={(value) => handleInputChange('garanti_bitis_tarihi', value)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>

                  {/* Satın Alma Fiyatı */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Satın Alma Fiyatı"
                      value={formData.satin_alma_fiyati}
                      onChange={(e) => handleInputChange('satin_alma_fiyati', e.target.value)}
                      error={!!errors.satin_alma_fiyati}
                      helperText={errors.satin_alma_fiyati}
                      type="number"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">₺</InputAdornment>
                      }}
                    />
                  </Grid>

                  {/* Amortisman Süresi */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Amortisman Süresi"
                      value={formData.amortisman_suresi}
                      onChange={(e) => handleInputChange('amortisman_suresi', e.target.value)}
                      error={!!errors.amortisman_suresi}
                      helperText={errors.amortisman_suresi}
                      type="number"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">Yıl</InputAdornment>
                      }}
                    />
                  </Grid>

                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                    sx={{ mr: 1 }}
                  >
                    {submitting ? 'Kaydediliyor...' : 'Envanter Kaydını Ekle'}
                  </Button>
                  <Button onClick={handleBack} disabled={submitting}>
                    Geri
                  </Button>
                  <Button 
                    onClick={resetForm} 
                    disabled={submitting}
                    startIcon={<ClearIcon />}
                    sx={{ ml: 1 }}
                  >
                    Formu Temizle
                  </Button>
                </Box>
              </StepContent>
            </Step>

          </Stepper>

          {/* Özet Bilgi */}
          {activeStep === steps.length && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Envanter Kaydı Başarıyla Eklendi!
              </Typography>
              <Button onClick={resetForm} variant="outlined" startIcon={<RefreshIcon />}>
                Yeni Kayıt Ekle
              </Button>
            </Paper>
          )}

        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default AddInventory;