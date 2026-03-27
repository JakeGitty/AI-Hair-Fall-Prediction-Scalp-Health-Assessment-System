import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Activity, Clock, FileText, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';

const Dashboard = () => {
    const { user, token } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/assessments/history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Failed to fetch history (Status ${response.status}): ${errText}`);
                }
                const data = await response.json();
                setHistory(data.history);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchHistory();
    }, [token]);

    if (!user) return <Navigate to="/login" replace />;

    // Format chart data
    const chartData = history.map((item, index) => ({
        name: new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        risk: item.risk_score,
        fullDate: new Date(item.created_at).toLocaleString(),
        category: item.risk_category
    }));

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <div className="min-h-screen bg-healthcare-background py-10 px-4 sm:px-6 lg:px-8">
            <motion.div 
                className="max-w-5xl mx-auto space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Patient Dashboard</h1>
                        <p className="mt-1 text-sm text-gray-500">Welcome back, track your clinical assessments here.</p>
                    </div>
                    <Link
                        to="/assessment"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-healthcare-teal hover:bg-teal-700 transition"
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        New Scan
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Activity className="h-8 w-8 animate-spin text-healthcare-teal" /></div>
                ) : error ? (
                    <div className="bg-red-50 p-4 rounded-md text-red-700 border border-red-200">{error}</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-gray-100">
                        <FileText className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Assessment History</h3>
                        <p className="mt-1 text-sm text-gray-500">You haven't completed any clinical scans yet.</p>
                        <div className="mt-6">
                            <Link to="/assessment" className="text-sm font-medium text-healthcare-teal hover:text-teal-600">Start your first scan &rarr;</Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Left Column: Progress Chart */}
                        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-healthcare-teal" /> Risk Progression Timeline
                                </h3>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#319795" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#319795" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value) => [`${Math.round(value)}%`, 'Risk Score']}
                                            />
                                            <Area type="monotone" dataKey="risk" stroke="#319795" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column: Recent Scans Log */}
                        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-base font-bold text-gray-900">Assessment Log</h3>
                                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">{history.length} Total</span>
                            </div>
                            <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                {[...history].reverse().map((item) => (
                                    <li key={item.id} className="p-6 hover:bg-teal-50/50 transition duration-150 ease-in-out cursor-pointer group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 p-2 rounded-lg ${item.risk_category === 'Low' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {item.risk_category === 'Low' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-healthcare-teal transition">{Math.round(item.risk_score)}% {item.risk_category} Risk</p>
                                                    <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">{item.prediction_method.replace('_', ' ')}</p>
                                                    <p className="text-xs text-gray-400 mt-2">{new Date(item.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-healthcare-teal transition" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Dashboard;
