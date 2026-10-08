import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useAnuncios } from '../hooks/useAnuncios';
import { localEstimateStorage } from '../utils/storage';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { items, loading, error, summary } = useAnuncios();
  const localEstimates = localEstimateStorage.list();

  return (
    <div>
      <PageHeader title={`Bem-vindo, ${user?.nome ?? 'usuário'}!`} subtitle='Acompanhe seus anúncios e estimativas em um só lugar.' />

      {loading ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-28' />
          ))}
        </div>
      ) : error ? (
        <EmptyState title='Não foi possível carregar o dashboard' description={error} />
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card><p className='text-xs uppercase tracking-wide2 text-gray-500'>Total de anúncios</p><p className='mt-2 text-3xl font-semibold text-brand-900'>{summary.total}</p></Card>
          <Card><p className='text-xs uppercase tracking-wide2 text-gray-500'>Rascunho</p><p className='mt-2 text-3xl font-semibold text-amber-700'>{summary.rascunho}</p></Card>
          <Card><p className='text-xs uppercase tracking-wide2 text-gray-500'>Completos</p><p className='mt-2 text-3xl font-semibold text-green-700'>{summary.completo}</p></Card>
          <Card><p className='text-xs uppercase tracking-wide2 text-gray-500'>Publicados</p><p className='mt-2 text-3xl font-semibold text-brand-900'>{summary.publicados}</p></Card>
        </div>
      )}

      <div className='mt-6 grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <h3 className='text-sm font-semibold uppercase tracking-wide2 text-brand-800'>Ações rápidas</h3>
          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
            <Link to='/estimativas/nova' className='focus-ring rounded-xl bg-brand-900 p-4 text-sm font-semibold text-white'>Nova estimativa</Link>
            <Link to='/anuncios' className='focus-ring rounded-xl border border-brand-900 p-4 text-sm font-semibold text-brand-900'>Meus anúncios</Link>
            <Link to='/anuncios/novo' className='focus-ring rounded-xl border border-brand-900 p-4 text-sm font-semibold text-brand-900'>Nova publicação</Link>
            <Link to='/estimativas/nova#localizacao' className='focus-ring rounded-xl border border-brand-900 p-4 text-sm font-semibold text-brand-900'>Onde estou?</Link>
          </div>
        </Card>

        <Card>
          <h3 className='text-sm font-semibold uppercase tracking-wide2 text-brand-800'>Resumo de estimativas</h3>
          <p className='mt-1 text-xs text-gray-500'>Estado local do navegador (não vem da API).</p>
          <p className='mt-4 text-3xl font-semibold text-brand-900'>{localEstimates.length}</p>
          <p className='text-sm text-gray-600'>estimativas calculadas/salvas localmente</p>
        </Card>
      </div>

      {!loading && !error && items.length === 0 ? (
        <div className='mt-6'>
          <EmptyState
            title='Você ainda não criou anúncios'
            description='Comece com uma estimativa para gerar seu primeiro anúncio.'
            action={<Link to='/estimativas/nova' className='text-sm font-semibold text-brand-900 hover:underline'>Criar estimativa agora</Link>}
          />
        </div>
      ) : null}
    </div>
  );
};
