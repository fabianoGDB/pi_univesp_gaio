import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddressAutocomplete } from '../components/domain/AddressAutocomplete';
import { PriceRange } from '../components/domain/PriceRange';
import { PropertyCard } from '../components/domain/PropertyCard';
import { EstimateCard } from '../components/domain/EstimateCard';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { PageHeader } from '../components/layout/PageHeader';
import { estimativaService } from '../services/estimativaService';
import { EstimativaRequest, EstimativaResponse, LocalEstimateUiState } from '../types';
import { getErrorMessage } from '../utils/error';
import { localEstimateStorage, pendingEstimateStorage } from '../utils/storage';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const optionsSimple = ['1', '2', '3', '4', '5+'];
const garagemOptions = ['0', '1', '2', '3', '4', '5+'];
const comodidadesDisponiveis = [
  'Academia',
  'Elevador',
  'Permite animais',
  'Piscina',
  'Portaria',
  'Salão de festas',
  'Condomínio fechado',
  'Segurança 24h',
  'Portão eletrônico',
  'Área murada',
  'Área de serviço',
  'Armários na cozinha',
  'Armários no quarto',
  'Churrasqueira',
  'Mobiliado',
  'Quarto de serviço',
  'Ar-condicionado',
  'Porteiro 24h',
  'Varanda'
];

const parseNumericOption = (value: string): number => (value.includes('+') ? 5 : Number(value));

export const NovaEstimativaPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [request, setRequest] = useState<EstimativaRequest>({
    bairroOuCep: '',
    areaM2: 105,
    quartos: 3,
    banheiros: 2,
    vagasGaragem: 2
  });
  const [enderecoCompleto, setEnderecoCompleto] = useState('');
  const [addressMeta, setAddressMeta] = useState({ bairro: '', cidade: '', latitude: 0, longitude: 0 });

  // Campos visuais sem endpoint correspondente (estado local de interface)
  const [uiState, setUiState] = useState<LocalEstimateUiState>({
    tipoImovel: 'Apartamento',
    padrao: 'Padrão',
    condominioMensal: '',
    comodidades: ['Elevador', 'Piscina']
  });

  const [result, setResult] = useState<EstimativaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedEstimativaId, setSavedEstimativaId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ bairroOuCep?: string }>({});

  useEffect(() => {
    const pending = pendingEstimateStorage.get();
    if (!pending) return;

    setRequest(pending.request);
    setResult(pending.result);
    setUiState(pending.uiState);
    pendingEstimateStorage.clear();
    showToast({
      type: 'info',
      title: 'Dados restaurados',
      description: 'Recuperamos sua estimativa para você continuar de onde parou.'
    });
  }, []);

  const canSubmit = useMemo(() => request.bairroOuCep.trim().length >= 3 && request.areaM2 > 0, [request]);

  const handleCalculate = async () => {
    const errors: { bairroOuCep?: string } = {};
    if (!request.bairroOuCep.trim()) errors.bairroOuCep = 'Informe um bairro ou CEP.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    setResult(null);
    setSavedEstimativaId(null);
    try {
      const data = await estimativaService.calcular(request);
      setResult(data);
      localEstimateStorage.add({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        bairroOuCep: request.bairroOuCep,
        valorEstimado: data.valorEstimado
      });
      showToast({ type: 'success', title: 'Estimativa calculada', description: 'Confira o resultado e as dicas geradas.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Falha ao calcular estimativa', description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEstimate = async () => {
    if (!result) return;

    if (!isAuthenticated) {
      pendingEstimateStorage.set({ request, result, uiState });
      showToast({ type: 'info', title: 'Faça login para salvar', description: 'Seus dados foram preservados para continuar depois.' });
      navigate('/login', { state: { from: '/estimativas/nova' } });
      return;
    }

    setSaveLoading(true);
    try {
      const saved = await estimativaService.salvar({
        parametros: request,
        valorEstimado: result.valorEstimado,
        faixaMinima: result.faixaMinima,
        faixaMaxima: result.faixaMaxima,
        confianca: result.confianca
      });
      setSavedEstimativaId(saved.id);
      showToast({ type: 'success', title: 'Estimativa salva', description: `ID #${saved.id} salvo com sucesso.` });
    } catch (error) {
      showToast({ type: 'error', title: 'Não foi possível salvar', description: getErrorMessage(error) });
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setUiState((prev) => ({
      ...prev,
      comodidades: prev.comodidades.includes(amenity)
        ? prev.comodidades.filter((item) => item !== amenity)
        : [...prev.comodidades, amenity]
    }));
  };

  return (
    <div className='space-y-6'>
      <PageHeader title='Calcule a estimativa do seu imóvel' subtitle='Preencha os dados e veja uma estimativa de preço com confiança e dicas de fotos.' />

      <PropertyCard>
        <section id='localizacao' className='space-y-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Localização</h2>
          <AddressAutocomplete
            value={request.bairroOuCep}
            error={fieldErrors.bairroOuCep}
            onInputChange={(value) => setRequest((prev) => ({ ...prev, bairroOuCep: value }))}
            onAddressSelected={({ suggestion, details }) => {
              setRequest((prev) => ({ ...prev, bairroOuCep: suggestion.descricao }));
              setEnderecoCompleto(details.endereco);
              setAddressMeta({
                bairro: details.bairro,
                cidade: details.cidade,
                latitude: details.latitude,
                longitude: details.longitude
              });
              showToast({ type: 'success', title: 'Endereço selecionado', description: `${details.bairro} • ${details.cidade}` });
            }}
          />
        </section>

        <section className='space-y-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Tipo do imóvel</h2>
          <div className='grid grid-cols-2 gap-2'>
            {(['Apartamento', 'Casa'] as const).map((tipo) => (
              <button
                key={tipo}
                type='button'
                className={`focus-ring rounded-full border px-3 py-2 text-sm font-medium ${uiState.tipoImovel === tipo ? 'border-brand-900 bg-brand-900 text-white' : 'border-surface-100 bg-white text-brand-900'}`}
                onClick={() => setUiState((prev) => ({ ...prev, tipoImovel: tipo }))}
              >
                {tipo}
              </button>
            ))}
          </div>
          <Select label='Padrão' value={uiState.padrao} onChange={(e) => setUiState((prev) => ({ ...prev, padrao: e.target.value }))}>
            <option>Padrão</option>
            <option>Alto padrão</option>
            <option>Luxo</option>
          </Select>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Características</h2>
          <PriceRange min={20} max={500} value={request.areaM2} onChange={(areaM2) => setRequest((prev) => ({ ...prev, areaM2 }))} />
          <Input
            label='Condomínio mensal'
            placeholder='R$ 850'
            value={uiState.condominioMensal}
            onChange={(event) => setUiState((prev) => ({ ...prev, condominioMensal: event.target.value }))}
            helperText='Deixe 0 se não houver condomínio.'
          />
        </section>

        <section className='space-y-4'>
          <h2 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Instalações</h2>
          <div className='grid gap-4 md:grid-cols-3'>
            <div>
              <p className='mb-2 text-sm font-medium text-brand-900'>Número de quartos</p>
              <div className='flex flex-wrap gap-2'>
                {optionsSimple.map((option) => (
                  <button
                    key={option}
                    type='button'
                    className={`focus-ring min-w-10 rounded-full border px-3 py-2 text-sm ${request.quartos === parseNumericOption(option) ? 'border-brand-900 bg-brand-900 text-white' : 'border-surface-100 bg-white text-brand-900'}`}
                    onClick={() => setRequest((prev) => ({ ...prev, quartos: parseNumericOption(option) }))}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className='mb-2 text-sm font-medium text-brand-900'>Banheiros</p>
              <div className='flex flex-wrap gap-2'>
                {optionsSimple.map((option) => (
                  <button
                    key={option}
                    type='button'
                    className={`focus-ring min-w-10 rounded-full border px-3 py-2 text-sm ${request.banheiros === parseNumericOption(option) ? 'border-brand-900 bg-brand-900 text-white' : 'border-surface-100 bg-white text-brand-900'}`}
                    onClick={() => setRequest((prev) => ({ ...prev, banheiros: parseNumericOption(option) }))}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className='mb-2 text-sm font-medium text-brand-900'>Vagas de garagem</p>
              <div className='flex flex-wrap gap-2'>
                {garagemOptions.map((option) => (
                  <button
                    key={option}
                    type='button'
                    className={`focus-ring min-w-10 rounded-full border px-3 py-2 text-sm ${request.vagasGaragem === parseNumericOption(option) ? 'border-brand-900 bg-brand-900 text-white' : 'border-surface-100 bg-white text-brand-900'}`}
                    onClick={() => setRequest((prev) => ({ ...prev, vagasGaragem: parseNumericOption(option) }))}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className='space-y-4'>
          <h2 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Comodidades</h2>
          <div className='flex flex-wrap gap-2'>
            {comodidadesDisponiveis.map((amenity) => {
              const active = uiState.comodidades.includes(amenity);
              return (
                <button
                  key={amenity}
                  type='button'
                  className={`focus-ring inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${active ? 'border-brand-900 bg-brand-900 text-white' : 'border-surface-100 bg-white text-brand-900'}`}
                  onClick={() => toggleAmenity(amenity)}
                >
                  <span className={`inline-block h-3 w-3 rounded-sm border ${active ? 'border-white bg-white/90' : 'border-brand-900'}`} />
                  {amenity}
                </button>
              );
            })}
          </div>
        </section>

        <div className='space-y-2'>
          <Button onClick={handleCalculate} disabled={!canSubmit} loading={loading} fullWidth>
            Calcular estimativa
          </Button>
          {enderecoCompleto ? (
            <p className='text-xs text-gray-500'>
              Endereço selecionado: {enderecoCompleto} — {addressMeta.bairro}, {addressMeta.cidade}
            </p>
          ) : null}
        </div>
      </PropertyCard>

      {result ? (
        <div className='space-y-3'>
          <EstimateCard request={request} result={result} onSave={handleSaveEstimate} onReset={() => setResult(null)} saveLoading={saveLoading} />
          {savedEstimativaId ? (
            <div className='rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800'>
              Estimativa salva com sucesso (ID: #{savedEstimativaId}). Você já pode criar um anúncio a partir dela.
              <div className='mt-2'>
                <Button variant='secondary' onClick={() => navigate('/anuncios/novo', { state: { estimativaId: savedEstimativaId, bairro: addressMeta.bairro || request.bairroOuCep, enderecoCompleto: enderecoCompleto || request.bairroOuCep } })}>
                  Criar anúncio agora
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
