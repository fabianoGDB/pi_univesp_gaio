import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/layout/PageHeader';
import { formatCurrencyBRL } from '../utils/format';
import { localEstimateStorage } from '../utils/storage';

export const EstimativasPage = () => {
  const estimates = localEstimateStorage.list();

  return (
    <div>
      <PageHeader
        title='Minhas estimativas'
        subtitle='Histórico local no navegador para facilitar retomadas.'
        action={
          <Link to='/estimativas/nova'>
            <Button>Nova estimativa</Button>
          </Link>
        }
      />

      {estimates.length === 0 ? (
        <EmptyState
          title='Nenhuma estimativa local'
          description='Faça um novo cálculo para visualizar o histórico aqui.'
          action={<Link className='text-sm font-semibold text-brand-900 hover:underline' to='/estimativas/nova'>Começar agora</Link>}
        />
      ) : (
        <div className='grid gap-3'>
          {estimates.map((estimate) => (
            <Card key={estimate.id} className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <p className='font-semibold text-brand-900'>{estimate.bairroOuCep}</p>
                <p className='text-sm text-gray-500'>{new Date(estimate.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div className='text-right'>
                <p className='text-lg font-semibold text-brand-900'>{formatCurrencyBRL(estimate.valorEstimado)}</p>
                <Link className='text-sm font-medium text-brand-900 hover:underline' to={`/estimativas/${estimate.id}`}>Ver detalhes</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
