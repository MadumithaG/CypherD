import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const auth = {
  async register(email: string, password: string) {
    const { data } = await api.post('/auth/register', { email, password })
    localStorage.setItem('token', data.access_token)
  },
  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.access_token)
  },
  logout() { localStorage.removeItem('token') }
}

export const walletApi = {
  async me() { return (await api.get('/wallets/me')).data },
  async create(address: string) { return (await api.post('/wallets/create', { address })).data },
  async prepare(recipient: string, amount_input: string, unit: 'ETH'|'USD') {
    return (await api.post('/transfer/prepare', { recipient, amount_input, unit })).data
  },
  async execute(approval_id: string, signature: string) {
    return (await api.post('/transfer/execute', { approval_id, signature })).data
  },
  async history() { return (await api.get('/history')).data }
}
