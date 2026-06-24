import api from './axios';


export const getNotes = async () => {
    const { data } = await api.get('/journal/notes/');
    return data;
};

export const createNote = async (body) => {
    const { data } = await api.post('/journal/notes/', body);
    return data;
};

export const updateNote = async (id, body) => {
    const { data } = await api.patch(`/journal/notes/${id}/update/`, body);
    return data;
};
export const deleteNote = async (id) => {
    await api.delete(`/journal/notes/${id}/delete/`);
};

export const toggleFavorite = async (id) => {
    const { data } = await api.post(`/journal/notes/${id}/favorite/`);
    return data;
};

export const toggleShared = async (id) => {
    const { data } = await api.post(`/journal/notes/${id}/share/`);
    return data;
};

export const getEmotions = async () => {
    const { data } = await api.get('/journal/emotions/');
    return data;
};


export const sendToTherapist = async (noteId) => {
    const response = await api.post(`/journal/notes/${noteId}/send-to-therapist/`);
    return response.data;
}

export const analyzeText = async (text) => {
    const { data } = await api.post('/journal/analyze/', { text });
    return data;
};

export const getEmotionStats = async (period) => {
    const { data } = await api.get(`/journal/emotion-stats/?period=${period}`);
    return data;
};

export const getTherapistClientEmotionStats = async (clientId, period) => {
    const { data } = await api.get(`/journal/therapist/clients/${clientId}/emotion-stats/?period=${period}`);
    return data;
};