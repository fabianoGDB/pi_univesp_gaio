import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/layout/PageHeader';
import { formatCurrencyBRL } from '../utils/format';
import { localEstimateStorage } from '../utils/storage';

export const EstimativaDetalhePage = () => {
  const { id } = useParams();
  const estimate = localEstimateStorage.list().find((item) => item.id === id);

  return (
    <div>
      <PageHeader title='Detalhes da estimativa local' subtitle='Esta seção representa somente dados mantidos no navegador.' />
      {!estimate ? (
        <EmptyState title='Estimativa não encontrada' description='Essa estimativa local pode ter sido removida do navegador.' action={<Link to='/estimativas'><Button variant='secondary'>Voltar</Button></Link>} />
      ) : (
        <Card>
          <p className='text-xs uppercase tracking-wide2 text-gray-500'>Localização</p>
          <p className='text-lg font-semibold text-brand-900'>{estimate.bairroOuCep}</p>
          <p className='mt-4 text-xs uppercase tracking-wide2 text-gray-500'>Valor estimado</p>
          <p className='text-3xl font-semibold text-brand-900'>{formatCurrencyBRL(estimate.valorEstimado)}</p>
          <p className='mt-2 text-sm text-gray-500'>Calculado em {new Date(estimate.createdAt).toLocaleString('pt-BR')}</p>
          <div className='mt-5'>
            <Link to='/estimativas/nova'>
              <Button>Novo cálculo</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};
