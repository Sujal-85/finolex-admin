import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader } from '@/components/ui/loader';
import api from '@/api/client';
import { DollarSign, Ticket, Calculator } from 'lucide-react';

const Settlement = () => {
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/settlements/summary');
            setSummary(response.data);
            setIsLoading(false);
        } catch (error: any) {
            console.error("Error fetching settlement summary", error);
            if (error.response) {
                console.error("Details:", error.response.data);
            }
            setIsLoading(false);
        }
    };

  if (isLoading) {
      return <Loader />;
    }
  
    if (!summary) return <div className="p-8 text-center text-red-500">Failed to load settlement data. Please try again.</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Settlement Summary</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Total Services Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                            <DollarSign size={24} />
                        </div>
                        <h3 className="text-gray-500 font-medium mb-1">Total Services</h3>
                        <p className="text-3xl font-bold text-gray-800">₹{summary.totalServicesAmount}</p>
                        <p className="text-sm text-gray-400 mt-2">{summary.orderCount} Completed Orders</p>
                    </div>
                </div>

                {/* Total Coupons Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-orange-600">
                            <Ticket size={24} />
                        </div>
                        <h3 className="text-gray-500 font-medium mb-1">Total Coupon Value</h3>
                        <p className="text-3xl font-bold text-gray-800">₹{summary.totalCouponsAmount}</p>
                        <p className="text-sm text-gray-400 mt-2">{summary.couponCount} Coupons Issued</p>
                    </div>
                </div>

                {/* Net Payable Card */}
                <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 relative overflow-hidden text-white group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-gray-700 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="bg-gray-700 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-green-400">
                            <Calculator size={24} />
                        </div>
                        <h3 className="text-gray-300 font-medium mb-1">Net Payable Amount</h3>
                        <p className="text-4xl font-bold text-white">₹{summary.netPayable}</p>
                        <p className="text-sm text-gray-400 mt-2">To be paid by Manager</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
                <div className="shrink-0">ℹ️</div>
                <p>
                    <strong>Calculation Logic:</strong> Net Payable = (Total Value of Completed Orders) - (Total Value of Issued Coupons related to those orders).
                    This summary reflects the final settlement amount required from the Mess Manager.
                </p>
            </div>
        </div>
    );
};

export default Settlement;
