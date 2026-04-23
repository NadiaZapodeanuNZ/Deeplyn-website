import axios from 'axios'

const apiClient = axios.create({
    baseURL: '/api',
    withCredentials: true,
    // timeout - 10s 
  timeout: 10000,

  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue = []


const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error) 
    } else {
      resolve() 
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
 
  (response) => response,
  // second callback -  It activates when we get an error response from the server (4xx).
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const url = originalRequest.url || ''
    if (url.includes('/login') || url.includes('/refresh') || url.includes('/register')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => apiClient(originalRequest)) 
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      await apiClient.post('/refresh/')
      processQueue(null)
      return apiClient(originalRequest)
    } catch (refreshError) {

      processQueue(refreshError)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default apiClient