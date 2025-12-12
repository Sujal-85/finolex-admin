import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Ticket, Printer } from 'lucide-react';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [couponCount, setCouponCount] = useState(1);

    useEffect(() => {
        fetchOrderDetails();
        fetchCoupons();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/orders/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrder(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching order", error);
            setLoading(false);
        }
    };

    const fetchCoupons = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/coupons?orderId=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCoupons(response.data);
        } catch (error) {
            console.error("Error fetching coupons", error);
        }
    };

    const handleGenerateCoupons = async () => {
        setGenerating(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/orders/${id}/coupons`, {
                numberOfCoupons: couponCount,
                valuePerCoupon: order.costPerHead
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCoupons(); // Refresh list
            setGenerating(false);
            alert("Coupons generated successfully!");
        } catch (error) {
            console.error("Error generating coupons", error);
            setGenerating(false);
            alert("Failed to generate coupons");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!order) return <div className="p-8 text-center">Order not found</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => navigate('/admin/orders')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Orders
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Order Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">{order.eventName}</h1>
                                    <p className="text-gray-500">{order.department}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium 
                                    ${order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Calendar className="text-blue-500" size={20} />
                                    <div>
                                        <p className="text-xs text-gray-500">Date & Time</p>
                                        <p className="font-medium text-gray-800">
                                            {new Date(order.date).toLocaleDateString()} at {order.time}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <MapPin className="text-red-500" size={20} />
                                    <div>
                                        <p className="text-xs text-gray-500">Venue</p>
                                        <p className="font-medium text-gray-800">{order.venue}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Users className="text-purple-500" size={20} />
                                    <div>
                                        <p className="text-xs text-gray-500">Guests</p>
                                        <p className="font-medium text-gray-800">{order.numberOfPersons} Persons</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <DollarSign className="text-green-500" size={20} />
                                    <div>
                                        <p className="text-xs text-gray-500">Total Cost</p>
                                        <p className="font-medium text-gray-800">₹{order.totalAmount}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="font-medium text-gray-800 mb-2">Service Type</h3>
                                <p className="text-gray-600">{order.serviceType}</p>
                            </div>

                            {order.notes && (
                                <div className="mt-6">
                                    <h3 className="font-medium text-gray-800 mb-2">Notes</h3>
                                    <p className="text-gray-600 bg-yellow-50 p-4 rounded-lg text-sm">{order.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coupons Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Ticket className="text-orange-500" />
                                Coupons
                            </h2>

                            {/* Only Admin can generate coupons */}
                            {Boolean(localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') || '{}').role === 'admin') && (
                                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                    <p className="text-sm text-blue-800 mb-2 font-medium">Generate New Coupons</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={couponCount}
                                            onChange={(e) => setCouponCount(Number(e.target.value))}
                                            className="w-20 px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={handleGenerateCoupons}
                                            disabled={generating}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                                        >
                                            {generating ? '...' : 'Generate'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {coupons.length === 0 ? (
                                    <p className="text-center text-gray-500 text-sm py-4">No coupons generated yet.</p>
                                ) : (
                                    coupons.map((coupon: any) => (
                                        <div key={coupon._id} className="border border-dashed border-gray-300 bg-gray-50 p-3 rounded-lg flex justify-between items-center group hover:bg-white hover:border-blue-300 transition-colors">
                                            <div>
                                                <p className="font-mono font-bold text-gray-800">{coupon.code}</p>
                                                <p className="text-xs text-gray-500">Value: ₹{coupon.value}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${coupon.status === 'Used' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {coupon.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {coupons.length > 0 && (
                                <button className="w-full mt-4 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 py-2 rounded-lg transition-all">
                                    <Printer size={16} />
                                    Print All Coupons
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
