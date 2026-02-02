import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Settings, Info } from 'lucide-react';
import Header from '../components/layout/Header';

const More = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            icon: UtensilsCrossed,
            label: 'Food Count',
            description: 'Manage daily food count',
            path: '/food',
            color: 'green'
        },
        {
            icon: Settings,
            label: 'Settings',
            description: 'PG preferences and language',
            path: '/settings',
            color: 'gray'
        },
        {
            icon: Info,
            label: 'About',
            description: 'Version and help',
            path: '/about',
            color: 'blue'
        }
    ];

    const colorClasses = {
        green: 'bg-green-100 text-green-600',
        gray: 'bg-gray-100 text-gray-600',
        blue: 'bg-blue-100 text-blue-600'
    };

    return (
        <div className="page">
            <Header title="More" gradient={false} />

            <div className="page-content animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuItems.map(({ icon: Icon, label, description, path, color }) => (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            className="w-full flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm text-left hover:shadow-md transition-all hover:-translate-y-1"
                        >
                            <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <div className="font-semibold">{label}</div>
                                <div className="text-sm text-gray-500">{description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default More;
