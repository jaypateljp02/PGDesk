import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const About = () => {
    const navigate = useNavigate();
    const { t } = useAuth();

    return (
        <div className="page">
            <header className="gradient-header page-header">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-icon btn-ghost text-white"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-white">About</h1>
                    </div>
                </div>
            </header>

            <div className="page-content animate-fade-in">
                {/* App Info Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center mb-6">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-orange-100 overflow-hidden text-center">
                        <img src="/logo.png" alt="PGDesk" className="w-20 h-20 object-contain mx-auto" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">PGDesk</h2>
                    <p className="text-gray-500 mb-4">PG Management Made Easy</p>
                    <div className="inline-block px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-semibold">
                        Version 1.0.0
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h3 className="font-semibold text-gray-400 text-sm mb-4 uppercase tracking-wider">Features</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">✓</span>
                            <span className="text-gray-700">Room & Bed Management</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">✓</span>
                            <span className="text-gray-700">Resident Tracking</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">✓</span>
                            <span className="text-gray-700">Rent Collection</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">✓</span>
                            <span className="text-gray-700">WhatsApp Reminders</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">✓</span>
                            <span className="text-gray-700">Food Count Tracking</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">✓</span>
                            <span className="text-gray-700">Hindi & English Support</span>
                        </li>
                    </ul>
                </div>

                {/* Developer Info */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-400 text-sm mb-4 uppercase tracking-wider">Developer</h3>
                    <p className="text-gray-700 mb-2">Made with ❤️ for PG Owners</p>
                    <p className="text-gray-500 text-sm">
                        © 2024 PGDesk. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default About;
