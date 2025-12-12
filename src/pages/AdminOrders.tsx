import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const AdminOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/orders/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Order marked as ${newStatus}`);
            fetchOrders(); // Refresh table
        } catch (error) {
            console.error("Error updating status", error);
            toast.error("Failed to update status");
        }
    };

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
            setOrders(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching orders", error);
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredOrders = orders.filter((order: any) => {
        const matchesFilter = filter === 'All' || order.status === filter;
        const matchesSearch = order.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.eventType?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Mess Orders</h1>
                    <p className="text-gray-600 mt-1">Manage guest visits, functions, and exams</p>
                </div>
                <button
                    onClick={() => navigate('/admin/create-order')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Create New Order
                </button>
            </div>

            {/* Stats Cards - Simplified for now */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{orders.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                        {orders.filter((o: any) => o.status === 'Pending').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        {orders.filter((o: any) => o.status === 'Completed').length}
                    </p>
                </div>
                {/* Placeholder for Total Value */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Active Events</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                        {orders.filter((o: any) => o.status === 'In Progress').length}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Filter Buttons */}
                        {['All', 'Pending', 'In Progress', 'Completed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-4">Event Details</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Persons</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
                            ) : filteredOrders.map((order: any) => (
                                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-800">{order.eventName || 'Unnamed Event'}</p>
                                        <p className="text-xs text-gray-500">{order.department}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar size={16} />
                                            {new Date(order.date).toLocaleDateString()}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{order.time}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                                            {order.eventType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{order.numberOfPersons}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        ₹{order.totalAmount}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/admin/orders/${order._id}`)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                View
                                            </button>

                                            {/* Manager Actions */}
                                            {Boolean(localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') || '{}').role === 'manager') && (
                                                <>
                                                    {order.status === 'Pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateStatus(order._id, 'Rejected')}
                                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                            >
                                                                Reject
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(order._id, 'In Progress')}
                                                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                            >
                                                                Accept
                                                            </button>
                                                        </>
                                                    )}
                                                    {order.status === 'In Progress' && (
                                                        <button
                                                            onClick={() => updateStatus(order._id, 'Completed')}
                                                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                        >
                                                            Complete
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;
