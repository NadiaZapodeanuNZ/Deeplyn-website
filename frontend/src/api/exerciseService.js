import api from './axios';


export const getClientExercises = async () => {
    const { data } = await api.get('/exercises/client/');
    return data;
};

export const completeExercise = async (exerciseId, body) => {
    const { data } = await api.post(`/exercises/client/${exerciseId}/complete/`, body);
    return data;
};

export const getClientHistory = async () => {
    const { data } = await api.get('/exercises/client/completions/');
    return data;
};

export const shareWithTherapist = async (completionId) => {
    const { data } = await api.post(`/exercises/client/completions/${completionId}/share/`);
    return data;
};


export const getTherapistDashboard = async () => {
    const { data } = await api.get('/exercises/therapist/');
    return data;
};

export const createExercise = async (body) => {
    const { data } = await api.post('/exercises/therapist/create/', body);
    return data;
};

export const updateExercise = async (exerciseId, body) => {
    const { data } = await api.patch(`/exercises/therapist/${exerciseId}/update/`, body);
    return data;
};

export const deleteExercise = async (exerciseId) => {
    await api.delete(`/exercises/therapist/${exerciseId}/delete/`);
};

export const getClientCompletions = async (clientId = null) => {
    const url = clientId ? `/exercises/therapist/client-completions/?client_id=${clientId}` : '/exercises/therapist/client-completions/';
    const { data } = await api.get(url);
    return data;
};

export const deleteClientCompletionFromPanel = async (completionId) => {
    await api.delete(`/exercises/therapist/client-completions/${completionId}/delete/`);
};

export const publishExercise = async (exerciseId, clientId) => {
    const { data } = await api.post(`/exercises/therapist/${exerciseId}/publish/`, { client_id: clientId });
    return data;
};
export default {getClientExercises,completeExercise,getClientHistory,
shareWithTherapist, getTherapistDashboard, createExercise,updateExercise,deleteExercise,
getClientCompletions,deleteClientCompletionFromPanel,
};