import React, { useState, useEffect } from 'react'
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
  Print as PrintIcon,
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

  // Verileri yükle
  const fetchEquipment = async () => {
    setLoading(true)
    setError(null)
    try {
      // JOIN'li sorgu ile tüm ilişkili verileri al
      const { data, error } = await supabase
        .from('ekipman_envanteri')
        .select(`
          *,
          markalar(marka_adi),
          modeller(model_adi),
          lokasyonlar(lokasyon_adi),
          atanan_personel:personel!atanan_personel_id(ad, soyad),
          mac_adresleri(mac_adresi),
          seri_numaralari(seri_no)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Verileri işle ve computed field'ları oluştur
      const processedData = (data || []).map(item => ({
        ...item,
        // MAC adresi ve seri numarasını al
        mac_adresi: item.mac_adresleri?.mac_adresi || '',
        seri_no: item.seri_numaralari?.seri_no || '',
        marka_model: item.markalar && item.modeller 
          ? `${item.markalar.marka_adi} ${item.modeller.model_adi}` 
          : 'Bilgi Yok',
        konum_adi: item.lokasyonlar?.lokasyon_adi || 'Bilinmiyor',
        agent_name: item.atanan_personel 
          ? `${item.atanan_personel.ad} ${item.atanan_personel.soyad}`
          : (item.agent || '-') // Fallback to existing agent field
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

  // Seçili kayıtları geçmişe aktar
  const handleArchiveSelected = async () => {
    if (selectedRows.length === 0) {
      showToast('Geçmişe aktarmak için en az bir kayıt seçin.', 'warning')
      return
    }

    if (!window.confirm(`${selectedRows.length} kayıt geçmişe aktarılacak. Emin misiniz?`)) {
      return
    }

    setLoading(true)
    try {
      // Seçili kayıtları al
      const recordsToArchive = equipment.filter(item => selectedRows.includes(item.id))
      
      // Kayıtları geçmiş tablosuna ekle
      const archiveData = recordsToArchive.map(record => ({
        orijinal_id: record.id,
        mac_adresi: record.mac_adresi || '', // JOIN'den gelen değer
        seri_no: record.seri_no || '', // JOIN'den gelen değer
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
        arsiv_nedeni: 'SILINDI',
        arsiv_notu: 'Kullanıcı tarafından silindi',
        created_by: record.created_by,
        updated_by: record.updated_by,
      }))

      // Önce geçmişe ekle
      const { error: archiveError } = await supabase
        .from('ekipman_gecmisi')
        .insert(archiveData)

      if (archiveError) {
        console.error('Geçmişe aktarma hatası:', archiveError)
        showToast('Kayıtlar geçmişe aktarılırken hata oluştu.', 'error')
        return
      }

      // İlişkili hareket kayıtlarını sil (CASCADE çalışmıyorsa manuel sil)
      const { error: movementError } = await supabase
        .from('envanter_hareketleri')
        .delete()
        .in('ekipman_id', selectedRows)

      if (movementError) {
        console.error('Hareket kayıtları silme hatası:', movementError)
        // Hata olsa bile devam et, belki CASCADE zaten çalışmıştır
      }

      // Ana tablodan kayıtları sil
      const { error: deleteError } = await supabase
        .from('ekipman_envanteri')
        .delete()
        .in('id', selectedRows)

      if (deleteError) {
        console.error('Silme hatası:', deleteError)
        showToast('Kayıtlar silinirken hata oluştu.', 'error')
        return
      }

      showToast(`${selectedRows.length} kayıt başarıyla geçmişe aktarıldı.`, 'success')
      setSelectedRows([])
      await fetchEquipment() // Listeyi yenile
    } catch (error) {
      console.error('Geçmişe aktarma hatası:', error)
      showToast('Kayıtlar geçmişe aktarılırken hata oluştu.', 'error')
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
      const { data: officeLocation, error: checkError } = await supabase
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

  // Ofise giriş tarihi dolu olan kayıtları otomatik geçmişe aktar
  const checkAndArchiveOfficeEntries = async () => {
    try {
      // Ofise giriş tarihi dolu olan kayıtları bul
      const { data: officeEntries, error } = await supabase
        .from('ekipman_envanteri')
        .select('*')
        .not('ofise_giris_tarihi', 'is', null)

      if (error) {
        console.error('Ofise giriş kayıtları kontrol hatası:', error)
        return
      }

      if (officeEntries && officeEntries.length > 0) {
        console.log(`${officeEntries.length} adet ofise giriş kaydı bulundu, geçmişe aktarılıyor...`)

        // Bu kayıtları geçmişe aktar
        const archiveData = officeEntries.map(record => ({
          orijinal_id: record.id,
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
          arsiv_nedeni: 'OFISE_GIRDI',
          arsiv_notu: 'Otomatik: Ofise giriş tarihi dolu',
          created_by: record.created_by,
          updated_by: record.updated_by,
        }))

        // Önce geçmişe ekle
        const { error: archiveError } = await supabase
          .from('ekipman_gecmisi')
          .insert(archiveData)

        if (archiveError) {
          console.error('Otomatik geçmişe aktarma hatası:', archiveError)
          return
        }

        // İlişkili hareket kayıtlarını sil (CASCADE çalışmıyorsa manuel sil)
        const { error: movementError } = await supabase
          .from('envanter_hareketleri')
          .delete()
          .in('ekipman_id', officeEntries.map(r => r.id))

        if (movementError) {
          console.error('Hareket kayıtları silme hatası:', movementError)
          // Hata olsa bile devam et, belki CASCADE zaten çalışmıştır
        }

        // Ana tablodan sil (CASCADE ile hareket geçmişi de silinecek)
        const { error: deleteError } = await supabase
          .from('ekipman_envanteri')
          .delete()
          .in('id', officeEntries.map(r => r.id))

        if (deleteError) {
          console.error('Otomatik silme hatası:', deleteError)
          return
        }

        console.log(`${officeEntries.length} kayıt otomatik olarak geçmişe aktarıldı`)
        showToast(`${officeEntries.length} kayıt ofise giriş nedeniyle geçmişe aktarıldı`, 'info')
      }
    } catch (error) {
      console.error('Otomatik geçmiş aktarım hatası:', error)
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

  // Konum durumuna göre renk
  const getLocationChipColor = (location) => {
    switch (location) {
      case 'BOŞTA': return 'success'
      case 'AGENT': return 'primary'
      case 'EĞİTMEN': return 'secondary'
      case 'AGENT TR': return 'warning'
      default: return 'default'
    }
  }

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
      width: 120,
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
              onClick={handleArchiveSelected}
              color="error"
            >
              Geçmişe Aktar ({selectedRows.length})
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