import { api } from './api';
import { Anuncio, AnuncioFilters, AnuncioRequest, AnuncioUpdate } from '../types';

const parseAnunciosResponse = (data: unknown): Anuncio[] => {
  if (Array.isArray(data)) return data as Anuncio[];
  if (!data || typeof data !== 'object') return [];
  const payload = data as Record<string, unknown>;
  const arrays = [payload.content, payload.data, payload.items];
  const found = arrays.find(Array.isArray);
  return (found as Anuncio[] | undefined) ?? [];
};

export const anuncioService = {
  async create(payload: AnuncioRequest): Promise<Anuncio> {
    const { data } = await api.post<Anuncio>('/api/anuncios', payload);
    return data;
  },

  async list(filters?: AnuncioFilters): Promise<Anuncio[]> {
    const { data } = await api.get<unknown>('/api/anuncios', {
      params: {
        id: filters?.id,
        bairro: filters?.bairro,
        status: filters?.status
      }
    });
    return parseAnunciosResponse(data);
  },

  async getById(id: number): Promise<Anuncio | null> {
    const list = await this.list({ id });
    return list.find((item) => item.id === id) ?? list[0] ?? null;
  },

  async update(id: number, payload: AnuncioUpdate): Promise<Anuncio> {
    const { data } = await api.patch<Anuncio>(`/api/anuncios/${id}`, payload);
    return data;
  }
};
