import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  LinearProgress,
  Alert,
  Button,
} from '@mui/material'
import {
  Inventory as InventoryIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingIcon,
  Settings as SetupIcon,
} from '@mui/icons-material'
import { supabase } from '../config/supabase'

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card elevation={2}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="h2" color={color}>
            {value}
          </Typography>
        </Box>
        <Box color={`${color}.main`}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalEquipment: 0,
    activeAgents: 0,
    availableEquipment: 0,
    inUseEquipment: 0,
    loading: true,
  })
  const [showSetupAlert, setShowSetupAlert] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Toplam ekipman sayısı
        const { count: totalCount } = await supabase
          .from('ekipman_envanteri')
          .select('*', { count: 'exact', head: true })

        // Tüm ekipmanları lokasyon bilgileriyle birlikte al
        const { data: allEquipment } = await supabase
          .from('ekipman_envanteri')
          .select(`
            id,
            lokasyon_id,
            atanan_personel_id,
            lokasyonlar(lokasyon_kodu),
            atanan_personel:personel!atanan_personel_id(ad, soyad)
          `)

        // Boşta olan ekipmanlar (atanan_personel_id null olanlar)
        const availableCount = allEquipment?.filter(item => !item.atanan_personel_id).length || 0
        
        // Kullanımda olan ekipmanlar (atanan_personel_id var olanlar)
        const inUseCount = allEquipment?.filter(item => item.atanan_personel_id).length || 0

        // Aktif agent sayısı (benzersiz atanan personel)
        const uniqueAgents = new Set(
          allEquipment
            ?.filter(item => item.atanan_personel && item.atanan_personel.ad)
            .map(item => `${item.atanan_personel.ad} ${item.atanan_personel.soyad}`)
        )

        setStats({
          totalEquipment: totalCount || 0,
          activeAgents: uniqueAgents.size || 0,
          availableEquipment: availableCount || 0,
          inUseEquipment: inUseCount || 0,
          loading: false,
        })

        // Check if setup is needed
        if (totalCount === 0) {
          checkSetupStatus()
        }
      } catch (error) {
        console.error('İstatistik yükleme hatası:', error)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const { data: deptData } = await supabase.from('departmanlar').select('id').limit(1)
      const { data: brandData } = await supabase.from('markalar').select('id').limit(1)
      
      if (!deptData?.length || !brandData?.length) {
        setShowSetupAlert(true)
      }
    } catch (error) {
      console.error('Setup durumu kontrolü hatası:', error)
    }
  }

  if (stats.loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          İstatistikler yükleniyor...
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Envanter Takip Sistemi - Ana Sayfa
      </Typography>

      {showSetupAlert && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<SetupIcon />}
              onClick={() => navigate('/setup')}
            >
              Kurulum Başlat
            </Button>
          }
        >
          <strong>Sistem kurulumu gerekli!</strong> Başlamak için temel verileri (departman, lokasyon, marka) eklemeniz gerekmektedir.
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Ekipman"
            value={stats.totalEquipment}
            icon={<InventoryIcon fontSize="large" />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Boşta Ekipman"
            value={stats.availableEquipment}
            icon={<LocationIcon fontSize="large" />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Kullanımda Ekipman"
            value={stats.inUseEquipment}
            icon={<TrendingIcon fontSize="large" />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aktif Agent"
            value={stats.activeAgents}
            icon={<PersonIcon fontSize="large" />}
            color="info"
          />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sistem Özellikleri
        </Typography>
        <Typography variant="body1" paragraph>
          • <strong>Otomatik Tamamlama:</strong> Daha önce girilen değerleri hatırlar ve seçmenizi sağlar
        </Typography>
        <Typography variant="body1" paragraph>
          • <strong>Geçmiş Takibi:</strong> Her ekipmanın kim tarafından ne zaman kullanıldığını izler
        </Typography>
        <Typography variant="body1" paragraph>
          • <strong>Profesyonel Arayüz:</strong> Modern ve kullanıcı dostu tasarım
        </Typography>
        <Typography variant="body1">
          • <strong>Gerçek Zamanlı Veriler:</strong> Supabase ile anlık veri senkronizasyonu
        </Typography>
      </Paper>
    </Box>
  )
}

export default Dashboard 