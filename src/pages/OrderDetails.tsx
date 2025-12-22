import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Ticket, Printer } from 'lucide-react';
import { jsPDF } from "jspdf";

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

    const handlePrintCoupons = async () => {
        if (!coupons.length) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Helper to load image
        const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
                img.onerror = reject;
            });
        };

        try {
            // Load Assets
            const [famtLogo, canteenLogo, signature] = await Promise.all([
                loadImage('/famt-logo.png'),
                loadImage('/logo.png'),
                loadImage('/manager_signature.png')
            ]);

            // Layout Settings
            const margin = 10;
            const cols = 2; // Reduced to 2 cols for wider coupons
            const rows = 4; // 8 coupons per page
            const couponWidth = (pageWidth - (margin * 2) - 10) / cols;
            const couponHeight = (pageHeight - (margin * 2) - 10) / rows;

            // Common Data
            const eventDate = new Date(order.date).toLocaleDateString();

            // --- Summary Page ---
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(0, 51, 102); // Dark Blue
            doc.text("Order Summary", pageWidth / 2, 40, { align: "center" });

            doc.setDrawColor(0);
            doc.setLineWidth(0.5);
            doc.line(margin, 45, pageWidth - margin, 45);

            doc.setFontSize(14);
            doc.setTextColor(0);

            let summaryY = 60;
            const lineHeight = 10;

            doc.text(`Event: ${order.eventName}`, margin + 10, summaryY);
            summaryY += lineHeight;
            doc.text(`Date & Time: ${eventDate} at ${order.time}`, margin + 10, summaryY);
            summaryY += lineHeight;
            doc.text(`Venue: ${order.venue || 'Canteen'}`, margin + 10, summaryY);
            summaryY += lineHeight;
            doc.text(`Department: ${order.department || 'N/A'}`, margin + 10, summaryY);
            summaryY += lineHeight;
            doc.text(`Service Type: ${order.serviceType || 'Standard'}`, margin + 10, summaryY);
            summaryY += 15;

            doc.setFontSize(16);
            doc.text(`Total Coupons: ${coupons.length}`, margin + 10, summaryY);
            summaryY += lineHeight;
            doc.setTextColor(0, 100, 0);
            doc.text(`Total Order Amount: Rs. ${order.totalAmount}`, margin + 10, summaryY);

            // Add Logos to summary
            doc.addImage(famtLogo, 'PNG', 20, 10, 30, 30);
            doc.addImage(canteenLogo, 'PNG', pageWidth - 50, 10, 30, 30);

            // Start Coupons on new page
            doc.addPage();

            coupons.forEach((coupon: any, index: number) => {
                const itemsPerPage = cols * rows;
                const pageIndex = Math.floor(index / itemsPerPage);
                const positionOnPage = index % itemsPerPage;

                if (index > 0 && positionOnPage === 0) {
                    doc.addPage();
                }

                const colIndex = positionOnPage % cols;
                const rowIndex = Math.floor(positionOnPage / cols);

                const x = margin + (colIndex * (couponWidth + 10)); // +10 gap
                const y = margin + (rowIndex * (couponHeight + 5)); // +5 gap

                // --- Coupon Styling ---

                // Border
                doc.setDrawColor(200, 200, 200);
                doc.setLineDashPattern([3, 3], 0);
                doc.rect(x, y, couponWidth, couponHeight);
                doc.setLineDashPattern([], 0);

                // Header Background
                doc.setFillColor(245, 247, 250); // Light Gray/Blue
                doc.rect(x + 1, y + 1, couponWidth - 2, 15, 'F');

                // Logos
                const logoSize = 10;
                doc.addImage(famtLogo, 'PNG', x + 3, y + 2.5, logoSize, logoSize);
                doc.addImage(canteenLogo, 'PNG', x + couponWidth - 13, y + 2.5, logoSize, logoSize);

                // Title (Mess Name / College)
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(50);
                doc.text("Finolex Canteen", x + (couponWidth / 2), y + 8, { align: "center" });
                doc.setFontSize(7);
                doc.setFont("helvetica", "normal");
                doc.text("FAMT, Ratnagiri", x + (couponWidth / 2), y + 12, { align: "center" });

                // Event Details
                let cy = y + 22;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(0);
                doc.text(order.eventName?.substring(0, 30) || "Event", x + (couponWidth / 2), cy, { align: "center" });

                cy += 6;
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(80);
                doc.text(`${eventDate} | ${order.time}`, x + (couponWidth / 2), cy, { align: "center" });

                cy += 5;
                doc.text(`${order.venue || 'Canteen'} | ${order.department || 'General'}`, x + (couponWidth / 2), cy, { align: "center" });

                cy += 5;
                doc.text(`Service: ${order.serviceType || 'Standard'}`, x + (couponWidth / 2), cy, { align: "center" });

                // Value & Code Box
                cy += 6;
                doc.setDrawColor(0);
                doc.setLineWidth(0.1);
                // doc.rect(x + 10, cy, couponWidth - 20, 12); // Inner box

                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.setTextColor(0, 100, 0); // Dark Green
                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.setTextColor(0, 100, 0); // Dark Green
                cy += 6;
                doc.text(`Rs. ${coupon.value}`, x + (couponWidth / 2), cy, { align: "center" });

                cy += 6;
                doc.setFont("courier", "bold");
                doc.setFontSize(11);
                doc.setTextColor(0);
                doc.text(coupon.code, x + (couponWidth / 2), cy, { align: "center" });

                // Footer / Signature
                const sigY = y + couponHeight - 12;
                doc.addImage(signature, 'PNG', x + couponWidth - 25, sigY - 5, 20, 10);

                doc.setFont("helvetica", "italic");
                doc.setFontSize(6);
                doc.setTextColor(150);
                doc.text("Authorized Signature", x + couponWidth - 15, sigY + 6, { align: "center" });

                doc.text("One Time Use", x + 10, sigY + 6, { align: "center" });
            });

            doc.save(`Coupons-${order.eventName || 'Order'}.pdf`);

        } catch (error) {
            console.error("Failed to load assets for PDF", error);
            alert("Could not load images/logos for printing. Please try again.");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!order) return <div className="p-8 text-center">Order not found</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Navigation */}
                <button
                    onClick={() => navigate('/admin/orders')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors group"
                >
                    <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="font-medium">Back to Orders</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Order Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Title & Status Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50" />

                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                                            {order.eventName}
                                        </h1>
                                    </div>
                                    <p className="text-slate-500 font-medium text-lg">{order.department}</p>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border
                                    ${order.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                    {order.status.toUpperCase()}
                                </span>
                            </div>

                            {/* Service Type & Notes */}
                            <div className="mt-8 grid grid-cols-1 gap-4">
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Service Type</h3>
                                    <p className="text-slate-700 font-medium">{order.serviceType}</p>
                                </div>
                                {order.notes && (
                                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600/70 mb-2 flex items-center gap-1">
                                            Notes
                                        </h3>
                                        <p className="text-amber-900/80 text-sm leading-relaxed">{order.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Date Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Calendar size={20} />
                                </div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Date & Time</p>
                                <p className="font-bold text-slate-800 mt-1">
                                    {new Date(order.date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-slate-500">{order.time}</p>
                            </div>

                            {/* Venue Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <MapPin size={20} />
                                </div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Venue</p>
                                <p className="font-bold text-slate-800 mt-1 truncate" title={order.venue}>{order.venue}</p>
                                <p className="text-sm text-slate-500">Campus</p>
                            </div>

                            {/* Guests Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Users size={20} />
                                </div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Guests</p>
                                <p className="font-bold text-slate-800 mt-1">{order.numberOfPersons}</p>
                                <p className="text-sm text-slate-500">Expected</p>
                            </div>

                            {/* Cost Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <DollarSign size={20} />
                                </div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Cost</p>
                                <p className="font-bold text-slate-800 mt-1">₹{order.totalAmount.toLocaleString()}</p>
                                <p className="text-sm text-slate-500">₹{order.costPerHead}/head</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Coupons */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Ticket className="text-orange-500" />
                                    <span>Coupons</span>
                                </h2>
                                <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded-md">
                                    {coupons.length} Issued
                                </span>
                            </div>

                            {/* Admin Generate Controls */}
                            {Boolean(localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') || '{}').role === 'admin') && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                                    <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Generate New Batches</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={couponCount}
                                            onChange={(e) => setCouponCount(Number(e.target.value))}
                                            className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                        <button
                                            onClick={handleGenerateCoupons}
                                            disabled={generating}
                                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow flex items-center justify-center"
                                        >
                                            {generating ? (
                                                <span className="animate-pulse">Generating...</span>
                                            ) : (
                                                'Generate'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Coupons List */}
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                {coupons.length === 0 ? (
                                    <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                                        <Ticket size={32} className="mb-2 opacity-50" />
                                        <p className="text-sm">No coupons yet</p>
                                    </div>
                                ) : (
                                    coupons.map((coupon: any) => (
                                        <div
                                            key={coupon._id}
                                            className="relative bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                                        >
                                            {/* Decorative Left Border */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600" />

                                            <div className="flex justify-between items-center pl-3">
                                                <div>
                                                    <p className="font-mono font-bold text-slate-700 text-lg tracking-tight group-hover:text-blue-600 transition-colors">
                                                        {coupon.code}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-medium">Value: <span className="text-slate-600">₹{coupon.value}</span></p>
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border
                                                    ${coupon.status === 'Used'
                                                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                                                        : 'bg-green-50 text-green-700 border-green-100'
                                                    }`}>
                                                    {coupon.status}
                                                </span>
                                            </div>

                                            {/* Ticket "Notch" illusion (optional CSS trick, keeping simple for now) */}
                                            {/* <div className="absolute -right-2 top-1/2 -mt-2 w-4 h-4 bg-slate-50 rounded-full border border-slate-200" /> */}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Print Button */}
                            {coupons.length > 0 && (
                                <div className="pt-6 mt-auto">
                                    <button
                                        onClick={handlePrintCoupons}
                                        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Printer size={18} className="group-hover:scale-110 transition-transform" />
                                        Print All Coupons
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
