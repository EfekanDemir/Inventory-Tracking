import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  GetApp as ExcelIcon,
  QrCode as QrCodeIcon,

  Delete as DeleteIcon,
} from '@mui/icons-material'
import { supabase } from '../config/supabase'
import { exportToExcel } from '../utils/exportUtils'
import { generateBulkQRCodes, createQRCodePrintPage } from '../utils/qrCodeUtils'
import { showToast } from '../utils/notificationUtils'

const InventoryList = () => {
  const navigate = useNavigate()
  const [equipment, setEquipment] = useState([])
  const [filteredEquipment, setFilteredEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)
  const [selectedRows, setSelectedRows] = useState([])

  // Excel export - Seçili satırlar varsa onları, yoksa hepsini indir
  const handleExcelExport = () => {
    let dataToExport
    let filename = 'envanter_listesi'
    
    if (selectedRows.length > 0) {
      // Seçili satırlar varsa sadece onları indir
      dataToExport = equipment.filter(item => selectedRows.includes(item.id))
      filename = `secili_envanter_${selectedRows.length}_kayit`
      showToast(`${selectedRows.length} seçili kayıt Excel'e aktarılıyor...`, 'info')
    } else {
      // Seçili satır yoksa filtrelenmiş listeyi veya tüm listeyi indir
      dataToExport = filteredEquipment.length > 0 ? filteredEquipment : equipment
      showToast(`${dataToExport.length} kayıt Excel'e aktarılıyor...`, 'info')
    }
    
    const result = exportToExcel(dataToExport, filename)
    if (result.success) {
      showToast(result.message, 'success')
    } else {
      showToast(result.message, 'error')
    }
  }

  // QR kod oluşturma
  const handleQRCodeGeneration = async () => {
    const dataToProcess = selectedRows.length > 0 ? 
      equipment.filter(item => selectedRows.includes(item.id)) : 
      filteredEquipment.length > 0 ? filteredEquipment : equipment

    if (dataToProcess.length === 0) {
      showToast('QR kod oluşturmak için en az bir ekipman seçin.', 'warning')
      return
    }

    showToast('QR kodları oluşturuluyor...', 'info')
    
    const result = await generateBulkQRCodes(dataToProcess)
    if (result.success) {
      const printResult = createQRCodePrintPage(result.qrCodes)
      if (printResult.success) {
        showToast(`${result.qrCodes.length} adet QR kod yazdırma sayfası açıldı!`, 'success')
      } else {
        showToast('QR kod yazdırma sayfası oluşturulamadı.', 'error')
      }
    } else {
      showToast('QR kod oluşturma başarısız.', 'error')
    }
  }

  // Verileri yükle - View tablosu kullanarak
  const fetchEquipment = async () => {
    setLoading(true)
    setError(null)
    try {
      // View tablosundan aktif ekipmanları al
      const { data, error } = await supabase
        .from('v_aktif_ekipman')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Verileri işle ve computed field'ları oluştur
      const processedData = (data || []).map(item => ({
        ...item,
        marka_model: item.marka_adi && item.model_adi 
          ? `${item.marka_adi} ${item.model_adi}` 
          : 'Bilgi Yok',
        konum_adi: item.lokasyon_adi || 'Bilinmiyor',
        agent_name: item.personel_ad && item.personel_soyad
          ? `${item.personel_ad} ${item.personel_soyad}`
          : '-'
      }))
      
      setEquipment(processedData)
      setFilteredEquipment(processedData)
    } catch (error) {
      console.error('Envanter yükleme hatası:', error)
      setError(`Envanter verileri yüklenirken bir hata oluştu: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Soft delete ile kayıtları sil
  const handleSoftDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      showToast('Silmek için en az bir kayıt seçin.', 'warning')
      return
    }

    if (!window.confirm(`${selectedRows.length} kayıt silinecek. Bu işlem geri alınabilir. Emin misiniz?`)) {
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

      // Soft delete fonksiyonunu çağır
      const { data: deleteResult, error } = await supabase
        .rpc('soft_delete_multiple_ekipman', {
          p_ekipman_ids: selectedRows,
          p_silen_personel_id: personelId,
          p_silme_nedeni: 'MANUEL_SILME'
        })

      if (error) {
        console.error('Soft delete hatası:', error)
        showToast('Kayıtlar silinirken hata oluştu.', 'error')
        return
      }

      showToast(`${deleteResult} kayıt başarıyla silindi.`, 'success')
      setSelectedRows([])
      
      // Verileri yeniden yükle
      await fetchEquipment()
      
    } catch (error) {
      console.error('Soft delete işlemi hatası:', error)
      showToast('Kayıtlar silinirken hata oluştu.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Tekil kayıt silme
  const handleSoftDeleteSingle = async (ekipmanId) => {
    if (!window.confirm('Bu kayıt silinecek. Bu işlem geri alınabilir. Emin misiniz?')) {
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

      // Soft delete fonksiyonunu çağır
      const { error } = await supabase
        .rpc('soft_delete_ekipman', {
          p_ekipman_id: ekipmanId,
          p_silen_personel_id: personelId,
          p_silme_nedeni: 'MANUEL_SILME'
        })

      if (error) {
        console.error('Soft delete hatası:', error)
        showToast('Kayıt silinirken hata oluştu.', 'error')
        return
      }

      showToast('Kayıt başarıyla silindi.', 'success')
      
      // Verileri yeniden yükle
      await fetchEquipment()
      
    } catch (error) {
      console.error('Soft delete işlemi hatası:', error)
      showToast('Kayıt silinirken hata oluştu.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEquipment()
    // Sayfa yüklendiğinde gerekli kontrolleri yap
    ensureOfficeLocation()
    checkAndArchiveOfficeEntries()
  }, [])

  // "Ofis" lokasyonunu oluştur (yoksa)
  const ensureOfficeLocation = async () => {
    try {
      // "Ofis" lokasyonunu kontrol et
      const { error: checkError } = await supabase
        .from('lokasyonlar')
        .select('id')
        .eq('lokasyon_kodu', 'OFIS')
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        // "Ofis" lokasyonu yok, oluştur
        const { error: createError } = await supabase
          .from('lokasyonlar')
          .insert([{
            lokasyon_kodu: 'OFIS',
            lokasyon_adi: 'Ofis',
            lokasyon_tipi: 'DEPO',
            aciklama: 'Ofis içi ekipmanlar'
          }])

        if (createError) {
          console.error('Ofis lokasyonu oluşturma hatası:', createError)
        } else {
          console.log('Ofis lokasyonu oluşturuldu')
        }
      }
    } catch (error) {
      console.error('Ofis lokasyonu kontrol hatası:', error)
    }
  }

  // Ofise giriş tarihi dolu olan kayıtları otomatik soft delete yap
  const checkAndArchiveOfficeEntries = async () => {
    // İşlem kilidi kontrolü
    if (window.isArchiving) {
      console.log('Arşivleme işlemi zaten devam ediyor...');
      return;
    }
    
    try {
      // İşlem kilidini aktifleştir
      window.isArchiving = true;
      
      // Ofise giriş tarihi dolu olan aktif kayıtları bul
      const { data: officeEntries, error } = await supabase
        .from('v_aktif_ekipman')
        .select('*')
        .not('ofise_giris_tarihi', 'is', null)

      if (error) {
        console.error('Ofise giriş kayıtları kontrol hatası:', error)
        return
      }

      if (officeEntries && officeEntries.length > 0) {
        console.log(`${officeEntries.length} adet ofise giriş kaydı bulundu, soft delete yapılıyor...`)

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

        // Soft delete fonksiyonunu çağır
        const { data: deleteResult, error: deleteError } = await supabase
          .rpc('soft_delete_multiple_ekipman', {
            p_ekipman_ids: officeEntries.map(r => r.id),
            p_silen_personel_id: personelId,
            p_silme_nedeni: 'OFISE_GIRDI'
          })

        if (deleteError) {
          console.error('Otomatik soft delete hatası:', deleteError)
          return
        }

        console.log(`${deleteResult} kayıt otomatik olarak soft delete yapıldı`)
        showToast(`${deleteResult} kayıt ofise giriş nedeniyle soft delete yapıldı`, 'info')
        
        // Verileri yeniden yükle
        await fetchEquipment()
      }
    } catch (error) {
      console.error('Otomatik soft delete hatası:', error)
    } finally {
      // İşlem kilidini kaldır
      window.isArchiving = false;
    }
  }

  // Arama fonksiyonu
  useEffect(() => {
    if (!searchTerm) {
      setFilteredEquipment(equipment)
    } else {
      const filtered = equipment.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      setFilteredEquipment(filtered)
    }
  }, [searchTerm, equipment])



  // DataGrid sütunları
  const columns = [
    {
      field: 'mac_adresi',
      headerName: 'MAC Adresi',
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <span>{params.value || '-'}</span>
        </Tooltip>
      ),
    },
    {
      field: 'marka_model',
      headerName: 'Marka/Model',
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <span>{params.value || '-'}</span>
        </Tooltip>
      ),
    },
    {
      field: 'seri_no',
      headerName: 'Seri No',
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <span>{params.value || '-'}</span>
        </Tooltip>
      ),
    },
    {
      field: 'konum_adi',
      headerName: 'Lokasyon',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || 'Bilinmiyor'}
          color="primary"
          size="small"
        />
      ),
    },
    {
      field: 'agent_name',
      headerName: 'Agent',
      width: 150,
      renderCell: (params) => (
        <span>{params.value || '-'}</span>
      ),
    },
    { 
      field: 'ofise_giris_tarihi', 
      headerName: 'Ofise Giriş', 
      width: 120, 
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-' 
    },
    { 
      field: 'ofisten_cikis_tarihi', 
      headerName: 'Ofisten Çıkış', 
      width: 120, 
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-' 
    },
    {
      field: 'created_at',
      headerName: 'Kayıt Tarihi',
      width: 130,
      renderCell: (params) => (
        <span>
          {new Date(params.value).toLocaleDateString('tr-TR')}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Düzenle">
            <IconButton
              size="small"
              onClick={() => navigate(`/edit/${params.row.id}`)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Geçmiş">
            <IconButton
              size="small"
              onClick={() => navigate(`/history/${params.row.id}`)}
              color="secondary"
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sil">
            <IconButton
              size="small"
              onClick={() => handleSoftDeleteSingle(params.row.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Kayıtlar</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ExcelIcon />}
            onClick={handleExcelExport}
            color="success"
          >
            {selectedRows.length > 0 
              ? `Seçilenleri İndir (${selectedRows.length})` 
              : 'Excel İndir'
            }
          </Button>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            onClick={handleQRCodeGeneration}
            color="info"
          >
            QR Kod
          </Button>
          {selectedRows.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={handleSoftDeleteSelected}
              color="error"
            >
              Sil ({selectedRows.length})
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add')}
          >
            Yeni Ekipman Ekle
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="MAC adresi, marka, agent vb. ile ara..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEquipment}
            disabled={loading}
          >
            Yenile
          </Button>
        </Box>
      </Paper>

      <Paper elevation={2}>
        <DataGrid
          rows={filteredEquipment}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          checkboxSelection
          onRowSelectionModelChange={(newSelection) => {
            setSelectedRows(newSelection)
          }}
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: 'Envanter bulunamadı',
            noResultsOverlayLabel: 'Sonuç bulunamadı',
            errorOverlayDefaultLabel: 'Veri yüklenirken hata oluştu',
            toolbarColumns: 'Sütunlar',
            toolbarFilters: 'Filtreler',
            toolbarDensity: 'Yoğunluk',
            toolbarExport: 'Dışa Aktar',
            columnsPanelTextFieldLabel: 'Sütun ara',
            columnsPanelShowAllButton: 'Hepsini göster',
            columnsPanelHideAllButton: 'Hepsini gizle',
            footerRowSelected: (count) => `${count} satır seçildi`,
            footerTotalRows: 'Toplam Satır:',
            footerTotalVisibleRows: (visibleCount, totalCount) =>
              `${totalCount.toLocaleString()} toplam ${visibleCount.toLocaleString()} görünür`,
          }}
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
            },
          }}
        />
      </Paper>
    </Box>
  )
}

export default InventoryList