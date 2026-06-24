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

export const login = async (formData) => {
    const response = await api.post('/users/login/', formData);
    return response.data;
};

export const forgotPassword = async ({email}) => {
    const response = await api.post('/users/forgot-password/', {email});
    return response.data;
};

export const resetPassword = async (token, password, confirmPass) => {
    const response = await api.post('/users/reset-password/', {
        token: token,
        password: password,
        confirm_pass: confirmPass,
    });
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get('/users/me/');
    return response.data;
};

export const logout = async () => {
    await api.post('/users/logout/');
};

export const loginWithLink = async (token) => {
    const response = await api.get(`/users/login/with-link/?token=${token}`);
    return response.data;
}
