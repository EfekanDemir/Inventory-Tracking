import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  GetApp as ExcelIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material'
import { supabase } from '../config/supabase'
import { exportToExcel } from '../utils/exportUtils'
import { showToast } from '../utils/notificationUtils'

const HistoricalRecords = () => {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredRecords, setFilteredRecords] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [filterArchiveReason, setFilterArchiveReason] = useState('')

  // Filtreleme seçenekleri
  const archiveReasons = [
    { value: '', label: 'Tümü' },
    { value: 'SILINDI', label: 'Silindi' },
    { value: 'OFISE_GIRDI', label: 'Ofise Girdi' },
    { value: 'HURDAYA_AYRILDI', label: 'Hurdaya Ayrıldı' },
  ]

  useEffect(() => {
    fetchHistoricalRecords()
  }, [])

  // Arama ve filtreleme
  useEffect(() => {
    let filtered = [...records]

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(record =>
        Object.values(record).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Arşiv nedeni filtresi
    if (filterArchiveReason) {
      filtered = filtered.filter(record => record.arsiv_nedeni === filterArchiveReason)
    }

    setFilteredRecords(filtered)
  }, [records, searchTerm, filterArchiveReason])

  const fetchHistoricalRecords = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ekipman_gecmisi')
        .select(`
          *,
          markalar(marka_adi),
          modeller(model_adi),
          lokasyonlar(lokasyon_adi),
          atanan_personel:personel!atanan_personel_id(ad, soyad),
          arsiv_yapan:personel!arsiv_yapan_id(ad, soyad)
        `)
        .order('arsiv_tarihi', { ascending: false })

      if (error) throw error

      setRecords(data || [])
    } catch (error) {
      console.error('Geçmiş kayıtları yükleme hatası:', error)
      setError('Geçmiş kayıtları yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const handleExcelExport = () => {
    if (filteredRecords.length === 0) {
      showToast('Export edilecek kayıt bulunmamaktadır.', 'warning')
      return
    }

    const excelData = filteredRecords.map(record => ({
      'Orijinal ID': record.orijinal_id || '',
      'MAC Adresi': record.mac_adresi || '',
      'Marka/Model': record.markalar && record.modeller 
        ? `${record.markalar.marka_adi} ${record.modeller.model_adi}`
        : '',
      'Seri No': record.seri_no || '',
      'Son Konum': record.lokasyonlar?.lokasyon_adi || '',
      'Son Atanan': record.atanan_personel 
        ? `${record.atanan_personel.ad} ${record.atanan_personel.soyad}`
        : '',
      'Arşiv Nedeni': getArchiveReasonLabel(record.arsiv_nedeni),
      'Arşiv Tarihi': new Date(record.arsiv_tarihi).toLocaleDateString('tr-TR'),
      'Arşiv Yapan': record.arsiv_yapan 
        ? `${record.arsiv_yapan.ad} ${record.arsiv_yapan.soyad}`
        : '',
      'Arşiv Notu': record.arsiv_notu || '',
      'Kayıt Tarihi': new Date(record.created_at).toLocaleDateString('tr-TR'),
    }))

    const result = exportToExcel(excelData, 'gecmis_kayitlar')
    
    if (result.success) {
      showToast(result.message, 'success')
    } else {
      showToast(result.message, 'error')
    }
  }

  const getArchiveReasonLabel = (reason) => {
    const reasonMap = {
      'SILINDI': 'Silindi',
      'OFISE_GIRDI': 'Ofise Girdi',
      'HURDAYA_AYRILDI': 'Hurdaya Ayrıldı',
    }
    return reasonMap[reason] || reason
  }

  const getArchiveReasonColor = (reason) => {
    const colorMap = {
      'SILINDI': 'error',
      'OFISE_GIRDI': 'success',
      'HURDAYA_AYRILDI': 'warning',
    }
    return colorMap[reason] || 'default'
  }

  const handleViewDetails = (record) => {
    // Geçmiş kayıt detaylarını görüntüle
    navigate(`/history/${record.orijinal_id || record.id}`)
  }

  const handleRestore = async (record) => {
    if (!window.confirm('Bu kaydı geri yüklemek istediğinizden emin misiniz?')) {
      return
    }

    try {
      // Önce aynı seri no veya MAC adresi olan kayıt var mı kontrol et
      const checkConditions = []
      
      if (record.seri_no) {
        checkConditions.push(`seri_no.eq.${record.seri_no}`)
      }
      
      if (record.mac_adresi) {
        checkConditions.push(`mac_adresi.eq.${record.mac_adresi}`)
      }

      if (checkConditions.length > 0) {
        const { data: existingRecords, error: checkError } = await supabase
          .from('ekipman_envanteri')
          .select('id, seri_no, mac_adresi')
          .or(checkConditions.join(','))
          .limit(1)

        if (checkError) {
          console.error('Çakışma kontrol hatası:', checkError)
        } else if (existingRecords && existingRecords.length > 0) {
          const existing = existingRecords[0]
          let conflictMessage = 'Bu kayıt geri yüklenemez çünkü: '
          
          if (existing.seri_no === record.seri_no) {
            conflictMessage += `Seri numarası "${record.seri_no}" zaten kullanımda. `
          }
          
          if (existing.mac_adresi === record.mac_adresi) {
            conflictMessage += `MAC adresi "${record.mac_adresi}" zaten kullanımda. `
          }
          
          showToast(conflictMessage, 'error')
          return
        }
      }

      // Kaydı geri yükle
      const { error: restoreError } = await supabase
        .from('ekipman_envanteri')
        .insert([{
          mac_adresi: record.mac_adresi,
          seri_no: record.seri_no,
          barkod: record.barkod,
          marka_id: record.marka_id,
          model_id: record.model_id,
          lokasyon_id: record.lokasyon_id,
          atanan_personel_id: record.atanan_personel_id,
          satin_alma_tarihi: record.satin_alma_tarihi,
          garanti_bitis_tarihi: record.garanti_bitis_tarihi,
          ofise_giris_tarihi: record.ofise_giris_tarihi,
          ofisten_cikis_tarihi: record.ofisten_cikis_tarihi,
          geri_donus_tarihi: record.geri_donus_tarihi,
          satin_alma_fiyati: record.satin_alma_fiyati,
          amortisman_suresi: record.amortisman_suresi,
          defter_degeri: record.defter_degeri,
          fiziksel_durum: record.fiziksel_durum,
          calismma_durumu: record.calismma_durumu,
          aciklama: record.aciklama,
          ozel_notlar: record.ozel_notlar,
          created_by: record.created_by,
          updated_by: record.updated_by,
        }])

      if (restoreError) throw restoreError

      // Geçmiş kayıttan sil
      const { error: deleteError } = await supabase
        .from('ekipman_gecmisi')
        .delete()
        .eq('id', record.id)

      if (deleteError) throw deleteError

      showToast('Kayıt başarıyla geri yüklendi!', 'success')
      await fetchHistoricalRecords()
    } catch (error) {
      console.error('Geri yükleme hatası:', error)
      
      // Daha detaylı hata mesajları
      if (error.code === '23505') {
        if (error.details?.includes('seri_no')) {
          showToast('Bu seri numarası zaten kullanımda. Geri yükleme başarısız.', 'error')
        } else if (error.details?.includes('mac_adresi')) {
          showToast('Bu MAC adresi zaten kullanımda. Geri yükleme başarısız.', 'error')
        } else {
          showToast('Benzersiz alan çakışması nedeniyle geri yükleme başarısız.', 'error')
        }
      } else {
        showToast('Kayıt geri yüklenirken hata oluştu.', 'error')
      }
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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
            Geçmiş Kayıtlar
          </Typography>
        </Box>
        
        {filteredRecords.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<ExcelIcon />}
            onClick={handleExcelExport}
          >
            Excel İndir
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* İstatistikler */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Toplam Geçmiş Kayıt
              </Typography>
              <Typography variant="h4">
                {records.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Silinen Kayıtlar
              </Typography>
              <Typography variant="h4">
                {records.filter(r => r.arsiv_nedeni === 'SILINDI').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ofise Giren
              </Typography>
              <Typography variant="h4">
                {records.filter(r => r.arsiv_nedeni === 'OFISE_GIRDI').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Hurdaya Ayrılan
              </Typography>
              <Typography variant="h4">
                {records.filter(r => r.arsiv_nedeni === 'HURDAYA_AYRILDI').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtreler */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Arşiv Nedeni</InputLabel>
              <Select
                value={filterArchiveReason}
                onChange={(e) => setFilterArchiveReason(e.target.value)}
                label="Arşiv Nedeni"
              >
                {archiveReasons.map((reason) => (
                  <MenuItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tablo */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>MAC Adresi</strong></TableCell>
              <TableCell><strong>Marka/Model</strong></TableCell>
              <TableCell><strong>Seri No</strong></TableCell>
              <TableCell><strong>Son Konum</strong></TableCell>
              <TableCell><strong>Arşiv Nedeni</strong></TableCell>
              <TableCell><strong>Arşiv Tarihi</strong></TableCell>
              <TableCell><strong>İşlemler</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.orijinal_id || record.id}</TableCell>
                <TableCell>{record.mac_adresi || '-'}</TableCell>
                <TableCell>
                  {record.markalar && record.modeller 
                    ? `${record.markalar.marka_adi} ${record.modeller.model_adi}`
                    : '-'
                  }
                </TableCell>
                <TableCell>{record.seri_no || '-'}</TableCell>
                <TableCell>{record.lokasyonlar?.lokasyon_adi || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={getArchiveReasonLabel(record.arsiv_nedeni)}
                    color={getArchiveReasonColor(record.arsiv_nedeni)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(record.arsiv_tarihi).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(record)}
                    title="Detayları Görüntüle"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRestore(record)}
                    title="Geri Yükle"
                    color="primary"
                  >
                    <RestoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredRecords.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            Geçmiş kayıt bulunamadı.
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default HistoricalRecords 