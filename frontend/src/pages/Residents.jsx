import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, ChevronRight } from 'lucide-react';
import Header from '../components/layout/Header';
import Badge from '../components/ui/Badge';
import { residentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Residents = () => {
    const navigate = useNavigate();
    const { t, n } = useAuth(); // Get t and n
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadResidents();
    }, [filter, search]);

    const loadResidents = async () => {
        try {
            const response = await residentsAPI.getAll({
                status: filter,
                search: search.trim()
            });
            setResidents(response.data);
        } catch (error) {
            console.error('Failed to load residents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (e, phone) => {
        e.stopPropagation();
        window.open(`tel:${phone}`);
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const filters = [
        { value: 'all', label: t('all') },
        { value: 'paid', label: t('paid') },
        { value: 'pending', label: t('pending') },
        { value: 'overdue', label: t('overdue') }
    ];

    return (
        <div className="page">
            <Header
                title={t('residents')}
                rightAction={
                    <button
                        onClick={() => navigate('/residents/add')}
                        className="btn-icon btn-ghost text-white"
                    >
                        <Plus size={24} />
                    </button>
                }
            />

            <div className="page-content animate-fade-in">
                {/* Search Bar */}
                <div className="search-bar mb-4">
                    <Search size={20} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs mb-4">
                    {filters.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value)}
                            className={`filter-tab ${filter === value ? 'active' : ''}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Residents List */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-pulse text-gray-400">{t('loading')}</div>
                    </div>
                ) : residents.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            {search || filter !== 'all'
                                ? t('noResidentsFound')
                                : t('noResidentsAdded')}
                        </div>
                        {!search && filter === 'all' && (
                            <button
                                onClick={() => navigate('/residents/add')}
                                className="btn btn-primary"
                            >
                                <Plus size={20} />
                                {t('addFirstResident')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {residents.map((resident) => (
                            <button
                                key={resident._id}
                                onClick={() => navigate(`/residents/${resident._id}`)}
                                className="list-item w-full text-left h-full flex flex-col items-start gap-3 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div className="list-item-avatar shrink-0">
                                        {getInitials(resident.name)}
                                    </div>
                                    <div className="list-item-content min-w-0 flex-1">
                                        <div className="list-item-title truncate">{resident.name}</div>
                                        <div className="list-item-subtitle truncate">
                                            {t('room')} {n(resident.room?.name) || t('noRoom')}
                                            {resident.section?.name && resident.section.name !== '_default' &&
                                                ` • ${resident.section.name}`
                                            }
                                            {resident.bed?.name && ` • ${t('bed')} ${n(resident.bed.name)}`}
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-400 shrink-0" />
                                </div>

                                <div className="flex items-center justify-between w-full pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            ₹{n(resident.rentAmount)}
                                        </span>
                                        <Badge status={resident.currentRentStatus} />
                                    </div>
                                    <div
                                        onClick={(e) => handleCall(e, resident.phone)}
                                        className="btn-icon btn-ghost text-gray-400 hover:text-[var(--primary)] w-10 h-10 flex items-center justify-center p-0"
                                    >
                                        <Phone size={18} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Floating Add Button */}
                <button
                    onClick={() => navigate('/residents/add')}
                    className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--primary-start)] to-[var(--primary-end)] text-white shadow-lg flex items-center justify-center"
                >
                    <Plus size={24} />
                </button>
            </div>
        </div>
    );
};

export default Residents;
