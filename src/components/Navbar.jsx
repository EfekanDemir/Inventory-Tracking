import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
} from '@mui/icons-material'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Ana Sayfa', icon: <DashboardIcon /> },
    { path: '/inventory', label: 'Kayıtlar', icon: <InventoryIcon /> },
    { path: '/historical', label: 'Geçmiş Kayıtlar', icon: <HistoryIcon /> },
    { path: '/availability', label: 'Müsaitlik Durumu', icon: <AssignmentIcon /> },
    { path: '/add', label: 'Kayıt Ekle', icon: <AddIcon /> },
    { path: '/reports', label: 'Raporlar', icon: <ReportsIcon /> },
    { path: '/setup', label: 'Sistem Kurulum', icon: <SettingsIcon /> },
  ]

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <BusinessIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Envanter Takip Sistemi
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar 