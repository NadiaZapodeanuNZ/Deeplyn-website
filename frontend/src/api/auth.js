import api from './axios';

export const registerClient = async (formData) => {
    const response = await api.post('/users/register/client/', formData);
    return response.data};

export const registerTherapist = async (formData) => {
    const response = await api.post('/users/register/therapist/', formData);
    return response.data};

export const verifyEmail = async ({email, token}) => {
    const response = await api.post('/users/verify-email/', { email, token });
    return response.data;
};

export const resendToken = async ({email}) => {
    const response = await api.post('/users/resend-token/', { email });
    return response.data;
};

export const login = async (form) => {
    const response = await api.post('/users/login/', form);
    return response.data;
};

export const forgotPassword = async ({email}) => {
    const response = await api.post('/users/forgot-password/', {email});
    return response.data;
};

export const resetPassword = async () => {
    const response = await api.get('/users/reset-password/');
    return response.data;
}

export const getCurrentUser = async () => {
    const response = await api.get('/users/me/');
    return response.data;
};