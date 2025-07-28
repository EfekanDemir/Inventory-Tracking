import React, { useState, useEffect } from 'react'
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Check as CheckIcon
} from '@mui/icons-material'
import { supabase } from '../config/supabase'
import { toast } from 'react-hot-toast'

// Özel StepIcon komponenti
const CustomStepIcon = ({ active, completed, icon }) => {
  if (completed) {
    return (
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: 'success.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px'
        }}
      >
        <CheckIcon fontSize="small" />
      </Box>
    )
  }
  
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: active ? 'primary.main' : 'grey.300',
        color: active ? 'white' : 'grey.600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold'
      }}
    >
      {icon}
    </Box>
  )
}

const SetupWizard = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [completedSteps, setCompletedSteps] = useState(new Set())

  // Form verileri
  const [departments, setDepartments] = useState([{ departman_adi: '', aciklama: '' }])
  const [locations, setLocations] = useState([{ lokasyon_kodu: '', lokasyon_adi: '', lokasyon_tipi: 'DEPO', departman_id: '' }])
  const [brands, setBrands] = useState([{ marka_adi: '', aciklama: '' }])
  const [models, setModels] = useState([{ 
    model_adi: '', 
    kategori: 'Bilgisayar', 
    marka_id: '',
    yeni_kategori: ''
  }])
  const [serialNumbers, setSerialNumbers] = useState([{ 
    seri_no: '', 
    aciklama: '', 
    model_id: '' 
  }])
  const [macAddresses, setMacAddresses] = useState([{ 
    mac_adresi: '', 
    aciklama: '', 
    model_id: '' 
  }])
  const [personnel, setPersonnel] = useState([{ ad: '', soyad: '', email: '', sicil_no: '', departman_id: '' }])

  // Mevcut veriler
  const [existingDepartments, setExistingDepartments] = useState([])
  const [existingBrands, setExistingBrands] = useState([])
  const [existingModels, setExistingModels] = useState([])
  const [existingLocations, setExistingLocations] = useState([])
  const [existingPersonnel, setExistingPersonnel] = useState([])
  const [existingCategories, setExistingCategories] = useState([])
  const [existingSerialNumbers, setExistingSerialNumbers] = useState([])
  const [existingMacAddresses, setExistingMacAddresses] = useState([])
  
  // Düzenleme state'leri
  const [editingItem, setEditingItem] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({})

  const steps = [
    'Departmanlar',
    'Lokasyonlar', 
    'Markalar',
    'Modeller',
    'Seri Numaraları',
    'MAC Adresleri',
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

  // Form temizleme fonksiyonları
  const clearDepartments = () => {
    setDepartments([{ departman_adi: '', aciklama: '' }])
  }

  const clearLocations = () => {
    setLocations([{ lokasyon_kodu: '', lokasyon_adi: '', lokasyon_tipi: 'DEPO', departman_id: '' }])
  }

  const clearBrands = () => {
    setBrands([{ marka_adi: '', aciklama: '' }])
  }

  const clearModels = () => {
    setModels([{ 
      model_adi: '', 
      kategori: 'Bilgisayar', 
      marka_id: '',
      yeni_kategori: ''
    }])
  }

  const clearSerialNumbers = () => {
    setSerialNumbers([{ 
      seri_no: '', 
      aciklama: '', 
      model_id: '' 
    }])
  }

  const clearMacAddresses = () => {
    setMacAddresses([{ 
      mac_adresi: '', 
      aciklama: '', 
      model_id: '' 
    }])
  }

  const clearPersonnel = () => {
    setPersonnel([{ ad: '', soyad: '', email: '', sicil_no: '', departman_id: '' }])
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
      const { data: modelData, error: modelError } = await supabase
        .from('modeller')
        .select(`
          *,
          markalar!inner(marka_adi)
        `)
        .order('model_adi')
      
      if (modelError) {
        console.error('Modeller yükleme hatası:', modelError)
      }
      setExistingModels(modelData || [])
      console.log('Modeller yüklendi:', modelData?.length || 0)

      // Mevcut kategorileri yükle (benzersiz)
      const { data: categoryData, error: categoryError } = await supabase
        .from('modeller')
        .select('kategori')
        .not('kategori', 'is', null)
      
      if (categoryError) {
        console.error('Kategoriler yükleme hatası:', categoryError)
      } else {
        // Benzersiz kategorileri al ve sırala
        const uniqueCategories = [...new Set(categoryData.map(item => item.kategori))].sort()
        setExistingCategories(uniqueCategories)
        console.log('Mevcut kategoriler:', uniqueCategories)
      }

      // Mevcut lokasyonları yükle
      const { data: locationData, error: locationError } = await supabase
        .from('lokasyonlar')
        .select(`
          *,
          departmanlar(departman_adi)
        `)
        .order('lokasyon_adi')
      
      if (locationError) {
        console.error('Lokasyonlar yükleme hatası:', locationError)
      }
      setExistingLocations(locationData || [])
      console.log('Mevcut lokasyonlar:', locationData)

      // Mevcut personeli yükle
      const { data: personnelData, error: personnelError } = await supabase
        .from('personel')
        .select(`
          *,
          departmanlar(departman_adi)
        `)
        .order('ad')
        
      if (personnelError) {
        console.error('Personel yükleme hatası:', personnelError)
      }
      setExistingPersonnel(personnelData || [])
      console.log('Personel yüklendi:', personnelData?.length || 0)

      // Seri numaralarını yükle
      const { data: serialData, error: serialError } = await supabase
        .from('seri_numaralari')
        .select(`
          *,
          modeller!inner(model_adi)
        `)
        .order('seri_no')
      
      if (serialError) {
        console.error('Seri numaraları yükleme hatası:', serialError)
      }
      setExistingSerialNumbers(serialData || [])
      console.log('Seri numaraları yüklendi:', serialData?.length || 0)

      // MAC adreslerini yükle
      const { data: macData, error: macError } = await supabase
        .from('mac_adresleri')
        .select(`
          *,
          modeller!inner(model_adi)
        `)
        .order('mac_adresi')
      
      if (macError) {
        console.error('MAC adresleri yükleme hatası:', macError)
      }
      setExistingMacAddresses(macData || [])
      console.log('MAC adresleri yüklendi:', macData?.length || 0)

      // Tamamlanan adımları işaretle
      const completed = new Set()
      if (deptData && deptData.length > 0) completed.add(0)
      if (locationData && locationData.length > 0) completed.add(1)
      if (brandData && brandData.length > 0) completed.add(2)
      if (modelData && modelData.length > 0) completed.add(3)
      if (serialData && serialData.length > 0) completed.add(4)
      if (macData && macData.length > 0) completed.add(5)
      if (personnelData && personnelData.length > 0) completed.add(6)
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
      if (location.lokasyon_adi) {
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
      yeni_kategori: ''
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

  // Seri numarası işlemleri
  const addSerialNumber = () => {
    setSerialNumbers([...serialNumbers, { 
      seri_no: '', 
      aciklama: '', 
      model_id: '' 
    }])
  }

  const removeSerialNumber = (index) => {
    if (serialNumbers.length > 1) {
      setSerialNumbers(serialNumbers.filter((_, i) => i !== index))
    }
  }

  const updateSerialNumber = (index, field, value) => {
    const updated = [...serialNumbers]
    updated[index][field] = value
    setSerialNumbers(updated)
  }

  // MAC adresi işlemleri
  const addMacAddress = () => {
    setMacAddresses([...macAddresses, { 
      mac_adresi: '', 
      aciklama: '', 
      model_id: '' 
    }])
  }

  const removeMacAddress = (index) => {
    if (macAddresses.length > 1) {
      setMacAddresses(macAddresses.filter((_, i) => i !== index))
    }
  }

  const updateMacAddress = (index, field, value) => {
    const updated = [...macAddresses]
    updated[index][field] = value
    setMacAddresses(updated)
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

  // Adım validasyonu
  const validateStep = (step) => {
    switch (step) {
      case 0: // Departmanlar
        return departments.every(dept => dept.departman_adi.trim() !== '')
      case 1: // Lokasyonlar
        return locations.every(loc => 
          loc.lokasyon_kodu.trim() !== '' && 
          loc.lokasyon_adi.trim() !== ''
        )
      case 2: // Markalar
        return brands.every(brand => brand.marka_adi.trim() !== '')
      case 3: // Modeller
        return models.every(model => 
          model.model_adi.trim() !== '' && 
          model.marka_id !== '' && 
          model.marka_id !== null &&
          !isNaN(parseInt(model.marka_id)) &&
          (model.kategori !== 'Diğer' || (model.kategori === 'Diğer' && model.yeni_kategori.trim() !== ''))
        )
      case 4: // Seri Numaraları
        return serialNumbers.every(serial => 
          serial.seri_no.trim() !== '' && 
          serial.model_id !== '' && 
          serial.model_id !== null &&
          !isNaN(parseInt(serial.model_id))
        )
      case 5: // MAC Adresleri
        return macAddresses.every(mac => 
          mac.mac_adresi.trim() !== '' && 
          mac.model_id !== '' && 
          mac.model_id !== null &&
          !isNaN(parseInt(mac.model_id))
        )
      case 6: // Personel
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
        case 0: // Departmanlar
          const validDepartments = departments.filter(dept => dept.departman_adi.trim() !== '')
          if (validDepartments.length === 0) {
            throw new Error('En az bir departman eklenmelidir.')
          }
          
          const { error: deptError } = await supabase
            .from('departmanlar')
            .insert(validDepartments)
          
          if (deptError) throw deptError
          clearDepartments()
          await loadExistingData()
          break

        case 1: // Lokasyonlar
          const validLocations = locations.filter(loc => 
            loc.lokasyon_kodu.trim() !== '' && 
            loc.lokasyon_adi.trim() !== ''
          )
          if (validLocations.length === 0) {
            throw new Error('En az bir lokasyon eklenmelidir.')
          }
          
          // departman_id boşsa NULL olarak ayarla
          const locationsToInsert = validLocations.map(loc => ({
            ...loc,
            departman_id: loc.departman_id || null
          }))
          
          console.log('Kaydedilecek lokasyonlar:', JSON.stringify(locationsToInsert, null, 2))
          
          const { error: locError } = await supabase
            .from('lokasyonlar')
            .insert(locationsToInsert)
          
          if (locError) {
            console.error('Lokasyon kaydetme hatası:', locError)
            throw locError
          }
          clearLocations()
          await loadExistingData()
          break

        case 2: // Markalar
          const validBrands = brands.filter(brand => brand.marka_adi.trim() !== '')
          if (validBrands.length === 0) {
            throw new Error('En az bir marka eklenmelidir.')
          }
          
          const { error: brandError } = await supabase
            .from('markalar')
            .insert(validBrands)
          
          if (brandError) throw brandError
          clearBrands()
          await loadExistingData()
          break

        case 3: // Modeller
          const validModels = models.filter(model => 
            model.model_adi.trim() !== '' && 
            model.marka_id !== '' && 
            model.marka_id !== null &&
            !isNaN(parseInt(model.marka_id)) &&
            (model.kategori !== 'Diğer' || (model.kategori === 'Diğer' && model.yeni_kategori.trim() !== ''))
          )
          if (validModels.length === 0) {
            throw new Error('En az bir model eklenmelidir.')
          }
          
          // Modelleri kaydet
          const modelsToInsert = validModels.map(model => ({
            model_adi: model.model_adi,
            kategori: model.kategori === 'Diğer' && model.yeni_kategori.trim() !== '' 
              ? model.yeni_kategori.trim() 
              : model.kategori,
            marka_id: parseInt(model.marka_id), // Sayısal değere çevir
            aciklama: model.aciklama
          }))
          
          console.log('Kaydedilecek modeller:', modelsToInsert)
          console.log('Model kategori değerleri:', modelsToInsert.map(m => m.kategori))
          
          // Önce tablo yapısını kontrol et
          const { data: modelTableInfo, error: modelTableError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'modeller')
            .eq('table_schema', 'public')
          
          if (modelTableError) {
            console.error('Model tablo yapısı kontrol hatası:', modelTableError)
          } else {
            console.log('modeller tablo yapısı:', modelTableInfo)
          }
          
          const { error: modelError } = await supabase
            .from('modeller')
            .insert(modelsToInsert)
          
          if (modelError) {
            console.error('Model kaydetme hatası:', modelError)
            console.error('Hata detayları:', {
              code: modelError.code,
              message: modelError.message,
              details: modelError.details,
              hint: modelError.hint
            })
            throw modelError
          }
          clearModels()
          await loadExistingData()
          break

        case 4: // Seri Numaraları
          const validSerialNumbers = serialNumbers.filter(serial => 
            serial.seri_no.trim() !== '' && 
            serial.model_id !== '' && 
            serial.model_id !== null &&
            !isNaN(parseInt(serial.model_id))
          )
          if (validSerialNumbers.length === 0) {
            throw new Error('En az bir seri numarası eklenmelidir.')
          }
          
          // Seri numaralarını kaydet
          const serialsToInsert = validSerialNumbers.map(serial => ({
            seri_no: serial.seri_no,
            aciklama: serial.aciklama,
            model_id: parseInt(serial.model_id),
            kullanim_durumu: 'MUSAIT'
          }))
          
          console.log('Kaydedilecek seri numaraları:', serialsToInsert)
          
          const { error: serialError } = await supabase
            .from('seri_numaralari')
            .insert(serialsToInsert)
          
          if (serialError) {
            console.error('Seri numarası kaydetme hatası:', serialError)
            console.error('Hata detayları:', {
              code: serialError.code,
              message: serialError.message,
              details: serialError.details,
              hint: serialError.hint
            })
            throw serialError
          }
          
          console.log('Seri numaraları başarıyla kaydedildi')
          clearSerialNumbers()
          await loadExistingData()
          break

        case 5: // MAC Adresleri
          const validMacAddresses = macAddresses.filter(mac => 
            mac.mac_adresi.trim() !== '' && 
            mac.model_id !== '' && 
            mac.model_id !== null &&
            !isNaN(parseInt(mac.model_id))
          )
          if (validMacAddresses.length === 0) {
            throw new Error('En az bir MAC adresi eklenmelidir.')
          }
          
          // MAC adreslerini kaydet
          const macsToInsert = validMacAddresses.map(mac => ({
            mac_adresi: mac.mac_adresi,
            aciklama: mac.aciklama,
            model_id: parseInt(mac.model_id),
            kullanim_durumu: 'MUSAIT'
          }))
          
          console.log('Kaydedilecek MAC adresleri:', macsToInsert)
          
          const { error: macError } = await supabase
            .from('mac_adresleri')
            .insert(macsToInsert)
          
          if (macError) {
            console.error('MAC adresi kaydetme hatası:', macError)
            console.error('Hata detayları:', {
              code: macError.code,
              message: macError.message,
              details: macError.details,
              hint: macError.hint
            })
            throw macError
          }
          
          console.log('MAC adresleri başarıyla kaydedildi')
          clearMacAddresses()
          await loadExistingData()
          break

        case 6: // Personel
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
          clearPersonnel()
          await loadExistingData()
          break

        default:
          break
      }
      
      toast.success('Veriler başarıyla kaydedildi!')
      setCompletedSteps(prev => new Set([...prev, step]))
      
    } catch (error) {
      console.error('Kaydetme hatası:', error)
      setError(error.message)
      toast.error(`Kaydetme hatası: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    // Validation olmadan bir sonraki adıma geç
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleStepClick = (stepIndex) => {
    // Herhangi bir adıma geçiş yapabilme özelliği
    setActiveStep(stepIndex)
  }

  const handleSaveCurrentStep = async () => {
    await saveStep(activeStep)
  }

  const completeSetup = async () => {
    try {
      setLoading(true)
      
      // Tüm adımları tamamla
      for (let i = 0; i < steps.length; i++) {
        if (!completedSteps.has(i) && validateStep(i)) {
          await saveStep(i)
        }
      }
      
      toast.success('Sistem kurulumu tamamlandı!')
      
    } catch (error) {
      console.error('Kurulum tamamlama hatası:', error)
      toast.error('Kurulum tamamlanırken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (type, id) => {
    if (!confirm(`${type} silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      let tableName = ''
      switch (type) {
        case 'departmanlar':
          tableName = 'departmanlar'
          break
        case 'lokasyonlar':
          tableName = 'lokasyonlar'
          break
        case 'markalar':
          tableName = 'markalar'
          break
        case 'modeller':
          tableName = 'modeller'
          break
        case 'seri numaraları':
          tableName = 'seri_numaralari'
          break
        case 'MAC adresleri':
          tableName = 'mac_adresleri'
          break
        case 'personel':
          tableName = 'personel'
          break
        default:
          throw new Error('Bilinmeyen tablo türü')
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) {
        console.error(`${type} silme hatası:`, error)
        toast.error(`${type} silinirken hata oluştu`)
        return
      }

      toast.success(`${type} başarıyla silindi`)
      await loadExistingData() // Verileri yeniden yükle
    } catch (error) {
      console.error(`${type} silme hatası:`, error)
      toast.error(`${type} silinirken hata oluştu`)
    }
  }

  const handleEditItem = (type, item) => {
    setEditingItem({ type, item })
    setEditFormData(item)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      let tableName = ''
      let updateData = {}

      switch (editingItem.type) {
        case 'departmanlar':
          tableName = 'departmanlar'
          updateData = {
            departman_adi: editFormData.departman_adi,
            aciklama: editFormData.aciklama
          }
          break
        case 'lokasyonlar':
          tableName = 'lokasyonlar'
          updateData = {
            lokasyon_kodu: editFormData.lokasyon_kodu,
            lokasyon_adi: editFormData.lokasyon_adi,
            lokasyon_tipi: editFormData.lokasyon_tipi,
            departman_id: editFormData.departman_id
          }
          break
        case 'markalar':
          tableName = 'markalar'
          updateData = {
            marka_adi: editFormData.marka_adi,
            aciklama: editFormData.aciklama
          }
          break
        case 'modeller':
          tableName = 'modeller'
          updateData = {
            model_adi: editFormData.model_adi,
            kategori: editFormData.kategori === 'Diğer' && editFormData.yeni_kategori?.trim() !== '' 
              ? editFormData.yeni_kategori.trim() 
              : editFormData.kategori,
            marka_id: editFormData.marka_id,
            aciklama: editFormData.aciklama
          }
          break
        case 'seri numaraları':
          tableName = 'seri_numaralari'
          updateData = {
            seri_no: editFormData.seri_no,
            aciklama: editFormData.aciklama,
            model_id: editFormData.model_id
          }
          break
        case 'MAC adresleri':
          tableName = 'mac_adresleri'
          updateData = {
            mac_adresi: editFormData.mac_adresi,
            aciklama: editFormData.aciklama,
            model_id: editFormData.model_id
          }
          break
        case 'personel':
          tableName = 'personel'
          updateData = {
            ad: editFormData.ad,
            soyad: editFormData.soyad,
            email: editFormData.email,
            sicil_no: editFormData.sicil_no,
            departman_id: editFormData.departman_id
          }
          break
        default:
          throw new Error('Bilinmeyen tablo türü')
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', editingItem.item.id)

      if (error) {
        console.error(`${editingItem.type} güncelleme hatası:`, error)
        toast.error(`${editingItem.type} güncellenirken hata oluştu`)
        return
      }

      toast.success(`${editingItem.type} başarıyla güncellendi`)
      setEditDialogOpen(false)
      setEditingItem(null)
      setEditFormData({})
      await loadExistingData() // Verileri yeniden yükle
    } catch (error) {
      console.error(`${editingItem.type} güncelleme hatası:`, error)
      toast.error(`${editingItem.type} güncellenirken hata oluştu`)
    }
  }

  const handleCancelEdit = () => {
    setEditDialogOpen(false)
    setEditingItem(null)
    setEditFormData({})
  }

  const handleDeleteCategory = async (category) => {
    if (!confirm(`"${category}" kategorisini silmek istediğinizden emin misiniz? Bu kategoriyi kullanan modeller etkilenebilir.`)) {
      return
    }

    try {
      // Önce bu kategoriyi kullanan modelleri kontrol et
      const { data: modelsUsingCategory, error: checkError } = await supabase
        .from('modeller')
        .select('id, model_adi')
        .eq('kategori', category)

      if (checkError) {
        console.error('Kategori kullanım kontrolü hatası:', checkError)
        toast.error('Kategori kullanım kontrolü yapılamadı')
        return
      }

      if (modelsUsingCategory && modelsUsingCategory.length > 0) {
        const modelNames = modelsUsingCategory.map(m => m.model_adi).join(', ')
        toast.error(`Bu kategori "${modelNames}" modelleri tarafından kullanılıyor. Önce bu modelleri silin veya kategorilerini değiştirin.`)
        return
      }

      // Kategoriyi kullanan model yoksa, bu kategoriyi kullanan tüm modelleri varsayılan kategoriye çevir
      const { error: updateError } = await supabase
        .from('modeller')
        .update({ kategori: 'Bilgisayar' })
        .eq('kategori', category)

      if (updateError) {
        console.error('Model kategorilerini güncelleme hatası:', updateError)
        toast.error('Model kategorileri güncellenirken hata oluştu')
        return
      }

      toast.success(`"${category}" kategorisi başarıyla silindi ve ilgili modeller "Bilgisayar" kategorisine taşındı`)
      await loadExistingData() // Verileri yeniden yükle
    } catch (error) {
      console.error('Kategori silme hatası:', error)
      toast.error('Kategori silinirken hata oluştu')
    }
  }

  const renderExistingDataTable = (type, data, columns) => {
    if (!data || data.length === 0) return null

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Mevcut {type}
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col, index) => (
                  <TableCell key={index}>{col.header}</TableCell>
                ))}
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex}>
                      {col.render ? col.render(item) : item[col.field]}
                    </TableCell>
                  ))}
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditItem(type, item)}
                      title="Düzenle"
                      sx={{ mr: 1 }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteItem(type, item.id)}
                      title="Sil"
                    >
                      <DeleteIcon fontSize="small" />
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
              Şirket departmanlarını ekleyin. En az bir departman zorunludur.
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
              Şirket lokasyonlarını ekleyin. En az bir lokasyon zorunludur.
            </Typography>
            
            {renderExistingDataTable('lokasyonlar', existingLocations, [
              { field: 'lokasyon_kodu', header: 'Lokasyon Kodu' },
              { field: 'lokasyon_adi', header: 'Lokasyon Adı' },
              { field: 'lokasyon_tipi', header: 'Tip' },
              { 
                field: 'departmanlar', 
                header: 'Departman',
                render: (item) => item.departmanlar?.departman_adi || 'Atanmamış'
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
                        <MenuItem value="OFIS">Ofis</MenuItem>
                        <MenuItem value="KULLANICI">Kullanıcı</MenuItem>
                        <MenuItem value="EGITIM">Eğitim</MenuItem>
                        <MenuItem value="BAKIM">Bakım</MenuItem>
                        <MenuItem value="HURDA">Hurda</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Departman (Opsiyonel)</InputLabel>
                      <Select
                        value={loc.departman_id}
                        label="Departman (Opsiyonel)"
                        onChange={(e) => updateLocation(index, 'departman_id', e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Departman seçmeyin</em>
                        </MenuItem>
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
              Markalara bağlı modelleri ekleyin.
            </Typography>

            {/* Kategori Yönetimi */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Kategori Yönetimi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Mevcut kategorileri görüntüleyin ve yönetin.
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {/* Varsayılan kategoriler */}
                {['Bilgisayar', 'Laptop', 'Tablet', 'Telefon', 'Aksesuar'].map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    color="primary"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
                
                {/* Özel kategoriler */}
                {existingCategories
                  .filter(cat => !['Bilgisayar', 'Laptop', 'Tablet', 'Telefon', 'Aksesuar'].includes(cat))
                  .map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      color="secondary"
                      variant="outlined"
                      onDelete={() => handleDeleteCategory(category)}
                      deleteIcon={<DeleteIcon />}
                      sx={{ m: 0.5 }}
                    />
                  ))
                }
              </Box>
              
              {existingCategories.filter(cat => !['Bilgisayar', 'Laptop', 'Tablet', 'Telefon', 'Aksesuar'].includes(cat)).length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Henüz özel kategori eklenmemiş.
                </Typography>
              )}
            </Paper>
            
            {renderExistingDataTable('modeller', existingModels, [
              { field: 'model_adi', header: 'Model Adı' },
              { field: 'kategori', header: 'Kategori' },
              { 
                field: 'markalar', 
                header: 'Marka',
                render: (item) => item.markalar?.marka_adi || 'Bilinmiyor'
              }
            ])}
            
            {models.map((model, index) => (
              <Paper key={index} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Model {index + 1}
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Model Adı *"
                      value={model.model_adi}
                      onChange={(e) => updateModel(index, 'model_adi', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth required>
                      <InputLabel>Kategori</InputLabel>
                      <Select
                        value={model.kategori}
                        label="Kategori"
                        onChange={(e) => updateModel(index, 'kategori', e.target.value)}
                      >
                        {/* Varsayılan kategoriler */}
                        <MenuItem value="Bilgisayar">Bilgisayar</MenuItem>
                        <MenuItem value="Laptop">Laptop</MenuItem>
                        <MenuItem value="Tablet">Tablet</MenuItem>
                        <MenuItem value="Telefon">Telefon</MenuItem>
                        <MenuItem value="Aksesuar">Aksesuar</MenuItem>
                        
                        {/* Mevcut kategoriler (varsayılan olmayanlar) */}
                        {existingCategories
                          .filter(cat => !['Bilgisayar', 'Laptop', 'Tablet', 'Telefon', 'Aksesuar'].includes(cat))
                          .map(category => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))
                        }
                        
                        {/* Ayırıcı */}
                        {existingCategories.filter(cat => !['Bilgisayar', 'Laptop', 'Tablet', 'Telefon', 'Aksesuar'].includes(cat)).length > 0 && (
                          <MenuItem disabled>
                            <Divider />
                          </MenuItem>
                        )}
                        
                        {/* Diğer seçeneği */}
                        <MenuItem value="Diğer">➕ Yeni Kategori Ekle</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {model.kategori === 'Diğer' && (
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Yeni Kategori Adı *"
                        value={model.yeni_kategori}
                        onChange={(e) => updateModel(index, 'yeni_kategori', e.target.value)}
                        required
                        placeholder="Örn: Monitör, Yazıcı, Klavye..."
                        helperText="Bu kategori dropdown'da görünecek"
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} md={model.kategori === 'Diğer' ? 4 : 6}>
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

      case 4: // Seri Numaraları
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Seri Numaraları
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Modellere ait seri numaralarını ekleyin. En az bir seri numarası zorunludur.
            </Typography>
            
            {renderExistingDataTable('seri numaraları', existingSerialNumbers, [
              { field: 'seri_no', header: 'Seri Numarası' },
              { field: 'aciklama', header: 'Açıklama' },
              { 
                field: 'modeller', 
                header: 'Model',
                render: (item) => item.modeller?.model_adi || 'Bilinmiyor'
              }
            ])}
            
            {serialNumbers.map((serial, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Seri Numarası *"
                      value={serial.seri_no}
                      onChange={(e) => updateSerialNumber(index, 'seri_no', e.target.value)}
                      required
                      placeholder="SN123456789"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Model *</InputLabel>
                      <Select
                        value={serial.model_id}
                        label="Model *"
                        onChange={(e) => updateSerialNumber(index, 'model_id', e.target.value)}
                      >
                        {existingModels.map((model) => (
                          <MenuItem key={model.id} value={model.id}>
                            {model.model_adi} ({model.markalar?.marka_adi})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={serial.aciklama}
                      onChange={(e) => updateSerialNumber(index, 'aciklama', e.target.value)}
                      placeholder="İsteğe bağlı açıklama"
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton 
                      onClick={() => removeSerialNumber(index)}
                      disabled={serialNumbers.length === 1}
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
              onClick={addSerialNumber}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Seri Numarası Ekle
            </Button>
          </Box>
        )

      case 5: // MAC Adresleri
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              MAC Adresleri
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Modellere ait MAC adreslerini ekleyin. MAC adresleri opsiyoneldir.
            </Typography>
            
            {renderExistingDataTable('MAC adresleri', existingMacAddresses, [
              { field: 'mac_adresi', header: 'MAC Adresi' },
              { field: 'aciklama', header: 'Açıklama' },
              { 
                field: 'modeller', 
                header: 'Model',
                render: (item) => item.modeller?.model_adi || 'Bilinmiyor'
              }
            ])}
            
            {macAddresses.map((mac, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="MAC Adresi *"
                      value={mac.mac_adresi}
                      onChange={(e) => updateMacAddress(index, 'mac_adresi', e.target.value)}
                      required
                      placeholder="00:11:22:33:44:55"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Model *</InputLabel>
                      <Select
                        value={mac.model_id}
                        label="Model *"
                        onChange={(e) => updateMacAddress(index, 'model_id', e.target.value)}
                      >
                        {existingModels.map((model) => (
                          <MenuItem key={model.id} value={model.id}>
                            {model.model_adi} ({model.markalar?.marka_adi})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={mac.aciklama}
                      onChange={(e) => updateMacAddress(index, 'aciklama', e.target.value)}
                      placeholder="İsteğe bağlı açıklama"
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton 
                      onClick={() => removeMacAddress(index)}
                      disabled={macAddresses.length === 1}
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
              onClick={addMacAddress}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              MAC Adresi Ekle
            </Button>
          </Box>
        )

      case 6: // Personel
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Personel Bilgileri
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Departmanlara atanacak personelleri ekleyin. Sicil no otomatik olarak üretilir.
            </Typography>
            
            {renderExistingDataTable('personel', existingPersonnel, [
              { field: 'ad', header: 'Ad' },
              { field: 'soyad', header: 'Soyad' },
              { field: 'email', header: 'E-posta' },
              { field: 'sicil_no', header: 'Sicil No' },
              { 
                field: 'departmanlar', 
                header: 'Departman',
                render: (item) => item.departmanlar?.departman_adi || 'Atanmamış'
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
                      type="email"
                      value={person.email}
                      onChange={(e) => updatePersonnel(index, 'email', e.target.value)}
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
        return <Typography>Bilinmeyen adım</Typography>
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Sistem Kurulum Sihirbazı
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Envanter takip sistemini kullanmaya başlamak için gerekli temel verileri ekleyin.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label} completed={completedSteps.has(index)}>
            <StepLabel 
              onClick={() => handleStepClick(index)}
              StepIconComponent={(props) => (
                <CustomStepIcon 
                  {...props} 
                  icon={index + 1}
                />
              )}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  borderRadius: 1
                }
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="body2">{error}</Typography>
        </Paper>
      )}

      <Box sx={{ mt: 4, mb: 4 }}>
        {renderStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Geri
        </Button>
        
        <Box>
          <Button
            variant="contained"
            onClick={handleSaveCurrentStep}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            {loading ? 'Kaydediliyor...' : 'Bu Adımı Kaydet'}
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="success"
              onClick={completeSetup}
              disabled={loading}
            >
              Kurulumu Tamamla
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              İleri
            </Button>
          )}
        </Box>
      </Box>

      {/* Düzenleme Dialog'u */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? `${editingItem.type} Düzenle` : 'Düzenle'}
        </DialogTitle>
        <DialogContent>
          {editingItem && (
            <Box sx={{ pt: 2 }}>
              {editingItem.type === 'departmanlar' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Departman Adı *"
                      value={editFormData.departman_adi || ''}
                      onChange={(e) => setEditFormData({...editFormData, departman_adi: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={editFormData.aciklama || ''}
                      onChange={(e) => setEditFormData({...editFormData, aciklama: e.target.value})}
                    />
                  </Grid>
                </Grid>
              )}

              {editingItem.type === 'lokasyonlar' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Lokasyon Kodu *"
                      value={editFormData.lokasyon_kodu || ''}
                      onChange={(e) => setEditFormData({...editFormData, lokasyon_kodu: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Lokasyon Adı *"
                      value={editFormData.lokasyon_adi || ''}
                      onChange={(e) => setEditFormData({...editFormData, lokasyon_adi: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Lokasyon Tipi</InputLabel>
                      <Select
                        value={editFormData.lokasyon_tipi || 'DEPO'}
                        label="Lokasyon Tipi"
                        onChange={(e) => setEditFormData({...editFormData, lokasyon_tipi: e.target.value})}
                      >
                        <MenuItem value="DEPO">Depo</MenuItem>
                        <MenuItem value="OFIS">Ofis</MenuItem>
                        <MenuItem value="LABORATUVAR">Laboratuvar</MenuItem>
                        <MenuItem value="DIGER">Diğer</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Departman</InputLabel>
                      <Select
                        value={editFormData.departman_id || ''}
                        label="Departman"
                        onChange={(e) => setEditFormData({...editFormData, departman_id: e.target.value})}
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

              {editingItem.type === 'markalar' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Marka Adı *"
                      value={editFormData.marka_adi || ''}
                      onChange={(e) => setEditFormData({...editFormData, marka_adi: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={editFormData.aciklama || ''}
                      onChange={(e) => setEditFormData({...editFormData, aciklama: e.target.value})}
                    />
                  </Grid>
                </Grid>
              )}

              {editingItem.type === 'modeller' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Model Adı *"
                      value={editFormData.model_adi || ''}
                      onChange={(e) => setEditFormData({...editFormData, model_adi: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Kategori</InputLabel>
                      <Select
                        value={editFormData.kategori || 'Bilgisayar'}
                        label="Kategori"
                        onChange={(e) => setEditFormData({...editFormData, kategori: e.target.value})}
                      >
                        <MenuItem value="Bilgisayar">Bilgisayar</MenuItem>
                        <MenuItem value="Laptop">Laptop</MenuItem>
                        <MenuItem value="Tablet">Tablet</MenuItem>
                        <MenuItem value="Telefon">Telefon</MenuItem>
                        <MenuItem value="Aksesuar">Aksesuar</MenuItem>
                        <Divider />
                        {existingCategories
                          .filter(cat => !['Bilgisayar', 'Laptop', 'Tablet', 'Telefon', 'Aksesuar'].includes(cat))
                          .map(category => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))
                        }
                        <Divider />
                        <MenuItem value="Diğer">➕ Yeni Kategori Ekle</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {editFormData.kategori === 'Diğer' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Yeni Kategori Adı *"
                        value={editFormData.yeni_kategori || ''}
                        onChange={(e) => setEditFormData({...editFormData, yeni_kategori: e.target.value})}
                        required
                        placeholder="Örn: Monitör, Yazıcı, Klavye..."
                        helperText="Bu kategori dropdown'da görünecek"
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Marka</InputLabel>
                      <Select
                        value={editFormData.marka_id || ''}
                        label="Marka"
                        onChange={(e) => setEditFormData({...editFormData, marka_id: e.target.value})}
                      >
                        {existingBrands.map((brand) => (
                          <MenuItem key={brand.id} value={brand.id}>
                            {brand.marka_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={editFormData.aciklama || ''}
                      onChange={(e) => setEditFormData({...editFormData, aciklama: e.target.value})}
                    />
                  </Grid>
                </Grid>
              )}

              {editingItem.type === 'seri numaraları' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Seri Numarası *"
                      value={editFormData.seri_no || ''}
                      onChange={(e) => setEditFormData({...editFormData, seri_no: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Model</InputLabel>
                      <Select
                        value={editFormData.model_id || ''}
                        label="Model"
                        onChange={(e) => setEditFormData({...editFormData, model_id: e.target.value})}
                      >
                        {existingModels.map((model) => (
                          <MenuItem key={model.id} value={model.id}>
                            {model.model_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={editFormData.aciklama || ''}
                      onChange={(e) => setEditFormData({...editFormData, aciklama: e.target.value})}
                    />
                  </Grid>
                </Grid>
              )}

              {editingItem.type === 'MAC adresleri' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="MAC Adresi *"
                      value={editFormData.mac_adresi || ''}
                      onChange={(e) => setEditFormData({...editFormData, mac_adresi: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Model</InputLabel>
                      <Select
                        value={editFormData.model_id || ''}
                        label="Model"
                        onChange={(e) => setEditFormData({...editFormData, model_id: e.target.value})}
                      >
                        {existingModels.map((model) => (
                          <MenuItem key={model.id} value={model.id}>
                            {model.model_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={editFormData.aciklama || ''}
                      onChange={(e) => setEditFormData({...editFormData, aciklama: e.target.value})}
                    />
                  </Grid>
                </Grid>
              )}

              {editingItem.type === 'personel' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Ad *"
                      value={editFormData.ad || ''}
                      onChange={(e) => setEditFormData({...editFormData, ad: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Soyad *"
                      value={editFormData.soyad || ''}
                      onChange={(e) => setEditFormData({...editFormData, soyad: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="E-posta"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Sicil No"
                      value={editFormData.sicil_no || ''}
                      onChange={(e) => setEditFormData({...editFormData, sicil_no: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Departman</InputLabel>
                      <Select
                        value={editFormData.departman_id || ''}
                        label="Departman"
                        onChange={(e) => setEditFormData({...editFormData, departman_id: e.target.value})}
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>İptal</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SetupWizard