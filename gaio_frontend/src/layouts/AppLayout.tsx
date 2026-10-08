import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-surface-50'>
        <header className='border-b border-surface-100 bg-white px-6 py-4'>
          <p className='font-serifBrand text-3xl font-bold text-brand-900'>GAIÒ</p>
          <p className='text-sm text-gray-500'>Estimativa inteligente de imóveis</p>
        </header>
        <main className='mx-auto max-w-5xl p-4 md:p-8'>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-surface-50'>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className='md:pl-72'>
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className='mx-auto max-w-7xl p-4 md:p-8'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
