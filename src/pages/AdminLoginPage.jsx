import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- CONFIGURATION (FIXED) ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const LOGIN_ENDPOINT = `${API_BASE_URL}/admin/login`;

const AdminLoginPage = () => {
    const [email, setEmail] = useState('admin@canteen.com');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Use the LOGIN_ENDPOINT variable
            const response = await axios.post(LOGIN_ENDPOINT, {
                email,
                password,
            });

            localStorage.setItem('admin_token', response.data.token);
            navigate('/menu');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Server might be down or URL is incorrect.');
        } finally {
            setLoading(false);
        }
    };

    // To prevent caching, append a timestamp
    const backgroundImageUrl = `/jjcet_gate.jpg?${new Date().getTime()}`;

    return (
        <div 
            className="min-h-screen flex items-center justify-center bg-cover bg-center" 
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
            <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-50 w-full">
                <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 text-white rounded-lg shadow-xl bg-opacity-80">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">JJ Canteen</h1>
                        <h2 className="text-xl font-semibold text-cyan-400">Admin Portal</h2>
                    </div>
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
                            <input
                                id="email" type="email" required
                                className="w-full px-3 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
                            <input
                                id="password" type="password" required
                                className="w-full px-3 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-center text-red-400">{error}</p>}
                        <div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full px-4 py-2 font-semibold bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-500"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                    <p className="text-white text-center text-sm mt-8 opacity-80">
                        Powered by <span className="font-bold">Nexora</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;