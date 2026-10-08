import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { PageHeader } from '../components/layout/PageHeader';
import { anuncioService } from '../services/anuncioService';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/error';

interface LocationState {
  estimativaId?: number;
  bairro?: string;
  enderecoCompleto?: string;
}

export const NovoAnuncioPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const state = (location.state as LocationState | null) ?? null;

  const [estimativaId, setEstimativaId] = useState(state?.estimativaId ? String(state.estimativaId) : '');
  const [bairro, setBairro] = useState(state?.bairro ?? '');
  const [enderecoCompleto, setEnderecoCompleto] = useState(state?.enderecoCompleto ?? '');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ id: number; titulo?: string; descricao?: string; dicasFotos?: string[] } | null>(null);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!estimativaId || !bairro || !enderecoCompleto) {
      showToast({ type: 'error', title: 'Campos obrigatórios', description: 'Preencha estimativa, bairro e endereço completo.' });
      return;
    }

    setLoading(true);
    try {
      const anuncio = await anuncioService.create({ estimativaId: Number(estimativaId), bairro, enderecoCompleto });
      setCreated({ id: anuncio.id, titulo: anuncio.titulo, descricao: anuncio.descricao, dicasFotos: anuncio.dicasFotos });
      showToast({ type: 'success', title: 'Anúncio criado', description: 'Revise e edite antes de publicar.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Falha ao criar anúncio', description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader title='Nova publicação' subtitle='Crie um anúncio a partir de uma estimativa salva.' />

      <Card>
        <form onSubmit={handleCreate} className='grid gap-3 md:grid-cols-2'>
          <Input label='ID da estimativa salva' value={estimativaId} onChange={(e) => setEstimativaId(e.target.value)} inputMode='numeric' required />
          <Input label='Bairro' value={bairro} onChange={(e) => setBairro(e.target.value)} required />
          <div className='md:col-span-2'>
            <Input label='Endereço completo' value={enderecoCompleto} onChange={(e) => setEnderecoCompleto(e.target.value)} required />
          </div>
          <div className='md:col-span-2'>
            <Button type='submit' loading={loading}>Criar anúncio com IA</Button>
          </div>
        </form>
      </Card>

      {created ? (
        <Card className='space-y-3'>
          <h3 className='text-lg font-semibold text-brand-900'>Revisão inicial do anúncio #{created.id}</h3>
          <div>
            <p className='text-xs uppercase tracking-wide2 text-gray-500'>Título sugerido</p>
            <p className='font-semibold text-brand-900'>{created.titulo || 'Título não retornado pela API'}</p>
          </div>
          <div>
            <p className='text-xs uppercase tracking-wide2 text-gray-500'>Descrição sugerida</p>
            <p className='text-sm text-gray-700'>{created.descricao || 'Descrição não retornada pela API'}</p>
          </div>
          <div>
            <p className='text-xs uppercase tracking-wide2 text-gray-500'>Dicas de fotos</p>
            <ul className='mt-1 list-disc space-y-1 pl-5 text-sm text-gray-700'>
              {(created.dicasFotos ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button onClick={() => navigate(`/anuncios/${created.id}/editar`)}>Editar anúncio</Button>
            <Button variant='secondary' onClick={() => navigate(`/anuncios/${created.id}`)}>Visualizar detalhes</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
};
