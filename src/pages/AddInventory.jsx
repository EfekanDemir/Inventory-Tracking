import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { tr } from 'date-fns/locale'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Compare as CompareIcon,
  History as HistoryIcon,
} from '@mui/icons-material'
import { supabase } from '../config/supabase'
import { notifyInventoryChange, showToast } from '../utils/notificationUtils'

const AddInventory = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)

  const [formData, setFormData] = useState({
    mac_adresi: '',
    marka_id: '',
    model_id: '',
    lokasyon_id: '',
    seri_no: '',
    atanan_personel_id: '',
    ofise_giris_tarihi: null,
    ofisten_cikis_tarihi: null,
    aciklama: '',
  })

  const [originalData, setOriginalData] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Dropdown verileri
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [locations, setLocations] = useState([])
  const [personnel, setPersonnel] = useState([])
  const [filteredModels, setFilteredModels] = useState([])
  const [existingMacAddresses, setExistingMacAddresses] = useState([])
  const [existingSerialNumbers, setExistingSerialNumbers] = useState([])

  // Form temizleme fonksiyonu
  const clearForm = () => {
    setFormData({
      mac_adresi: '',
      marka_id: '',
      model_id: '',
      lokasyon_id: '',
      seri_no: '',
      atanan_personel_id: '',
      ofise_giris_tarihi: null,
      ofisten_cikis_tarihi: null,
      aciklama: '',
    })
  }

  // Önce dropdown'ları yükle
  useEffect(() => {
    loadDropdownData()
  }, [])

  // Dropdown'lar yüklendikten sonra ekipman verisini yükle (edit modunda)
  useEffect(() => {
    if (isEditMode && brands.length > 0 && models.length > 0 && locations.length > 0) {
      fetchEquipmentData()
    }
  }, [isEditMode, brands.length, models.length, locations.length, id])

  // Marka değiştiğinde modelleri filtrele
  useEffect(() => {
    if (formData.marka_id) {
      const filtered = models.filter(model => model.marka_id === parseInt(formData.marka_id))
      setFilteredModels(filtered)
      // Eğer seçili model farklı markaya aitse, model seçimini temizle
      if (formData.model_id && !filtered.find(m => m.id === parseInt(formData.model_id))) {
        setFormData(prev => ({ ...prev, model_id: '' }))
      }
    } else {
      setFilteredModels([])
      setFormData(prev => ({ ...prev, model_id: '' }))
    }
  }, [formData.marka_id, models])

  const loadDropdownData = async () => {
    try {
      console.log('Dropdown verileri yükleniyor...')
      
      // Markaları yükle (is_active filtresi olmadan)
      const { data: brandsData, error: brandsError } = await supabase
        .from('markalar')
        .select('id, marka_adi')
        .order('marka_adi')

      if (brandsError) {
        console.error('Markalar yükleme hatası:', brandsError)
        throw brandsError
      }
      setBrands(brandsData || [])
      console.log('Markalar yüklendi:', brandsData?.length || 0)

      // Modelleri yükle (is_active filtresi olmadan)
      const { data: modelsData, error: modelsError } = await supabase
        .from('modeller')
        .select('id, marka_id, model_adi, kategori')
        .order('model_adi')

      if (modelsError) {
        console.error('Modeller yükleme hatası:', modelsError)
        throw modelsError
      }
      setModels(modelsData || [])
      console.log('Modeller yüklendi:', modelsData?.length || 0)

      // Lokasyonları yükle (is_active filtresi olmadan)
      const { data: locationsData, error: locationsError } = await supabase
        .from('lokasyonlar')
        .select('id, lokasyon_kodu, lokasyon_adi, lokasyon_tipi')
        .order('lokasyon_adi')

      if (locationsError) {
        console.error('Lokasyonlar yükleme hatası:', locationsError)
        throw locationsError
      }
      setLocations(locationsData || [])
      console.log('Lokasyonlar yüklendi:', locationsData?.length || 0)

      // Personeli yükle
      const { data: personnelData, error: personnelError } = await supabase
        .from('personel')
        .select('id, ad, soyad, email, sicil_no')
        .order('ad')

      if (personnelError) {
        console.error('Personel yükleme hatası:', personnelError)
        throw personnelError
      }
      setPersonnel(personnelData || [])
      console.log('Personel yüklendi:', personnelData?.length || 0)

      // MAC adreslerini yeni tablodan yükle (tüm durumlar)
      const { data: macData, error: macError } = await supabase
        .from('mac_adresleri')
        .select('*')
        .order('mac_adresi')

      if (macError) {
        console.error('MAC adresleri yükleme hatası:', macError)
        throw macError
      }
      setExistingMacAddresses(macData || [])
      console.log('MAC adresleri yüklendi:', macData?.length || 0)
      console.log('MAC adresleri durumları:', macData?.map(mac => ({ id: mac.id, mac: mac.mac_adresi, durum: mac.kullanim_durumu })))

      // Seri numaralarını yeni tablodan yükle (tüm durumlar)
      const { data: serialData, error: serialError } = await supabase
        .from('seri_numaralari')
        .select('*')
        .order('seri_no')

      if (serialError) {
        console.error('Seri numaraları yükleme hatası:', serialError)
        throw serialError
      }
      setExistingSerialNumbers(serialData || [])
      console.log('Seri numaraları yüklendi:', serialData?.length || 0)
      console.log('Seri numaraları durumları:', serialData?.map(serial => ({ id: serial.id, seri: serial.seri_no, durum: serial.kullanim_durumu })))

      console.log('Tüm dropdown verileri yüklendi')

    } catch (error) {
      console.error('Dropdown verileri yükleme hatası:', error)
      setError(`Kategori verileri yüklenirken hata oluştu: ${error.message}`)
    }
  }

  const fetchEquipmentData = async () => {
    setLoading(true)
    try {
      // Ekipman verisini ve ilişkili MAC/seri bilgilerini al
      // Önce ekipman verisini al
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('ekipman_envanteri')
        .select('*')
        .eq('id', id)
        .single()

      if (equipmentError) throw equipmentError

      // MAC adresi ve seri numarasını ayrı ayrı al
      let macAdresi = ''
      let seriNo = ''

      if (equipmentData.mac_adresi_id) {
        const { data: macData } = await supabase
          .from('mac_adresleri')
          .select('mac_adresi')
          .eq('id', equipmentData.mac_adresi_id)
          .single()
        macAdresi = macData?.mac_adresi || ''
      }

      if (equipmentData.seri_no_id) {
        const { data: serialData } = await supabase
          .from('seri_numaralari')
          .select('seri_no')
          .eq('id', equipmentData.seri_no_id)
          .single()
        seriNo = serialData?.seri_no || ''
      }

      const data = equipmentData

      if (error) throw error

      // MAC adresi ve seri numarasını al
      const macAdresiValue = macAdresi
      const seriNoValue = seriNo

      // Sadece tablo alanlarını al, JOIN edilen verileri hariç tut
      const formEquipmentData = {
        mac_adresi: macAdresiValue,
        marka_id: data.marka_id ? String(data.marka_id) : '',
        model_id: data.model_id ? String(data.model_id) : '',
        lokasyon_id: data.lokasyon_id ? String(data.lokasyon_id) : '',
        seri_no: seriNoValue,
        atanan_personel_id: data.atanan_personel_id ? String(data.atanan_personel_id) : '',
        ofise_giris_tarihi: data.ofise_giris_tarihi ? new Date(data.ofise_giris_tarihi) : null,
        ofisten_cikis_tarihi: data.ofisten_cikis_tarihi ? new Date(data.ofisten_cikis_tarihi) : null,
        aciklama: data.aciklama || '',

      }

      setFormData(formEquipmentData)
      setOriginalData(formEquipmentData)
    } catch (error) {
      console.error('Ekipman verisi yükleme hatası:', error)
      setError('Ekipman verisi yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  // Değişiklikleri karşılaştır ve görüntüle
  const getFieldLabel = (field) => {
    const labels = {
      mac_adresi: 'MAC Adresi',
      marka_id: 'Marka',
      model_id: 'Model',
      lokasyon_id: 'Lokasyon',
      seri_no: 'Seri Numarası',
      
      atanan_personel_id: 'Atanan Personel',
      ofise_giris_tarihi: 'Ofise Giriş Tarihi',
      ofisten_cikis_tarihi: 'Ofisten Çıkış Tarihi',
      aciklama: 'Açıklama',
    }
    return labels[field] || field
  }

  const getDisplayValue = (field, value) => {
    if (!value) return '-'
    
    switch (field) {
      case 'marka_id':
        const marka = brands.find(b => b.id === parseInt(value))
        return marka ? marka.marka_adi : value
      case 'model_id':
        const model = models.find(m => m.id === parseInt(value))
        return model ? model.model_adi : value
      case 'lokasyon_id':
        const lokasyon = locations.find(l => l.id === parseInt(value))
        return lokasyon ? lokasyon.lokasyon_adi : value
      case 'atanan_personel_id':
        const personel = personnel.find(p => p.id === parseInt(value))
        return personel ? `${personel.ad} ${personel.soyad}` : value
      case 'ofise_giris_tarihi':
      case 'ofisten_cikis_tarihi':
        if (value instanceof Date) {
          return value.toLocaleDateString('tr-TR')
        }
        return value
      default:
        return value
    }
  }

  const getChanges = () => {
    if (!originalData || Object.keys(originalData).length === 0) return []
    
    const changes = []
    const fieldsToCheck = [
      'mac_adresi', 'marka_id', 'model_id', 'lokasyon_id', 
              'seri_no', 'atanan_personel_id', 'ofise_giris_tarihi', 
      'ofisten_cikis_tarihi', 'aciklama'
    ]
    
    fieldsToCheck.forEach(field => {
      const originalValue = originalData[field]
      const currentValue = formData[field]
      
      // Tarih alanları için özel karşılaştırma
      if (field.includes('tarihi')) {
        const origDate = originalValue ? new Date(originalValue).toDateString() : null
        const currDate = currentValue ? new Date(currentValue).toDateString() : null
        
        if (origDate !== currDate) {
          changes.push({
            field,
            label: getFieldLabel(field),
            oldValue: getDisplayValue(field, originalValue),
            newValue: getDisplayValue(field, currentValue),
            type: 'date'
          })
        }
      } else {
        // Diğer alanlar için normal karşılaştırma
        const oldVal = originalValue || ''
        const newVal = currentValue || ''
        
        if (String(oldVal) !== String(newVal)) {
          changes.push({
            field,
            label: getFieldLabel(field),
            oldValue: getDisplayValue(field, originalValue),
            newValue: getDisplayValue(field, currentValue),
            type: 'text'
          })
        }
      }
    })
    
    return changes
  }

  const changes = getChanges()

  // Form alanlarını güncelle
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    setError(null)
    setSuccess(null)
  }

  // MAC ve Seri numarası durumlarını güncelle
  const updateMacSerialStatus = async (macAddress, serialNumber, status) => {
    try {
      if (macAddress) {
        await supabase
          .from('mac_adresleri')
          .update({ kullanim_durumu: status })
          .eq('mac_adresi', macAddress)
      }
      
      if (serialNumber) {
        await supabase
          .from('seri_numaralari')
          .update({ kullanim_durumu: status })
          .eq('seri_no', serialNumber)
      }
    } catch (error) {
      console.error('MAC/Seri durum güncelleme hatası:', error)
    }
  }

  // Geçmiş kaydı ekle - Detaylı değişiklik bilgileriyle


  // Form doğrulama
  const validateForm = () => {
    if (!formData.marka_id) {
      setError('Marka seçimi zorunludur.')
      return false
    }
    if (!formData.model_id) {
      setError('Model seçimi zorunludur.')
      return false
    }
    if (!formData.lokasyon_id) {
      setError('Lokasyon seçimi zorunludur.')
      return false
    }
    // MAC adresi opsiyonel - zorunlu değil
    if (!formData.seri_no) {
      setError('Seri numarası seçimi zorunludur.')
      return false
    }
    
    // Seri numarası tablosunun varlığını kontrol et
    // MAC adresi opsiyonel olduğu için kontrole gerek yok
    if (existingSerialNumbers.length === 0) {
      setError('Sistem kurulumunda seri numaraları eklenmesi gerekiyor.')
      return false
    }
    
    return true
  }

  // Form gönder
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSubmitLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Ofise giriş tarihi girilmişse "Ofis" lokasyonunu otomatik ata
      let finalLokasyonId = formData.lokasyon_id ? parseInt(formData.lokasyon_id) : null
      
      if (formData.ofise_giris_tarihi) {
        // "Ofis" lokasyonunu bul veya oluştur
        const { data: officeLocation, error: officeError } = await supabase
          .from('lokasyonlar')
          .select('id')
          .eq('lokasyon_kodu', 'OFIS:1')
          .single()

        if (officeError && officeError.code === 'PGRST116') {
          // "Ofis" lokasyonu yok, oluştur
          const { data: newOfficeLocation, error: createError } = await supabase
            .from('lokasyonlar')
            .insert([{
              lokasyon_kodu: 'OFIS:1',
              lokasyon_adi: 'Ofis',
              lokasyon_tipi: 'OFIS',
              aciklama: 'Ofis içi ekipmanlar'
            }])
            .select('id')
            .single()

          if (createError) {
            console.error('Ofis lokasyonu oluşturma hatası:', createError)
          } else {
            finalLokasyonId = newOfficeLocation.id
          }
        } else if (officeLocation) {
          finalLokasyonId = officeLocation.id
        }
      }

      // MAC adresi ve seri numarası ID'lerini bul
      let macAdresiId = null
      let seriNoId = null

      // MAC adresi ID'sini bul
      if (formData.mac_adresi) {
        const { data: macData, error: macError } = await supabase
          .from('mac_adresleri')
          .select('id')
          .eq('mac_adresi', formData.mac_adresi)
          .single()

        if (macError) {
          console.error('MAC adresi bulunamadı:', macError)
          throw new Error('Seçilen MAC adresi bulunamadı')
        }
        macAdresiId = macData.id
      }

      // Seri numarası ID'sini bul
      if (formData.seri_no) {
        const { data: seriData, error: seriError } = await supabase
          .from('seri_numaralari')
          .select('id')
          .eq('seri_no', formData.seri_no)
          .single()

        if (seriError) {
          console.error('Seri numarası bulunamadı:', seriError)
          throw new Error('Seçilen seri numarası bulunamadı')
        }
        seriNoId = seriData.id
      }

      // Sadece veritabanı alanlarını gönder, JOIN edilen verileri hariç tut
      const submitData = {
        mac_adresi_id: macAdresiId,
        seri_no_id: seriNoId,

        marka_id: formData.marka_id ? parseInt(formData.marka_id) : null,
        model_id: formData.model_id ? parseInt(formData.model_id) : null,
        lokasyon_id: finalLokasyonId,
        atanan_personel_id: formData.atanan_personel_id ? parseInt(formData.atanan_personel_id) : null,
        ofise_giris_tarihi: formData.ofise_giris_tarihi ? 
          formData.ofise_giris_tarihi.toISOString().split('T')[0] : null,
        ofisten_cikis_tarihi: formData.ofisten_cikis_tarihi ? 
          formData.ofisten_cikis_tarihi.toISOString().split('T')[0] : null,
        aciklama: formData.aciklama || null,
      }

      let result
      if (isEditMode) {
        // Güncelleme
        result = await supabase
          .from('ekipman_envanteri')
          .update(submitData)
          .eq('id', id)
          .select()
          .single()
      } else {
        // Yeni kayıt
        result = await supabase
          .from('ekipman_envanteri')
          .insert([submitData])
          .select()
          .single()
      }

      if (result.error) throw result.error

      // MAC ve Seri numarası durumlarını güncelle
      if (macAdresiId) {
        await updateMacSerialStatus(formData.mac_adresi, null, 'KULLANIMDA')
      }
      if (seriNoId) {
        await updateMacSerialStatus(null, formData.seri_no, 'KULLANIMDA')
      }

      // Eğer edit modunda ve MAC/seri numarası değiştiyse eskilerini müsait yap
      if (isEditMode && originalData) {
        if (originalData.mac_adresi !== formData.mac_adresi && originalData.mac_adresi) {
          await updateMacSerialStatus(originalData.mac_adresi, null, 'MUSAIT')
        }
        if (originalData.seri_no !== formData.seri_no && originalData.seri_no) {
          await updateMacSerialStatus(null, originalData.seri_no, 'MUSAIT')
        }
      }



      const successMessage = isEditMode 
        ? 'Ekipman başarıyla güncellendi!' 
        : 'Yeni ekipman başarıyla eklendi!'
      
      setSuccess(successMessage)
      showToast(successMessage, 'success')

      // Form temizle (sadece yeni kayıt modunda)
      if (!isEditMode) {
        clearForm()
      }

      // 2 saniye sonra listeye yönlendir
      setTimeout(() => {
        navigate('/inventory')
      }, 2000)

    } catch (error) {
      console.error('Form gönderme hatası:', error)
      
      if (error.code === '23505') {
        if (error.message.includes('mac_adresi_id')) {
          setError('Bu MAC adresi zaten başka bir ekipmana atanmış. Lütfen farklı bir MAC adresi seçin.')
        } else if (error.message.includes('seri_no_id')) {
          setError('Bu seri numarası zaten başka bir ekipmana atanmış. Lütfen farklı bir seri numarası seçin.')

        } else {
          setError('Bu bilgiler zaten kayıtlı. Lütfen benzersiz değerler seçin.')
        }
      } else {
        setError('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Ekipman verisi yükleniyor...
        </Typography>
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          {isEditMode ? <EditIcon sx={{ mr: 1 }} /> : <AddIcon sx={{ mr: 1 }} />}
          <Typography variant="h4">
            {isEditMode ? 'Kayıt Düzenle' : 'Yeni Kayıt Ekle'}
          </Typography>
          {isEditMode && changes.length > 0 && (
            <Chip 
              icon={<HistoryIcon />}
              label={`${changes.length} değişiklik yapıldı`}
              color="warning"
              variant="outlined"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        <Paper elevation={2} sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}



          {/* Sistem Kurulumu Uyarısı */}
          {(brands.length === 0 || locations.length === 0) && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Önemli:</strong> Ekipman ekleyebilmek için önce sistem kurulumu yapmanız gerekiyor. 
                <br />
                <Button 
                  variant="contained" 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => navigate('/setup')}
                >
                  Sistem Kurulumuna Git
                </Button>
              </Typography>
            </Alert>
          )}



          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Temel Bilgiler */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Temel Bilgiler
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>MAC Adresi (Opsiyonel)</InputLabel>
                  <Select
                    value={formData.mac_adresi || ''}
                    label="MAC Adresi (Opsiyonel)"
                    onChange={(e) => handleChange('mac_adresi', e.target.value)}
                    disabled={existingMacAddresses.filter(mac => mac.kullanim_durumu === 'MUSAIT').length === 0}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>MAC adresi yok / Bilinmiyor</em>
                    </MenuItem>
                    {existingMacAddresses.length === 0 ? (
                      <MenuItem disabled>
                        <em>Sistem kurulumunda MAC adresi eklenmesi gerekli</em>
                      </MenuItem>
                    ) : (
                      existingMacAddresses.map((mac) => (
                        <MenuItem 
                          key={mac.id} 
                          value={mac.mac_adresi}
                          disabled={mac.kullanim_durumu !== 'MUSAIT'}
                        >
                          {mac.mac_adresi} {mac.aciklama && `(${mac.aciklama})`}
                          {mac.kullanim_durumu !== 'MUSAIT' && ` - ${mac.kullanim_durumu}`}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>



              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Seri Numarası *</InputLabel>
                  <Select
                    value={formData.seri_no || ''}
                    label="Seri Numarası *"
                    onChange={(e) => handleChange('seri_no', e.target.value)}
                    disabled={existingSerialNumbers.filter(serial => serial.kullanim_durumu === 'MUSAIT').length === 0}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {existingSerialNumbers.length === 0 ? (
                      <MenuItem disabled>
                        <em>Müsait seri numarası bulunamadı - Sistem kurulumu gerekli</em>
                      </MenuItem>
                    ) : (
                      existingSerialNumbers.map((serial) => (
                        <MenuItem 
                          key={serial.id} 
                          value={serial.seri_no}
                          disabled={serial.kullanim_durumu !== 'MUSAIT'}
                        >
                          {serial.seri_no} {serial.aciklama && `(${serial.aciklama})`}
                          {serial.kullanim_durumu !== 'MUSAIT' && ` - ${serial.kullanim_durumu}`}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Marka</InputLabel>
                  <Select
                    value={formData.marka_id || ''}
                    label="Marka"
                    onChange={(e) => handleChange('marka_id', e.target.value)}
                    disabled={brands.length === 0}
                  >
                    {brands.length === 0 ? (
                      <MenuItem disabled>
                        <em>Marka bulunamadı - Sistem kurulumu gerekli</em>
                      </MenuItem>
                    ) : (
                      brands.map((brand) => (
                        <MenuItem key={brand.id} value={brand.id}>
                          {brand.marka_adi}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={formData.model_id || ''}
                    label="Model"
                    onChange={(e) => handleChange('model_id', e.target.value)}
                    disabled={!formData.marka_id}
                  >
                                            {filteredModels.length === 0 ? (
                          <MenuItem disabled>
                            <em>Önce marka seçin</em>
                          </MenuItem>
                        ) : (
                          filteredModels.map((model) => (
                            <MenuItem key={model.id} value={model.id}>
                              {model.model_adi} ({model.kategori})
                            </MenuItem>
                          ))
                        )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Lokasyon</InputLabel>
                  <Select
                    value={formData.lokasyon_id || ''}
                    label="Lokasyon"
                    onChange={(e) => handleChange('lokasyon_id', e.target.value)}
                    disabled={locations.length === 0}
                  >
                    {locations.length === 0 ? (
                      <MenuItem disabled>
                        <em>Lokasyon bulunamadı - Sistem kurulumu gerekli</em>
                      </MenuItem>
                    ) : (
                      locations.map((location) => (
                        <MenuItem key={location.id} value={location.id}>
                          {location.lokasyon_adi} ({location.lokasyon_kodu})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Atanan Personel (Opsiyonel)</InputLabel>
                  <Select
                    value={formData.atanan_personel_id || ''}
                    label="Atanan Personel (Opsiyonel)"
                    onChange={(e) => handleChange('atanan_personel_id', e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Personel atanmamış</em>
                    </MenuItem>
                    {personnel.map((person) => (
                      <MenuItem key={person.id} value={person.id}>
                        {person.ad} {person.soyad} ({person.sicil_no || person.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Tarih Bilgileri */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Tarih Bilgileri
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Ofisten Çıkış Tarihi"
                  value={formData.ofisten_cikis_tarihi}
                  onChange={(value) => handleChange('ofisten_cikis_tarihi', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Cihazın emanet verildiği tarih",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Ofise Giriş Tarihi"
                  value={formData.ofise_giris_tarihi}
                  onChange={(value) => handleChange('ofise_giris_tarihi', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Cihazın teslim alındığı tarih",
                    },
                  }}
                />
              </Grid>

              {/* Açıklama */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Ek Bilgiler
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Açıklama"
                  value={formData.aciklama}
                  onChange={(e) => handleChange('aciklama', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Ek notlar, özel durumlar vb."
                />
              </Grid>

              {/* Değişiklik Detayları (Sadece edit modunda ve değişiklik varsa) */}
              {isEditMode && changes.length > 0 && (
                <Grid item xs={12}>
                  <Accordion sx={{ mt: 2, mb: 2 }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="changes-content"
                      id="changes-header"
                    >
                      <Box display="flex" alignItems="center">
                        <CompareIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          Değişiklik Detayları
                        </Typography>
                        <Chip 
                          label={`${changes.length} değişiklik`}
                          color="warning"
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Aşağıda yapılan değişikliklerin detayını görebilirsiniz:
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Alan</strong></TableCell>
                              <TableCell><strong>Eski Değer</strong></TableCell>
                              <TableCell><strong>Yeni Değer</strong></TableCell>
                              <TableCell><strong>Durum</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {changes.map((change, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {change.label}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      textDecoration: 'line-through',
                                      color: 'text.secondary',
                                      fontStyle: 'italic'
                                    }}
                                  >
                                    {change.oldValue || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 'bold',
                                      color: 'primary.main'
                                    }}
                                  >
                                    {change.newValue || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label="Değiştirildi"
                                    color="info"
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Not:</strong> Bu değişiklikler "Güncelle" butonuna bastığınızda kaydedilecektir.
                        </Typography>
                      </Alert>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              )}

              {/* Butonlar */}
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => navigate('/inventory')}
                    disabled={submitLoading}
                  >
                    İptal
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    startIcon={submitLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={submitLoading}
                  >
                    {submitLoading ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </LocalizationProvider>
  )
}

export default AddInventory 