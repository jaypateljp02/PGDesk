import { useState, useEffect } from 'react';
import { LogOut, Globe, Calendar, UtensilsCrossed, Smartphone, Edit2, X, Save, Download, RefreshCw } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import { useAuth } from '../context/AuthContext';
import { rentAPI } from '../services/api';
import { usePWAInstall } from '../hooks/usePWAInstall';

const Settings = () => {
    const { user, logout, updateSettings, t } = useAuth(); // Destructure t
    const [saving, setSaving] = useState(false);
    const [showEditPGModal, setShowEditPGModal] = useState(false);
    const [autoRentLoading, setAutoRentLoading] = useState(false);
    const { canInstall, isInstalled, promptInstall } = usePWAInstall();

    // Auto create rent for current month
    const handleAutoCreateRent = async () => {
        setAutoRentLoading(true);
        try {
            const now = new Date();
            const response = await rentAPI.autoCreate(now.getMonth() + 1, now.getFullYear());
            alert(`✅ ${response.data.message}`);
        } catch (error) {
            console.error('Failed to auto-create rent:', error);
            alert(t('error'));
        } finally {
            setAutoRentLoading(false);
        }
    };

    const handleSettingChange = async (key, value) => {
        setSaving(true);
        try {
            const result = await updateSettings({ [key]: value });
            if (!result.success) {
                alert(`${t('error')}: ${result.message}`);
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            alert(t('error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page">
            <Header title={t('settings')} />

            <main className="page-content animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    {/* PG Details */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-500 text-sm">{t('pgDetails').toUpperCase()}</h3>
                            <button
                                onClick={() => setShowEditPGModal(true)}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-[var(--primary)] transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-gray-600">{t('name')}</span>
                                <span className="font-medium">{user?.name || 'PGDesk'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-gray-600">{t('ownerName')}</span>
                                <span className="font-medium">{user?.ownerName || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-600">{t('phone')}</span>
                                <span className="font-medium">{user?.phone || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-500 text-sm mb-3">{t('preferences').toUpperCase()}</h3>

                        {/* Language */}
                        <div className="py-4 border-b">
                            <div className="flex items-center gap-3 mb-3">
                                <Globe size={20} className="text-gray-400" />
                                <span className="font-medium">{t('language')}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSettingChange('language', 'en')}
                                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${user?.language === 'en' || !user?.language
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                    disabled={saving}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => handleSettingChange('language', 'hi')}
                                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${user?.language === 'hi'
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                    disabled={saving}
                                >
                                    हिंदी
                                </button>
                            </div>
                        </div>

                        {/* Default Rent Cycle */}
                        <div className="py-4 border-b">
                            <div className="flex items-center gap-3 mb-3">
                                <Calendar size={20} className="text-gray-400" />
                                <span className="font-medium">{t('rentCycle')}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => handleSettingChange('defaultRentCycle', 'fixed')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${user?.defaultRentCycle === 'fixed' || !user?.defaultRentCycle
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                    disabled={saving}
                                >
                                    {t('fixedDate')}
                                </button>
                                <button
                                    onClick={() => handleSettingChange('defaultRentCycle', 'individual')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${user?.defaultRentCycle === 'individual'
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                    disabled={saving}
                                >
                                    {t('individualDate')}
                                </button>
                            </div>
                        </div>

                        {/* Food Enabled by Default */}
                        <div className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <UtensilsCrossed size={20} className="text-gray-400" />
                                    <div>
                                        <span className="font-medium">{t('foodModule')}</span>
                                        <p className="text-sm text-gray-500">{t('enableFood')}</p>
                                    </div>
                                </div>
                                <Toggle
                                    checked={user?.defaultFoodEnabled !== false}
                                    onChange={(checked) => handleSettingChange('defaultFoodEnabled', checked)}
                                    disabled={saving}
                                />
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Connection */}
                    <WhatsAppConnection t={t} />

                    {/* Install App */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-500 text-sm mb-4">INSTALL APP</h3>

                        {!isInstalled && (
                            <div className="py-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <Download size={20} className="text-purple-500" />
                                    <div className="flex-1">
                                        <span className="font-medium">Add to Home Screen</span>
                                        <p className="text-sm text-gray-500">Install PGDesk for quick access</p>
                                    </div>
                                </div>
                                {canInstall ? (
                                    <button
                                        onClick={promptInstall}
                                        className="w-full py-2 mt-2 bg-purple-50 text-purple-600 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                                    >
                                        📱 Install PGDesk App
                                    </button>
                                ) : (
                                    <p className="text-sm text-gray-400 mt-2">
                                        Open in mobile browser → Menu → "Add to Home Screen"
                                    </p>
                                )}
                            </div>
                        )}

                        {isInstalled && (
                            <div className="py-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        ✓
                                    </div>
                                    <span className="text-green-600 font-medium">App Installed!</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="card lg:col-span-2">
                        <div className="max-w-md mx-auto">
                            <Button
                                variant="ghost"
                                fullWidth
                                onClick={logout}
                                className="text-red-500 hover:bg-red-50"
                                icon={<LogOut size={20} />}
                            >
                                {t('logout')}
                            </Button>
                        </div>
                        <p className="text-center text-gray-400 text-sm mt-4">
                            PGDesk v1.0.0
                        </p>
                    </div>
                </div>
            </main>

            {/* Edit PG Modal */}
            {showEditPGModal && (
                <EditPGModal
                    user={user}
                    onClose={() => setShowEditPGModal(false)}
                    updateSettings={updateSettings}
                    t={t}
                />
            )}
        </div>
    );
};

// Edit PG Details Modal
const EditPGModal = ({ user, onClose, updateSettings, t }) => {
    // ... (Keep existing logic, add t usage if needed, mostly form labels)
    // For brevity, skipping deep refactor of modal internals unless requested, 
    // but passing t prop down.

    // Quick inline refactor of visible labels for consistency
    const [formData, setFormData] = useState({
        name: user?.name || '',
        ownerName: user?.ownerName || '',
        phone: user?.phone || ''
    });
    const [loading, setLoading] = useState(false);

    const handlePhoneChange = (value) => {
        const numericValue = value.replace(/\D/g, '').slice(0, 10);
        setFormData(prev => ({ ...prev, phone: numericValue }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.phone || formData.phone.length < 10) {
            alert(t('error'));
            return;
        }

        setLoading(true);
        try {
            await updateSettings(formData);
            onClose();
        } catch (error) {
            console.error('Failed to update details:', error);
            alert(t('error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-16 pb-4 px-4 overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up my-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">{t('edit')} {t('pgDetails')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="input-group">
                        <label className="input-label">{t('name')} *</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('ownerName')}</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.ownerName}
                            onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('phone')} *</label>
                        <input
                            type="tel"
                            className="input"
                            value={formData.phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            maxLength={10}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <Button variant="ghost" onClick={onClose} fullWidth>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        fullWidth
                        loading={loading}
                        icon={<Save size={18} />}
                    >
                        {t('save')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// WhatsApp Connection Component
const WhatsAppConnection = ({ t }) => {
    const [status, setStatus] = useState({ isReady: false, isInitializing: false, qrCode: null });
    const [loading, setLoading] = useState(false);

    const checkStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/whatsapp/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStatus(data);
            }
        } catch (error) {
            console.error('Failed to check WhatsApp status:', error);
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/whatsapp/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            checkStatus();
        } catch (error) {
            console.error('Failed to initialize WhatsApp:', error);
            alert(t('error'));
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/whatsapp/disconnect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            setStatus({ isReady: false, isInitializing: false, qrCode: null });
        } catch (error) {
            console.error('Failed to disconnect WhatsApp:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-4">
                <Smartphone size={20} className="text-green-500" />
                <h3 className="font-semibold text-gray-500 text-sm">{t('whatsappConnection').toUpperCase()}</h3>
            </div>

            {status.isReady ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-700 font-medium">{t('connected')}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        {t('sendReminders')} {t('enabled')}.
                    </p>
                    <button
                        onClick={handleDisconnect}
                        disabled={loading}
                        className="text-red-500 text-sm font-medium hover:underline"
                    >
                        {loading ? t('loading') : t('disconnect')}
                    </button>
                </div>
            ) : status.isInitializing && status.qrCode ? (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">{t('scanQR')}:</p>
                    <div className="p-4 bg-white border rounded-xl flex justify-center">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(status.qrCode)}`}
                            alt="WhatsApp QR Code"
                            className="w-48 h-48"
                        />
                    </div>
                </div>
            ) : status.isInitializing ? (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl">
                    <div className="animate-spin w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                    <span className="text-yellow-700">{t('loading')}</span>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                        {t('connect')} WhatsApp
                    </p>
                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? t('loading') : `🔗 ${t('connect')}`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Settings;
