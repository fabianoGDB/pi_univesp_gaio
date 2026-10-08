import axios, { AxiosError } from 'axios';
import { ApiError } from '../types';
import { authStorage } from '../utils/storage';

let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

const getFriendlyMessage = (status?: number): string => {
  if (status === 400) return 'Dados inválidos. Revise as informações e tente novamente.';
  if (status === 401) return 'Sua sessão expirou. Faça login novamente.';
  if (status === 403) return 'Você não tem permissão para realizar esta ação.';
  if (status === 404) return 'Recurso não encontrado.';
  if (status && status >= 500) return 'O servidor apresentou instabilidade. Tente novamente em instantes.';
  return 'Não foi possível concluir a operação. Verifique sua conexão.';
};

const normalizeError = (error: AxiosError): ApiError => {
  const status = error.response?.status;
  const responseData = error.response?.data as Record<string, unknown> | undefined;
  const apiMessage =
    typeof responseData?.message === 'string'
      ? responseData.message
      : typeof responseData?.erro === 'string'
        ? responseData.erro
        : undefined;

  return {
    status,
    message: apiMessage ?? getFriendlyMessage(status),
    details: responseData ?? error.message
  };
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const auth = authStorage.get();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const normalized = normalizeError(error);
    if (normalized.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(normalized);
  }
);
