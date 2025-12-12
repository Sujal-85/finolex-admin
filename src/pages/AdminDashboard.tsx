import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

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

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 mb-8">Manage mess orders and services</p>

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
                                        {/* Actions Removed - Now Managed by Canteen Manager */}
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
