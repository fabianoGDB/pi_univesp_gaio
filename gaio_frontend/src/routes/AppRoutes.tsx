import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { LoginPage } from '../pages/LoginPage';
import { CadastroPage } from '../pages/CadastroPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EstimativasPage } from '../pages/EstimativasPage';
import { NovaEstimativaPage } from '../pages/NovaEstimativaPage';
import { EstimativaDetalhePage } from '../pages/EstimativaDetalhePage';
import { AnunciosPage } from '../pages/AnunciosPage';
import { NovoAnuncioPage } from '../pages/NovoAnuncioPage';
import { AnuncioDetalhePage } from '../pages/AnuncioDetalhePage';
import { EditarAnuncioPage } from '../pages/EditarAnuncioPage';

export const AppRoutes = () => (
  <Routes>
    <Route path='/' element={<Navigate to='/dashboard' replace />} />
    <Route path='/login' element={<LoginPage />} />
    <Route path='/cadastro' element={<CadastroPage />} />

    <Route element={<AppLayout />}>
      <Route path='/estimativas' element={<EstimativasPage />} />
      <Route path='/estimativas/nova' element={<NovaEstimativaPage />} />
      <Route path='/estimativas/:id' element={<EstimativaDetalhePage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/anuncios' element={<AnunciosPage />} />
        <Route path='/anuncios/novo' element={<NovoAnuncioPage />} />
        <Route path='/anuncios/:id' element={<AnuncioDetalhePage />} />
        <Route path='/anuncios/:id/editar' element={<EditarAnuncioPage />} />
      </Route>
    </Route>

    <Route path='*' element={<Navigate to='/dashboard' replace />} />
  </Routes>
);
