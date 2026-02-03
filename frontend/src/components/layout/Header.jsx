import { ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({
    title,
    subtitle,
    showBack = false,
    showSettings = false,
    rightAction,
    gradient = true
}) => {
    const navigate = useNavigate();

    return (
        <header className={`page-header ${gradient ? 'gradient-header' : 'bg-white border-b border-gray-200'}`}>
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    {showBack ? (
                        <button
                            onClick={() => navigate(-1)}
                            className={`btn-icon btn-ghost ${gradient ? 'text-white' : 'text-gray-600'}`}
                        >
                            <ArrowLeft size={24} />
                        </button>
                    ) : (
                        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/20">
                            <img
                                src="/logo.png"
                                alt="PGDesk"
                                className="w-9 h-9 object-contain"
                            />
                        </div>
                    )}
                    <div>
                        <h1 className={`text-xl font-bold tracking-tight ${gradient ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className={`text-sm ${gradient ? 'text-white/80' : 'text-gray-500'}`}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {rightAction}
                    {showSettings && (
                        <button
                            onClick={() => navigate('/settings')}
                            className={`btn-icon btn-ghost ${gradient ? 'text-white' : 'text-gray-600'}`}
                        >
                            <Settings size={24} />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
