import api from './axios';

export const getAvailableTherapists = async () => {
    const { data } = await api.get('/users/therapists/available/');
    return data;
};

export const requestTherapistConnection = async (therapistId) => {
    const { data } = await api.post(`/users/therapists/${therapistId}/request/`, {});
    return data;
};

export const getMyTherapist = async () => {
    const { data } = await api.get('/users/my-therapist/');
    return data;
};

export const endRelationship = async (clientId = null) => {
    const url = clientId ? `/users/end-relationship/${clientId}/` : '/users/end-relationship/';
    const { data } = await api.post(url, {});
    return data;
};

export const sendCrisisAlert = async (message = '') => {
    const { data } = await api.post('/users/crisis-alert/', { message });
    return data;
};