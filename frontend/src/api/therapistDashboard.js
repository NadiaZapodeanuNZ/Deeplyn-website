
import api from './axios';


export const getPendingRequests = async () => {
    const { data } = await api.get('/users/clients/requests/');
    return data;
};

export const acceptClient = async (clientId) => {
    const { data } = await api.post(`/users/clients/${clientId}/accept/`);
    return data;
};

export const rejectClient = async (clientId) => {
    const { data } = await api.post(`/users/clients/${clientId}/reject/`);
    return data;
};

export const getMyClients = async () => {
    const { data } = await api.get('/users/my-clients/');
    return data;
};

export const endClientRelationship = async (clientId) => {
    const { data } = await api.post(`/users/end-relationship/${clientId}/`);
    return data;
};


// --- JOURNAL (therapist panel) ---

export const getClientSharedNotes = async (clientId) => {
    const { data } = await api.get(`/journal/therapist/clients/${clientId}/notes/`);
    return data;
};

export const deleteSharedNoteFromPanel = async (sharedNoteId) => {
    await api.delete(`/journal/therapist/shared-notes/${sharedNoteId}/`);
};


// --- QUIZ (per client) ---

export const getClientQuizzes = async (clientId) => {
    const { data } = await api.get(`/quiz/clients/${clientId}/quizzes/`);
    return data;
};

export const createQuiz = async (body) => {
    const { data } = await api.post('/quiz/create/', body);
    return data;
};

export const publishQuiz = async (quizId) => {
    const { data } = await api.post(`/quiz/${quizId}/publish/`);
    return data;
};

export const getSentQuizzes = async (clientId = null) => {
    const url = clientId ? `/quiz/sent/?client_id=${clientId}` : '/quiz/sent/';
    const { data } = await api.get(url);
    return data;
};

export const deleteClientQuiz = async (quizId) => {
    await api.delete(`/quiz/${quizId}/delete/`);
};

// alias pt QuizManagement.jsx (acelasi endpoint)
export const deleteQuiz = deleteClientQuiz;


// --- INTREBARI (custom + predefinite) ---

export const getMyQuestions = async () => {
    const { data } = await api.get('/quiz/questions/mine/');
    return data;
};

export const getPredefinedQuestions = async () => {
    const { data } = await api.get('/quiz/questions/predefined/');
    return data;
};

export const createCustomQuestion = async (text) => {
    const { data } = await api.post('/quiz/questions/', { text });
    return data;
};

export const updateQuestion = async (questionId, text) => {
    const { data } = await api.patch(`/quiz/questions/${questionId}/update/`, { text });
    return data;
};

export const deleteQuestion = async (questionId) => {
    await api.delete(`/quiz/questions/${questionId}/delete/`);
};


// --- DRAFTS ---

export const getDrafts = async () => {
    const { data } = await api.get('/quiz/drafts/');
    return data;
};

export const createDraft = async (body) => {
    const { data } = await api.post('/quiz/drafts/create/', body);
    return data;
};

export const updateDraft = async (draftId, body) => {
    const { data } = await api.patch(`/quiz/drafts/${draftId}/update/`, body);
    return data;
};

export const deleteDraft = async (draftId) => {
    await api.delete(`/quiz/drafts/${draftId}/delete/`);
};

export const sendDraft = async (draftId, body) => {
    const { data } = await api.post(`/quiz/drafts/${draftId}/send/`, body);
    return data;
};


// --- SESIUNI ---

export const getTherapistSessions = async (clientId = null) => {
    const url = clientId ? `/therapy/sessions/?client_id=${clientId}` : '/therapy/sessions/';
    const { data } = await api.get(url);
    return data;
};

export const createTherapistSession = async (body) => {
    const { data } = await api.post('/therapy/sessions/create/', body);
    return data;
};

export const approveTherapistSession = async (sessionId) => {
    const { data } = await api.post(`/therapy/sessions/${sessionId}/approve/`);
    return data;
};

export const rejectTherapistSession = async (sessionId) => {
    const { data } = await api.post(`/therapy/sessions/${sessionId}/reject/`);
    return data;
};

export const cancelTherapistSession = async (sessionId) => {
    await api.delete(`/therapy/sessions/${sessionId}/delete/`);
};