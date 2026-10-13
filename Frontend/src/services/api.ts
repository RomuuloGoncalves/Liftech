import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { authService } from './authService';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';

    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Same list as AUTH_ROUTES in App.tsx (api.ts cannot import the App).
const AUTH_ROUTES = ['/login', '/login/colaborador', '/solicitar-acesso'];

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.url !== '/auth/login' &&
      !AUTH_ROUTES.includes(window.location.pathname)
    ) {
      authService.logout();
      // api.ts lives outside the router: BrowserRouter reacts to popstate.
      window.history.pushState(null, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }

    return Promise.reject(error);
  }
);

export default api;
