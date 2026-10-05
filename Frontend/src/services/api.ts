import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const isProduction = import.meta.env.PROD;

const api: AxiosInstance = axios.create({
  baseURL: isProduction ? 'https://sua-api-producao.com/api' : 'http://localhost:3000/api'
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
  (error: any) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      
      if (window.location.pathname !== '/login') {
        window.location.pathname = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;