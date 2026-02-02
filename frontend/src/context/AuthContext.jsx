import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { translations } from '../utils/translations';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Translation Helper
    const t = (key) => {
        const lang = user?.language || 'en';
        return translations[lang]?.[key] || translations['en']?.[key] || key;
    };

    // Number/Digit Helper
    const n = (num) => {
        if (num === null || num === undefined) return '';
        const lang = user?.language || 'en';

        // If language is not Hindi, return as is (converted to string if needed)
        if (lang !== 'hi') return String(num);

        const hindiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

        // If it's a number, use toLocaleString with hi-IN for better formatting
        if (typeof num === 'number') {
            try {
                return num.toLocaleString('hi-IN');
            } catch (e) {
                return String(num).replace(/[0-9]/g, (w) => hindiDigits[+w]);
            }
        }

        // If it's already a string (like "1,000" or "+91..."), use manual replacement
        return String(num).replace(/[0-9]/g, (w) => hindiDigits[+w]);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/auth/me');
            setUser(response.data.pg);
        } catch (err) {
            localStorage.removeItem('token');
            setError(null); // Don't show error for silent auth check
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            setUser(response.data.pg);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            return false;
        }
    };

    const register = async (data) => {
        try {
            setError(null);
            const response = await api.post('/auth/register', data);
            localStorage.setItem('token', response.data.token);
            setUser(response.data.pg);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setError(null); // Clear any existing errors on logout
    };

    const updateSettings = async (settings) => {
        try {
            const response = await api.put('/auth/settings', settings);
            setUser(response.data.pg);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Update failed';
            setError(message);
            return { success: false, message };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            login,
            register,
            logout,
            updateSettings,
            isAuthenticated: !!user,
            t,
            n
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
