import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// ICONS from original OrdersPage
import { LuLogOut, LuMenu, LuX } from 'react-icons/lu';
import { FaCheck, FaTruck, FaClipboardList, FaSearch } from 'react-icons/fa';
// ICONS imported from AdminDashboardPage for new layout
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign, MdFastfood, MdLocalDrink, MdOutlineBreakfastDining, MdOutlineLunchDining, MdOutlineDinnerDining, MdMenuBook } from "react-icons/md"; 
import { FaPlusCircle, FaUtensils, FaChartLine, FaQuestionCircle } from 'react-icons/fa'; 

// --- Helper function for Authorization Header (from AdminDashboardPage) ---
const getAdminAuthHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
});

// --- SparkleOverlay Component (from AdminDashboardPage) ---
const SparkleOverlay = () => {
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const sparks = Array.from({ length: 40 }).map((_, i) => {
        const style = {
            '--x': `${random(-150, 150)}vw`, '--y': `${random(-150, 150)}vh`,
            '--duration': `${random(8, 20)}s`, '--delay': `${random(1, 10)}s`,
            '--size': `${random(1, 3)}px`,
        };
        return <div key={i} className="spark" style={style}></div>;
    });
    return (
        <>
            <style>{`
                @keyframes sparkle-animation { 0% { transform: scale(0) translate(0, 0); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1) translate(var(--x), var(--y)); opacity: 0; } }
                .sparkle-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: hidden; }
                .spark { position: absolute; top: 50%; left: 50%; width: var(--size); height: var(--size); background-color: #fbbF24; border-radius: 50%; animation: sparkle-animation var(--duration) var(--delay) infinite linear; box-shadow: 0 0 4px #fbbF24, 0 0 8px #fbbF24; }
            `}</style>
            <div className="sparkle-container">{sparks}</div>
        </>
    );
};

// --- AdminSidebarNav Component (from AdminDashboardPage) ---
const AdminSidebarNav = ({ onClose }) => {
    const navigate = useNavigate();
    const NavItem = ({ to, icon: Icon, name, isActive = false }) => (
        <Link to={to} className="block w-full" onClick={onClose}>
            <button className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 space-x-3 text-left ${
                isActive ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700 hover:text-orange-400'
            }`}>
                <Icon size={20} className="flex-shrink-0" />
                <span className="font-semibold">{name}</span>
            </button>
        </Link>
    );

    return (
        <div className="space-y-2 p-4 pt-0">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Actions</h3>
            <NavItem to="/menu" icon={FaUtensils} name="Menu Management" />
            <NavItem to="/orders" icon={FaClipboardList} name="Orders" isActive={true} /> {/* <-- SET TO ACTIVE */}
            <NavItem to="/revenue" icon={FaChartLine} name="Revenue & Sales" />
            <NavItem to="/feedback" icon={VscFeedback} name="Student Feedback" />
            <NavItem to="/advertisement" icon={MdCampaign} name="Ads Management" />
            
            <div className="pt-4 border-t border-slate-700 mt-4">
                <button 
                    onClick={() => { navigate('/admin/menu/add'); onClose(); }} 
                    className="w-full flex items-center p-3 rounded-lg transition-colors duration-200 space-x-3 text-left bg-green-600 text-white hover:bg-green-700 shadow-md"
                >
                    <FaPlusCircle size={20} className="flex-shrink-0" />
                    <span className="font-bold">Add New Menu Item</span>
                </button>
            </div>
        </div>
    );
};


// --- Main OrdersPage Component (Modified) ---
const OrdersPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    // --- NEW STATE from AdminDashboardPage ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); 
    const [isCanteenOpen, setIsCanteenOpen] = useState(true);

    // --- NEW: Canteen Status Functions (from AdminDashboardPage) ---
    const fetchCanteenStatus = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/canteen-status/public');
            setIsCanteenOpen(res.data.isOpen);
            return res.data.isOpen;
        } catch (err) { console.warn("Could not fetch canteen status."); setIsCanteenOpen(false); return false; }
    };
    const handleToggleCanteen = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            alert('Authentication error. Please log in again.');
            navigate('/login');
            return;
        }
        try {
            // NOTE: Using getAdminAuthHeaders now
            const response = await axios.patch('http://localhost:5000/api/admin/canteen-status',
                {},
                { headers: getAdminAuthHeaders(token) } 
            );
            setIsCanteenOpen(response.data.isOpen);
            alert(`Canteen status set to ${response.data.isOpen ? 'OPEN' : 'CLOSED'}.`);
        } catch (error) {
            alert('Failed to update canteen status. Check console/server.');
            console.error("Canteen Toggle Error:", error.response?.data || error.message);
        }
    };

    // --- MODIFIED: fetchOrders (Uses new Auth) ---
    const fetchOrders = async () => {
        // Not setting loading to true here to allow silent refresh
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) { navigate('/login'); return; }
            // --- AUTH CHANGE ---
            const config = { headers: getAdminAuthHeaders(token) };
            const response = await axios.get('http://localhost:5000/api/admin/orders', config);
            setOrders(response.data);
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Session expired. Please log in again.');
                handleLogout();
            } else {
                setError('Failed to fetch orders.');
            }
            console.error(err);
        } finally { setLoading(false); } // Only set loading false on initial load/error
    };
    
    // --- MODIFIED: useEffect (fetches status too) ---
    useEffect(() => {
        setLoading(true); // Set loading true on first mount
        fetchOrders();
        fetchCanteenStatus(); // Fetch status on mount
        
        const interval = setInterval(() => {
            fetchOrders(); // Silently refresh orders
            fetchCanteenStatus(); // Silently refresh status
        }, 30000); 

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const handleLogout = () => { localStorage.removeItem('admin_token'); navigate('/login'); };

    // --- MODIFIED: handleMarkAsReady (Uses new Auth) ---
    const handleMarkAsReady = async (orderId) => {
        try {
            const token = localStorage.getItem('admin_token');
            // --- AUTH CHANGE ---
            const config = { headers: getAdminAuthHeaders(token) };
            const response = await axios.patch(`http://localhost:5000/api/admin/orders/${orderId}/mark-ready`, {}, config);
            
            if (response.status === 200) {
                setOrders(orders.map(order => order._id === orderId ? response.data : order));
            } else {
                throw new Error('Update failed on the server.');
            }
        } catch (err) {
            alert('Failed to update order status to Ready. Check backend route.');
            console.error('Mark Ready Error:', err.response?.data || err.message);
        }
    };
    
    // --- MODIFIED: handleMarkAsDelivered (Uses new Auth) ---
    const handleMarkAsDelivered = async (orderId) => {
        try {
            const token = localStorage.getItem('admin_token');
            // --- AUTH CHANGE ---
            const config = { headers: getAdminAuthHeaders(token) };
            const response = await axios.patch(`http://localhost:5000/api/admin/orders/${orderId}/mark-delivered`, {}, config);
            
            if (response.status === 200) {
                 setOrders(orders.map(order => order._id === orderId ? response.data : order));
            } else {
                 throw new Error('Update failed on the server.');
            }
        } catch (err) {
            alert('Failed to update order status to Delivered. ENSURE BACKEND ROUTE IS PATCH /orders/:orderId/mark-delivered');
            console.error('Mark Delivered Error:', err.response?.data || err.message);
        }
    };

    // --- Filtering logic (Unchanged) ---
    const filteredOrders = orders
        .filter(order => {
            const status = order.status;
            const normalizedStatus = status === 'Paid' ? 'Paid' : status === 'Ready' ? 'Ready' : status === 'Delivered' ? 'Delivered' : 'Other';
            if (filter === 'All') return true;
            if (filter === 'Ready') return normalizedStatus === 'Ready';
            if (filter === 'Paid') return normalizedStatus === 'Paid';
            if (filter === 'Delivered') return normalizedStatus === 'Delivered';
            return false;
        })
        .filter(order => (order.billNumber || '').toLowerCase().includes(searchTerm.toLowerCase())); // Added safeguard for billNumber

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Paid': return 'bg-yellow-900/40 text-yellow-400 font-bold'; 
            case 'Ready': return 'bg-orange-900/40 text-orange-400 font-bold'; 
            case 'Delivered': return 'bg-green-900/40 text-green-400 font-bold'; 
            default: return 'bg-slate-700/40 text-slate-400';
        }
    };

    // --- RETURN: MODIFIED with AdminDashboardPage layout ---
    return (
        <div className="min-h-screen bg-slate-900 font-sans relative flex">
            <SparkleOverlay />
            
            {/* --- MOBILE DRAWER/OVERLAY (from AdminDashboardPage) --- */}
            <div 
                className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${isDrawerOpen ? 'bg-black/50 pointer-events-auto' : 'bg-black/0 pointer-events-none'}`}
                onClick={() => setIsDrawerOpen(false)}
            >
                <div 
                    className={`absolute left-0 top-0 w-64 h-full bg-slate-800 shadow-2xl transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    onClick={e => e.stopPropagation()} 
                >
                    <div className="p-4 flex justify-between items-center border-b border-slate-700">
                        <h3 className="text-xl font-bold text-orange-400">Admin Menu</h3>
                        <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-white">
                            <LuX size={24} />
                        </button>
                    </div>
                    <AdminSidebarNav onClose={() => setIsDrawerOpen(false)} />
                </div>
            </div>

            {/* --- DESKTOP SIDEBAR (from AdminDashboardPage) --- */}
            <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700 sticky top-0 h-screen overflow-y-auto flex-shrink-0 z-20">
                <div className="p-4 py-6">
                    <h1 className="text-2xl font-extrabold text-orange-400">Admin Portal</h1>
                </div>
                <AdminSidebarNav onClose={() => {}} />
            </aside>

            {/* --- MAIN CONTENT AREA (Wrapper from AdminDashboardPage) --- */}
            <div className="flex-grow relative z-10 min-h-screen">
            
                {/* --- NEW HEADER (from AdminDashboardPage, modified) --- */}
                <header className="bg-gray-900 text-white shadow-lg p-4 flex justify-between items-center sticky top-0 z-30 border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                        {/* Hamburger Button for mobile */}
                        <button className="md:hidden text-white" onClick={() => setIsDrawerOpen(true)}>
                            <LuMenu size={24} />
                        </button>
                        {/* Page Title */}
                        <div className="flex items-center gap-2">
                             <FaClipboardList size={20} className="text-orange-400" />
                            <div className="text-xl font-extrabold text-orange-400 hidden md:block">Order Management</div>
                            <div className="text-xl font-extrabold text-orange-400 md:hidden">Orders</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {/* Status Toggle */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-slate-300 hidden sm:inline">Status:</span>
                            <button onClick={handleToggleCanteen} className={`px-3 py-1 rounded-full font-bold transition-all shadow-md active:scale-95 text-sm flex items-center ${isCanteenOpen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-7Check'}`}> {isCanteenOpen ? 'ON' : 'OFF'} </button>
                        </div>
                        {/* Logout */}
                        <button onClick={handleLogout} className="bg-red-600 font-semibold py-2 px-4 rounded-lg transition duration-300 hover:bg-red-700 flex items-center space-x-2 shadow-md active:scale-95">
                            <LuLogOut size={18} /><span>Log Out</span>
                        </button>
                    </div>
                </header>
                
                {/* --- Original <main> content from OrdersPage --- */}
                <main className="container mx-auto p-4 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <h2 className="text-4xl font-bold text-slate-100 mb-4 md:mb-0">Placed Orders</h2>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                            
                            {/* Search Input (Unchanged) */}
                            <div className="relative w-full md:w-64">
                                <input type="text" placeholder="Search by Bill Number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="p-2 pl-10 border border-slate-600 rounded-lg w-full bg-slate-800 text-lg text-white placeholder-slate-400 focus:ring-1 focus:ring-orange-500"/>
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                            </div>

                            {/* Filter Buttons (Unchanged) */}
                            <div className="flex space-x-2 bg-slate-700 p-1 rounded-lg shadow-inner">
                                <button onClick={() => setFilter('All')} className={`px-4 py-2 rounded-md text-base font-semibold transition-colors ${filter === 'All' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-600'}`}>All</button>
                                <button onClick={() => setFilter('Paid')} className={`px-4 py-2 rounded-md text-base font-semibold transition-colors ${filter === 'Paid' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-600'}`}>New (Paid)</button>
                                <button onClick={() => setFilter('Ready')} className={`px-4 py-2 rounded-md text-base font-semibold transition-colors ${filter === 'Ready' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-600'}`}>Ready to Serve</button>
                                <button onClick={() => setFilter('Delivered')} className={`px-4 py-2 rounded-md text-base font-semibold transition-colors ${filter === 'Delivered' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-600'}`}>Delivered</button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Order Table (Unchanged) */}
                    {loading ? (<p className="text-slate-400 text-center p-10">Loading orders...</p>) : error ? (<p className="text-red-400 text-center p-10">{error}</p>) : (
                        <div className="bg-slate-800 rounded-lg shadow-xl overflow-x-auto border border-slate-700">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead className="bg-slate-700/70">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Bill Number</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Student Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-lg text-slate-300">{order.billNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-lg text-slate-100">{order.studentName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-base text-slate-400">{new Date(order.orderDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-base text-slate-400">
                                                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-lg text-orange-400">₹{order.totalAmount.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1 inline-flex text-base leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>{order.status}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-base font-medium">
                                                {order.status === 'Paid' && (
                                                    <button onClick={() => handleMarkAsReady(order._id)} className="px-4 py-2 bg-purple-500 text-white text-sm font-semibold rounded-lg hover:bg-purple-600 flex items-center space-x-1 transition duration-150 active:scale-95">
                                                        <FaTruck size={12} /> <span>Mark Ready</span>
                                                    </button>
                                                )}
                                                {order.status === 'Ready' && (
                                                    <button onClick={() => handleMarkAsDelivered(order._id)} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 flex items-center space-x-1 transition duration-150 active:scale-95">
                                                        <FaCheck size={12} /> <span>Delivered</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" className="text-center text-slate-400 py-10">
                                                No orders found matching the criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default OrdersPage;