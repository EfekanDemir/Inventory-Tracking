import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, Container } from '@mui/material'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { setupChunkErrorHandler } from './utils/errorHandler'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import InventoryList from './pages/InventoryList'
import Availability from './pages/Availability'
import AddInventory from './pages/AddInventory'
import InventoryHistory from './pages/InventoryHistory'
import HistoricalRecords from './pages/HistoricalRecords'
import Reports from './pages/Reports'
import SetupWizard from './pages/SetupWizard'

// Material-UI teması
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
})

function App() {
  // Global error handler
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error:', event.error)
    }

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app-container">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Navbar />
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<InventoryList />} />
              <Route path="/availability" element={<Availability />} />
              <Route path="/add" element={<AddInventory />} />
              <Route path="/edit/:id" element={<AddInventory />} />
              <Route path="/history/:id" element={<InventoryHistory />} />
              <Route path="/historical" element={<HistoricalRecords />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/setup" element={<SetupWizard />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App 