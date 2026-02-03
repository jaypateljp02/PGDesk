import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2, Shield, ArrowRight, ArrowLeft } from 'lucide-react';

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
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password State
    const [resetStep, setResetStep] = useState(1);
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
                const res = await api.post('/auth/security-question', { email: formData.email });
                setFetchedQuestion(res.data.question);
                setResetStep(2);
                setMsg({ type: '', content: '' });
            } else {
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

    // Input component with icon
    const InputField = ({ icon: Icon, type = "text", ...props }) => (
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon size={18} />
            </div>
            <input
                type={type === "password" && showPassword ? "text" : type}
                {...props}
                className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-gray-700 placeholder-gray-400"
            />
            {type === "password" && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}
        </div>
    );

    // Forgot Password Form
    if (isForgotPassword) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex flex-col justify-center py-8 px-4">
                <div className="w-full max-w-md mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
                        <p className="text-gray-500 mt-1">Recover your account securely</p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8">
                        {msg.content && (
                            <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-6 ${msg.type === 'error'
                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                    : 'bg-green-50 text-green-600 border border-green-100'
                                }`}>
                                {msg.content}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {resetStep === 1 ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <InputField
                                        icon={Mail}
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="bg-blue-50 p-4 rounded-xl text-blue-700 text-sm border border-blue-100">
                                        <strong className="block mb-1">Security Question:</strong>
                                        {fetchedQuestion}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Your Answer</label>
                                        <InputField
                                            icon={Shield}
                                            name="securityAnswer"
                                            value={formData.securityAnswer}
                                            onChange={handleChange}
                                            placeholder="Enter your answer"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">New Password</label>
                                        <InputField
                                            icon={Lock}
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            placeholder="Create new password"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {resetStep === 1 ? 'Continue' : 'Reset Password'}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <button
                            type="button"
                            onClick={() => {
                                setIsForgotPassword(false);
                                setResetStep(1);
                                setMsg({ type: '', content: '' });
                            }}
                            className="w-full mt-4 py-3 text-gray-500 font-medium hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Login/Register Form
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex flex-col justify-center py-8 px-4">
            <div className="w-full max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-200 transform hover:scale-105 transition-transform">
                        <span className="text-5xl">🏠</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        {isLogin ? 'Welcome Back!' : 'Create Account'}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {isLogin ? 'Sign in to manage your PG' : 'Start managing your PG today'}
                    </p>
                </div>

                {/* Toggle Tabs */}
                <div className="bg-gray-100 p-1.5 rounded-2xl flex mb-6">
                    <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${isLogin
                                ? 'bg-white text-gray-800 shadow-md'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${!isLogin
                                ? 'bg-white text-gray-800 shadow-md'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">PG Name</label>
                                    <InputField
                                        icon={Building2}
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="My Awesome PG"
                                        required={!isLogin}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Owner Name</label>
                                    <InputField
                                        icon={User}
                                        name="ownerName"
                                        value={formData.ownerName}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                        required={!isLogin}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <InputField
                                        icon={Phone}
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 9876543210"
                                        required={!isLogin}
                                    />
                                </div>

                                {/* Security Section */}
                                <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl space-y-4 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Shield size={16} className="text-orange-500" />
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Security Question
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Question</label>
                                        <select
                                            name="securityQuestion"
                                            value={formData.securityQuestion}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-gray-700"
                                            required={!isLogin}
                                        >
                                            {SECURITY_QUESTIONS.map((q, i) => (
                                                <option key={i} value={q}>{q}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Answer</label>
                                        <InputField
                                            icon={Shield}
                                            name="securityAnswer"
                                            value={formData.securityAnswer}
                                            onChange={handleChange}
                                            placeholder="Your answer"
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <InputField
                                icon={Mail}
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <InputField
                                icon={Lock}
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
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
                                    className="text-sm text-orange-500 font-medium hover:text-orange-600 hover:underline transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-200 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm mt-8">
                    Manage your PG with ease ✨
                </p>
            </div>
        </div>
    );
};

export default Login;
