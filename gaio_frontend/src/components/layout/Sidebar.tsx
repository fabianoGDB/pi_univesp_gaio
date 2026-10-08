import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calculator, Megaphone, PlusSquare } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/estimativas/nova', label: 'Nova estimativa', icon: Calculator },
  { to: '/anuncios', label: 'Meus anúncios', icon: Megaphone },
  { to: '/anuncios/novo', label: 'Nova publicação', icon: PlusSquare }
];

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const location = useLocation();

  return (
    <>
      <aside className={clsx('fixed inset-y-0 left-0 z-30 w-72 bg-brand-900 px-5 py-6 text-white transition-transform md:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <p className='font-serifBrand text-3xl font-bold tracking-wide'>GAIÒ</p>
        <p className='mt-1 text-sm text-gray-200'>Painel de anúncios inteligentes</p>
        <nav className='mt-8 space-y-2'>
          {links.map((link) => {
            const Icon = link.icon;
            const active = location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={clsx('focus-ring flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition', active ? 'bg-white text-brand-900' : 'text-gray-200 hover:bg-brand-800')}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      {open && <button className='fixed inset-0 z-20 bg-black/30 md:hidden' onClick={onClose} aria-label='Fechar menu' />}
    </>
  );
};
