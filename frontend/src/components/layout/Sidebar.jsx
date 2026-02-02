import { NavLink, useLocation } from 'react-router-dom';
import { Home, DoorOpen, Users, IndianRupee, UtensilsCrossed, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { logout, t } = useAuth();

    const navItems = [
        { path: '/', icon: Home, label: t('dashboard') },
        { path: '/rooms', icon: DoorOpen, label: t('rooms') },
        { path: '/residents', icon: Users, label: t('residents') },
        { path: '/rent', icon: IndianRupee, label: t('rent') },
        { path: '/food', icon: UtensilsCrossed, label: t('food') },
        { path: '/settings', icon: Settings, label: t('settings') },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col z-50">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                    <img src="/icon-192.png" alt="PGDesk Logo" className="w-full h-full object-contain scale-110" />
                </div>
                <div>
                    <h1 className="font-bold text-gray-800 text-lg">PGDesk</h1>
                    <p className="text-xs text-gray-400">{t('desktopEdition')}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {navItems.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive
                                ? 'bg-[#FFEBEE] text-[#FF7A5C]'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <Icon size={20} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                    <LogOut size={20} />
                    <span>{t('logout')}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
