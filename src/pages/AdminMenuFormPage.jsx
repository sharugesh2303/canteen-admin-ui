/* ==================================
 * FILE: src/pages/AdminMenuFormPage.jsx
 * ================================== */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// Icons for Form
import { FaSave, FaTimes, FaUpload, FaEdit, FaTrashAlt } from 'react-icons/fa';
// Icons for Layout/Sidebar
import { LuLogOut, LuMenu, LuX } from 'react-icons/lu';
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign } from "react-icons/md";
import { FaPlusCircle, FaUtensils, FaClipboardList, FaChartLine } from 'react-icons/fa';

// ================================================
// !!! VERCEL DEPLOYMENT FIX: API URLS !!!
// ================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const API_ROOT_URL = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : 'http://localhost:10000');
// ================================================
// !!! END OF FIX !!!
// ================================================


// --- Helper function for Authorization Header (FIXED) ---
const getAdminAuthHeaders = (token, contentType = 'application/json') => ({
    'Authorization': `Bearer ${token}`, // Corrected to use Bearer token
    'Content-Type': contentType,
});

// **HELPER FUNCTION FOR CORRECTING IMAGE URL (FIXED)**
const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    // Use the new API_ROOT_URL variable
    const BASE_UPLOAD_URL = `${API_ROOT_URL}/uploads/`;

    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    if (imagePath.startsWith('/')) {
        return `${API_ROOT_URL}${imagePath}`;
    }
    return BASE_UPLOAD_URL + imagePath;
};
// **END HELPER**


// --- SparkleOverlay Component (from Dashboard) ---
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

// --- RealTimeClock Component (from Dashboard) ---
const RealTimeClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const formattedTime = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return (
        <div className="text-right mt-1 px-4 md:px-8">
            <p className="text-sm text-slate-400 font-medium leading-none">Current Time:</p>
            <p className="text-lg font-extrabold text-orange-400 leading-none">{formattedTime}</p>
        </div>
    );
};

// --- AdminSidebarNav Component (from Dashboard) ---
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
            <NavItem to="/menu" icon={FaUtensils} name="Menu Management" isActive={true} />
            <NavItem to="/orders" icon={FaClipboardList} name="Orders" />
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

// --- AddSubCategory Modal Component ---
const AddSubCategoryModal = ({ onSave, onCancel, isSubmitting }) => {
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = () => {
        if (!name || !file) {
            alert('Please provide a subcategory name and an image.');
            return;
        }
        onSave(name, file);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center p-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md border-t-4 border-orange-500">
                <h3 className="text-xl font-bold mb-6 text-slate-100">Add New Subcategory</h3>
                <div className="space-y-4">
                    <label className="block text-slate-300">
                        Subcategory Name
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Chips, Drinks, Bakery"
                            className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white"
                        />
                    </label>
                    <label className="block text-slate-300">
                        Subcategory Image
                        <div className="mt-1 p-4 border-2 border-dashed border-slate-600 rounded-lg text-center cursor-pointer hover:border-orange-500">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                                id="subcat-file-upload" 
                            />
                            {!preview ? (
                                <label htmlFor="subcat-file-upload" className="cursor-pointer">
                                    <FaUpload className="mx-auto text-slate-400" size={30} />
                                    <p className="text-sm text-slate-400 mt-2">Click to upload image</p>
                                </label>
                            ) : (
                                <img src={preview} alt="Preview" className="w-32 h-32 object-cover mx-auto rounded-full" />
                            )}
                        </div>
                    </label>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="bg-gray-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-green-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-700 transition-all active:scale-95 shadow-md shadow-green-500/30 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- END: AddSubCategory Modal Component ---


// --- EditSubCategory Modal Component ---
const EditSubCategoryModal = ({ subCategory, onSave, onCancel, isSubmitting }) => {
    const [name, setName] = useState(subCategory ? subCategory.name : '');

    useEffect(() => {
        if (subCategory) {
            setName(subCategory.name);
        }
    }, [subCategory]);

    const handleSubmit = () => {
        if (!name.trim()) {
            alert('Please provide a subcategory name.');
            return;
        }
        if (subCategory) {
            onSave(subCategory._id, name.trim());
        }
    };

    if (!subCategory) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center p-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md border-t-4 border-blue-500">
                <h3 className="text-xl font-bold mb-6 text-slate-100">Edit Subcategory</h3>
                <div className="space-y-4">
                    <label className="block text-slate-300">
                        Subcategory Name
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-slate-700 text-white"
                        />
                    </label>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="bg-gray-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-500/30 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- END: EditSubCategory Modal Component ---


// --- Main Page Component ---
const AdminMenuFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // --- Form State ---
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Snacks',
        stock: '0',
        subCategory: ''
    });
    const [subCategories, setSubCategories] = useState([]);
    const [itemImageFile, setItemImageFile] = useState(null);
    const [itemImagePreview, setItemImagePreview] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubCategoryModalVisible, setIsSubCategoryModalVisible] = useState(false);
    const [isEditSubCategoryModalVisible, setIsEditSubCategoryModalVisible] = useState(false);
    const [selectedSubCategoryForEdit, setSelectedSubCategoryForEdit] = useState(null);
    const [isSubmittingSubCat, setIsSubmittingSubCat] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Layout State ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCanteenOpen, setIsCanteenOpen] = useState(true);

    // --- Canteen Status Functions ---
    const fetchCanteenStatus = async () => {
        try {
            // Use API_BASE_URL
            const res = await axios.get(`${API_BASE_URL}/canteen-status/public`);
            setIsCanteenOpen(res.data.isOpen);
        } catch (err) { console.warn("Could not fetch canteen status."); }
    };
    const handleToggleCanteen = async () => {
        const getBearerAuthHeaders = (token) => ({ // Define helper here or globally
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const token = localStorage.getItem('admin_token');
        if (!token) { navigate('/login'); return; }
        try {
            // Use API_BASE_URL
            const response = await axios.patch(`${API_BASE_URL}/admin/canteen-status`, {}, { headers: getBearerAuthHeaders(token) });
            setIsCanteenOpen(response.data.isOpen);
            alert(`Canteen status set to ${response.data.isOpen ? 'OPEN' : 'CLOSED'}.`);
        } catch (error) {
            alert('Failed to update canteen status.');
            console.error("Canteen Toggle Error:", error.response?.data || error.message);
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/login');
    };

    // --- Fetch Subcategories ---
    const fetchSubCategories = useCallback(async () => {
        try {
            // Use API_BASE_URL
            const response = await axios.get(`${API_BASE_URL}/subcategories`);
            const data = response.data;
            if (Array.isArray(data)) {
                const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
                setSubCategories(sortedData);
            } else {
                setSubCategories([]);
            }
        } catch (err) {
            console.error("Failed to fetch subcategories:", err);
            setError('Failed to load subcategories.');
            setSubCategories([]);
        }
    }, []);

    // --- Initial Data Load ---
    useEffect(() => {
        const fetchPageData = async () => {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('admin_token');
            if (!token) {
                navigate('/login');
                return;
            }
            await Promise.all([fetchCanteenStatus(), fetchSubCategories()]);

            if (isEditMode) {
                try {
                    // Use API_BASE_URL
                    const itemResponse = await axios.get(`${API_BASE_URL}/admin/menu/${id}`, {
                        headers: getAdminAuthHeaders(token) // Use correct helper
                    });
                    const itemToEdit = itemResponse.data;

                    if (itemToEdit) {
                        setFormData({
                            id: itemToEdit._id,
                            name: itemToEdit.name,
                            price: itemToEdit.price.toString(),
                            category: itemToEdit.category,
                            stock: itemToEdit.stock.toString(),
                            subCategory: itemToEdit.subCategory ? itemToEdit.subCategory._id : ''
                        });
                        
                        // Use the helper function to guarantee the full URL
                        const fullImageUrl = getFullImageUrl(itemToEdit.imageUrl || '');
                        setExistingImageUrl(fullImageUrl);
                        
                    } else {
                        setError('Item not found.');
                    }
                } catch (err) {
                     console.error("Failed to fetch item data:", err);
                     if (err.response?.status === 401) {
                         setError('Session expired. Please log in again.');
                     } else {
                         setError('Failed to load item data.');
                     }
                }
            }
            setLoading(false);
        };
        fetchPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEditMode, navigate, fetchSubCategories]);


    // --- Form Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'category' && value !== 'Snacks') {
            setFormData(prev => ({ ...prev, subCategory: '' }));
        }
    };
    const handleItemImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setItemImageFile(file);
            setItemImagePreview(URL.createObjectURL(file));
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isEditMode && !itemImageFile) {
            alert('Please upload an image for the new item.');
            return;
        }
        if (formData.category === 'Snacks' && !formData.subCategory) {
            alert('Please select or add a subcategory for Snacks.');
            return;
        }

        setIsSubmitting(true);
        const itemFormData = new FormData();
        itemFormData.append('name', formData.name);
        itemFormData.append('price', formData.price);
        itemFormData.append('category', formData.category);
        itemFormData.append('stock', formData.stock);
        if (formData.subCategory) {
            itemFormData.append('subCategory', formData.subCategory);
        }
        if (itemImageFile) {
            itemFormData.append('image', itemImageFile);
        }

        try {
            const token = localStorage.getItem('admin_token');
            // Use correct headers
            const headers = getAdminAuthHeaders(token, 'multipart/form-data');
            
            // Use Bearer token authorization
            headers['Authorization'] = `Bearer ${token}`;
            delete headers['x-auth-token']; // remove old header

            if (isEditMode) {
                // Use API_BASE_URL
                await axios.put(`${API_BASE_URL}/menu/${id}`, itemFormData, { headers });
                alert('Item updated successfully!');
            } else {
                // Use API_BASE_URL
                await axios.post(`${API_BASE_URL}/menu`, itemFormData, { headers });
                alert('Item added successfully!');
            }
            navigate('/menu');
        } catch (error) {
            console.error('Failed to save item:', error.response ? error.response.data : error.message);
            alert(`Failed to save item: ${error.response?.data?.msg || error.message || 'Check console.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleCancel = () => navigate('/menu');

    // --- SubCategory Handlers ---
    const handleSaveNewSubCategory = async (name, file) => {
        setIsSubmittingSubCat(true);
        const subCatFormData = new FormData();
        subCatFormData.append('name', name);
        subCatFormData.append('image', file);
        try {
            const token = localStorage.getItem('admin_token');
            // Use correct headers
            const headers = getAdminAuthHeaders(token, 'multipart/form-data');
            headers['Authorization'] = `Bearer ${token}`;
            delete headers['x-auth-token'];

            // Use API_BASE_URL
            const response = await axios.post(`${API_BASE_URL}/admin/subcategories`, subCatFormData, { headers });
            
            await fetchSubCategories();
            setFormData(prev => ({ ...prev, subCategory: response.data._id }));
            setIsSubCategoryModalVisible(false);
        } catch (error) {
            console.error("Failed to create subcategory:", error);
            alert(`Failed to create subcategory: ${error.response?.data?.msg || 'Check console.'}`);
        } finally {
            setIsSubmittingSubCat(false);
        }
    };
    const handleOpenEditSubCategoryModal = () => {
        const selectedSub = subCategories.find(sub => sub._id === formData.subCategory);
        if (selectedSub) {
            setSelectedSubCategoryForEdit(selectedSub);
            setIsEditSubCategoryModalVisible(true);
        } else {
            alert("Please select a subcategory to edit.");
        }
    };
    const handleSaveEditedSubCategory = async (subId, newName) => {
        setIsSubmittingSubCat(true);
        try {
            const token = localStorage.getItem('admin_token');
            // Use API_BASE_URL
            await axios.put(`${API_BASE_URL}/admin/subcategories/${subId}`,
                { name: newName },
                { headers: getAdminAuthHeaders(token) } // Use correct helper
            );
            await fetchSubCategories();
            setIsEditSubCategoryModalVisible(false);
            alert('Subcategory updated successfully!');
        } catch (error) {
            console.error("Failed to update subcategory:", error);
            alert(`Failed to update subcategory: ${error.response?.data?.msg || 'Check console.'}`);
        } finally {
            setIsSubmittingSubCat(false);
        }
    };
    const handleDeleteSubCategory = async () => {
        const subIdToDelete = formData.subCategory;
        const selectedSub = subCategories.find(sub => sub._id === subIdToDelete);

        if (!selectedSub) {
            alert("Please select a subcategory to delete.");
            return;
        }

        if (window.confirm(`Are you sure you want to permanently delete "${selectedSub.name}"? This cannot be undone.`)) {
            setIsSubmittingSubCat(true);
            try {
                const token = localStorage.getItem('admin_token');
                // Use API_BASE_URL
                await axios.delete(`${API_BASE_URL}/admin/subcategories/${subIdToDelete}`, {
                    headers: getAdminAuthHeaders(token) // Use correct helper
                });
                await fetchSubCategories();
                setFormData(prev => ({ ...prev, subCategory: '' }));
                alert('Subcategory deleted successfully!');
            } catch (error) {
                 console.error("Failed to delete subcategory:", error);
                 alert(`Failed to delete subcategory: ${error.response?.data?.msg || 'Make sure no items use it.'}`);
            } finally {
                 setIsSubmittingSubCat(false);
            }
        }
    };

    // --- Render Logic ---
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex justify-center items-center">
                <svg className="animate-spin h-10 w-10 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-center text-lg ml-4 text-slate-400">Loading Form...</span>
            </div>
        );
    }

    if (error) {
        return (
             <div className="min-h-screen bg-slate-900 flex justify-center items-center p-8 flex-col"> 
                 <p className="text-red-400 text-center">{error}</p> 
                 <button onClick={() => navigate('/menu')} className="mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">
                     Back to Menu
                 </button>
             </div>
        );
    }


    // --- Main Return with Layout ---
    return (
        <div className="min-h-screen bg-slate-900 font-sans relative flex">
            <SparkleOverlay />
            
            {/* --- MOBILE DRAWER/OVERLAY --- */}
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

            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700 sticky top-0 h-screen overflow-y-auto flex-shrink-0 z-20">
                <div className="p-4 py-6">
                    <h1 className="text-2xl font-extrabold text-orange-400">Admin Portal</h1>
                </div>
                <AdminSidebarNav onClose={() => {}} />
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-grow relative z-10 min-h-screen">
                
                {/* --- HEADER --- */}
                <header className="bg-gray-900 text-white shadow-lg p-4 flex justify-between items-center sticky top-0 z-30 border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                        <button className="md:hidden text-white" onClick={() => setIsDrawerOpen(true)}>
                            <LuMenu size={24} />
                        </button>
                        <div className="text-xl font-extrabold text-orange-400 hidden md:block">JJ College Smart Canteen</div>
                        <div className="text-xl font-extrabold text-orange-400 md:hidden">Canteen Admin</div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-slate-300 hidden sm:inline">Status:</span>
                            <button onClick={handleToggleCanteen} className={`px-3 py-1 rounded-full font-bold transition-all shadow-md active:scale-95 text-sm flex items-center ${isCanteenOpen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}> {isCanteenOpen ? 'ON' : 'OFF'} </button>
                        </div>
                        <button onClick={handleLogout} className="bg-red-600 font-semibold py-2 px-4 rounded-lg transition duration-300 hover:bg-red-700 flex items-center space-x-2 shadow-md active:scale-95">
                            <LuLogOut size={18} /><span>Log Out</span>
                        </button>
                    </div>
                </header>
                <RealTimeClock />

                {/* --- Form Content within Main --- */}
                <main className="container mx-auto p-4 md:p-8">
                    <h2 className="text-3xl font-extrabold text-slate-100 mb-6">
                        {isEditMode ? 'Edit Menu Item' : 'Add New Item'}
                    </h2>

                    {/* --- Modals --- */}
                    {isSubCategoryModalVisible && (
                        <AddSubCategoryModal
                            isSubmitting={isSubmittingSubCat}
                            onSave={handleSaveNewSubCategory}
                            onCancel={() => setIsSubCategoryModalVisible(false)}
                        />
                    )}
                    {isEditSubCategoryModalVisible && (
                        <EditSubCategoryModal
                            subCategory={selectedSubCategoryForEdit}
                            isSubmitting={isSubmittingSubCat}
                            onSave={handleSaveEditedSubCategory}
                            onCancel={() => setIsEditSubCategoryModalVisible(false)}
                        />
                    )}

                    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 mb-10 border-t-4 border-orange-500 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Item Name */}
                            <label className="block text-slate-300">Item Name
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white" />
                            </label>

                            {/* Price */}
                            <label className="block text-slate-300">Price (₹)
                                <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white" />
                            </label>
                            
                            {/* Category Dropdown */}
                            <label className="block text-slate-300">Category
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white">
                                    <option value="Snacks">Snacks</option>
                                    <option value="Breakfast">Breakfast</option>
                                    <option value="Lunch">Lunch</option>
                                    <option value="Drinks">Drinks</option>
                                    <option value="Stationery">Stationery</option>
                                </select>
                            </label>

                            {/* Stock Count */}
                            <label className="block text-slate-300">Stock Count
                                <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white" />
                            </label>

                            {/* Item Image Upload */}
                            <div className="md:col-span-2">
                                <label className="block text-slate-300 mb-1">Item Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-grow p-4 border-2 border-dashed border-slate-600 rounded-lg text-center cursor-pointer hover:border-orange-500">
                                        <input type="file" accept="image/*" className="hidden" onChange={handleItemImageChange} id="item-file-upload"/>
                                        <label htmlFor="item-file-upload" className="cursor-pointer">
                                            {(!itemImagePreview && !existingImageUrl) && (
                                                <>
                                                    <FaUpload className="mx-auto text-slate-400" size={30} />
                                                    <p className="text-sm text-slate-400 mt-2">Click to upload item image</p>
                                                </>
                                            )}
                                            {(itemImagePreview || existingImageUrl) && (
                                                <p className="text-sm text-blue-400 mt-2">Click to change image</p>
                                            )}
                                        </label>
                                    </div>
                                    <div className="flex-shrink-0 w-32 h-32 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                                        {itemImagePreview ? (
                                            <img src={itemImagePreview} alt="Item Preview" className="w-full h-full object-cover" />
                                        ) : existingImageUrl ? (
                                            <img src={existingImageUrl} alt="Current Item" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-slate-500 text-xs">No Image</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* --- Subcategory Section (Conditional) --- */}
                            {formData.category === 'Snacks' && (
                                <div className="md:col-span-2">
                                    <label className="block text-slate-300 mb-1">
                                        Choose a Subcategory
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <select
                                            name="subCategory"
                                            value={formData.subCategory}
                                            onChange={handleChange}
                                            className="flex-grow p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white disabled:opacity-50"
                                            disabled={isSubmittingSubCat}
                                        >
                                            <option value="">-- Select a Subcategory --</option>
                                            {subCategories.map(sub => (
                                                <option key={sub._id} value={sub._id}>{sub.name}</option>
                                            ))}
                                        </select>

                                        {!formData.subCategory ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsSubCategoryModalVisible(true)}
                                                className="flex-shrink-0 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
                                                disabled={isSubmittingSubCat}
                                                title="Add New Subcategory"
                                            >
                                                Add+
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={handleOpenEditSubCategoryModal}
                                                    className="flex-shrink-0 bg-blue-500 text-white font-semibold p-2 rounded-lg hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                                                    disabled={isSubmittingSubCat}
                                                    title="Edit Selected Subcategory"
                                                >
                                                    <FaEdit size={16}/>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteSubCategory}
                                                    className="flex-shrink-0 bg-red-600 text-white font-semibold p-2 rounded-lg hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                                                    disabled={isSubmittingSubCat}
                                                    title="Delete Selected Subcategory"
                                                >
                                                    <FaTrashAlt size={16}/>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="mt-8 flex justify-end space-x-4">
                            <button type="button" onClick={handleCancel} disabled={isSubmitting || isSubmittingSubCat} className="bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50">
                                <FaTimes className="inline-block mr-2" />
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting || isSubmittingSubCat} className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-500/30 disabled:opacity-50">
                                <FaSave className="inline-block mr-2" />
                                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Item' : 'Save Item')}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default AdminMenuFormPage;
