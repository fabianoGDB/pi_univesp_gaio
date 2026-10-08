import { api } from './api';
import {
  EstimativaRequest,
  EstimativaResponse,
  EstimativaSalva,
  SaveEstimativaRequest
} from '../types';

export const estimativaService = {
  async calcular(payload: EstimativaRequest): Promise<EstimativaResponse> {
    const { data } = await api.post<EstimativaResponse>('/api/estimativas/calcular', payload);
    return data;
  },

  async salvar(payload: SaveEstimativaRequest): Promise<EstimativaSalva> {
    const { data } = await api.post<EstimativaSalva>('/api/estimativas', payload);
    return data;
  }
};
