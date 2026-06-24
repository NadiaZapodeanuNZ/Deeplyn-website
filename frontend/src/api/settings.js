import api from './axios';

export const changePassword = async (oldPassword, newPassword, confirmNewPassword) => {
    const { data } = await api.post('/users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
    });
    return data;
};

export const updateProfilePhoto = async (file) => {
    const formData = new FormData();
    formData.append('profile_photo', file);
    const { data } = await api.patch('/users/update-profile-photo/', formData);
    return data;
};

export const updateUsername = async (username) => {
    const { data } = await api.patch('/users/update-username/', { username });
    return data;
};

export const deleteAccount = async (password) => {
    const { data } = await api.delete('/users/delete-account/', {
        data: { password },
    });
    return data;
};

export const updateAcceptingClients = async (val) => {
    const { data } = await api.patch('/users/accepting-clients/', {
        is_accepting_clients: val,
    });
    return data;
};

export const updateBio = async (bio) => {
    const { data } = await api.patch('/users/update-bio/', { bio });
    return data;
};

export const updateSpecializations = async (specializations) => {
    const { data } = await api.patch('/users/update-specializations/', { specializations });
    return data;
};