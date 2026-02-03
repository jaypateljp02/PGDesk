import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SECURITY_QUESTIONS = [
    "What is the name of your first pet?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What is your favorite food?",
    "In which city were you born?"
];

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    // Forgot Password State
    const [resetStep, setResetStep] = useState(1); // 1: Email, 2: Answer & New Password
    const [fetchedQuestion, setFetchedQuestion] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        ownerName: '',
        phone: '',
        securityQuestion: SECURITY_QUESTIONS[0],
        securityAnswer: '',
        newPassword: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState({ type: '', content: '' });
    const { login, register, error } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMsg({ type: '', content: '' });

        if (isForgotPassword) {
            await handleForgotPassword();
        } else if (isLogin) {
            await login(formData.email, formData.password);
        } else {
            const success = await register({
                email: formData.email,
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
                const res = await api.post('/auth/security-question', { email: formData.email });
                setFetchedQuestion(res.data.question);
                setResetStep(2);
                setMsg({ type: '', content: '' });
            } else {
                // Reset Password
                await api.post('/auth/reset-password', {
                    email: formData.email,
                    securityAnswer: formData.securityAnswer,
                    newPassword: formData.newPassword
                });
                setMsg({ type: 'success', content: 'Password reset successful! Please login.' });
                setTimeout(() => {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                    setResetStep(1);
                    setFormData(prev => ({ ...prev, password: '', securityAnswer: '', newPassword: '' }));
                }, 2000);
            }
        } catch (err) {
            setMsg({ type: 'error', content: err.response?.data?.message || 'Something went wrong' });
        }
    };

    // Render Forgot Password Form
    if (isForgotPassword) {
        return (
            <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-purple-600 bg-clip-text text-transparent">Reset Password</h1>
                    <p className="text-[var(--text-secondary)] mt-1 text-sm">Recover your account securey</p>
                </div>

                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="card shadow-xl animate-fade-in space-y-6">
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
                                    <label className="input-label">Enter your registered email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm mb-4">
                                        <strong>Security Question:</strong><br />
                                        {fetchedQuestion}
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Your Answer</label>
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
                                        <label className="input-label">New Password</label>
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
                                {isSubmitting ? 'Please wait...' : (resetStep === 1 ? 'Next' : 'Reset Password')}
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
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render Login/Register Form
    return (
        <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
                <div className="w-16 h-16 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-1 ring-black/5">
                    <span className="text-3xl">🏠</span>
                </div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[var(--primary)] to-purple-600 bg-clip-text text-transparent">
                    PG Management
                </h1>
                <p className="text-[var(--text-secondary)] mt-2 text-sm">
                    {isLogin ? 'Welcome back! Please sign in.' : 'Create your account to get started.'}
                </p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="card shadow-xl animate-fade-in">
                    {error && (
                        <div className="bg-[var(--error-light)] text-[var(--error)] px-4 py-3 rounded-xl mb-4 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">PG Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="My PG"
                                        required={!isLogin}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Owner Name</label>
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
                                    <label className="input-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="+91 9876543210"
                                        required={!isLogin}
                                    />
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Security Question (for password recovery)</p>
                                    <div className="input-group">
                                        <label className="input-label">Question</label>
                                        <select
                                            name="securityQuestion"
                                            value={formData.securityQuestion}
                                            onChange={handleChange}
                                            className="input"
                                            required={!isLogin}
                                        >
                                            {SECURITY_QUESTIONS.map((q, i) => (
                                                <option key={i} value={q}>{q}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Answer</label>
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
                            <label className="input-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password</label>
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
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full mt-6"
                        >
                            {isSubmitting
                                ? 'Please wait...'
                                : isLogin
                                    ? 'Sign In'
                                    : 'Create Account'}
                        </button>
                    </form>

                    <div className="text-center mt-6 pt-4 border-t border-[var(--border)]">
                        <p className="text-[var(--text-secondary)] text-sm">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-[var(--primary)] font-semibold ml-1"
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>

                <p className="text-center text-[var(--text-muted)] text-xs mt-6 mb-4">
                    Manage your PG with ease
                </p>
            </div>
        </div>
    );
};

export default Login;
