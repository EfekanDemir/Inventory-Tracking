import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material'
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

const SetupWizard = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingType, setEditingType] = useState('')
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState(null)
  
  // Kategori popup state'leri
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [currentModelIndex, setCurrentModelIndex] = useState(null)
  const [availableCategories, setAvailableCategories] = useState([
    'Bilgisayar', 'Laptop', 'Tablet', 'Telefon', 'Aksesuar'
  ])

  // Form verileri
  const [departments, setDepartments] = useState([{ departman_adi: '', aciklama: '' }])
  const [locations, setLocations] = useState([{ lokasyon_kodu: '', lokasyon_adi: '', lokasyon_tipi: 'DEPO', departman_id: '' }])
  const [brands, setBrands] = useState([{ marka_adi: '', aciklama: '' }])
  const [models, setModels] = useState([{ 
    model_adi: '', 
    kategori: 'Bilgisayar', 
    marka_id: '',
    seri_numaralari: [{ seri_no: '', aciklama: '' }],
    mac_adresleri: [{ mac_adresi: '', aciklama: '' }]
  }])
  const [personnel, setPersonnel] = useState([{ ad: '', soyad: '', email: '', sicil_no: '', departman_id: '' }])

  // Mevcut veriler
  const [existingDepartments, setExistingDepartments] = useState([])
  const [existingBrands, setExistingBrands] = useState([])
  const [existingModels, setExistingModels] = useState([])
  const [existingLocations, setExistingLocations] = useState([])
  const [existingPersonnel, setExistingPersonnel] = useState([])

  const steps = [
    'Departmanlar',
    'Lokasyonlar', 
    'Markalar',
    'Modeller',
    'Personel'
  ]

  useEffect(() => {
    loadExistingData()
  }, [])

  // Otomatik kod üretimi fonksiyonları
  const generateLocationCode = (locationName, departmentName) => {
    const deptPrefix = departmentName ? departmentName.substring(0, 3).toUpperCase() : 'GEN'
    const locPrefix = locationName ? locationName.substring(0, 3).toUpperCase() : 'LOC'
    const timestamp = Date.now().toString().slice(-4)
    return `${deptPrefix}-${locPrefix}-${timestamp}`
  }

  const generateSicilNo = (firstName, lastName) => {
    const namePrefix = firstName ? firstName.substring(0, 2).toUpperCase() : 'XX'
    const surnamePrefix = lastName ? lastName.substring(0, 2).toUpperCase() : 'XX'
    const timestamp = Date.now().toString().slice(-6)
    return `${namePrefix}${surnamePrefix}${timestamp}`
  }

  const loadExistingData = async () => {
    try {
      console.log('SetupWizard: Mevcut veriler yükleniyor...')
      
      // Mevcut departmanları yükle
      const { data: deptData, error: deptError } = await supabase
        .from('departmanlar')
        .select('*')
        .order('departman_adi')
      
      if (deptError) {
        console.error('Departmanlar yükleme hatası:', deptError)
      }
      setExistingDepartments(deptData || [])
      console.log('Departmanlar yüklendi:', deptData?.length || 0)

      // Mevcut markaları yükle
      const { data: brandData } = await supabase
        .from('markalar')
        .select('*')
        .order('marka_adi')
      setExistingBrands(brandData || [])

      // Mevcut modelleri yükle
      const { data: modelData } = await supabase
        .from('modeller')
        .select(`
          *,
          markalar!inner(marka_adi)
        `)
        .order('model_adi')
      setExistingModels(modelData || [])

      // Mevcut lokasyonları yükle
      const { data: locationData } = await supabase
        .from('lokasyonlar')
        .select(`
          *,
          departmanlar!inner(departman_adi)
        `)
        .order('lokasyon_adi')
      setExistingLocations(locationData || [])

      // Mevcut personeli yükle
      const { data: personnelData, error: personnelError } = await supabase
        .from('personel')
        .select(`
          *,
          departmanlar!inner(departman_adi)
        `)
        .order('ad')
        
      if (personnelError) {
        console.error('Personel yükleme hatası:', personnelError)
      }
      setExistingPersonnel(personnelData || [])
      console.log('Personel yüklendi:', personnelData?.length || 0)

      // Tamamlanan adımları işaretle
      const completed = new Set()
      if (deptData && deptData.length > 0) completed.add(0)
      if (locationData && locationData.length > 0) completed.add(1)
      if (brandData && brandData.length > 0) completed.add(2)
      if (modelData && modelData.length > 0) completed.add(3)
      if (personnelData && personnelData.length > 0) completed.add(4)
      setCompletedSteps(completed)
    } catch (error) {
      console.error('Mevcut veriler yüklenirken hata:', error)
    }
  }

  // Departman işlemleri
  const addDepartment = () => {
    setDepartments([...departments, { departman_adi: '', aciklama: '' }])
  }

  const removeDepartment = (index) => {
    if (departments.length > 1) {
      setDepartments(departments.filter((_, i) => i !== index))
    }
  }

  const updateDepartment = (index, field, value) => {
    const updated = [...departments]
    updated[index][field] = value
    setDepartments(updated)
  }

  // Lokasyon işlemleri
  const addLocation = () => {
    setLocations([...locations, { lokasyon_kodu: '', lokasyon_adi: '', lokasyon_tipi: 'DEPO', departman_id: '' }])
  }

  const removeLocation = (index) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index))
    }
  }

  const updateLocation = (index, field, value) => {
    const updated = [...locations]
    updated[index][field] = value
    
    // Lokasyon adı veya departman değiştiğinde otomatik kod üret
    if (field === 'lokasyon_adi' || field === 'departman_id') {
      const location = updated[index]
      if (location.lokasyon_adi && location.departman_id) {
        const department = existingDepartments.find(d => d.id === location.departman_id)
        location.lokasyon_kodu = generateLocationCode(location.lokasyon_adi, department?.departman_adi)
      }
    }
    
    setLocations(updated)
  }

  // Marka işlemleri
  const addBrand = () => {
    setBrands([...brands, { marka_adi: '', aciklama: '' }])
  }

  const removeBrand = (index) => {
    if (brands.length > 1) {
      setBrands(brands.filter((_, i) => i !== index))
    }
  }

  const updateBrand = (index, field, value) => {
    const updated = [...brands]
    updated[index][field] = value
    setBrands(updated)
  }

  // Model işlemleri
  const addModel = () => {
    setModels([...models, { 
      model_adi: '', 
      kategori: 'Bilgisayar', 
      marka_id: '',
      seri_numaralari: [{ seri_no: '', aciklama: '' }],
      mac_adresleri: [{ mac_adresi: '', aciklama: '' }]
    }])
  }

  const removeModel = (index) => {
    if (models.length > 1) {
      setModels(models.filter((_, i) => i !== index))
    }
  }

  const updateModel = (index, field, value) => {
    const updated = [...models]
    updated[index][field] = value
    setModels(updated)
  }

  // Model için seri numarası ekleme
  const addSerialNumberToModel = (modelIndex) => {
    const updatedModels = [...models]
    updatedModels[modelIndex].seri_numaralari.push({ seri_no: '', aciklama: '' })
    setModels(updatedModels)
  }

  // Model için seri numarası silme
  const removeSerialNumberFromModel = (modelIndex, serialIndex) => {
    const updatedModels = [...models]
    updatedModels[modelIndex].seri_numaralari.splice(serialIndex, 1)
    setModels(updatedModels)
  }

  // Model için seri numarası güncelleme
  const updateSerialNumberInModel = (modelIndex, serialIndex, field, value) => {
    const updatedModels = [...models]
    updatedModels[modelIndex].seri_numaralari[serialIndex][field] = value
    setModels(updatedModels)
  }

  // Model için MAC adresi ekleme
  const addMacAddressToModel = (modelIndex) => {
    const updatedModels = [...models]
    updatedModels[modelIndex].mac_adresleri.push({ mac_adresi: '', aciklama: '' })
    setModels(updatedModels)
  }

  // Model için MAC adresi silme
  const removeMacAddressFromModel = (modelIndex, macIndex) => {
    const updatedModels = [...models]
    updatedModels[modelIndex].mac_adresleri.splice(macIndex, 1)
    setModels(updatedModels)
  }

  // Model için MAC adresi güncelleme
  const updateMacAddressInModel = (modelIndex, macIndex, field, value) => {
    const updatedModels = [...models]
    updatedModels[modelIndex].mac_adresleri[macIndex][field] = value
    setModels(updatedModels)
  }

  // Personel işlemleri
  const addPersonnel = () => {
    setPersonnel([...personnel, { ad: '', soyad: '', email: '', sicil_no: '', departman_id: '' }])
  }

  const removePersonnel = (index) => {
    if (personnel.length > 1) {
      setPersonnel(personnel.filter((_, i) => i !== index))
    }
  }

  const updatePersonnel = (index, field, value) => {
    const updated = [...personnel]
    updated[index][field] = value
    
    // Ad veya soyad değiştiğinde otomatik sicil no üret
    if (field === 'ad' || field === 'soyad') {
      const person = updated[index]
      if (person.ad && person.soyad) {
        person.sicil_no = generateSicilNo(person.ad, person.soyad)
      }
    }
    
    setPersonnel(updated)
  }



  // Mevcut veri silme işlemleri
  const openDeleteDialog = (type, item) => {
    setDeleteItem({ type, id: item.id, name: item[getDisplayField(type)] })
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setDeleteItem(null)
  }

  const getDisplayField = (type) => {
    switch (type) {
      case 'departmanlar': return 'departman_adi'
      case 'lokasyonlar': return 'lokasyon_adi'
      case 'markalar': return 'marka_adi'
      case 'modeller': return 'model_adi'
      case 'personel': return 'ad'
      default: return 'id'
    }
  }

  const deleteExistingItem = async () => {
    if (!deleteItem) return
    
    setLoading(true)
    setError('')
    
    try {
      console.log(`Silme işlemi başlatılıyor: ${deleteItem.type}, ID: ${deleteItem.id}`)
      
      // Model silme işlemi için özel kontrol
      if (deleteItem.type === 'modeller') {
        // Önce bu modeli kullanan ekipmanları kontrol et
        const { data: equipmentUsingModel, error: checkError } = await supabase
          .from('ekipman_envanteri')
          .select('id, marka_model')
          .eq('model_id', deleteItem.id)
        
        if (checkError) {
          console.error('Model kullanım kontrolü hatası:', checkError)
          throw checkError
        }
        
        if (equipmentUsingModel && equipmentUsingModel.length > 0) {
          const errorMessage = `Bu model ${equipmentUsingModel.length} ekipman tarafından kullanılıyor. Önce bu ekipmanları silmelisiniz.`
          setError(errorMessage)
          toast.error(errorMessage)
          return
        }
        
        // Modeli kullanan seri numaralarını sil
        const { error: serialError } = await supabase
          .from('seri_numaralari')
          .delete()
          .eq('model_id', deleteItem.id)
        
        if (serialError) {
          console.error('Seri numarası silme hatası:', serialError)
          throw serialError
        }
        
        // Modeli kullanan MAC adreslerini sil
        const { error: macError } = await supabase
          .from('mac_adresleri')
          .delete()
          .eq('model_id', deleteItem.id)
        
        if (macError) {
          console.error('MAC adresi silme hatası:', macError)
          throw macError
        }
      }
      
      // Ana kaydı sil
      const { data, error } = await supabase
        .from(deleteItem.type)
        .delete()
        .eq('id', deleteItem.id)
        .select()
      
      console.log('Silme sonucu:', { data, error })
      
      if (error) {
        console.error('Supabase silme hatası:', error)
        throw error
      }
      
      toast.success(`${deleteItem.type} başarıyla silindi!`)
      await loadExistingData()
      closeDeleteDialog()
      
    } catch (error) {
      console.error(`${deleteItem.type} silme hatası:`, error)
      
      // Kullanıcı dostu hata mesajları
      let userFriendlyMessage = error.message
      
      if (error.code === '23503') {
        if (error.message.includes('ekipman_envanteri')) {
          userFriendlyMessage = 'Bu kayıt ekipman envanterinde kullanılıyor. Önce ekipmanları silmelisiniz.'
        } else if (error.message.includes('envanter_hareketleri')) {
          userFriendlyMessage = 'Bu kayıt hareket geçmişinde kullanılıyor. Önce hareket geçmişini silmelisiniz.'
        } else {
          userFriendlyMessage = 'Bu kayıt başka bir tabloda kullanılıyor. Önce bağımlı kayıtları silmelisiniz.'
        }
      }
      
      setError(`${deleteItem.type} silme hatası: ${userFriendlyMessage}`)
      toast.error(`Silme hatası: ${userFriendlyMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Düzenleme işlemleri
  const openEditDialog = (type, item) => {
    setEditingType(type)
    setEditingItem({ ...item })
    setEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setEditDialogOpen(false)
    setEditingItem(null)
    setEditingType('')
  }

  const saveEdit = async () => {
    setLoading(true)
    setError('')
    
    try {
      console.log(`Güncelleme işlemi başlatılıyor: ${editingType}`, editingItem)
      
      const { data, error } = await supabase
        .from(editingType)
        .update(editingItem)
        .eq('id', editingItem.id)
        .select()
      
      console.log('Güncelleme sonucu:', { data, error })
      
      if (error) {
        console.error('Supabase güncelleme hatası:', error)
        throw error
      }
      
      toast.success(`${editingType} başarıyla güncellendi!`)
      await loadExistingData()
      closeEditDialog()
      
    } catch (error) {
      console.error(`${editingType} güncelleme hatası:`, error)
      setError(`${editingType} güncelleme hatası: ${error.message}`)
      toast.error(`Güncelleme hatası: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Adım validasyonu
  const validateStep = (step) => {
    switch (step) {
      case 0: // Departmanlar
        return departments.every(dept => dept.departman_adi.trim() !== '')
      case 1: // Lokasyonlar
        return locations.every(loc => 
          loc.lokasyon_kodu.trim() !== '' && 
          loc.lokasyon_adi.trim() !== '' && 
          loc.departman_id !== ''
        )
      case 2: // Markalar
        return brands.every(brand => brand.marka_adi.trim() !== '')
      case 3: // Modeller
        return models.every(model => 
          model.model_adi.trim() !== '' && 
          model.marka_id !== '' &&
          model.seri_numaralari.length > 0 &&
          model.seri_numaralari.every(serial => serial.seri_no.trim() !== '')
        )
      case 4: // Personel
        return personnel.every(person => 
          person.ad.trim() !== '' && 
          person.soyad.trim() !== '' && 
          person.email.trim() !== '' &&
          person.departman_id !== ''
        )
      default:
        return true
    }
  }

  // Adım kaydetme
  const saveStep = async (step) => {
    setLoading(true)
    setError('')
    
    try {
      switch (step) {
        case 0: { // Departmanlar
          const validDepartments = departments.filter(dept => dept.departman_adi.trim() !== '')
          if (validDepartments.length === 0) {
            throw new Error('En az bir departman eklenmelidir.')
          }
          
          const { error: deptError } = await supabase
            .from('departmanlar')
            .insert(validDepartments)
          
          if (deptError) throw deptError
          await loadExistingData()
          break
        }

        case 1: { // Lokasyonlar
          const validLocations = locations.filter(loc => 
            loc.lokasyon_kodu.trim() !== '' && 
            loc.lokasyon_adi.trim() !== '' && 
            loc.departman_id !== ''
          )
          if (validLocations.length === 0) {
            throw new Error('En az bir lokasyon eklenmelidir.')
          }
          
          const { error: locError } = await supabase
            .from('lokasyonlar')
            .insert(validLocations)
          
          if (locError) throw locError
          await loadExistingData()
          break
        }

        case 2: { // Markalar
          const validBrands = brands.filter(brand => brand.marka_adi.trim() !== '')
          if (validBrands.length === 0) {
            throw new Error('En az bir marka eklenmelidir.')
          }
          
          const { error: brandError } = await supabase
            .from('markalar')
            .insert(validBrands)
          
          if (brandError) throw brandError
          await loadExistingData()
          break
        }

        case 3: { // Modeller
          const validModels = models.filter(model => 
            model.model_adi.trim() !== '' && 
            model.marka_id !== '' &&
            model.seri_numaralari.length > 0 &&
            model.seri_numaralari.every(serial => serial.seri_no.trim() !== '')
          )
          if (validModels.length === 0) {
            throw new Error('En az bir model eklenmelidir.')
          }
          
          // Modelleri kaydet
          const { error: modelError } = await supabase
            .from('modeller')
            .insert(validModels)
          
          if (modelError) throw modelError
          
          // Kaydedilen modelleri al (ID'leri için)
          const { data: savedModels, error: savedModelsError } = await supabase
            .from('modeller')
            .select('id, model_adi')
            .in('model_adi', validModels.map(m => m.model_adi))
          
          if (savedModelsError) throw savedModelsError
          
          // Her model için seri numaralarını ve MAC adreslerini kaydet
          for (const model of validModels) {
            const savedModel = savedModels.find(m => m.model_adi === model.model_adi)
            if (!savedModel) continue
            
            // Seri numaralarını kaydet
            const validSerials = model.seri_numaralari.filter(serial => serial.seri_no.trim() !== '')
            if (validSerials.length > 0) {
              const serialsWithModelId = validSerials.map(serial => ({
                ...serial,
                model_id: savedModel.id
              }))
              
              const { error: serialError } = await supabase
                .from('seri_numaralari')
                .insert(serialsWithModelId)
              
              if (serialError) throw serialError
            }
            
            // MAC adreslerini kaydet (opsiyonel)
            const validMacs = model.mac_adresleri.filter(mac => mac.mac_adresi.trim() !== '')
            if (validMacs.length > 0) {
              const macsWithModelId = validMacs.map(mac => ({
                ...mac,
                model_id: savedModel.id
              }))
              
              const { error: macError } = await supabase
                .from('mac_adresleri')
                .insert(macsWithModelId)
              
              if (macError) throw macError
            }
          }
          
          await loadExistingData()
          break
        }

        case 4: { // Personel
          const validPersonnel = personnel.filter(person => 
            person.ad.trim() !== '' && 
            person.soyad.trim() !== '' && 
            person.email.trim() !== '' &&
            person.departman_id !== ''
          )
          if (validPersonnel.length === 0) {
            throw new Error('En az bir personel eklenmelidir.')
          }
          
          const { error: personnelError } = await supabase
            .from('personel')
            .insert(validPersonnel)
          
          if (personnelError) throw personnelError
          await loadExistingData()
          break
        }
      }
      
      setSuccess(`${steps[step]} başarıyla kaydedildi!`)
      setTimeout(() => setSuccess(''), 3000)
      
      // Adımı tamamlandı olarak işaretle
      setCompletedSteps(prev => new Set([...prev, step]))
      
    } catch (error) {
      console.error(`${steps[step]} kaydetme hatası:`, error)
      setError(`${steps[step]} kaydetme hatası: ${error.message}`)
      // Hata durumunda otomatik geçiş yapma
      return false
    } finally {
      setLoading(false)
    }
    return true
  }

  const handleNext = () => {
    // Sadece bir sonraki adıma geç, kaydetme zorunlu değil
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1)
      setError('')
      setSuccess('')
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
      setError('')
      setSuccess('')
    }
  }

  const handleStepClick = (stepIndex) => {
    // Herhangi bir adıma tıklayarak geçiş yapabilme
    setActiveStep(stepIndex)
    setError('')
    setSuccess('')
  }

  const handleSaveCurrentStep = async () => {
    // Mevcut adımı kaydetme butonu
    if (validateStep(activeStep)) {
      const success = await saveStep(activeStep)
      if (success) {
        toast.success(`${steps[activeStep]} başarıyla kaydedildi!`)
      }
    } else {
      setError('Lütfen tüm zorunlu alanları doldurun.')
    }
  }

  const completeSetup = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Son adımı kaydet (opsiyonel)
      if (validateStep(activeStep)) {
        const success = await saveStep(activeStep)
        if (!success) {
          // Hata durumunda da devam et, sadece uyarı ver
          console.warn('Son adım kaydedilemedi, kurulum devam ediyor...')
        }
      }
      
      // Sistem ayarlarını otomatik olarak ekle
      const defaultSettings = [
        { kategori: 'uygulama', ayar_anahtari: 'app_name', ayar_degeri: 'Envanter Takip Sistemi', data_tipi: 'string', aciklama: 'Uygulama adı', is_public: true },
        { kategori: 'ozellikler', ayar_anahtari: 'qr_code_enabled', ayar_degeri: true, data_tipi: 'boolean', aciklama: 'QR kod özelliği aktif mi?', is_public: false },
        { kategori: 'ozellikler', ayar_anahtari: 'excel_export_enabled', ayar_degeri: true, data_tipi: 'boolean', aciklama: 'Excel export aktif mi?', is_public: false }
      ]
      
      const { error: settingsError } = await supabase
        .from('sistem_ayarlari')
        .insert(defaultSettings)
      
      if (settingsError) {
        console.warn('Sistem ayarları eklenirken hata:', settingsError)
      }
      
      // Kurulum tamamlandı
      setSuccess('Sistem kurulumu başarıyla tamamlandı!')
      toast.success('Sistem kurulumu tamamlandı!')
      
      // Ana sayfaya yönlendir
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
      
    } catch (error) {
      console.error('Kurulum tamamlama hatası:', error)
      setError(`Kurulum tamamlama hatası: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const renderExistingDataTable = (type, data, columns) => {
    if (data.length === 0) return null

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Mevcut {type}
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.field}>{col.header}</TableCell>
                ))}
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((col) => (
                      <TableCell key={col.field}>
                        {col.render ? col.render(item) : item[col.field]}
                      </TableCell>
                    ))}
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          console.log('Düzenleme tıklandı:', type, item)
                          openEditDialog(type, item)
                        }}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          console.log('Silme tıklandı:', type, item)
                          openDeleteDialog(type, item)
                        }}
                        color="error"
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                                      </TableRow>
                  ))}
              </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Departmanlar
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Departman Bilgileri
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sistem için gerekli departmanları ekleyin. En az bir departman zorunludur.
            </Typography>
            
            {renderExistingDataTable('departmanlar', existingDepartments, [
              { field: 'departman_adi', header: 'Departman Adı' },
              { field: 'aciklama', header: 'Açıklama' }
            ])}
            
            {departments.map((dept, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Departman Adı *"
                      value={dept.departman_adi}
                      onChange={(e) => updateDepartment(index, 'departman_adi', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={dept.aciklama}
                      onChange={(e) => updateDepartment(index, 'aciklama', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <IconButton 
                      onClick={() => removeDepartment(index)}
                      disabled={departments.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={addDepartment}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Departman Ekle
            </Button>
          </Box>
        )

      case 1: // Lokasyonlar
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Lokasyon Bilgileri
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Departmanlara bağlı lokasyonları ekleyin. Lokasyon kodu otomatik olarak üretilir.
            </Typography>
            
            {renderExistingDataTable('lokasyonlar', existingLocations, [
              { field: 'lokasyon_kodu', header: 'Lokasyon Kodu' },
              { field: 'lokasyon_adi', header: 'Lokasyon Adı' },
              { field: 'lokasyon_tipi', header: 'Tip' },
              { 
                field: 'departmanlar', 
                header: 'Departman',
                render: (item) => item.departmanlar?.departman_adi || 'Bilinmiyor'
              }
            ])}
            
            {locations.map((loc, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Lokasyon Kodu *"
                      value={loc.lokasyon_kodu}
                      onChange={(e) => updateLocation(index, 'lokasyon_kodu', e.target.value)}
                      required
                      helperText="Otomatik üretilir"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Lokasyon Adı *"
                      value={loc.lokasyon_adi}
                      onChange={(e) => updateLocation(index, 'lokasyon_adi', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth required>
                      <InputLabel>Lokasyon Tipi</InputLabel>
                      <Select
                        value={loc.lokasyon_tipi}
                        label="Lokasyon Tipi"
                        onChange={(e) => updateLocation(index, 'lokasyon_tipi', e.target.value)}
                      >
                        <MenuItem value="DEPO">Depo</MenuItem>
                        <MenuItem value="KULLANICI">Kullanıcı</MenuItem>
                        <MenuItem value="EGITIM">Eğitim</MenuItem>
                        <MenuItem value="BAKIM">Bakım</MenuItem>
                        <MenuItem value="HURDA">Hurda</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth required>
                      <InputLabel>Departman *</InputLabel>
                      <Select
                        value={loc.departman_id}
                        label="Departman *"
                        onChange={(e) => updateLocation(index, 'departman_id', e.target.value)}
                      >
                        {existingDepartments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.departman_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <IconButton 
                      onClick={() => removeLocation(index)}
                      disabled={locations.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={addLocation}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Lokasyon Ekle
            </Button>
          </Box>
        )

      case 2: // Markalar
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Marka Bilgileri
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ekipman markalarını ekleyin. En az bir marka zorunludur.
            </Typography>
            
            {renderExistingDataTable('markalar', existingBrands, [
              { field: 'marka_adi', header: 'Marka Adı' },
              { field: 'aciklama', header: 'Açıklama' }
            ])}
            
            {brands.map((brand, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Marka Adı *"
                      value={brand.marka_adi}
                      onChange={(e) => updateBrand(index, 'marka_adi', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={brand.aciklama}
                      onChange={(e) => updateBrand(index, 'aciklama', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <IconButton 
                      onClick={() => removeBrand(index)}
                      disabled={brands.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={addBrand}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Marka Ekle
            </Button>
          </Box>
        )

      case 3: // Modeller
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Model Bilgileri
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Markalara bağlı modelleri ekleyin. Her model için en az bir seri numarası zorunludur. MAC adresleri opsiyoneldir.
            </Typography>
            
            {renderExistingDataTable('modeller', existingModels, [
              { field: 'model_adi', header: 'Model Adı' },
              { field: 'kategori', header: 'Kategori' },
              { 
                field: 'markalar', 
                header: 'Marka',
                render: (item) => item.markalar?.marka_adi || 'Bilinmiyor'
              },
              { 
                field: 'seri_count', 
                header: 'Seri Numaraları',
                render: () => {
                  // Bu kısım daha sonra veritabanından seri numarası sayısını alacak
                  return 'Yükleniyor...'
                }
              },
              { 
                field: 'mac_count', 
                header: 'MAC Adresleri',
                render: () => {
                  // Bu kısım daha sonra veritabanından MAC adresi sayısını alacak
                  return 'Yükleniyor...'
                }
              }
            ])}
            
            {models.map((model, index) => (
              <Paper key={index} sx={{ p: 3, mb: 3 }}>
                {/* Model Ana Bilgileri */}
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Model {index + 1}
                </Typography>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Model Adı *"
                      value={model.model_adi}
                      onChange={(e) => updateModel(index, 'model_adi', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth required>
                      <InputLabel>Kategori</InputLabel>
                      <Select
                        value={model.kategori}
                        label="Kategori"
                        onChange={(e) => {
                          if (e.target.value === 'OTHER_NEW') {
                            setCurrentModelIndex(index)
                            setCategoryDialogOpen(true)
                          } else {
                            updateModel(index, 'kategori', e.target.value)
                          }
                        }}
                      >
                        {availableCategories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                        <MenuItem value="OTHER_NEW">+ Yeni Kategori Ekle</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Marka *</InputLabel>
                      <Select
                        value={model.marka_id}
                        label="Marka *"
                        onChange={(e) => updateModel(index, 'marka_id', e.target.value)}
                      >
                        {existingBrands.map((brand) => (
                          <MenuItem key={brand.id} value={brand.id}>
                            {brand.marka_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton 
                      onClick={() => removeModel(index)}
                      disabled={models.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Seri Numaraları Bölümü */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Seri Numaraları *</span>
                    <Chip label={`${model.seri_numaralari.length} adet`} size="small" color="primary" />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Bu model için en az bir seri numarası zorunludur.
                  </Typography>
                  
                  {model.seri_numaralari.map((serial, serialIndex) => (
                    <Paper key={serialIndex} sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                          <TextField
                            fullWidth
                            label="Seri Numarası *"
                            value={serial.seri_no}
                            onChange={(e) => updateSerialNumberInModel(index, serialIndex, 'seri_no', e.target.value)}
                            required
                            placeholder="SN123456789"
                          />
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <TextField
                            fullWidth
                            label="Açıklama"
                            value={serial.aciklama}
                            onChange={(e) => updateSerialNumberInModel(index, serialIndex, 'aciklama', e.target.value)}
                            placeholder="İsteğe bağlı açıklama"
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <IconButton 
                            onClick={() => removeSerialNumberFromModel(index, serialIndex)}
                            disabled={model.seri_numaralari.length === 1}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => addSerialNumberToModel(index)}
                    variant="outlined"
                    size="small"
                  >
                    Seri Numarası Ekle
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* MAC Adresleri Bölümü */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>MAC Adresleri</span>
                    <Chip label={`${model.mac_adresleri.length} adet`} size="small" color="secondary" />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    MAC adresleri opsiyoneldir, gerekirse ekleyebilirsiniz.
                  </Typography>
                  
                  {model.mac_adresleri.map((mac, macIndex) => (
                    <Paper key={macIndex} sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                          <TextField
                            fullWidth
                            label="MAC Adresi"
                            value={mac.mac_adresi}
                            onChange={(e) => updateMacAddressInModel(index, macIndex, 'mac_adresi', e.target.value)}
                            placeholder="00:11:22:33:44:55"
                          />
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <TextField
                            fullWidth
                            label="Açıklama"
                            value={mac.aciklama}
                            onChange={(e) => updateMacAddressInModel(index, macIndex, 'aciklama', e.target.value)}
                            placeholder="İsteğe bağlı açıklama"
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <IconButton 
                            onClick={() => removeMacAddressFromModel(index, macIndex)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => addMacAddressToModel(index)}
                    variant="outlined"
                    size="small"
                  >
                    MAC Adresi Ekle
                  </Button>
                </Box>
              </Paper>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={addModel}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Model Ekle
            </Button>
          </Box>
        )

      case 4: // Personel
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Personel Bilgileri
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Departmanlara atanacak personelleri ekleyin. Sicil no otomatik olarak üretilir.
            </Typography>
            
            {existingPersonnel.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Henüz kayıtlı personel bulunmuyor. Aşağıdan yeni personel ekleyebilirsiniz.
              </Alert>
            )}
            
            {renderExistingDataTable('personel', existingPersonnel, [
              { field: 'ad', header: 'Ad' },
              { field: 'soyad', header: 'Soyad' },
              { field: 'email', header: 'E-posta' },
              { field: 'sicil_no', header: 'Sicil No' },
              { 
                field: 'departmanlar', 
                header: 'Departman',
                render: (item) => item.departmanlar?.departman_adi || 'Bilinmiyor'
              }
            ])}
            
            {personnel.map((person, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Ad *"
                      value={person.ad}
                      onChange={(e) => updatePersonnel(index, 'ad', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Soyad *"
                      value={person.soyad}
                      onChange={(e) => updatePersonnel(index, 'soyad', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="E-posta *"
                      value={person.email}
                      onChange={(e) => updatePersonnel(index, 'email', e.target.value)}
                      type="email"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Sicil No"
                      value={person.sicil_no}
                      onChange={(e) => updatePersonnel(index, 'sicil_no', e.target.value)}
                      helperText="Otomatik üretilir"
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth required>
                      <InputLabel>Departman *</InputLabel>
                      <Select
                        value={person.departman_id}
                        label="Departman *"
                        onChange={(e) => updatePersonnel(index, 'departman_id', e.target.value)}
                      >
                        {existingDepartments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.departman_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton 
                      onClick={() => removePersonnel(index)}
                      disabled={personnel.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={addPersonnel}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Personel Ekle
            </Button>
          </Box>
        )



      default:
        return null
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Sistem Kurulum Sihirbazı
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Envanter takip sistemini kullanmaya başlamak için gerekli temel bilgileri yapılandırın.
      </Typography>

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

      <Paper elevation={2} sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={completedSteps.has(index)}>
              <StepLabel 
                onClick={() => handleStepClick(index)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ mb: 3 }} />

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Geri
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Kaydet Butonu */}
            <Button
              variant="outlined"
              onClick={handleSaveCurrentStep}
              disabled={loading || !validateStep(activeStep)}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            
            {/* İleri/Tamamla Butonu */}
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={completeSetup}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Tamamlanıyor...' : 'Kurulumu Tamamla'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                İleri
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Düzenleme Dialog'u */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingType} Düzenle
        </DialogTitle>
        <DialogContent>
          {editingItem && (
            <Box sx={{ pt: 2 }}>
              {editingType === 'departmanlar' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Departman Adı"
                      value={editingItem.departman_adi || ''}
                      onChange={(e) => setEditingItem({...editingItem, departman_adi: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={editingItem.aciklama || ''}
                      onChange={(e) => setEditingItem({...editingItem, aciklama: e.target.value})}
                    />
                  </Grid>
                </Grid>
              )}
              
              {editingType === 'lokasyonlar' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Lokasyon Kodu"
                      value={editingItem.lokasyon_kodu || ''}
                      onChange={(e) => setEditingItem({...editingItem, lokasyon_kodu: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Lokasyon Adı"
                      value={editingItem.lokasyon_adi || ''}
                      onChange={(e) => setEditingItem({...editingItem, lokasyon_adi: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Lokasyon Tipi</InputLabel>
                      <Select
                        value={editingItem.lokasyon_tipi || 'DEPO'}
                        label="Lokasyon Tipi"
                        onChange={(e) => setEditingItem({...editingItem, lokasyon_tipi: e.target.value})}
                      >
                        <MenuItem value="DEPO">Depo</MenuItem>
                        <MenuItem value="KULLANICI">Kullanıcı</MenuItem>
                        <MenuItem value="EGITIM">Eğitim</MenuItem>
                        <MenuItem value="BAKIM">Bakım</MenuItem>
                        <MenuItem value="HURDA">Hurda</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Departman</InputLabel>
                      <Select
                        value={editingItem.departman_id || ''}
                        label="Departman"
                        onChange={(e) => setEditingItem({...editingItem, departman_id: e.target.value})}
                      >
                        {existingDepartments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.departman_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
              
              {editingType === 'markalar' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Marka Adı"
                      value={editingItem.marka_adi || ''}
                      onChange={(e) => setEditingItem({...editingItem, marka_adi: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={editingItem.aciklama || ''}
                      onChange={(e) => setEditingItem({...editingItem, aciklama: e.target.value})}
                    />
                  </Grid>
                </Grid>
              )}
              
              {editingType === 'modeller' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Model Adı"
                      value={editingItem.model_adi || ''}
                      onChange={(e) => setEditingItem({...editingItem, model_adi: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Kategori</InputLabel>
                      <Select
                        value={editingItem.kategori || 'Bilgisayar'}
                        label="Kategori"
                        onChange={(e) => setEditingItem({...editingItem, kategori: e.target.value})}
                      >
                        <MenuItem value="Bilgisayar">Bilgisayar</MenuItem>
                        <MenuItem value="Laptop">Laptop</MenuItem>
                        <MenuItem value="Tablet">Tablet</MenuItem>
                        <MenuItem value="Telefon">Telefon</MenuItem>
                        <MenuItem value="Aksesuar">Aksesuar</MenuItem>
                        <MenuItem value="Diğer">Diğer</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Marka</InputLabel>
                      <Select
                        value={editingItem.marka_id || ''}
                        label="Marka"
                        onChange={(e) => setEditingItem({...editingItem, marka_id: e.target.value})}
                      >
                        {existingBrands.map((brand) => (
                          <MenuItem key={brand.id} value={brand.id}>
                            {brand.marka_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
              
              {editingType === 'personel' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Ad"
                      value={editingItem.ad || ''}
                      onChange={(e) => setEditingItem({...editingItem, ad: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Soyad"
                      value={editingItem.soyad || ''}
                      onChange={(e) => setEditingItem({...editingItem, soyad: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="E-posta"
                      value={editingItem.email || ''}
                      onChange={(e) => setEditingItem({...editingItem, email: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Sicil No"
                      value={editingItem.sicil_no || ''}
                      onChange={(e) => setEditingItem({...editingItem, sicil_no: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Departman</InputLabel>
                      <Select
                        value={editingItem.departman_id || ''}
                        label="Departman"
                        onChange={(e) => setEditingItem({...editingItem, departman_id: e.target.value})}
                      >
                        {existingDepartments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.departman_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
              
              {editingType === 'mac_adresleri' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="MAC Adresi"
                      value={editingItem.mac_adresi || ''}
                      onChange={(e) => setEditingItem({...editingItem, mac_adresi: e.target.value})}
                      placeholder="00:1B:44:11:3A:B7"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={editingItem.aciklama || ''}
                      onChange={(e) => setEditingItem({...editingItem, aciklama: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Kullanım Durumu</InputLabel>
                      <Select
                        value={editingItem.kullanim_durumu || 'MUSAIT'}
                        label="Kullanım Durumu"
                        onChange={(e) => setEditingItem({...editingItem, kullanim_durumu: e.target.value})}
                      >
                        <MenuItem value="MUSAIT">Müsait</MenuItem>
                        <MenuItem value="KULLANILIYOR">Kullanılıyor</MenuItem>
                        <MenuItem value="REZERVE">Rezerve</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
              
              {editingType === 'seri_numaralari' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Seri Numarası"
                      value={editingItem.seri_no || ''}
                      onChange={(e) => setEditingItem({...editingItem, seri_no: e.target.value})}
                      placeholder="SN123456789"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={editingItem.aciklama || ''}
                      onChange={(e) => setEditingItem({...editingItem, aciklama: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Kullanım Durumu</InputLabel>
                      <Select
                        value={editingItem.kullanim_durumu || 'MUSAIT'}
                        label="Kullanım Durumu"
                        onChange={(e) => setEditingItem({...editingItem, kullanim_durumu: e.target.value})}
                      >
                        <MenuItem value="MUSAIT">Müsait</MenuItem>
                        <MenuItem value="KULLANILIYOR">Kullanılıyor</MenuItem>
                        <MenuItem value="REZERVE">Rezerve</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>İptal</Button>
          <Button 
            onClick={saveEdit} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Yeni Kategori Ekleme Dialog'u */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Yeni Kategori Ekle
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Listede bulunmayan yeni bir kategori ekleyin. Bu kategori daha sonra diğer modeller için de kullanılabilir.
          </Typography>
          <TextField
            fullWidth
            label="Kategori Adı"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="örn: Monitör, Klavye, Mouse vb."
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCategoryDialogOpen(false)
            setNewCategory('')
            setCurrentModelIndex(null)
          }}>
            İptal
          </Button>
          <Button 
            onClick={() => {
              if (newCategory.trim()) {
                // Yeni kategoriyi listeye ekle
                const updatedCategories = [...availableCategories, newCategory.trim()]
                setAvailableCategories(updatedCategories)
                
                // Mevcut modelin kategorisini güncelle
                if (currentModelIndex !== null) {
                  updateModel(currentModelIndex, 'kategori', newCategory.trim())
                }
                
                // Dialog'u kapat ve temizle
                setCategoryDialogOpen(false)
                setNewCategory('')
                setCurrentModelIndex(null)
                
                toast.success(`"${newCategory.trim()}" kategorisi eklendi!`)
              }
            }}
            variant="contained"
            disabled={!newCategory.trim()}
          >
            Kategori Ekle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Onay Dialog'u */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>
          Silme Onayı
        </DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{deleteItem?.name}</strong> adlı {deleteItem?.type} kaydını silmek istediğinizden emin misiniz?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>İptal</Button>
          <Button 
            onClick={deleteExistingItem} 
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SetupWizard 