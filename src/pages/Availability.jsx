import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  CheckCircle as AvailableIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { supabase } from '../config/supabase'
import { showToast } from '../utils/notificationUtils'

const Availability = () => {
  const navigate = useNavigate()
  const [equipmentData, setEquipmentData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [locations, setLocations] = useState([])

  // İstatistikler
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    inUse: 0,
    availabilityRate: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterData()
  }, [equipmentData, searchTerm, statusFilter, locationFilter])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Ekipman verilerini JOIN'li olarak al
      const { data: equipmentList, error: equipmentError } = await supabase
        .from('ekipman_envanteri')
        .select(`
          *,
          markalar(marka_adi),
          modeller(model_adi),
          lokasyonlar(lokasyon_adi),
          atanan_personel:personel!atanan_personel_id(ad, soyad, email, sicil_no)
        `)
        .order('created_at', { ascending: false })

      if (equipmentError) throw equipmentError

      // Lokasyonları ayrıca al
      const { data: locationList, error: locationError } = await supabase
        .from('lokasyonlar')
        .select('id, lokasyon_adi')
        .order('lokasyon_adi')

      if (locationError) throw locationError

      setEquipmentData(equipmentList || [])
      setLocations(locationList || [])

      // İstatistikleri hesapla
      const total = equipmentList?.length || 0
      const available = equipmentList?.filter(item => !item.atanan_personel_id).length || 0
      const inUse = total - available
      const availabilityRate = total > 0 ? Math.round((available / total) * 100) : 0

      setStats({ total, available, inUse, availabilityRate })

    } catch (error) {
      console.error('Veri yükleme hatası:', error)
      setError('Müsaitlik verileri yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    let filtered = [...equipmentData]

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchFields = [
          item.mac_adresi,
          item.seri_no,
          item.markalar?.marka_adi,
          item.modeller?.model_adi,
          item.lokasyonlar?.lokasyon_adi,
          item.atanan_personel ? `${item.atanan_personel.ad} ${item.atanan_personel.soyad}` : '',
          item.aciklama
        ]
        return searchFields.some(field => 
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    // Durum filtresi
    if (statusFilter !== 'all') {
      if (statusFilter === 'available') {
        filtered = filtered.filter(item => !item.atanan_personel_id)
      } else if (statusFilter === 'inUse') {
        filtered = filtered.filter(item => item.atanan_personel_id)
      }
    }

    // Lokasyon filtresi
    if (locationFilter !== 'all') {
      filtered = filtered.filter(item => item.lokasyon_id === parseInt(locationFilter))
    }

    setFilteredData(filtered)
  }

  const getStatusColor = (item) => {
    return item.atanan_personel_id ? 'warning' : 'success'
  }

  const getStatusText = (item) => {
    return item.atanan_personel_id ? 'Kullanımda' : 'Müsait'
  }

  const getDisplayName = (item) => {
    const marka = item.markalar?.marka_adi || ''
    const model = item.modeller?.model_adi || ''
    return `${marka} ${model}`.trim() || 'Bilinmeyen Model'
  }

  const handleEdit = (equipmentId) => {
    navigate(`/add/${equipmentId}`)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Müsaitlik verileri yükleniyor...
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
          startIcon={<RefreshIcon />}
          onClick={fetchData}
        >
          Yeniden Dene
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Başlık */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <AssignmentIcon sx={{ mr: 1 }} />
          <Typography variant="h4">
            Ekipman Müsaitlik Durumu
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
        >
          Yenile
        </Button>
      </Box>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Toplam Ekipman
                  </Typography>
                  <Typography variant="h4">
                    {stats.total}
                  </Typography>
                </Box>
                <ComputerIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Müsait Ekipman
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.available}
                  </Typography>
                </Box>
                <AvailableIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Kullanımda
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.inUse}
                  </Typography>
                </Box>
                <PersonIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Müsaitlik Oranı
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    %{stats.availabilityRate}
                  </Typography>
                </Box>
                <InfoIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtreler */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtreler
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Arama"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Marka, model, seri no, personel vb."
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={statusFilter}
                label="Durum"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="available">Müsait</MenuItem>
                <MenuItem value="inUse">Kullanımda</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Lokasyon</InputLabel>
              <Select
                value={locationFilter}
                label="Lokasyon"
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <MenuItem value="all">Tüm Lokasyonlar</MenuItem>
                {locations.map(location => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.lokasyon_adi}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Ekipman Listesi */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ekipman Detayları ({filteredData.length} kayıt)
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {filteredData.length === 0 ? (
          <Alert severity="info">
            Filtrelere uygun ekipman bulunamadı.
          </Alert>
        ) : (
          <List>
            {filteredData.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: getStatusColor(item) === 'success' ? 'success.main' : 'warning.main' 
                    }}>
                      {item.atanan_personel_id ? <PersonIcon /> : <AvailableIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {getDisplayName(item)}
                        </Typography>
                        <Chip 
                          label={getStatusText(item)} 
                          color={getStatusColor(item)} 
                          size="small" 
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Seri No:</strong> {item.seri_no || '-'} | 
                          <strong> MAC:</strong> {item.mac_adresi || '-'} | 
                          <strong> Lokasyon:</strong> {item.lokasyonlar?.lokasyon_adi || '-'}
                        </Typography>
                        {item.atanan_personel_id && (
                          <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
                            <strong>Kullanan:</strong> {item.atanan_personel.ad} {item.atanan_personel.soyad}
                            {item.atanan_personel.email && ` (${item.atanan_personel.email})`}
                          </Typography>
                        )}
                        {item.ofisten_cikis_tarihi && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            <strong>Çıkış Tarihi:</strong> {new Date(item.ofisten_cikis_tarihi).toLocaleDateString('tr-TR')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Tooltip title="Düzenle">
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleEdit(item.id)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredData.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  )
}

export default Availability 