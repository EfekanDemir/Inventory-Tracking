import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
// MUI Lab Timeline kaldırıldı - theme sorunu nedeniyle
import {
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Computer as ComputerIcon,
  GetApp as ExcelIcon,
} from '@mui/icons-material'
import { supabase } from '../config/supabase'
import { exportHistoryToExcel } from '../utils/exportUtils'
import { showToast } from '../utils/notificationUtils'

const InventoryHistory = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [equipment, setEquipment] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Dropdown verileri için state'ler
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])

  useEffect(() => {
    if (id) {
      loadDropdownData()
      fetchEquipmentAndHistory()
    }
  }, [id])

  // Dropdown verilerini yükle
  const loadDropdownData = async () => {
    try {
      // Markaları yükle
      const { data: brandsData, error: brandsError } = await supabase
        .from('markalar')
        .select('id, marka_adi')
        .order('marka_adi')

      if (brandsError) throw brandsError
      setBrands(brandsData || [])

      // Modelleri yükle
      const { data: modelsData, error: modelsError } = await supabase
        .from('modeller')
        .select('id, marka_id, model_adi')
        .order('model_adi')

      if (modelsError) throw modelsError
      setModels(modelsData || [])
    } catch (error) {
      console.error('Dropdown verileri yükleme hatası:', error)
    }
  }

  // Excel export fonksiyonu
  const handleExcelExport = () => {
    if (history.length === 0) {
      showToast('Export edilecek geçmiş kaydı bulunmamaktadır.', 'warning')
      return
    }

    // Ekipman bilgilerini hazırla
    const equipmentInfo = {
      marka_model: equipment?.markalar && equipment?.modeller 
        ? `${equipment.markalar.marka_adi} ${equipment.modeller.model_adi}`
        : equipment?.marka_model || 'Bilinmiyor',
      mac_adresi: equipment?.mac_adresi || 'Belirtilmedi',
      seri_no: equipment?.seri_no || 'Belirtilmedi',
      lokasyon_adi: equipment?.lokasyonlar?.lokasyon_adi || 'Bilinmiyor',
      atanan_personel: equipment?.atanan_personel 
        ? `${equipment.atanan_personel.ad} ${equipment.atanan_personel.soyad}`
        : equipment?.agent || 'Atanmamış',
    }

    const result = exportHistoryToExcel(history, equipmentInfo, `ekipman_gecmisi_${id}`)
    
    if (result.success) {
      showToast(result.message, 'success')
    } else {
      showToast(result.message, 'error')
    }
  }

  const fetchEquipmentAndHistory = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Ekipman bilgilerini JOIN'li olarak getir
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('ekipman_envanteri')
        .select(`
          *,
          markalar(marka_adi),
          modeller(model_adi),
          lokasyonlar(lokasyon_adi),
          atanan_personel:personel!atanan_personel_id(ad, soyad)
        `)
        .eq('id', id)
        .single()

      if (equipmentError) throw equipmentError

      // Geçmiş kayıtlarını getir - JOIN'li sorgu ile gerçek değerleri al
      const { data: historyData, error: historyError } = await supabase
        .from('envanter_hareketleri')
        .select(`
          *,
          eski_lokasyon:lokasyonlar!eski_lokasyon_id(lokasyon_adi),
          yeni_lokasyon:lokasyonlar!yeni_lokasyon_id(lokasyon_adi),
          eski_personel:personel!eski_personel_id(ad, soyad),
          yeni_personel:personel!yeni_personel_id(ad, soyad),
          yapan_personel:personel!yapan_personel_id(ad, soyad)
        `)
        .eq('ekipman_id', id)
        .order('created_at', { ascending: false })

      if (historyError) throw historyError

      setEquipment(equipmentData)
      setHistory(historyData || [])
    } catch (error) {
      console.error('Veri yükleme hatası:', error)
      setError('Geçmiş verileri yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const getOperationIcon = (operationType) => {
    switch (operationType) {
      case 'Yeni Kayıt':
        return <AddIcon />
      case 'Güncelleme':
        return <EditIcon />
      default:
        return <HistoryIcon />
    }
  }



  const formatJsonData = (data) => {
    if (!data) return null

    const importantFields = {
      konum: 'Konum',
      agent: 'Agent',
      marka_model: 'Marka/Model',
      mac_adresi: 'MAC Adresi',
      seri_no: 'Seri No',
      ofise_giris_tarihi: 'Ofise Giriş Tarihi',
      ofisten_cikis_tarihi: 'Ofisten Çıkış Tarihi',
      aciklama: 'Açıklama',
    }

    return Object.entries(data)
      .filter(([key, value]) => importantFields[key] && value !== null && value !== '')
      .map(([key, value]) => (
        <Box key={key} sx={{ mb: 1 }}>
          <strong>{importantFields[key]}:</strong> {
            key === 'ofise_giris_tarihi' || key === 'ofisten_cikis_tarihi'
              ? new Date(value).toLocaleDateString('tr-TR')
              : value
          }
        </Box>
      ))
  }

  // Yeni detaylı değişiklik gösterme fonksiyonu
  const renderDetailedChanges = (record) => {
    // Eğer yeni formatta detaylı değişiklik verisi varsa onu kullan
    if (record.degisiklik_detaylari && record.degisiklik_detaylari.length > 0) {
      return (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Typography variant="subtitle2">
              Yapılan Değişiklikler:
            </Typography>
            <Chip 
              label={`${record.degisiklik_detaylari.length} alan değişti`}
              color="primary"
              size="small"
            />
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Alan</strong></TableCell>
                  <TableCell><strong>Eski Değer</strong></TableCell>
                  <TableCell><strong>Yeni Değer</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {record.degisiklik_detaylari.map((change, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {change.field_label}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textDecoration: 'line-through',
                          color: 'error.main',
                          fontStyle: 'italic'
                        }}
                      >
                        {change.old_display || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: 'success.main'
                        }}
                      >
                        {change.new_display || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )
    }

    // Eski formatta veri varsa eski mantığı kullan - record parametresi ile
    return getLegacyChanges(record.eski_degerler, record.yeni_degerler, record)
  }

  // Eski format için geriye dönük uyumluluk - Geliştirilmiş versiyon
  const getLegacyChanges = (oldData, newData, record = null) => {
    if (!oldData || !newData) return null

    const changes = []
    const importantFields = {
      mac_adresi: 'MAC Adresi',
      marka_id: 'Marka',
      model_id: 'Model',
      lokasyon_id: 'Lokasyon',
      seri_no: 'Seri No',
      atanan_personel_id: 'Atanan Personel',
      ofise_giris_tarihi: 'Ofise Giriş Tarihi',
      ofisten_cikis_tarihi: 'Ofisten Çıkış Tarihi',
      aciklama: 'Açıklama',
    }

    Object.keys(importantFields).forEach(key => {
      const oldValue = oldData[key]
      const newValue = newData[key]
      
      if (oldValue !== newValue) {
        let displayOldValue = oldValue || '-'
        let displayNewValue = newValue || '-'
        
        // Tarih formatı düzelt
        if (key.includes('tarihi') && oldValue) {
          displayOldValue = new Date(oldValue).toLocaleDateString('tr-TR')
        }
        if (key.includes('tarihi') && newValue) {
          displayNewValue = new Date(newValue).toLocaleDateString('tr-TR')
        }
        
        // JOIN'li verilerden gerçek değerleri al
        if (record) {
          // Lokasyon değişiklikleri
          if (key === 'lokasyon_id') {
            if (record.eski_lokasyon) {
              displayOldValue = record.eski_lokasyon.lokasyon_adi || displayOldValue
            }
            if (record.yeni_lokasyon) {
              displayNewValue = record.yeni_lokasyon.lokasyon_adi || displayNewValue
            }
          }
          
          // Personel değişiklikleri
          if (key === 'atanan_personel_id') {
            if (record.eski_personel) {
              displayOldValue = `${record.eski_personel.ad} ${record.eski_personel.soyad}` || displayOldValue
            }
            if (record.yeni_personel) {
              displayNewValue = `${record.yeni_personel.ad} ${record.yeni_personel.soyad}` || displayNewValue
            }
          }
        }
        
        // Marka ve model bilgilerini göster
        if (key === 'marka_id') {
          const oldMarka = brands.find(b => b.id === parseInt(oldValue))
          const newMarka = brands.find(b => b.id === parseInt(newValue))
          if (oldMarka) displayOldValue = oldMarka.marka_adi
          if (newMarka) displayNewValue = newMarka.marka_adi
        }
        
        if (key === 'model_id') {
          const oldModel = models.find(m => m.id === parseInt(oldValue))
          const newModel = models.find(m => m.id === parseInt(newValue))
          if (oldModel) displayOldValue = oldModel.model_adi
          if (newModel) displayNewValue = newModel.model_adi
        }
        
        // Display values kullan (varsa)
        if (oldData._display_values) {
          if (key === 'marka_id') displayOldValue = oldData._display_values.marka || displayOldValue
          if (key === 'model_id') displayOldValue = oldData._display_values.model || displayOldValue
          if (key === 'lokasyon_id') displayOldValue = oldData._display_values.lokasyon || displayOldValue
          if (key === 'atanan_personel_id') displayOldValue = oldData._display_values.personel || displayOldValue
        }
        
        if (newData._display_values) {
          if (key === 'marka_id') displayNewValue = newData._display_values.marka || displayNewValue
          if (key === 'model_id') displayNewValue = newData._display_values.model || displayNewValue
          if (key === 'lokasyon_id') displayNewValue = newData._display_values.lokasyon || displayNewValue
          if (key === 'atanan_personel_id') displayNewValue = newData._display_values.personel || displayNewValue
        }

        changes.push({
          field: importantFields[key],
          oldValue: displayOldValue,
          newValue: displayNewValue,
        })
      }
    })

    if (changes.length === 0) return null

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Değişiklikler:
        </Typography>
        {changes.map((change, idx) => (
          <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>{change.field}:</strong>
            </Typography>
            <Typography variant="body2" color="error.main">
              Eski: {change.oldValue}
            </Typography>
            <Typography variant="body2" color="success.main">
              Yeni: {change.newValue}
            </Typography>
          </Box>
        ))}
      </Box>
    )
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Geçmiş verileri yükleniyor...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/inventory')}
        >
          Geri Dön
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/inventory')}
            sx={{ mr: 2 }}
          >
            Geri
          </Button>
          <HistoryIcon sx={{ mr: 1 }} />
          <Typography variant="h4">
            Ekipman Geçmişi
          </Typography>
        </Box>
        
        {history.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<ExcelIcon />}
            onClick={handleExcelExport}
            sx={{ ml: 2 }}
          >
            Excel İndir
          </Button>
        )}
      </Box>

      {/* Ekipman Bilgileri */}
      {equipment && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <ComputerIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Mevcut Durum
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                Marka/Model
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {equipment.markalar && equipment.modeller 
                  ? `${equipment.markalar.marka_adi} ${equipment.modeller.model_adi}`
                  : equipment.marka_model || '-'
                }
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                MAC Adresi
              </Typography>
              <Typography variant="body1">
                {equipment.mac_adresi || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                Seri No
              </Typography>
              <Typography variant="body1">
                {equipment.seri_no || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                Lokasyon
              </Typography>
              <Chip
                label={equipment.lokasyonlar?.lokasyon_adi || 'Bilinmiyor'}
                color="primary"
                size="small"
              />
            </Grid>
            {equipment.atanan_personel && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Atanan Personel
                </Typography>
                <Typography variant="body1">
                  {`${equipment.atanan_personel.ad} ${equipment.atanan_personel.soyad}`}
                </Typography>
              </Grid>
            )}
            {!equipment.atanan_personel && equipment.agent && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Agent (Eski Sistem)
                </Typography>
                <Typography variant="body1">
                  {equipment.agent}
                </Typography>
              </Grid>
            )}
            {equipment.ofise_giris_tarihi && (
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Ofise Giriş Tarihi
                </Typography>
                <Typography variant="body1">
                  {new Date(equipment.ofise_giris_tarihi).toLocaleDateString('tr-TR')}
                </Typography>
              </Grid>
            )}
            {equipment.ofisten_cikis_tarihi && (
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Ofisten Çıkış Tarihi
                </Typography>
                <Typography variant="body1">
                  {new Date(equipment.ofisten_cikis_tarihi).toLocaleDateString('tr-TR')}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Geçmiş Timeline */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          İşlem Geçmişi ({history.length} kayıt)
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {history.length === 0 ? (
          <Alert severity="info">
            Bu ekipman için henüz geçmiş kaydı bulunmamaktadır.
          </Alert>
        ) : (
          <Box>
            {history.map((record) => (
              <Card key={record.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white'
                        }}
                      >
                        {getOperationIcon(record.islem_tipi)}
                      </Box>
                      <Box>
                        <Typography variant="h6">
                          {record.islem_tipi}
                        </Typography>
                        {record.degisiklik_sayisi !== undefined && record.degisiklik_sayisi > 0 && (
                          <Chip 
                            label={`${record.degisiklik_sayisi} alan değişti`}
                            color="warning"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(record.created_at).toLocaleString('tr-TR')}
                    </Typography>
                  </Box>

                      {/* Yapan kişi bilgisi */}
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          İşlemi yapan:
                        </Typography>
                        {record.yapan_personel ? (
                          <Chip
                            label={`${record.yapan_personel.ad} ${record.yapan_personel.soyad}`}
                            color="info"
                            size="small"
                          />
                        ) : record.degisiklik_yapan ? (
                          <Typography variant="body2" fontWeight="medium">
                            {record.degisiklik_yapan}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary" fontStyle="italic">
                            Bilinmiyor
                          </Typography>
                        )}
                      </Box>

                      {record.islem_tipi === 'Yeni Kayıt' ? (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2">
                              Kayıt Bilgileri
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {formatJsonData(record.yeni_degerler)}
                          </AccordionDetails>
                        </Accordion>
                      ) : (
                        <Box>
                          {record.degisiklik_sayisi !== undefined && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              <Typography variant="body2">
                                Bu güncelleme işleminde <strong>{record.degisiklik_sayisi} alan</strong> değiştirildi.
                              </Typography>
                            </Alert>
                          )}
                          
                          {renderDetailedChanges(record) || (
                            <Typography variant="body2" color="textSecondary">
                              Değişiklik detayları bulunamadı.
                            </Typography>
                          )}
                        </Box>
                      )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default InventoryHistory 