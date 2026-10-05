import api from './api';
import type { AxiosPromise } from 'axios';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
  };
  message?: string;
}

export const authService = {
  loginAdmin: (dados: LoginRequest): AxiosPromise<LoginResponse> => {
    return api.post<LoginResponse>('/auth/login', dados);
  }
};