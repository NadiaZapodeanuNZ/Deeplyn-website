

import apiClient from './client'

//---------------LOGIN-------------------------------------------------

export const login = async (identifier, password, rememberMe = false) => {
  const response = await apiClient.post('/login/', {
    identifier,  
    password,
    remember_me: rememberMe,
  })
  return response.data
}
// -------------LOGOUT------------------------------------------------

export const logout = async () => {
  try {
    await apiClient.post('/logout/')
  } catch (error) {

    console.warn('Logout request failed, but proceeding with client-side logout:', error)
  }
  window.location.href = '/login'
}

//-------------REGISTER------------------------------------------------

export const registerUser = async (userData) => {
  const response = await apiClient.post('/register/', userData)
  return response.data
}
// -----------VERIFY-EMAIL------------------------------------------------
export const verifyEmail = async (email, token) => {
  const response = await apiClient.post('/verify-email/', { email, token })
  return response.data
}

//------------RESEND-VERIFICATION-TOKEN------------------------------
export const resendToken = async (email) => {
  const response = await apiClient.post('/resend-token/', { email })
  return response.data
}

//-----------------FORGOT-PASSWORD----------------------------------------------
export const forgotPassword = async (email) => {
  const response = await apiClient.post('/forgot-password/', { email })
  return response.data
}

//-----------------RESET-PASSWORD------------------------------------
export const resetPassword = async (token, password, confirmPass) => {
  const response = await apiClient.post('/reset-password/', {
    token,
    password,
    confirm_pass: confirmPass,
  })
  return response.data
}
//-----------------GET-CURRENT-USER------------------------------------
export const getCurrentUser = async () => {
  const response = await apiClient.get('/me/')
  return response.data
}