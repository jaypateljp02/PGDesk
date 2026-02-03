import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, User, Minus, Edit2, Trash2, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import { roomsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RoomDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useAuth();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddBedModal, setShowAddBedModal] = useState(false);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [showEditBedModal, setShowEditBedModal] = useState(false);
    const [selectedBed, setSelectedBed] = useState(null);
    const [preselectedSectionId, setPreselectedSectionId] = useState(null);

    useEffect(() => {
        loadRoom();
    }, [id]);

    const loadRoom = async () => {
        try {
            const response = await roomsAPI.getById(id);
            setRoom(response.data);
        } catch (error) {
            console.error('Failed to load room:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBedClick = (bed) => {
        if (bed.isOccupied && bed.resident) {
            navigate(`/residents/${bed.resident._id || bed.resident.id}`);
        } else {
            navigate(`/residents/add?bedId=${bed._id}&roomId=${id}`);
        }
    };

    const handleEditBed = (bed, e) => {
        e.stopPropagation();
        setSelectedBed(bed);
        setShowEditBedModal(true);
    };

    const handleAddBedInSection = (sectionId) => {
        setPreselectedSectionId(sectionId);
        setShowAddBedModal(true);
    };

    const handleCloseAddBedModal = () => {
        setShowAddBedModal(false);
        setPreselectedSectionId(null);
    };

    // Calculate existing bed count for unique naming
    const getExistingBedCount = () => {
        if (room?.hasSections) {
            return room.sections?.reduce((acc, s) => acc + (s.beds?.length || 0), 0) || 0;
        }
        return room?.beds?.length || 0;
    };

    if (loading) {
        return (
            <div className="page">
                <Header title={t('loading')} showBack />
                <div className="page-content flex items-center justify-center h-64">
                    <div className="animate-pulse text-gray-400">{t('loading')}</div>
                </div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="page">
                <Header title="Room Not Found" showBack />
                <div className="page-content text-center py-12">
                    <p className="text-gray-500">Room not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <Header
                title={room.name}
                subtitle={`${room.occupiedBeds}/${room.totalBeds} ${t('occupied')}`}
                showBack
                rightAction={
                    <button
                        onClick={() => setShowAddBedModal(true)}
                        className="btn-icon btn-ghost text-white"
                    >
                        <Plus size={24} />
                    </button>
                }
            />

            <div className="page-content animate-fade-in">
                {/* Room with Sections */}
                {room.hasSections ? (
                    <div className="space-y-6">
                        {room.sections.length > 0 ? (
                            room.sections.map((section) => (
                                <div key={section._id}>
                                    <h3 className="font-semibold text-gray-700 mb-3">
                                        {section.name}
                                    </h3>
                                    <div className="bed-grid">
                                        {section.beds?.map((bed) => (
                                            <BedCard
                                                key={bed._id}
                                                bed={bed}
                                                onClick={() => handleBedClick(bed)}
                                                onEdit={(e) => handleEditBed(bed, e)}
                                            />
                                        ))}
                                        <button
                                            onClick={() => handleAddBedInSection(section._id)}
                                            className="bed-card border-2 border-dashed border-gray-300 hover:border-[var(--primary)]"
                                        >
                                            <Plus className="text-gray-400" size={24} />
                                            <span className="text-sm text-gray-400">{t('addBed')}</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 mb-4">{t('sectionsEnabledPrompt')}</p>
                                <Button onClick={() => setShowAddSectionModal(true)} icon={<Plus size={20} />}>
                                    {t('addFirstSection')}
                                </Button>
                            </div>
                        )}

                        {room.sections.length > 0 && (
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => setShowAddSectionModal(true)}
                                icon={<Plus size={20} />}
                            >
                                {t('addSection')}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3">{t('beds')}</h3>
                        <div className="bed-grid">
                            {room.beds?.map((bed) => (
                                <BedCard
                                    key={bed._id}
                                    bed={bed}
                                    onClick={() => handleBedClick(bed)}
                                    onEdit={(e) => handleEditBed(bed, e)}
                                />
                            ))}
                            <button
                                onClick={() => setShowAddBedModal(true)}
                                className="bed-card border-2 border-dashed border-gray-300 hover:border-[var(--primary)]"
                            >
                                <Plus className="text-gray-400" size={24} />
                                <span className="text-sm text-gray-400">{t('addBed')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Bed Modal */}
            {showAddBedModal && (
                <AddBedModal
                    roomId={id}
                    hasSections={room.hasSections}
                    sections={room.sections}
                    preselectedSectionId={preselectedSectionId}
                    existingBedCount={getExistingBedCount()}
                    onClose={handleCloseAddBedModal}
                    onSuccess={() => {
                        handleCloseAddBedModal();
                        loadRoom();
                    }}
                />
            )}

            {/* Add Section Modal */}
            {showAddSectionModal && (
                <AddSectionModal
                    roomId={id}
                    onClose={() => setShowAddSectionModal(false)}
                    onSuccess={() => {
                        setShowAddSectionModal(false);
                        loadRoom();
                    }}
                />
            )}

            {/* Edit Bed Modal */}
            {showEditBedModal && selectedBed && (
                <EditBedModal
                    bed={selectedBed}
                    onClose={() => {
                        setShowEditBedModal(false);
                        setSelectedBed(null);
                    }}
                    onSuccess={() => {
                        setShowEditBedModal(false);
                        setSelectedBed(null);
                        loadRoom();
                    }}
                />
            )}
        </div>
    );
};

// Bed Card Component with Edit button
const BedCard = ({ bed, onClick, onEdit }) => {
    const { t } = useAuth();
    return (
        <button
            onClick={onClick}
            className={`bed-card ${bed.isOccupied ? 'occupied' : 'vacant'} relative group`}
        >
            {/* Edit button - show on hover */}
            {!bed.isOccupied && (
                <button
                    onClick={onEdit}
                    className="absolute top-1 right-1 p-1 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                    <Edit2 size={14} className="text-gray-600" />
                </button>
            )}

            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${bed.isOccupied ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'
                }`}>
                {bed.isOccupied ? (
                    <User size={20} />
                ) : (
                    <span className="text-xs font-bold">!</span>
                )}
            </div>
            <div className="font-semibold text-sm">{bed.name}</div>
            {bed.isOccupied && bed.resident ? (
                <div className="text-xs text-gray-600 truncate max-w-full">
                    {bed.resident.name}
                </div>
            ) : (
                <div className="text-xs text-orange-600">{t('vacant')?.toUpperCase() || 'VACANT'}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
                {bed.rent ? `₹${bed.rent?.toLocaleString()}` : t('noRentSet')}
            </div>
        </button>
    );
};

// Add Bed Modal with +/- buttons, optional rent, unique naming
const AddBedModal = ({ roomId, hasSections, sections, preselectedSectionId, existingBedCount, onClose, onSuccess }) => {
    const { t } = useAuth();
    const [sectionId, setSectionId] = useState(preselectedSectionId || sections?.[0]?._id || '');
    const [bedCount, setBedCount] = useState(1);
    const [rent, setRent] = useState('');
    const [loading, setLoading] = useState(false);

    const incrementBedCount = () => {
        if (bedCount < 20) setBedCount(prev => prev + 1);
    };

    const decrementBedCount = () => {
        if (bedCount > 1) setBedCount(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Generate unique bed names based on existing count
            const beds = Array.from({ length: bedCount }, (_, i) => ({
                name: `B${existingBedCount + i + 1}`,
                rent: rent ? parseInt(rent) : null // Rent is optional
            }));

            await roomsAPI.addBeds(roomId, {
                sectionId: hasSections ? sectionId : undefined,
                beds
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to add beds:', error);
            alert(t('error') || 'Failed to add beds');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{t('addBed')}</h2>

                {hasSections && sections.length > 0 && (
                    <div className="input-group mb-4">
                        <label className="input-label">{t('sectionName') || 'Section'}</label>
                        <select
                            className="input"
                            value={sectionId}
                            onChange={(e) => setSectionId(e.target.value)}
                        >
                            {sections.map((s) => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Bed Count with +/- Buttons */}
                <div className="input-group mb-4">
                    <label className="input-label">{t('numberOfBeds')}</label>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={decrementBedCount}
                            disabled={bedCount <= 1}
                            className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Minus size={24} />
                        </button>
                        <span className="text-2xl font-bold w-12 text-center">{bedCount}</span>
                        <button
                            type="button"
                            onClick={incrementBedCount}
                            disabled={bedCount >= 20}
                            className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </div>

                {/* Rent - Optional */}
                <div className="input-group mb-2">
                    <label className="input-label">{t('rentPerBed')} <span className="text-gray-400 font-normal">- {t('optional')}</span></label>
                    <input
                        type="number"
                        className="input"
                        placeholder={t('rentPlaceholder')}
                        value={rent}
                        onChange={(e) => setRent(e.target.value)}
                    />
                </div>
                <p className="text-xs text-gray-500 mb-6">{t('rentHelpText')}</p>

                {/* Preview */}
                <div className="bg-gray-50 rounded-xl p-3 mb-6">
                    <p className="text-sm text-gray-600">
                        {t('willCreateBeds')}: <strong>{bedCount}</strong> bed{bedCount > 1 ? 's' : ''} named{' '}
                        <strong>
                            {Array.from({ length: Math.min(bedCount, 3) }, (_, i) => `B${existingBedCount + i + 1}`).join(', ')}
                            {bedCount > 3 ? '...' : ''}
                        </strong>
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onClose} fullWidth>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        fullWidth
                        loading={loading}
                    >
                        {t('addBed')} ({bedCount})
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Edit Bed Modal - Edit name, rent, or delete bed
const EditBedModal = ({ bed, onClose, onSuccess }) => {
    const { t } = useAuth();
    const [name, setName] = useState(bed.name || '');
    const [rent, setRent] = useState(bed.rent?.toString() || '');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await roomsAPI.updateBed(bed._id, {
                name: name.trim(),
                rent: rent ? parseInt(rent) : null
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to update bed:', error);
            alert(t('error') || 'Failed to update bed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await roomsAPI.deleteBed(bed._id);
            onSuccess();
        } catch (error) {
            console.error('Failed to delete bed:', error);
            alert('Failed to delete bed. It may be occupied.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">{t('editBed')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {!showDeleteConfirm ? (
                    <>
                        <div className="input-group mb-4">
                            <label className="input-label">{t('bedName')}</label>
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., B1"
                            />
                        </div>

                        <div className="input-group mb-6">
                            <label className="input-label">{t('rentPerBed')}</label>
                            <input
                                type="number"
                                className="input"
                                value={rent}
                                onChange={(e) => setRent(e.target.value)}
                                placeholder="e.g., 4500"
                            />
                        </div>

                        <div className="flex gap-3 mb-4">
                            <Button variant="ghost" onClick={onClose} fullWidth>
                                {t('cancel')}
                            </Button>
                            <Button
                                onClick={handleSave}
                                fullWidth
                                loading={loading}
                                disabled={!name.trim()}
                            >
                                {t('saveChanges')}
                            </Button>
                        </div>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-3 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            {t('deleteRoom') || 'Delete'} {/* Reuse deleteRoom or add deleteBed */}
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} className="text-red-500" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{t('deleteBedConfirm')}</h3>
                        <p className="text-gray-500 mb-6">{t('cannotUndo')}</p>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} fullWidth>
                                {t('cancel')}
                            </Button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50"
                            >
                                {loading ? t('deleting') : t('delete')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Add Section Modal
const AddSectionModal = ({ roomId, onClose, onSuccess }) => {
    const { t } = useAuth();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const suggestions = ['Inside', 'Balcony', 'Hall', 'Front', 'Back'];

    const handleSubmit = async () => {
        if (!name.trim()) return;

        setLoading(true);
        try {
            await roomsAPI.addSection(roomId, { name: name.trim() });
            onSuccess();
        } catch (error) {
            console.error('Failed to add section:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{t('addSection')}</h2>

                <div className="input-group mb-4">
                    <label className="input-label">{t('sectionName')}</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="e.g., Balcony"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => setName(s)}
                            className={`px-3 py-1 rounded-full text-sm ${name === s
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onClose} fullWidth>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        fullWidth
                        loading={loading}
                        disabled={!name.trim()}
                    >
                        {t('addSection')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RoomDetail;
