import api from './axios';
export const getSessions = async () => {
    const { data } = await api.get('/therapy/sessions/');
    return data;
};

export const createSession = async (date, session_type, client_notes = '') => {
    const { data } = await api.post('/therapy/sessions/create/', 
    {date,session_type,client_notes,});
    return data;
};


export const deleteSession = async (sessionId) => {
    const { data } = await api.delete(`/therapy/sessions/${sessionId}/delete/`);
    return data;
};

export const approveSession = async (sessionId) => {
    const { data } = await api.post(`/therapy/sessions/${sessionId}/approve/`);
    return data;
};

export const rejectSession = async (sessionId) => {
    const { data } = await api.post(`/therapy/sessions/${sessionId}/reject/`);
    return data;
};
