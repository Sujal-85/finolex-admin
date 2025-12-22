import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, Clock, Zap, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const response = await axios.get('http://localhost:5000/api/orders', config);
            const fetchedOrders = response.data;
            setOrders(fetchedOrders);

            // Calculate stats
            setStats({
                pending: fetchedOrders.filter((o: any) => o.status === 'Pending').length,
                inProgress: fetchedOrders.filter((o: any) => o.status === 'In Progress').length,
                completed: fetchedOrders.filter((o: any) => o.status === 'Completed').length,
            });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching orders", error);
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/orders/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchOrders(); // Refresh
        } catch (error) {
            console.error("Error updating status", error);
            alert("Failed to update status");
        }
    };

    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const navigate = useNavigate();

    // Fast Action: Navigate to Create Order
    const handleFastOrder = () => {
        navigate('/admin/create-order');
    };

    // AI Action: Parse and Navigate
    const handleAiOrder = async () => {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Assuming we have an API endpoint for this now
            const res = await axios.post('http://localhost:5000/api/ai/parse-order',
                { prompt: aiPrompt },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Navigate to Create Order with pre-filled state
            navigate('/admin/create-order', { state: { prefilledData: res.data } });
        } catch (error: any) {
            console.error("AI Error", error);
            const errorMessage = error.response?.data?.message || "AI could not understand the order. Please try again.";
            alert(errorMessage);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 mb-8">Manage mess orders and services</p>

            {/* --- NEW: Fast Actions Section --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* 1. Fast Action Card */}
                <div
                    onClick={handleFastOrder}
                    className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl shadow-blue-900/20 cursor-pointer overflow-hidden group hover:scale-[1.01] transition-all duration-300"
                >
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/30 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white/90 mb-3 backdrop-blur-sm border border-white/10">
                                🚀 Quick Action
                            </span>
                            <h3 className="text-3xl font-bold mb-2 tracking-tight">Fast Book Order</h3>
                            <p className="text-blue-100/80 max-w-[80%] text-sm leading-relaxed">
                                Instantly create a new mess order for guests or events.
                            </p>

                            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:gap-3 transition-all">
                                Start Booking <ArrowRight size={16} />
                            </div>
                        </div>

                        <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-md shadow-inner border border-white/10 group-hover:bg-white/25 transition-colors">
                            <Zap size={40} className="text-yellow-300 drop-shadow-lg" />
                        </div>
                    </div>
                </div>

                {/* 2. AI Assistant Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={100} className="text-purple-600" />
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                        <Sparkles size={18} className="text-purple-600" />
                        AI Order Assistant
                    </h3>

                    <div className="space-y-3">
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="e.g. Lunch for 30 guests from IT dept next Friday..."
                            className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none h-20"
                        />
                        <button
                            onClick={handleAiOrder}
                            disabled={aiLoading}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {aiLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>Generate Order form <ArrowRight size={16} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border-l-4 border-yellow-400 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">New Requests</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</h3>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-lg">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border-l-4 border-blue-400 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">In Progress</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.inProgress}</h3>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <CheckCircle className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border-l-4 border-green-400 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Completed</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.completed}</h3>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Incoming Orders</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : orders.length === 0 ? (
                    <p className="text-gray-500">No orders assigned to you.</p>
                ) : (
                    orders.map((order: any) => (
                        <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-800">{order.eventName}</h3>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">{order.eventType}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(order.date).toLocaleDateString()}
                                        </span>
                                        <span>•</span>
                                        <span>{order.numberOfPersons} Persons</span>
                                        <span>•</span>
                                        <span>{order.serviceType}</span>
                                    </div>
                                    {order.notes && (
                                        <p className="text-sm text-gray-600 mt-3 bg-yellow-50 p-2 rounded inline-block">
                                            Note: {order.notes}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium 
                                        ${order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            order.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                        {order.status}
                                    </span>

                                    <div className="flex gap-2">
                                        <span className="text-xs text-gray-400 italic">Managed by Manager</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
