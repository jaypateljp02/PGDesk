import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
    const { login, register, error, t } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    // Dynamic Security Questions
    const questions = [
        t('q_pet'),
        t('q_maiden'),
        t('q_school'),
        t('q_food'),
        t('q_city')
    ];

    // Forgot Password State
    const [resetStep, setResetStep] = useState(1); // 1: Email, 2: Answer & New Password
    const [fetchedQuestion, setFetchedQuestion] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        ownerName: '',
        phone: '',
        securityQuestion: '',
        securityAnswer: '',
        newPassword: ''
    });

    // Initialize security question when questions load/change
    useEffect(() => {
        if (!formData.securityQuestion) {
            setFormData(prev => ({ ...prev, securityQuestion: questions[0] }));
        }
    }, [questions]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState({ type: '', content: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Phone number validation - only digits, max 10
        if (name === 'phone') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, phone: numericValue }));
            return;
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMsg({ type: '', content: '' });

        if (isForgotPassword) {
            await handleForgotPassword();
        } else if (isLogin) {
            await login(formData.email.toLowerCase(), formData.password);
        } else {
            const success = await register({
                email: formData.email.toLowerCase(),
                password: formData.password,
                name: formData.name,
                ownerName: formData.ownerName,
                phone: formData.phone,
                securityQuestion: formData.securityQuestion,
                securityAnswer: formData.securityAnswer
            });
            if (!success) {
                // Error is handled by AuthContext
            }
        }

        setIsSubmitting(false);
    };

    const handleForgotPassword = async () => {
        try {
            if (resetStep === 1) {
                // Fetch Security Question
                const res = await api.post('/auth/security-question', { email: formData.email.toLowerCase() });
                setFetchedQuestion(res.data.question);
                setResetStep(2);
                setMsg({ type: '', content: '' });
            } else {
                // Reset Password
                await api.post('/auth/reset-password', {
                    email: formData.email.toLowerCase(),
                    securityAnswer: formData.securityAnswer,
                    newPassword: formData.newPassword
                });
                setMsg({ type: 'success', content: t('success') });
                setTimeout(() => {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                    setResetStep(1);
                    setFormData(prev => ({ ...prev, password: '', securityAnswer: '', newPassword: '' }));
                }, 2000);
            }
        } catch (err) {
            setMsg({ type: 'error', content: err.response?.data?.message || t('error') });
        }
    };

    // Render Forgot Password Form
    if (isForgotPassword) {
        return (
            <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col">
                <div className="gradient-header pt-12 pb-16 px-6 text-center">
                    <h1 className="text-2xl font-bold">{t('resetPassword')}</h1>
                    <p className="text-white/80 mt-1 text-sm">{t('recoverAccount')}</p>
                </div>

                <div className="flex-1 -mt-8 px-4">
                    <div className="card max-w-md mx-auto animate-fade-in space-y-4">
                        {msg.content && (
                            <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'error'
                                ? 'bg-[var(--error-light)] text-[var(--error)]'
                                : 'bg-green-100 text-green-700'
                                }`}>
                                {msg.content}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {resetStep === 1 ? (
                                <div className="input-group">
                                    <label className="input-label">{t('enterEmail')}</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="you@example.com"
                                        autoCapitalize="none"
                                        required
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm mb-4">
                                        <strong>{t('securityQuestion')}:</strong><br />
                                        {fetchedQuestion}
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('answer')}</label>
                                        <input
                                            type="text"
                                            name="securityAnswer"
                                            value={formData.securityAnswer}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="Answer"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('newPassword')}</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="New Password"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary w-full mt-2"
                            >
                                {isSubmitting ? t('pleaseWait') : (resetStep === 1 ? t('next') : t('resetPassword'))}
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setResetStep(1);
                                    setMsg({ type: '', content: '' });
                                }}
                                className="text-[var(--text-secondary)] text-sm hover:text-[var(--primary)]"
                            >
                                {t('backToLogin')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render Login/Register Form
    return (
        <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col">
            <div className="gradient-header pt-12 pb-16 px-6 text-center">
                <div className="w-32 h-32 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img src="/icon-192.png" alt="PGDesk Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold">PGDesk</h1>
                <p className="text-white/80 mt-1 text-sm">
                    {isLogin ? t('welcomeBack') : t('createAccount')}
                </p>
            </div>

            <div className="flex-1 -mt-8 px-4">
                <div className="card max-w-md mx-auto animate-fade-in">
                    {error && (
                        <div className="space-y-2 mb-4">
                            <div className="bg-[var(--error-light)] text-[var(--error)] px-4 py-3 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                            {error.toLowerCase().includes('network error') && (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-[10px] text-gray-400 break-all font-mono">
                                    <p className="font-bold uppercase mb-1">Diagnostic Info:</p>
                                    <p>API URL: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</p>
                                    <p>Please ensure VITE_API_URL is set in Vercel settings.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">{t('pgName')}</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="PGDesk"
                                        required={!isLogin}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('ownerName')}</label>
                                    <input
                                        type="text"
                                        name="ownerName"
                                        value={formData.ownerName}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Your full name"
                                        required={!isLogin}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('phone')}</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="9876543210"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={10}
                                        required={!isLogin}
                                    />
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('securityQuestion')} (for password recovery)</p>
                                    <div className="input-group">
                                        <label className="input-label">{t('securityQuestion')}</label>
                                        <select
                                            name="securityQuestion"
                                            value={formData.securityQuestion}
                                            onChange={handleChange}
                                            className="input"
                                            required={!isLogin}
                                        >
                                            {questions.map((q, i) => (
                                                <option key={i} value={q}>{q}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('answer')}</label>
                                        <input
                                            type="text"
                                            name="securityAnswer"
                                            value={formData.securityAnswer}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="Your answer"
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="input-group">
                            <label className="input-label">{t('email') || 'Email'}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="you@example.com"
                                autoCapitalize="none"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">{t('password') || 'Password'}</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        {isLogin && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setIsForgotPassword(true)}
                                    className="text-xs text-[var(--primary)] font-medium hover:underline"
                                >
                                    {t('forgotPassword')}
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full mt-6"
                        >
                            {isSubmitting
                                ? t('pleaseWait')
                                : isLogin
                                    ? t('signIn')
                                    : t('createAccount')}
                        </button>
                    </form>

                    <div className="text-center mt-6 pt-4 border-t border-[var(--border)]">
                        <p className="text-[var(--text-secondary)] text-sm">
                            {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-[var(--primary)] font-semibold ml-1"
                            >
                                {isLogin ? t('signUp') : t('signIn')}
                            </button>
                        </p>
                    </div>
                </div>

                <p className="text-center text-[var(--text-muted)] text-xs mt-6 mb-4">
                    {t('manageEase')}
                </p>
            </div>
        </div>
    );
};

export default Login;
