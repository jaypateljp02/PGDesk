import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import { roomsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Rooms = () => {
    const navigate = useNavigate();
    const { t, n } = useAuth(); // Get t() and n() from context
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const response = await roomsAPI.getAll();
            setRooms(response.data);
        } catch (error) {
            console.error('Failed to load rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOccupancyPercent = (room) => {
        if (room.totalBeds === 0) return 0;
        return Math.round((room.occupiedBeds / room.totalBeds) * 100);
    };

    return (
        <div className="page">
            <Header
                title={t('rooms')}
                rightAction={
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-icon btn-ghost text-white"
                    >
                        <Plus size={24} />
                    </button>
                }
            />

            <div className="page-content animate-fade-in">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-pulse text-gray-400">{t('loading')}</div>
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">{t('noRoomsAdded')}</div>
                        <Button onClick={() => setShowAddModal(true)} icon={<Plus size={20} />}>
                            {t('addRoom')}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map((room) => (
                            <button
                                key={room._id}
                                onClick={() => navigate(`/rooms/${room._id}`)}
                                className="card card-hover w-full text-left h-full flex flex-col justify-center"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{room.name}</h3>
                                        <div className="text-sm text-gray-500">
                                            {n(room.occupiedBeds)}/{n(room.totalBeds)} {t('occupied')}
                                        </div>

                                        {/* Occupancy Progress Bar */}
                                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${getOccupancyPercent(room)}%`,
                                                    background: room.vacantBeds > 0
                                                        ? 'linear-gradient(90deg, var(--success), var(--warning))'
                                                        : 'var(--success)'
                                                }}
                                            />
                                        </div>

                                        {/* Bed Indicators */}
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {Array.from({ length: room.totalBeds }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-3 h-3 rounded-full ${i < room.occupiedBeds ? 'bg-green-500' : 'bg-orange-400'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-400" size={20} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Floating Add Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--primary-start)] to-[var(--primary-end)] text-white shadow-lg flex items-center justify-center"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Add Room Modal */}
            {showAddModal && (
                <AddRoomModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        loadRooms();
                    }}
                    t={t}
                />
            )}
        </div>
    );
};

// Add Room Modal Component
const AddRoomModal = ({ onClose, onSuccess, t }) => {
    const [name, setName] = useState('');
    const [hasSections, setHasSections] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;

        setLoading(true);
        try {
            await roomsAPI.create({ name: name.trim(), hasSections: hasSections || false });
            onSuccess();
        } catch (error) {
            console.error('Failed to create room:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{t('addRoom')}</h2>

                {step === 1 && (
                    <>
                        <div className="input-group mb-6">
                            <label className="input-label">{t('name')} *</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., 101, Room 1A"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={onClose} fullWidth>
                                {t('cancel')}
                            </Button>
                            <Button
                                onClick={() => name.trim() && setStep(2)}
                                fullWidth
                                disabled={!name.trim()}
                            >
                                {t('next')}
                            </Button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <p className="text-gray-600 mb-4">
                            {t('roomHasSectionsPrompt')}
                        </p>

                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => setHasSections(false)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${hasSections === false
                                    ? 'border-[var(--primary)] bg-orange-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="font-semibold">{t('no')}, {t('simpleRoom')}</div>
                                <div className="text-sm text-gray-500">{t('simpleRoomHelp')}</div>
                            </button>

                            <button
                                onClick={() => setHasSections(true)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${hasSections === true
                                    ? 'border-[var(--primary)] bg-orange-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="font-semibold">{t('yes')}, {t('hasSections')}</div>
                                <div className="text-sm text-gray-500">{t('hasSectionsHelp')}</div>
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setStep(1)} fullWidth>
                                {t('back')}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                fullWidth
                                loading={loading}
                                disabled={hasSections === null}
                            >
                                {t('save')}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Rooms;
