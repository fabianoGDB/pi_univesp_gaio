import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { anuncioService } from '../services/anuncioService';
import { Anuncio } from '../types';
import { PageHeader } from '../components/layout/PageHeader';
import { Loading } from '../components/common/Loading';
import { EmptyState } from '../components/common/EmptyState';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/domain/StatusBadge';
import { formatCurrencyBRL, formatPercent } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/error';

export const AnuncioDetalhePage = () => {
  const { id } = useParams();
  const anuncioId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await anuncioService.getById(anuncioId);
      setAnuncio(data);
    } catch (error) {
      showToast({ type: 'error', title: 'Erro ao carregar detalhes', description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(anuncioId)) {
      void loadData();
    }
  }, [anuncioId]);

  const handlePublish = async () => {
    if (!anuncio) return;
    if (anuncio.status !== 'COMPLETO') {
      showToast({ type: 'info', title: 'Complete o anúncio', description: 'Para publicar, o status precisa estar como COMPLETO.' });
      return;
    }

    setPublishing(true);
    try {
      await anuncioService.update(anuncio.id, { publicado: true });
      showToast({ type: 'success', title: 'Anúncio publicado', description: 'Pronto! status de publicação atualizado.' });
      await loadData();
    } catch (error) {
      showToast({ type: 'error', title: 'Falha ao publicar', description: getErrorMessage(error) });
    } finally {
      setPublishing(false);
    }
  };

  const copyDescription = async () => {
    if (!anuncio?.descricao) return;
    await navigator.clipboard.writeText(anuncio.descricao);
    showToast({ type: 'success', title: 'Descrição copiada', description: 'Texto copiado para a área de transferência.' });
  };

  if (loading) return <Loading text='Carregando detalhes do anúncio...' />;
  if (!anuncio) return <EmptyState title='Anúncio não encontrado' description='Não foi possível localizar este anúncio.' action={<Button onClick={() => navigate('/anuncios')}>Voltar</Button>} />;

  return (
    <div className='space-y-6'>
      <PageHeader title={anuncio.titulo || `Anúncio #${anuncio.id}`} subtitle={anuncio.bairro || 'Bairro não informado'} />

      <Card className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <StatusBadge status={anuncio.status} />
          <p className='text-sm'>Publicado: <strong>{anuncio.publicado ? 'Sim' : 'Não'}</strong></p>
        </div>
        <p className='text-sm text-gray-700'>{anuncio.descricao || 'Sem descrição disponível.'}</p>
        <dl className='grid gap-2 text-sm md:grid-cols-2'>
          <div><dt className='text-gray-500'>Endereço</dt><dd>{anuncio.enderecoCompleto || '—'}</dd></div>
          <div><dt className='text-gray-500'>Bairro</dt><dd>{anuncio.bairro || '—'}</dd></div>
          <div><dt className='text-gray-500'>Valor estimado</dt><dd>{formatCurrencyBRL(anuncio.valorEstimado)}</dd></div>
          <div><dt className='text-gray-500'>Faixa de preço</dt><dd>{formatCurrencyBRL(anuncio.faixaMinima)} — {formatCurrencyBRL(anuncio.faixaMaxima)}</dd></div>
          <div><dt className='text-gray-500'>Confiança</dt><dd>{formatPercent(anuncio.confianca)}</dd></div>
        </dl>
        <div>
          <p className='text-xs uppercase tracking-wide2 text-gray-500'>Dicas de fotos</p>
          <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700'>
            {(anuncio.dicasFotos ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {(anuncio.dicasFotos ?? []).length === 0 ? <li>Nenhuma dica recebida da API.</li> : null}
          </ul>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='secondary' onClick={() => navigate(`/anuncios/${anuncio.id}/editar`)}>Editar</Button>
          <Button variant='secondary' onClick={() => navigate(`/anuncios/${anuncio.id}/editar`)}>Completar anúncio</Button>
          <Button onClick={() => void handlePublish()} disabled={anuncio.status !== 'COMPLETO'} loading={publishing}>Publicar</Button>
          <Button variant='ghost' onClick={() => void copyDescription()}>Copiar descrição</Button>
          <Button variant='ghost' onClick={() => navigate('/anuncios')}>Voltar</Button>
        </div>
        {anuncio.status !== 'COMPLETO' ? <p className='text-xs text-amber-700'>O anúncio está em RASCUNHO. Complete antes de publicar.</p> : null}
      </Card>
    </div>
  );
};
