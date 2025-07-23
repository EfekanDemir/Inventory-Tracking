import { useState, useEffect } from 'react'
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
      // View tablosundan silinmiş ekipmanları al
      const { data, error } = await supabase
        .from('v_silinmis_ekipman')
        .select('*')
        .order('deleted_at', { ascending: false })

      if (error) throw error

      setRecords(data || [])
    } catch (error) {
      console.error('Geçmiş kayıtları yükleme hatası:', error)
      setError(`Geçmiş kayıtları yüklenirken bir hata oluştu: ${error.message}`)
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
      'ID': record.id || '',
      'MAC Adresi': record.mac_adresi || '',
      'Marka/Model': record.marka_adi && record.model_adi 
        ? `${record.marka_adi} ${record.model_adi}`
        : '',
      'Seri No': record.seri_no || '',
      'Son Konum': record.lokasyon_adi || '',
      'Son Atanan': record.personel_ad && record.personel_soyad
        ? `${record.personel_ad} ${record.personel_soyad}`
        : '',
      'Silme Nedeni': getArchiveReasonLabel(record.arsiv_nedeni || 'SILINDI'),
      'Silme Tarihi': new Date(record.deleted_at).toLocaleDateString('tr-TR'),
      'Silen Kişi': record.silen_personel_ad && record.silen_personel_soyad
        ? `${record.silen_personel_ad} ${record.silen_personel_soyad}`
        : '',
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
    if (!window.confirm('Bu kayıt geri yüklenecek. Emin misiniz?')) {
      return
    }

    setLoading(true)
    try {
      // Mevcut kullanıcı ID'sini al
      const { data: { user } } = await supabase.auth.getUser()
      let personelId = 1 // Varsayılan değer
      
      if (user) {
        // Personel ID'sini al
        const { data: personelData } = await supabase
          .from('personel')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (personelData) {
          personelId = personelData.id
        }
      } else {
        console.log('Kullanıcı giriş yapmamış, varsayılan personel ID kullanılıyor')
      }

      // Soft restore fonksiyonunu çağır
      const { error } = await supabase
        .rpc('soft_restore_ekipman', {
          p_ekipman_id: record.id,
          p_restore_personel_id: personelId
        })

      if (error) {
        console.error('Restore hatası:', error)
        showToast('Kayıt geri yüklenirken hata oluştu.', 'error')
        return
      }

      showToast('Kayıt başarıyla geri yüklendi.', 'success')
      
      // Verileri yeniden yükle
      await fetchHistoricalRecords()
      
    } catch (error) {
      console.error('Restore işlemi hatası:', error)
      showToast('Kayıt geri yüklenirken hata oluştu.', 'error')
    } finally {
      setLoading(false)
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
                {records.filter(r => r.is_deleted === true).length}
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
                {records.filter(r => r.ofise_giris_tarihi).length}
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
                {records.filter(r => r.calismma_durumu === 'Hurdaya Ayrıldı').length}
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
                <TableCell>{record.id}</TableCell>
                <TableCell>{record.mac_adresi || '-'}</TableCell>
                <TableCell>
                  {record.marka_adi && record.model_adi 
                    ? `${record.marka_adi} ${record.model_adi}`
                    : '-'
                  }
                </TableCell>
                <TableCell>{record.seri_no || '-'}</TableCell>
                <TableCell>{record.lokasyon_adi || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={getArchiveReasonLabel(record.arsiv_nedeni || 'SILINDI')}
                    color={getArchiveReasonColor(record.arsiv_nedeni || 'SILINDI')}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(record.deleted_at).toLocaleDateString('tr-TR')}
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