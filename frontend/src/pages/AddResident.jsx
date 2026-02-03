import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toggle from '../components/ui/Toggle';
import { residentsAPI, roomsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AddResident = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useAuth();

    const preselectedBedId = searchParams.get('bedId');
    const preselectedRoomId = searchParams.get('roomId');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bedId: preselectedBedId || '',
        rentAmount: '',
        foodEnabled: true
    });

    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [vacantBeds, setVacantBeds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (preselectedRoomId) {
                // Load specific room
                const roomResponse = await roomsAPI.getById(preselectedRoomId);
                setSelectedRoom(roomResponse.data);

                // Find the bed rent
                const allBeds = roomResponse.data.hasSections
                    ? roomResponse.data.sections.flatMap(s => s.beds || [])
                    : roomResponse.data.beds || [];

                const preselectedBed = allBeds.find(b => b._id === preselectedBedId);
                if (preselectedBed) {
                    setFormData(prev => ({
                        ...prev,
                        rentAmount: preselectedBed.rent?.toString() || ''
                    }));
                }
                setVacantBeds(allBeds.filter(b => !b.isOccupied));
            } else {
                // Load all vacant beds
                const response = await residentsAPI.getVacantBeds();
                setVacantBeds(response.data);
            }

            // Load rooms for selection
            const roomsResponse = await roomsAPI.getAll();
            setRooms(roomsResponse.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleRoomSelect = async (roomId) => {
        try {
            const response = await roomsAPI.getById(roomId);
            setSelectedRoom(response.data);

            const allBeds = response.data.hasSections
                ? response.data.sections.flatMap(s => s.beds || [])
                : response.data.beds || [];

            setVacantBeds(allBeds.filter(b => !b.isOccupied));
            setFormData(prev => ({ ...prev, bedId: '', rentAmount: '' }));
        } catch (error) {
            console.error('Failed to load room:', error);
        }
    };

    const handleBedSelect = (bed) => {
        setFormData(prev => ({
            ...prev,
            bedId: bed._id,
            rentAmount: bed.rent?.toString() || prev.rentAmount
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.phone || !formData.bedId) {
            alert(t('fillRequired') || 'Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            await residentsAPI.create({
                name: formData.name,
                phone: formData.phone,
                bedId: formData.bedId,
                rentAmount: parseInt(formData.rentAmount) || undefined,
                foodEnabled: formData.foodEnabled
            });
            navigate('/residents');
        } catch (error) {
            console.error('Failed to add resident:', error);
            alert(error.response?.data?.message || t('error') || 'Failed to add resident');
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="page">
                <Header title={t('newResident')} showBack />
                <div className="page-content flex items-center justify-center h-64">
                    <div className="animate-pulse text-gray-400">{t('loading')}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <Header title={t('newResident')} showBack />

            <form onSubmit={handleSubmit} className="page-content animate-fade-in">
                <div className="card mb-4">
                    <Input
                        label={`${t('name')} *`}
                        placeholder={t('namePlaceholder')}
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                </div>

                <div className="card mb-4">
                    <Input
                        label={`${t('phone')} *`}
                        type="tel"
                        placeholder="9876543210"
                        value={formData.phone}
                        onChange={(e) => {
                            // Only allow numeric input, max 10 digits
                            const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormData(prev => ({ ...prev, phone: numericValue }));
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                    />
                </div>

                {/* Room Selection */}
                {!preselectedRoomId && (
                    <div className="card mb-4">
                        <label className="input-label mb-2 block">{t('roomSelection')} *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {rooms.map((room) => (
                                <button
                                    key={room._id}
                                    type="button"
                                    onClick={() => handleRoomSelect(room._id)}
                                    className={`p-3 rounded-xl text-center transition-all ${selectedRoom?._id === room._id
                                        ? 'bg-[var(--primary)] text-white'
                                        : room.vacantBeds > 0
                                            ? 'bg-gray-100 hover:bg-gray-200'
                                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                        }`}
                                    disabled={room.vacantBeds === 0}
                                >
                                    <div className="font-semibold">{room.name}</div>
                                    <div className="text-xs opacity-75">
                                        {room.vacantBeds} {t('vacant')}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bed Selection */}
                {(selectedRoom || preselectedRoomId) && vacantBeds.length > 0 && (
                    <div className="card mb-4">
                        <label className="input-label mb-2 block">{t('bedSelection')} *</label>
                        <div className="bed-grid">
                            {vacantBeds.map((bed) => (
                                <button
                                    key={bed._id}
                                    type="button"
                                    onClick={() => handleBedSelect(bed)}
                                    className={`p-3 rounded-xl text-center transition-all ${formData.bedId === bed._id
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-orange-50 border-2 border-orange-200 hover:border-orange-400'
                                        }`}
                                >
                                    <div className="font-semibold">{bed.name}</div>
                                    {/* Show section name for clarity */}
                                    {bed.sectionName && bed.sectionName !== '_default' && (
                                        <div className={`text-xs mt-1 ${formData.bedId === bed._id ? 'text-white/80' : 'text-blue-600 font-medium'}`}>
                                            📍 {bed.sectionName}
                                        </div>
                                    )}
                                    <div className={`text-xs ${formData.bedId === bed._id ? 'text-white/80' : 'opacity-75'}`}>
                                        ₹{bed.rent?.toLocaleString()}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rent Amount */}
                <div className="card mb-4">
                    <Input
                        label={t('rentAmount')}
                        type="number"
                        placeholder={t('rentPlaceholder')}
                        value={formData.rentAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, rentAmount: e.target.value }))}
                    />
                </div>

                {/* Food Toggle */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">{t('foodEnabled')}</div>
                            <div className="text-sm text-gray-500">{t('foodHelpText')}</div>
                        </div>
                        <Toggle
                            checked={formData.foodEnabled}
                            onChange={(checked) => setFormData(prev => ({ ...prev, foodEnabled: checked }))}
                        />
                    </div>
                </div>

                <Button type="submit" fullWidth loading={loading}>
                    {t('addResident')}
                </Button>
            </form>
        </div>
    );
};

export default AddResident;
