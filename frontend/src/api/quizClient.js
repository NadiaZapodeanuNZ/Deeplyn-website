import api from './axios';

export const getTodayQuiz = async () => {
    const { data } = await api.get('/quiz/today/');
    return data;
};

export const getQuizHistory = async () => {
    const { data } = await api.get('/quiz/history/');
    return data;
};

export const saveDraft = async (answerId, body) => {
    const { data } = await api.patch(`/quiz/answers/${answerId}/`, body);
    return data;
};

export const submitAnswer = async (answerId, body) => {
    const { data } = await api.post(`/quiz/answers/${answerId}/submit/`, body);
    return data;
};

export const updateAnswerEmotions = async (answerId, body) => {
    const { data } = await api.patch(`/quiz/answers/${answerId}/emotions/`, body);
    return data;
};

export const shareAnswers = async (quizId, body) => {
    const { data } = await api.post(`/quiz/${quizId}/share/`, body);
    return data;
};

export const shareQuiz = async (quizId) => {
    const { data } = await api.post(`/quiz/${quizId}/share/`);
    return data;};


export const getEmotions = async () => {
    const { data } = await api.get('/journal/emotions/');
    return data;};
