import React, { useState } from 'react'
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Box
} from '@mui/material'
import { 
  Delete as DeleteIcon, 
  Restore as RestoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

const EquipmentDelete = ({ equipment, onDelete, onRestore, refreshData }) => {
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [error, setError] = useState('')

  // Tek ekipman silme
  const handleDeleteSingle = async (equipmentId) => {
    setLoading(true)
    setError('')

    try {
      // Önce kontrol et
      const { data: equipment, error: checkError } = await supabase
        .from('ekipman_envanteri')
        .select(`
          id,
          lokasyon_id,
          atanan_personel_id,
          calismma_durumu,
          lokasyonlar(lokasyon_adi),
          personel(ad, soyad)
        `)
        .eq('id', equipmentId)
        .single()

      if (checkError) {
        throw checkError
      }

      // Silme işlemi
      const { data, error } = await supabase
        .from('ekipman_envanteri')
        .delete()
        .eq('id', equipmentId)
        .select()

      if (error) {
        throw error
      }

      toast.success(`Ekipman başarıyla silindi!`)
      if (onDelete) onDelete(equipmentId)
      if (refreshData) refreshData()

    } catch (error) {
      console.error('Silme hatası:', error)
      
      let errorMessage = 'Silme işlemi başarısız'
      
      if (error.code === '23503') {
        errorMessage = 'Bu ekipman başka tablolarda kullanılıyor. Önce bağımlı kayıtları silmelisiniz.'
      } else if (error.code === '42501') {
        errorMessage = 'Bu işlem için yetkiniz yok'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Soft delete
  const handleSoftDelete = async (equipmentId) => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('ekipman_envanteri')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: 1 // Kullanıcı ID'si
        })
        .eq('id', equipmentId)
        .eq('is_deleted', false)
        .select()

      if (error) {
        throw error
      }

      toast.success('Ekipman güvenli şekilde silindi!')
      if (onDelete) onDelete(equipmentId)
      if (refreshData) refreshData()

    } catch (error) {
      console.error('Soft delete hatası:', error)
      setError(error.message || 'Soft delete işlemi başarısız')
      toast.error('Soft delete işlemi başarısız')
    } finally {
      setLoading(false)
    }
  }

  // Soft delete geri yükleme
  const handleRestore = async (equipmentId) => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('ekipman_envanteri')
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          updated_by: 1 // Kullanıcı ID'si
        })
        .eq('id', equipmentId)
        .eq('is_deleted', true)
        .select()

      if (error) {
        throw error
      }

      toast.success('Ekipman başarıyla geri yüklendi!')
      if (onRestore) onRestore(equipmentId)
      if (refreshData) refreshData()

    } catch (error) {
      console.error('Geri yükleme hatası:', error)
      setError(error.message || 'Geri yükleme işlemi başarısız')
      toast.error('Geri yükleme işlemi başarısız')
    } finally {
      setLoading(false)
    }
  }

  // Çoklu silme
  const handleBulkDelete = async (equipmentIds) => {
    setLoading(true)
    setError('')

    try {
      // Önce kontrol et
      const { data: equipmentToDelete, error: checkError } = await supabase
        .from('ekipman_envanteri')
        .select('id, calismma_durumu')
        .in('id', equipmentIds)

      if (checkError) {
        throw checkError
      }

      // Soft delete uygula
      const { data: deletedData, error: deleteError } = await supabase
        .from('ekipman_envanteri')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: 1
        })
        .in('id', equipmentIds)
        .eq('is_deleted', false)
        .select()

      if (deleteError) {
        throw deleteError
      }

      toast.success(`${deletedData.length} ekipman başarıyla silindi!`)
      if (refreshData) refreshData()

    } catch (error) {
      console.error('Toplu silme hatası:', error)
      setError(error.message || 'Toplu silme işlemi başarısız')
      toast.error('Toplu silme işlemi başarısız')
    } finally {
      setLoading(false)
    }
  }

  // Silme onayı dialog'u
  const openDeleteDialog = (equipment) => {
    setSelectedEquipment(equipment)
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setSelectedEquipment(null)
    setError('')
  }

  const confirmDelete = async () => {
    if (selectedEquipment) {
      await handleSoftDelete(selectedEquipment.id)
      closeDeleteDialog()
    }
  }

  return (
    <Box>
      {/* Tek Ekipman Silme */}
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={() => openDeleteDialog(equipment)}
        disabled={loading}
        size="small"
      >
        {loading ? <CircularProgress size={20} /> : 'Sil'}
      </Button>

      {/* Silme Onay Dialog'u */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            Ekipman Silme Onayı
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedEquipment && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Bu ekipmanı silmek istediğinizden emin misiniz?
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                            primary="Ekipman ID"
        secondary={selectedEquipment.id} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Lokasyon" 
                    secondary={selectedEquipment.lokasyonlar?.lokasyon_adi || 'Belirtilmemiş'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Atanan Personel" 
                    secondary={
                      selectedEquipment.personel 
                        ? `${selectedEquipment.personel.ad} ${selectedEquipment.personel.soyad}`
                        : 'Atanmamış'
                    } 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Durum" 
                    secondary={
                      <Chip 
                        label={selectedEquipment.calismma_durumu}
                        color={
                          selectedEquipment.calismma_durumu === 'Çalışıyor' ? 'success' :
                          selectedEquipment.calismma_durumu === 'Arızalı' ? 'error' :
                          'warning'
                        }
                        size="small"
                      />
                    } 
                  />
                </ListItem>
              </List>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={loading}>
            İptal
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// Ekipman Listesi Component'i
const EquipmentList = ({ equipmentList, onRefresh }) => {
  const [selectedItems, setSelectedItems] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSelectItem = (equipmentId) => {
    setSelectedItems(prev => 
      prev.includes(equipmentId) 
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('Lütfen silinecek ekipmanları seçin')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ekipman_envanteri')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: 1
        })
        .in('id', selectedItems)
        .eq('is_deleted', false)
        .select()

      if (error) {
        throw error
      }

      toast.success(`${data.length} ekipman başarıyla silindi!`)
      setSelectedItems([])
      if (onRefresh) onRefresh()

    } catch (error) {
      console.error('Toplu silme hatası:', error)
      toast.error('Toplu silme işlemi başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {/* Toplu İşlem Butonları */}
      {selectedItems.length > 0 && (
        <Box mb={2} display="flex" gap={1}>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleBulkDelete}
            disabled={loading}
          >
            {loading ? 'Siliniyor...' : `${selectedItems.length} Ekipmanı Sil`}
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => setSelectedItems([])}
            disabled={loading}
          >
            Seçimi Temizle
          </Button>
        </Box>
      )}

      {/* Ekipman Listesi */}
      <List>
        {equipmentList.map((equipment) => (
          <ListItem key={equipment.id} divider>
            <ListItemText
              primary={`Ekipman ID: ${equipment.id}`}
              secondary={`${equipment.lokasyonlar?.lokasyon_adi} - ${equipment.calismma_durumu}`}
            />
            
            <ListItemSecondaryAction>
              <Box display="flex" gap={1}>
                <EquipmentDelete 
                  equipment={equipment}
                  onDelete={() => {
                    // Silme sonrası işlemler
                  }}
                  refreshData={onRefresh}
                />
                
                {equipment.is_deleted && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<RestoreIcon />}
                    size="small"
                    onClick={() => {
                      // Geri yükleme işlemi
                    }}
                  >
                    Geri Yükle
                  </Button>
                )}
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

export { EquipmentDelete, EquipmentList } 