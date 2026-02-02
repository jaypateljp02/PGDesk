import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import Header from '../components/layout/Header';
import ProgressRing from '../components/ui/ProgressRing';
import Button from '../components/ui/Button';
import { foodAPI } from '../services/api';

import { useAuth } from '../context/AuthContext';

const Food = () => {
    const { t, n, user } = useAuth(); // Get t, n and user
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState({});

    // Determine locale based on user language
    const locale = user?.language === 'hi' ? 'hi-IN' : 'en-IN';

    useEffect(() => {
        loadFoodData();
    }, []);

    const loadFoodData = async () => {
        try {
            const response = await foodAPI.getToday();
            setData(response.data);
        } catch (error) {
            console.error('Failed to load food data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (residentId) => {
        setUpdating(prev => ({ ...prev, [residentId]: true }));
        try {
            const response = await foodAPI.toggleResident(residentId);
            // Update local state - fix: use _id field for comparison
            setData(prev => ({
                ...prev,
                eatingToday: response.data.eatingToday,
                wentHome: prev.total - response.data.eatingToday,
                residents: prev.residents.map(r =>
                    (r.id === residentId || r._id === residentId)
                        ? { ...r, isHome: response.data.resident.isHome }
                        : r
                )
            }));
        } catch (error) {
            console.error('Failed to toggle resident:', error);
            alert(`${t('error')}: Failed to update status`);
        } finally {
            setUpdating(prev => ({ ...prev, [residentId]: false }));
        }
    };

    const handleReset = async () => {
        try {
            const response = await foodAPI.reset();
            loadFoodData(); // Reload all data
        } catch (error) {
            console.error('Failed to reset:', error);
        }
    };

    const formatDate = () => {
        return new Date().toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="page">
                <Header title={t('foodCount')} />
                <div className="page-content flex items-center justify-center h-64">
                    <div className="animate-pulse text-gray-400">{t('loading')}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <Header
                title={t('foodCount')}
                subtitle={formatDate()}
            />

            <div className="page-content animate-fade-in">
                {/* Main Stat */}
                <div className="card mb-6">
                    <div className="flex flex-col items-center py-4">
                        <ProgressRing
                            value={data?.eatingToday || 0}
                            max={data?.total || 1}
                            color="var(--success)"
                            size={120}
                            strokeWidth={12}
                            displayValue={n(data?.eatingToday || 0)}
                        />
                        <div className="mt-4 text-center">
                            <div className="text-3xl font-bold text-green-600">
                                {n(data?.eatingToday || 0)}
                            </div>
                            <div className="text-gray-500">
                                {t('eatingToday')}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{n(data?.eatingToday || 0)}</div>
                            <div className="text-sm text-gray-500">{t('atPG')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-500">{n(data?.wentHome || 0)}</div>
                            <div className="text-sm text-gray-500">{t('wentHome')}</div>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">
                        {t('markWhoWentHome')}:
                    </h3>
                    <p className="text-sm text-gray-500">
                        {t('tapToToggle')}
                    </p>
                </div>

                {/* Residents List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {data?.residents?.map((resident) => (
                        <button
                            key={resident.id}
                            onClick={() => handleToggle(resident.id)}
                            disabled={updating[resident.id]}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all h-full ${resident.isHome
                                ? 'bg-orange-50 border-2 border-orange-300'
                                : 'bg-white border-2 border-transparent shadow-sm hover:shadow-md'
                                } ${updating[resident.id] ? 'opacity-50' : ''}`}
                        >
                            <div className={`w-8 h-8 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${resident.isHome
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'border-gray-300'
                                }`}>
                                {resident.isHome && (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="font-medium truncate">{resident.name}</div>
                                <div className="text-sm text-gray-500 truncate">
                                    {t('room')} {n(resident.room)} • {t('bed')} {n(resident.bed)}
                                </div>
                            </div>
                            <div className={`text-sm font-bold shrink-0 ${resident.isHome ? 'text-orange-500' : 'text-green-500'
                                }`}>
                                {resident.isHome ? t('home') : t('eating')}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Reset Button */}
                <Button
                    variant="outline"
                    fullWidth
                    onClick={handleReset}
                    icon={<RotateCcw size={20} />}
                >
                    {t('resetAll')}
                </Button>
            </div>
        </div>
    );
};

export default Food;
