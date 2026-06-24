import axios from 'axios';

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true,
});

const EXCLUDED_FROM_REFRESH = ['users/login', 'login/refresh', 'users/logout', 'users/me'];

function isExcludedFromRefresh(url) {
    return EXCLUDED_FROM_REFRESH.some(endpoint => url.includes(endpoint));
}

let isRefreshing = false;

api.interceptors.request.use((config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const shouldTryRefresh = (
            error.response?.status === 401 &&
            !isRefreshing &&
            !isExcludedFromRefresh(originalRequest.url)
        );

        if (shouldTryRefresh) {
            isRefreshing = true;
            try {
                await axios.post(
                    'http://localhost:8000/api/users/login/refresh/',
                    {},
                    { withCredentials: true }
                );
                isRefreshing = false;
                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                if (window.location.pathname !== '/login') {
                    window.location.replace('/login');
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;