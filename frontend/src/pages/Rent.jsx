import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, MessageCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import ProgressRing from '../components/ui/ProgressRing';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { rentAPI, whatsappAPI } from '../services/api';

import { useAuth } from '../context/AuthContext';

const Rent = () => {
    const { t, n } = useAuth(); // Get t and n
    const [searchParams, setSearchParams] = useSearchParams();
    const [rentData, setRentData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(searchParams.get('filter') || 'all');

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const [selectedRent, setSelectedRent] = useState(null);
    const [paymentType, setPaymentType] = useState('full');
    const [amount, setAmount] = useState('');
    const [isSendingReminders, setIsSendingReminders] = useState(false);

    useEffect(() => {
        loadRent();
    }, [currentMonth, currentYear]);

    const loadRent = async () => {
        try {
            const response = await rentAPI.getByMonth(currentMonth, currentYear);
            setRentData(response.data.rentData);
            setSummary(response.data.summary);
        } catch (error) {
            console.error('Failed to load rent:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleMarkPaid = (rent) => {
        setSelectedRent(rent);
        setPaymentType('full');
        setAmount('');
    };

    const handleSubmitPayment = async () => {
        if (!selectedRent) return;

        setLoading(true);

        try {
            if (paymentType === 'full') {
                await rentAPI.markPaid(selectedRent._id);
            } else if (paymentType === 'partial') {
                await rentAPI.markPartial(selectedRent._id, Number(amount));
            } else if (paymentType === 'claimed') {
                await rentAPI.markClaimed(selectedRent._id, amount ? Number(amount) : selectedRent.amountDue);
            }
            setSelectedRent(null);
            loadRent();
        } catch (error) {
            console.error('Failed to record payment:', error);
            alert(`${t('error')}: Failed to record payment`);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = (resident) => {
        const messageTemplate = t('pendingReminderMessage') || "Hi {name}, your PG rent for this month is pending. Please make the payment and reply PAID.";
        const message = encodeURIComponent(messageTemplate.replace('{name}', resident.name));
        window.open(`https://wa.me/91${resident.phone?.replace(/\D/g, '')}?text=${message}`);
    };

    const handleSendAllReminders = async () => {
        const pendingResidents = getFilteredData().filter(r =>
            ['pending', 'overdue'].includes(r.status)
        );

        if (pendingResidents.length === 0) {
            alert(t('noRemindersToSend') || 'No pending reminders to send!');
            return;
        }

        setIsSendingReminders(true);
        try {
            const residentsData = pendingResidents.map(rent => ({
                phone: rent.resident?.phone,
                name: rent.resident?.name,
                amount: rent.amountDue
            }));

            const response = await whatsappAPI.sendReminders(residentsData);

            if (response.data.success) {
                alert(response.data.message);
            } else {
                alert(response.data.message || t('whatsappAutomationFailed'));
            }
        } catch (error) {
            console.error('WhatsApp automation error:', error);
            alert(t('whatsappAutomationFailed'));
        } finally {
            setIsSendingReminders(false);
        }
    };

    const getMonthName = (month) => {
        const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        return t(monthKeys[month - 1]);
    };

    const getFilteredData = () => {
        if (filter === 'all') return rentData;
        return rentData.filter(r => r.status === filter);
    };

    const filters = [
        { value: 'all', label: t('all') },
        { value: 'pending', label: t('pending') },
        { value: 'paid', label: t('paid') },
        { value: 'overdue', label: t('overdue') }
    ];

    const pendingCount = summary?.pending + summary?.overdue || 0;

    return (
        <div className="page">
            <Header title={t('rent')} />

            <div className="page-content animate-fade-in">
                {/* Month Selector */}
                <div className="flex items-center justify-center gap-4 mb-4">
                    <button onClick={handlePrevMonth} className="btn-icon btn-ghost">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-lg font-semibold min-w-[150px] text-center">
                        {getMonthName(currentMonth)} {n(currentYear)}
                    </h2>
                    <button onClick={handleNextMonth} className="btn-icon btn-ghost">
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Stats Summary */}
                {summary && (
                    <div className="card mb-4">
                        <div className="flex justify-around">
                            <ProgressRing
                                value={summary.paid}
                                max={summary.total || 1}
                                color="var(--success)"
                                label={t('paid')}
                                size={65}
                                displayValue={n(summary.paid)}
                            />
                            <ProgressRing
                                value={summary.pending}
                                max={summary.total || 1}
                                color="var(--warning)"
                                label={t('pending')}
                                size={65}
                                displayValue={n(summary.pending)}
                            />
                            <ProgressRing
                                value={summary.overdue}
                                max={summary.total || 1}
                                color="var(--error)"
                                label={t('overdue')}
                                size={65}
                                displayValue={n(summary.overdue)}
                            />
                        </div>
                        <div className="text-center mt-3 pt-3 border-t">
                            <div className="text-sm text-gray-500">{t('collected')}</div>
                            <div className="text-xl font-bold">
                                ₹{n(summary.collectedAmount)} / ₹{n(summary.totalAmount)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs & WhatsApp All Button */}
                <div className="mb-4 space-y-4">
                    <div className="filter-tabs">
                        {filters.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => {
                                    setFilter(value);
                                    setSearchParams(value === 'all' ? {} : { filter: value });
                                }}
                                className={`filter-tab ${filter === value ? 'active' : ''}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {pendingCount > 0 && (
                        <Button
                            variant="whatsapp"
                            fullWidth
                            size="md"
                            icon={<MessageCircle size={20} />}
                            onClick={handleSendAllReminders}
                            disabled={isSendingReminders}
                        >
                            {isSendingReminders ? t('sending') : `${t('sendReminders')} (${n(pendingCount)})`}
                        </Button>
                    )}
                </div>

                {/* Rent List */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-pulse text-gray-400">{t('loading')}</div>
                    </div>
                ) : getFilteredData().length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">{t('noResidentsFound')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24 lg:pb-0">
                        {getFilteredData().map((rent) => (
                            <div key={rent._id} className="card h-full flex flex-col justify-between hover:shadow-md transition-all">
                                <div>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="font-semibold">{rent.resident?.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {t('room')} {n(rent.resident?.room)}
                                                {rent.resident?.section && ` • ${rent.resident.section}`}
                                                {rent.resident?.bed && ` • ${t('bed')} ${n(rent.resident.bed)}`}
                                            </div>
                                        </div>
                                        <Badge status={rent.status} />
                                    </div>

                                    <div className="text-lg font-bold mb-4">
                                        ₹{n(rent.amountDue)}
                                        {rent.status === 'overdue' && (
                                            <div className="text-sm text-red-500 font-normal mt-1">
                                                {n(rent.daysOverdue)} {t('overdue')} {t('days')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {rent.status !== 'paid' && (
                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 mt-auto">
                                        <button
                                            onClick={() => handleMarkPaid(rent)}
                                            className="btn-icon bg-green-100 text-green-600 hover:bg-green-200 w-10 h-10 flex items-center justify-center p-0"
                                            title={t('markPaid')}
                                        >
                                            <Check size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleSendReminder(rent.resident)}
                                            className="btn-icon bg-green-500 text-white hover:bg-green-600 w-10 h-10 flex items-center justify-center p-0"
                                            title={t('sendReminders')}
                                        >
                                            <MessageCircle size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Payment Modal */}
                {selectedRent && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                            <h2 className="text-xl font-bold mb-1">{t('recordPayment')}</h2>
                            <p className="text-gray-500 mb-6">
                                {selectedRent.resident?.name} • ₹{n(selectedRent.amountDue)} {t('pending')}
                            </p>

                            <div className="space-y-4 mb-6">
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button onClick={() => setPaymentType('full')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${paymentType === 'full' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>{t('full')}</button>
                                    <button onClick={() => setPaymentType('partial')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${paymentType === 'partial' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>{t('partial')}</button>
                                    <button onClick={() => setPaymentType('claimed')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${paymentType === 'claimed' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>{t('claimed')}</button>
                                </div>

                                {paymentType === 'full' && (
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                                        <div className="text-green-800 font-medium mb-1">{t('markPaid')}</div>
                                        <div className="text-3xl font-bold text-green-600">₹{n(selectedRent.amountDue)}</div>
                                        <p className="text-sm text-green-700 mt-2">{t('status')} &rarr; <span className="font-bold">{t('paid')}</span></p>
                                    </div>
                                )}

                                {paymentType === 'partial' && (
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700">{t('amount')}</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-gray-500">₹</span>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="input pl-8 w-full text-lg font-bold"
                                                placeholder="0.00"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                )}

                                {paymentType === 'claimed' && (
                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-center">
                                        <p className="text-sm text-yellow-800 mb-3">{t('claimedHelp')}</p>
                                        <label className="block text-xs font-bold text-left text-yellow-700 mb-1 uppercase tracking-wider">{t('claimedAmount')}</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-yellow-600">₹</span>
                                            <input
                                                type="number"
                                                value={amount || ''}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="input pl-8 w-full border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400"
                                                placeholder={n(selectedRent.amountDue)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button variant="ghost" fullWidth onClick={() => setSelectedRent(null)}>{t('cancel')}</Button>
                                <Button
                                    fullWidth
                                    onClick={handleSubmitPayment}
                                    disabled={loading || (paymentType === 'partial' && !amount)}
                                >
                                    {loading ? t('loading') : t('confirm')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Rent;
