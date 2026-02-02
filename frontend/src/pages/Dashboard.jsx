import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, Users, IndianRupee, UtensilsCrossed, MessageCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import ProgressRing from '../components/ui/ProgressRing';
import Button from '../components/ui/Button';
import { dashboardAPI, rentAPI, whatsappAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, t, n } = useAuth(); // Get t() and n() from context
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await dashboardAPI.getStats();
            setStats(response.data.stats);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('goodMorning');
        if (hour < 17) return t('goodAfternoon');
        return t('goodEvening');
    };

    const handleWhatsAppReminders = async () => {
        if (!confirm('Send WhatsApp reminders to all pending residents? This will open multiple WhatsApp tabs.')) {
            return;
        }

        setSending(true);
        try {
            // 1. Get Pending Data
            const response = await rentAPI.getPending();
            const pending = response.data;

            if (pending.length === 0) {
                alert('No pending rents found!');
                return;
            }

            // 2. Format for WhatsApp API
            const residentsData = pending.map(rent => ({
                phone: rent?.residentId?.phone,
                name: rent?.residentId?.name,
                amount: rent?.amountDue
            })).filter(r => r.phone && r.name); // basic filter

            // 3. Send to Backend Automation
            const autoResponse = await whatsappAPI.sendReminders(residentsData);

            if (autoResponse.data.success) {
                alert(autoResponse.data.message);
            } else {
                alert(autoResponse.data.message || 'Failed to send reminders.');
            }

        } catch (error) {
            console.error('Failed to send reminders:', error);
            alert(t('error'));
        } finally {
            setSending(false);
        }
    };

    const actionCards = [
        { icon: DoorOpen, label: t('rooms'), path: '/rooms', color: 'purple' },
        { icon: Users, label: t('residents'), path: '/residents', color: 'teal' },
        { icon: IndianRupee, label: t('rent'), path: '/rent', color: 'coral' },
        { icon: UtensilsCrossed, label: t('food'), path: '/food', color: 'green' },
    ];

    if (loading) {
        return (
            <div className="page">
                <Header title={t('loading')} showSettings />
                <div className="page-content flex items-center justify-center h-64">
                    <div className="animate-pulse text-gray-400">{t('loading')}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <Header
                title={getGreeting()}
                subtitle={user?.name || 'PGDesk'}
                showSettings
            />

            <div className="page-content animate-fade-in">
                {/* Stats Row with Progress Rings */}
                <div className="card mb-4">
                    <div className="flex justify-around">
                        <ProgressRing
                            value={stats?.eatingToday || 0}
                            max={stats?.totalWithFood || 100}
                            color="var(--success)"
                            label={t('food')}
                            size={70}
                            displayValue={n(stats?.eatingToday || 0)}
                        />
                        <ProgressRing
                            value={stats?.pendingRent || 0}
                            max={stats?.totalResidents || 100}
                            color="var(--warning)"
                            label={t('rentPending')}
                            size={70}
                            displayValue={n(stats?.pendingRent || 0)}
                        />
                        <ProgressRing
                            value={stats?.vacantBeds || 0}
                            max={(stats?.vacantBeds || 0) + (stats?.totalResidents || 0)}
                            color="var(--info)"
                            label={t('vacant')}
                            size={70}
                            displayValue={n(stats?.vacantBeds || 0)}
                        />
                    </div>
                </div>



                {/* WhatsApp Reminder Button - Prominent Placement */}
                {stats?.pendingRent > 0 && (
                    <div className="mb-6 animate-fade-in">
                        <Button
                            variant="whatsapp"
                            fullWidth
                            size="lg"
                            icon={<MessageCircle size={24} />}
                            onClick={handleWhatsAppReminders}
                            disabled={sending}
                        >
                            {sending ? t('sending') : `${t('sendReminders')} (${n(stats.pendingRent)})`}
                        </Button>
                        <p className="text-center text-xs text-gray-500 mt-2">
                            {t('oneClickAutomation')}
                        </p>
                    </div>
                )}

                {/* Action Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {actionCards.map(({ icon: Icon, label, path, color }) => (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            className="action-card hover:scale-105 transition-transform"
                        >
                            <div className={`action-card-icon ${color}`}>
                                <Icon size={24} />
                            </div>
                            <span className="action-card-label">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* WhatsApp FAB */}
            {stats?.pendingRent > 0 && (
                <button
                    onClick={handleWhatsAppReminders}
                    className="fab fab-whatsapp lg:hidden"
                >
                    <MessageCircle size={24} />
                </button>
            )}
        </div>
    );
};

export default Dashboard;
