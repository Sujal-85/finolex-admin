import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Users, DollarSign, MapPin } from 'lucide-react';

const CreateOrder = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const prefilledData = location.state?.prefilledData;

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        eventType: 'Guest',
        eventName: '',
        department: '',
        date: '',
        time: '',
        venue: '',
        serviceType: 'Lunch',
        numberOfPersons: 0,
        costPerHead: 0,
        totalAmount: 0,
        notes: '',
        ...prefilledData // Overwrite defaults if AI provided data
    });

    // Recalculate total if AI populated data
    useEffect(() => {
        if (prefilledData) {
            // Optional: You could show a toast here like "AI filled the form!"
            // Ensure numbers are numbers
            const count = Number(prefilledData.numberOfPersons) || 0;
            const cost = Number(prefilledData.costPerHead) || 0;
            if (count || cost) {
                setFormData(prev => ({ ...prev, totalAmount: count * cost }));
            }
        }
    }, [prefilledData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Auto calculate total
            if (name === 'numberOfPersons' || name === 'costPerHead') {
                updated.totalAmount = Number(updated.numberOfPersons) * Number(updated.costPerHead);
            }

            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/orders', formData);
            navigate('/admin/orders');
        } catch (error: any) {
            console.error("Error creating order", error);
            const msg = error.response?.data?.message || "Failed to create order";
            alert(`Error: ${msg}`);
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/admin/orders')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
                >
                    <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                    Back to Orders
                </button>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Create New Order</h1>
                        <p className="text-sm text-gray-500 mt-1">Fill in the details for the new mess order</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">

                            {/* Section 1: Event Info */}
                            <div className="col-span-1 md:col-span-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 sm:h-6 bg-blue-500 rounded-full"></span>
                                    Event Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Event Type</label>
                                        <select
                                            name="eventType"
                                            value={formData.eventType}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                                        >
                                            <option value="Guest">Guest Visit</option>
                                            <option value="Function">Function</option>
                                            <option value="Exam">Exam (Oral/Practical)</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Event Name</label>
                                        <input
                                            type="text"
                                            name="eventName"
                                            placeholder="e.g. Annual Gathering"
                                            value={formData.eventName}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Department</label>
                                        <input
                                            type="text"
                                            name="department"
                                            placeholder="e.g. IT Dept"
                                            value={formData.department}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Date & Venue */}
                            <div className="col-span-1 md:col-span-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 sm:h-6 bg-green-500 rounded-full"></span>
                                    Date & Logistics
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleChange}
                                                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Time</label>
                                        <input
                                            type="time"
                                            name="time"
                                            value={formData.time}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Venue</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                name="venue"
                                                placeholder="e.g. Canteen Hall"
                                                value={formData.venue}
                                                onChange={handleChange}
                                                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Cost & Services */}
                            <div className="col-span-1 md:col-span-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 sm:h-6 bg-purple-500 rounded-full"></span>
                                    Service & Cost
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Service Type</label>
                                        <div className="flex flex-wrap gap-4">
                                            {['Lunch', 'Snacks', 'Both'].map((type) => (
                                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="serviceType"
                                                        value={type}
                                                        checked={formData.serviceType === type}
                                                        onChange={handleChange}
                                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm sm:text-base text-gray-700">{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Number of Persons</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="number"
                                                name="numberOfPersons"
                                                min="1"
                                                value={formData.numberOfPersons}
                                                onChange={handleChange}
                                                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Cost Per Head</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="number"
                                                name="costPerHead"
                                                min="0"
                                                value={formData.costPerHead}
                                                onChange={handleChange}
                                                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Total Amount</label>
                                        <input
                                            type="number"
                                            name="totalAmount"
                                            value={formData.totalAmount}
                                            readOnly
                                            className="w-full px-3 sm:px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg font-semibold text-gray-700 outline-none text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Notes */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Additional Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm sm:text-base"
                                    placeholder="Any special instructions for the mess manager..."
                                />
                            </div>

                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 border-t border-gray-100 pt-6">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/orders')}
                                className="w-full sm:w-auto px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all transform active:scale-95 disabled:opacity-50 text-sm sm:text-base"
                            >
                                <Save size={18} className="sm:w-5 sm:h-5" />
                                {loading ? 'Creating...' : 'Create Order'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateOrder;
