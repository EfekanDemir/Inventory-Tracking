import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  Grid,
  Divider,
} from '@mui/material'
import {
  Login as LoginIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('E-posta veya şifre hatalı.')
        } else {
          setError(error.message)
        }
        return
      }

      toast.success('Başarıyla giriş yaptınız!')
      navigate(from, { replace: true })
    } catch (error) {
      setError('Giriş sırasında bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              Envanter Takip Sistemi
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Giriş Yapın
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-posta Adresi"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Şifre"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: <LockIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              startIcon={<LoginIcon />}
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Button>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  component={Link}
                  to="/register"
                  fullWidth
                  variant="outlined"
                  size="small"
                >
                  Kayıt Ol
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  component={Link}
                  to="/forgot-password"
                  fullWidth
                  variant="text"
                  size="small"
                >
                  Şifremi Unuttum
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              📝 İlk Kullanım İçin:
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
              "Kayıt Ol" butonuna tıklayarak yeni hesap oluşturun!
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
              Hesap oluşturduktan sonra giriş yapabilirsiniz.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login 