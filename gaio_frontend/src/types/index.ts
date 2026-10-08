export type AuthStatus = 'carregando' | 'autenticado' | 'nao_autenticado';

export interface User {
  id: number;
  nome: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  tipo: 'Bearer';
  expiraEmMs: number;
  usuario: User;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest extends LoginRequest {
  nome: string;
}

export interface EstimativaRequest {
  bairroOuCep: string;
  areaM2: number;
  quartos: number;
  banheiros: number;
  vagasGaragem: number;
}

export interface EstimativaResponse {
  valorEstimado: number;
  faixaMinima: number;
  faixaMaxima: number;
  confianca: number;
  dicasFotos: string[];
}

export interface EstimativaSalva {
  id: number;
  parametros: EstimativaRequest;
  valorEstimado: number;
  faixaMinima: number;
  faixaMaxima: number;
  confianca: number;
}

export interface SaveEstimativaRequest {
  parametros: EstimativaRequest;
  valorEstimado: number;
  faixaMinima: number;
  faixaMaxima: number;
  confianca: number;
}

export interface EnderecoSuggestion {
  placeId: string;
  descricao: string;
}

export interface EnderecoDetalhes {
  endereco: string;
  bairro: string;
  cidade: string;
  latitude: number;
  longitude: number;
}

export type StatusAnuncio = 'RASCUNHO' | 'COMPLETO';

export interface Anuncio {
  id: number;
  titulo?: string;
  descricao?: string;
  bairro?: string;
  enderecoCompleto?: string;
  status?: StatusAnuncio;
  publicado?: boolean;
  valorEstimado?: number;
  faixaMinima?: number;
  faixaMaxima?: number;
  confianca?: number;
  dicasFotos?: string[];
  estimativaId?: number;
}

export interface AnuncioRequest {
  estimativaId: number;
  bairro: string;
  enderecoCompleto: string;
}

export interface AnuncioUpdate {
  titulo?: string;
  descricao?: string;
  status?: StatusAnuncio;
  publicado?: boolean;
}

export interface AnuncioFilters {
  id?: number;
  bairro?: string;
  status?: StatusAnuncio;
}

export interface ApiError {
  status?: number;
  message: string;
  details?: unknown;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

export interface LocalEstimateUiState {
  tipoImovel: 'Apartamento' | 'Casa';
  padrao: string;
  condominioMensal: string;
  comodidades: string[];
}
