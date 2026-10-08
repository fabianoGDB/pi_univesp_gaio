import { EstimativaRequest, EstimativaResponse } from '../../types';
import { formatCurrencyBRL, formatPercent } from '../../utils/format';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface EstimateCardProps {
  request: EstimativaRequest;
  result: EstimativaResponse;
  onSave: () => void;
  onReset: () => void;
  saveLoading?: boolean;
}

export const EstimateCard = ({ request, result, onSave, onReset, saveLoading }: EstimateCardProps) => (
  <Card className='space-y-5 p-0'>
    <div className='rounded-2xl bg-brand-900 p-6 text-white'>
      <p className='text-xs font-semibold uppercase tracking-wide2 text-amber-100'>Valor estimado</p>
      <p className='mt-2 text-4xl font-semibold text-accent-500'>{formatCurrencyBRL(result.valorEstimado)}</p>
      <div className='mt-4 rounded-xl bg-white/10 p-4'>
        <p className='text-xs text-gray-200'>Faixa provável de mercado</p>
        <p className='font-semibold'>{formatCurrencyBRL(result.faixaMinima)} — {formatCurrencyBRL(result.faixaMaxima)}</p>
      </div>
      <p className='mt-4 font-semibold text-accent-500'>Confiança da estimativa: {formatPercent(result.confianca)}</p>
    </div>

    <div className='grid gap-5 px-6 pb-6 md:grid-cols-2'>
      <div>
        <h3 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Parâmetros analisados</h3>
        <dl className='mt-3 grid grid-cols-2 gap-2 text-sm'>
          <dt className='text-gray-500'>Localização</dt><dd>{request.bairroOuCep}</dd>
          <dt className='text-gray-500'>Área</dt><dd>{request.areaM2}m²</dd>
          <dt className='text-gray-500'>Quartos</dt><dd>{request.quartos}</dd>
          <dt className='text-gray-500'>Banheiros</dt><dd>{request.banheiros}</dd>
          <dt className='text-gray-500'>Vagas</dt><dd>{request.vagasGaragem}</dd>
        </dl>
      </div>
      <div>
        <h3 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Insights de mercado</h3>
        <ul className='mt-3 space-y-2'>
          {result.dicasFotos.map((dica) => (
            <li key={dica} className='rounded-xl border border-accent-500/40 bg-accent-100 p-3 text-sm text-brand-900'>
              {dica}
            </li>
          ))}
        </ul>
      </div>
      <div className='md:col-span-2 flex flex-wrap gap-3'>
        <Button variant='secondary' fullWidth onClick={onSave} loading={saveLoading}>
          Salvar
        </Button>
        <Button fullWidth onClick={onReset}>Novo cálculo</Button>
      </div>
    </div>
  </Card>
);
