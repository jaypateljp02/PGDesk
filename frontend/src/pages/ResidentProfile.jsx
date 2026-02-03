import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, LogOut, Edit2, X, Save } from 'lucide-react';
import Header from '../components/layout/Header';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toggle from '../components/ui/Toggle';
import { residentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ResidentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, n } = useAuth();
    const [resident, setResident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showVacateModal, setShowVacateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        loadResident();
    }, [id]);

    const loadResident = async () => {
        try {
            const response = await residentsAPI.getById(id);
            setResident(response.data);
        } catch (error) {
            console.error('Failed to load resident:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = () => {
        window.open(`tel:${resident.phone}`);
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Hi ${resident.name}, this is regarding your PG rent.`);
        window.open(`https://wa.me/91${resident.phone.replace(/\D/g, '')}?text=${message}`);
    };

    const handleVacate = async () => {
        try {
            await residentsAPI.vacate(id);
            navigate('/residents');
        } catch (error) {
            console.error('Failed to vacate resident:', error);
            alert(t('error') || 'Failed to vacate resident');
        }
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    };

    const getMonthName = (month) => {
        const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        return t(monthKeys[month - 1]);
    };

    if (loading) {
        return (
            <div className="page">
                <Header title={t('loading')} showBack gradient={false} />
                <div className="page-content flex items-center justify-center h-64">
                    <div className="animate-pulse text-gray-400">{t('loading')}</div>
                </div>
            </div>
        );
    }

    if (!resident) {
        return (
            <div className="page">
                <Header title={t('error')} showBack gradient={false} />
                <div className="page-content text-center py-12">
                    <p className="text-gray-500">{t('noResidentsFound')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <Header
                title=""
                showBack
                gradient={false}
                rightAction={
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="btn-icon btn-ghost text-gray-600"
                    >
                        <Edit2 size={20} />
                    </button>
                }
            />

            <div className="page-content animate-fade-in">
                {/* Profile Header */}
                <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[var(--primary-start)] to-[var(--primary-end)] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                        {getInitials(resident.name)}
                    </div>
                    <h1 className="text-xl font-bold">{resident.name}</h1>
                    <p className="text-gray-500">+९१ {n(resident.phone)}</p>
                </div>

                {/* Location Info */}
                <div className="card mb-4">
                    <div className="grid grid-cols-3 text-center divide-x">
                        <div>
                            <div className="text-sm text-gray-500">{t('room')}</div>
                            <div className="font-semibold">{n(resident.room?.name) || '-'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">{t('sectionName') || t('section')}</div>
                            <div className="font-semibold">
                                {resident.section?.name && resident.section.name !== '_default'
                                    ? resident.section.name
                                    : '-'}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">{t('beds') || t('bed')}</div>
                            <div className="font-semibold">{n(resident.bed?.name) || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Rent Info */}
                <div className="card mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500">{t('monthlyRent')}</span>
                        <span className="text-xl font-bold">₹{n(resident.rentAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">{t('dueDate')}</span>
                        <span className="font-medium">{n(resident.rentDueDate || 1)} {t('everyMonth')}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-500">{t('foodEnabled')}</span>
                        <span className="font-medium">{resident.foodEnabled ? `✅ ${t('confirm')}` : `❌ ${t('cancel')}`}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-500">{t('joined')}</span>
                        <span className="font-medium">
                            {new Date(resident.joinDate).toLocaleDateString(t('language') === 'Hindi' ? 'hi-IN' : 'en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>

                {/* Rent History */}
                <div className="card mb-4">
                    <h3 className="font-semibold mb-3">{t('rentHistory')}</h3>
                    <div className="space-y-2">
                        {resident.rentHistory?.length > 0 ? (
                            resident.rentHistory.map((rent) => (
                                <div
                                    key={rent._id}
                                    className="flex items-center justify-between py-2 border-b last:border-0"
                                >
                                    <span className="text-gray-600">
                                        {getMonthName(rent.month)} {n(rent.year)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">₹{n(rent.amountDue)}</span>
                                        <Badge status={rent.status} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-center py-4">{t('noRentHistory')}</p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-4">
                    <Button variant="secondary" fullWidth onClick={handleCall} icon={<Phone size={20} />}>
                        {t('call')}
                    </Button>
                    <Button variant="whatsapp" fullWidth onClick={handleWhatsApp} icon={<MessageCircle size={20} />}>
                        {t('whatsapp')}
                    </Button>
                </div>

                {/* Vacate Button */}
                <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => setShowVacateModal(true)}
                    className="text-red-500 hover:bg-red-50"
                    icon={<LogOut size={20} />}
                >
                    {t('vacate')} / {t('checkout')}
                </Button>
            </div>

            {/* Vacate Confirmation Modal */}
            {showVacateModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-fade-in">
                        <h2 className="text-xl font-bold mb-2">{t('vacateConfirm')}</h2>
                        <p className="text-gray-600 mb-6">
                            {t('vacateWarning')} <strong>{resident.name}</strong>?
                            {t('vacateHelpText')}
                        </p>
                        <div className="flex gap-3">
                            <Button variant="ghost" fullWidth onClick={() => setShowVacateModal(false)}>
                                {t('cancel')}
                            </Button>
                            <button
                                onClick={handleVacate}
                                className="btn w-full bg-red-500 text-white hover:bg-red-600"
                            >
                                {t('yesVacate')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Resident Modal */}
            {showEditModal && (
                <EditResidentModal
                    resident={resident}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        loadResident();
                    }}
                />
            )}
        </div>
    );
};

// Edit Resident Modal
const EditResidentModal = ({ resident, onClose, onSuccess }) => {
    const { t, n } = useAuth();
    const [formData, setFormData] = useState({
        name: resident.name || '',
        phone: resident.phone || '',
        rentAmount: resident.rentAmount?.toString() || '',
        rentDueDate: resident.rentDueDate?.toString() || '1',
        foodEnabled: resident.foodEnabled !== false
    });
    const [loading, setLoading] = useState(false);

    const handlePhoneChange = (value) => {
        // Only allow numeric input, max 10 digits
        const numericValue = value.replace(/\D/g, '').slice(0, 10);
        setFormData(prev => ({ ...prev, phone: numericValue }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.phone || formData.phone.length < 10) {
            alert(t('fillRequired') || 'Please fill in all required fields correctly');
            return;
        }

        setLoading(true);
        try {
            await residentsAPI.update(resident._id, {
                name: formData.name.trim(),
                phone: formData.phone,
                rentAmount: parseInt(formData.rentAmount) || 0,
                rentDueDate: parseInt(formData.rentDueDate) || 1,
                foodEnabled: formData.foodEnabled
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to update resident:', error);
            alert(t('error') || 'Failed to update resident. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">{t('editResident')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Name */}
                    <div className="input-group">
                        <label className="input-label">{t('name')} *</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder={t('namePlaceholder')}
                        />
                    </div>

                    {/* Phone */}
                    <div className="input-group">
                        <label className="input-label">{t('phone')} *</label>
                        <input
                            type="tel"
                            className="input"
                            value={formData.phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="9876543210"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                        />
                    </div>

                    {/* Rent Amount */}
                    <div className="input-group">
                        <label className="input-label">{t('monthlyRent')} (₹)</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.rentAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, rentAmount: e.target.value }))}
                            placeholder="e.g., 4500"
                        />
                    </div>

                    {/* Rent Due Date */}
                    <div className="input-group">
                        <label className="input-label">{t('dueDate')} ({t('dayOfMonth')})</label>
                        <select
                            className="input"
                            value={formData.rentDueDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, rentDueDate: e.target.value }))}
                        >
                            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                <option key={day} value={day}>{day} {t('everyMonth')}</option>
                            ))}
                        </select>
                    </div>

                    {/* Food Enabled */}
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-medium">{t('foodEnabled')}</p>
                            <p className="text-sm text-gray-500">{t('foodHelpText')}</p>
                        </div>
                        <Toggle
                            checked={formData.foodEnabled}
                            onChange={(checked) => setFormData(prev => ({ ...prev, foodEnabled: checked }))}
                        />
                    </div>

                    {/* Current Room/Bed Info */}
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-sm text-gray-500 mb-1">{t('currentLocation')}</p>
                        <p className="font-medium">
                            {t('room')} {n(resident.room?.name) || t('noRoom')}
                            {resident.section?.name && resident.section.name !== '_default' ? ` → ${resident.section.name}` : ''}
                            {resident.bed?.name ? ` → ${t('bed')} ${n(resident.bed.name)}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {t('changeRoomHelpText')}
                        </p>
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
                        {t('saveChanges')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ResidentProfile;
