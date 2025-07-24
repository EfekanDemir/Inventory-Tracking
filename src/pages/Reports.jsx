import React, { useState, useEffect } from 'react'
import {
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Divider,
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { tr } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import {
  Assessment as ReportIcon,
  GetApp as DownloadIcon,
  DateRange as DateIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material'
import { supabase } from '../config/supabase'
import { exportSummaryReport } from '../utils/exportUtils'
import { showToast } from '../utils/notificationUtils'

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState({
    totalStats: {},
    locationStats: [],
    brandStats: [],
    agentStats: [],
    monthlyTrends: [],
    dailyActivity: [],
  })
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  })
  const [reportType, setReportType] = useState('monthly')

  // Renk paleti
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

  useEffect(() => {
    fetchReportData()
  }, [dateRange, reportType])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      // Genel istatistikler
      const totalStats = await fetchTotalStats()
      
      // Konum dağılımı
      const locationStats = await fetchLocationStats()
      
      // Marka dağılımı
      const brandStats = await fetchBrandStats()
      
      // Agent dağılımı
      const agentStats = await fetchAgentStats()
      
      // Aylık trendler
      const monthlyTrends = await fetchMonthlyTrends()
      
      // Günlük aktivite
      const dailyActivity = await fetchDailyActivity()

      setReportData({
        totalStats,
        locationStats,
        brandStats,
        agentStats,
        monthlyTrends,
        dailyActivity,
      })
    } catch (error) {
      console.error('Rapor verisi yükleme hatası:', error)
      showToast('Rapor verileri yüklenirken hata oluştu.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchTotalStats = async () => {
    const { count: totalEquipment } = await supabase
      .from('ekipman_envanteri')
      .select('*', { count: 'exact', head: true })

    // Tüm ekipmanları personel bilgileriyle al
    const { data: allEquipment } = await supabase
      .from('ekipman_envanteri')
      .select(`
        id,
        atanan_personel_id,
        atanan_personel:personel!atanan_personel_id(ad, soyad)
      `)

    // Boşta olan ekipmanlar (atanan_personel_id null olanlar)
    const availableEquipment = allEquipment?.filter(item => !item.atanan_personel_id).length || 0
    
    // Kullanımda olan ekipmanlar (atanan_personel_id var olanlar)
    const inUseEquipment = allEquipment?.filter(item => item.atanan_personel_id).length || 0

    // Aktif agent sayısı (benzersiz atanan personel)
    const uniqueAgents = new Set(
      allEquipment
        ?.filter(item => item.atanan_personel && item.atanan_personel.ad)
        .map(item => `${item.atanan_personel.ad} ${item.atanan_personel.soyad}`)
    )

    return {
      totalEquipment: totalEquipment || 0,
      availableEquipment: availableEquipment || 0,
      inUseEquipment: inUseEquipment || 0,
      activeAgents: uniqueAgents.size || 0,
    }
  }

  const fetchLocationStats = async () => {
    const { data } = await supabase
      .from('ekipman_envanteri')
      .select(`
        id,
        atanan_personel_id,
        lokasyonlar(lokasyon_adi)
      `)

    const locationCounts = {}
    data?.forEach(item => {
      let location
      if (!item.atanan_personel_id) {
        location = 'Boşta'
      } else {
        location = item.lokasyonlar?.lokasyon_adi || 'Atanmış'
      }
      locationCounts[location] = (locationCounts[location] || 0) + 1
    })

    return Object.entries(locationCounts).map(([name, value]) => ({ name, value }))
  }

  const fetchBrandStats = async () => {
    const { data } = await supabase
      .from('ekipman_envanteri')
      .select(`
        id,
        markalar(marka_adi),
        modeller(model_adi)
      `)

    const brandCounts = {}
    data?.forEach(item => {
      const brand = item.markalar && item.modeller 
        ? `${item.markalar.marka_adi} ${item.modeller.model_adi}`
        : 'Bilinmiyor'
      brandCounts[brand] = (brandCounts[brand] || 0) + 1
    })

    return Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // En çok kullanılan 10 marka
  }

  const fetchAgentStats = async () => {
    const { data } = await supabase
      .from('ekipman_envanteri')
      .select(`
        id,
        atanan_personel:personel!atanan_personel_id(ad, soyad)
      `)
      .not('atanan_personel_id', 'is', null)

    const agentCounts = {}
    data?.forEach(item => {
      if (item.atanan_personel && item.atanan_personel.ad) {
        const agent = `${item.atanan_personel.ad} ${item.atanan_personel.soyad}`
        agentCounts[agent] = (agentCounts[agent] || 0) + 1
      }
    })

    return Object.entries(agentCounts)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // En çok ekipmanı olan 10 agent
  }

  const fetchMonthlyTrends = async () => {
    const { data } = await supabase
      .from('ekipman_envanteri')
      .select('created_at')
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString())
      .order('created_at')

    const monthlyData = {}
    data?.forEach(item => {
      const date = new Date(item.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
    })

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
      monthName: new Date(month + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
    }))
  }

  const fetchDailyActivity = async () => {
    const { data } = await supabase
      .from('envanter_hareketleri')
      .select('created_at, islem_tipi')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Son 30 gün
      .order('created_at')

    const dailyData = {}
    data?.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString('tr-TR')
      if (!dailyData[date]) {
        dailyData[date] = { date, 'Yeni Kayıt': 0, 'Güncelleme': 0 }
      }
      dailyData[date][item.islem_tipi] = (dailyData[date][item.islem_tipi] || 0) + 1
    })

    return Object.values(dailyData).slice(-14) // Son 14 gün
  }

  const handleExportReport = () => {
    const summaryData = {
      ...reportData.totalStats,
      locationStats: reportData.locationStats.reduce((acc, item) => {
        acc[item.name] = item.value
        return acc
      }, {}),
      brandStats: reportData.brandStats,
      agentStats: reportData.agentStats,
    }

    const result = exportSummaryReport(summaryData, 'detayli_envanter_raporu')
    if (result.success) {
      showToast(result.message, 'success')
    } else {
      showToast(result.message, 'error')
    }
  }

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Rapor verileri yükleniyor...
        </Typography>
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <ReportIcon sx={{ mr: 1 }} />
            <Typography variant="h4">Raporlar ve Analizler</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportReport}
          >
            Excel İndir
          </Button>
        </Box>

        {/* Filtreler */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Rapor Filtreleri
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Rapor Türü</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Rapor Türü"
                >
                  <MenuItem value="daily">Günlük</MenuItem>
                  <MenuItem value="weekly">Haftalık</MenuItem>
                  <MenuItem value="monthly">Aylık</MenuItem>
                  <MenuItem value="yearly">Yıllık</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={dateRange.start}
                onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Bitiş Tarihi"
                value={dateRange.end}
                onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Genel İstatistikler */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Toplam Ekipman
                </Typography>
                <Typography variant="h4">
                  {reportData.totalStats.totalEquipment}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Boşta Ekipman
                </Typography>
                <Typography variant="h4" color="success.main">
                  {reportData.totalStats.availableEquipment}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Kullanımda Ekipman
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {reportData.totalStats.inUseEquipment}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Aktif Agent
                </Typography>
                <Typography variant="h4" color="info.main">
                  {reportData.totalStats.activeAgents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Grafikler */}
        <Grid container spacing={3}>
          {/* Konum Dağılımı - Pie Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Konum Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.locationStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.locationStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Marka Dağılımı - Bar Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                En Çok Kullanılan Markalar
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.brandStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="brand" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Aylık Trend - Line Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Aylık Kayıt Trendi
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Günlük Aktivite - Bar Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Son 14 Gün Aktivite
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Yeni Kayıt" stackId="a" fill="#8884d8" />
                  <Bar dataKey="Güncelleme" stackId="a" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Agent İstatistikleri */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                En Aktif Agent'lar
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.agentStats} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="agent" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  )
}

export default Reports 