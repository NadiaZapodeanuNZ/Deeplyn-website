
// this file defines a pre-configured axios instance that we use for all API calls to the backend.
// It includes the base URL, credentials settings, and most importantly, an interceptor that handles token refresh logic.
// By centralizing this logic here, we keep our React components clean and focused on UI, while all the authentication
// mechanics are handled transparently in this module.

import axios from 'axios'

const apiClient = axios.create({
    // /api bcs every request in backend begins with /api/ 
    // so i can write apiClient.get('/login')
    //  instead of apiClient.get('http://localhost:8000/api/login') in my React components.
    baseURL: '/api',
    withCredentials: true,
    // timeout - 10s 
    //so if the server doesnt respond in 10 s
    //the request will be ignored and an eror will be thrown
  timeout: 10000,

  headers: {
    'Content-Type': 'application/json',
  },
})

//i will use interceptors to handle token refresh logic
//interceptor de raspunsuri - it activates when 
// i recieve a response from the server, before it reaches the React component that made the request.

let isRefreshing = false
let failedQueue = [] // list of requests that wait for the refresh to complete


const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error) // the refresh failed - reject all queued requests with the error
    } else {
      resolve() // refresh succeeded - resolve all queued requests so they can retry with the new token
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
 // first callback . if the response is 2xx, it is ok!! nothing happens
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
      await apiClient.post('/refresh-token/').
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