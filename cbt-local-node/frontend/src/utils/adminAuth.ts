import axios from 'axios';

const ADMIN_TOKEN_KEY = 'admin_token';

export const getAdminToken = () => (sessionStorage.getItem(ADMIN_TOKEN_KEY) || '').trim();

export const setAdminToken = (token: string) => {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
};

export const clearAdminToken = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const getAdminAuthConfig = () => ({
    headers: {
        ...(getAdminToken() ? { Authorization: `Bearer ${getAdminToken()}` } : {}),
        'x-client-id': window.location.hostname,
    },
});

export const applyAdminAuthDefaults = () => {
    const token = getAdminToken();
    if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common.Authorization;
    }
    axios.defaults.headers.common['x-client-id'] = window.location.hostname;
};

export const clearAdminAuthDefaults = () => {
    delete axios.defaults.headers.common.Authorization;
    delete axios.defaults.headers.common['x-client-id'];
};
