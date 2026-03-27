import React, { useRef } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Info, Download, FileText, ActivitySquare, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import DoctorRecommendations from '../components/DoctorRecommendations';

const Results = () => {
    const location = useLocation();
    const result = location.state?.result;
    const reportRef = useRef(null);

    if (!result) {
        return <Navigate to="/assessment" replace />;
    }

    // Risk Score Visualization Data
    const scoreData = [
        { name: 'Risk', value: result.risk_score },
        { name: 'Safe', value: 100 - result.risk_score }
    ];

    // Colors
    const getRiskColors = (category) => {
        switch (category) {
            case 'Low': return { fill: '#38a169', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-800' };
            case 'Moderate': return { fill: '#d69e2e', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800' };
            case 'High': return { fill: '#e53e3e', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-800' };
            default: return { fill: '#319795', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', badge: 'bg-gray-100 text-gray-800' };
        }
    };

    const riskStyles = getRiskColors(result.risk_category);

    // Doctor's Report Logic (Explainable AI)
    const generateDoctorsReport = () => {
        const insights = [];
        const inputs = result.inputs || {};

        if (inputs.heredity === true || String(inputs.heredity).toLowerCase() === 'true' || String(inputs.heredity).toLowerCase() === 'yes' || inputs.heredity === 1 || inputs.heredity === '1') {
            insights.push({ title: "Genetic Predisposition Detected", desc: "Family history is the strongest contributing factor (+30% Risk).", icon: <ActivitySquare className="h-5 w-5 text-red-500" />, type: 'negative' });
        } else {
             insights.push({ title: "No Strong Genetic Links", desc: "No critical family history detected (-10% Risk).", icon: <Shield className="h-5 w-5 text-green-500" />, type: 'positive' });
        }

        if (inputs.stress_level === 'High') {
            insights.push({ title: "Elevated Cortisol Levels", desc: "High stress is accelerating follicular shedding (+20% Risk).", icon: <AlertTriangle className="h-5 w-5 text-red-500" />, type: 'negative' });
        } else if (inputs.stress_level === 'Low') {
            insights.push({ title: "Healthy Stress Management", desc: "Low stress is preserving hair follicle cycles.", icon: <CheckCircle className="h-5 w-5 text-green-500" />, type: 'positive' });
        }

        if (inputs.diet === 'Poor') {
            insights.push({ title: "Nutritional Deficits", desc: "Lack of core proteins and vitamins is halting hair growth (+19% Risk).", icon: <AlertTriangle className="h-5 w-5 text-red-500" />, type: 'negative' });
        } else if (inputs.diet === 'Good') {
            insights.push({ title: "Excellent Nutrition", desc: "Rich diet is actively supporting scalp health.", icon: <CheckCircle className="h-5 w-5 text-green-500" />, type: 'positive' });
        }

        if (Number(inputs.sleep_hours) < 6) {
            insights.push({ title: "Insufficient Sleep", desc: "Poor sleep is preventing follicular repair (+10% Risk).", icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />, type: 'warning' });
        }

        if (['Oily', 'Dandruff'].includes(inputs.scalp_condition)) {
            insights.push({ title: "Scalp Inflammation", desc: `Current condition (${inputs.scalp_condition}) may clog pores.`, icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />, type: 'warning' });
        }

        return insights.length > 0 ? insights : [
            { title: "Baseline Health", desc: "No extreme lifestyle factors detected. Scalp health is relatively stable.", icon: <CheckCircle className="h-5 w-5 text-green-500" />, type: 'positive' }
        ];
    };

    const doctorsReport = generateDoctorsReport();

    const handleDownloadPDF = () => {
        const element = reportRef.current;
        const opt = {
            margin: 0.5,
            filename: `TeleHair_Report_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };
    
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <div className="min-h-screen bg-healthcare-background py-12 px-4 sm:px-6 lg:px-8">
            <motion.div 
                className="max-w-4xl mx-auto space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >

                {/* Header Actions */}
                <div className="flex justify-between items-center mb-4">
                    <Link to="/assessment" className="text-sm font-medium text-healthcare-teal hover:text-teal-700 transition">
                        &larr; Start New Assessment
                    </Link>
                    <button 
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-healthcare-blue text-sm font-semibold rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-all hover:shadow cursor-pointer"
                    >
                        <Download className="h-4 w-4" /> Download PDF Report
                    </button>
                </div>

                {/* Printable Report Container */}
                <div ref={reportRef} className="space-y-8 p-2 bg-transparent rounded-lg">
                    
                    <motion.div variants={itemVariants} className="text-center">
                        <Activity className="mx-auto h-12 w-12 text-healthcare-teal" />
                        <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Clinical Assessment Results</h2>
                        <p className="mt-2 text-sm text-gray-600">Generated by TeleHair AI Engine Ensemble ({new Date(result.created_at).toLocaleDateString()})</p>
                    </motion.div>

                    {/* Top Summary Card */}
                    <motion.div variants={itemVariants} className={`rounded-2xl shadow-lg border p-8 flex flex-col md:flex-row items-center gap-8 ${riskStyles.bg} ${riskStyles.border}`}>
                        <div className="w-full md:w-1/3 flex flex-col items-center">
                            <h3 className="text-lg font-semibold text-gray-700">Risk Confidence</h3>
                            <div className="h-48 w-full relative mt-4 drop-shadow-md">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={scoreData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                                            <Cell fill={riskStyles.fill} />
                                            <Cell fill="#E2E8F0" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-4xl font-extrabold ${riskStyles.text}`}>{Math.round(result.risk_score)}%</span>
                                </div>
                            </div>
                            <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${riskStyles.badge}`}>
                                {result.prediction_method.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="w-full md:w-2/3 space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    {result.risk_category === 'Low' ? <CheckCircle className="h-8 w-8 text-green-600" /> : <AlertTriangle className={`h-8 w-8 ${riskStyles.text}`} />}
                                    <h3 className={`text-3xl font-extrabold tracking-tight ${riskStyles.text}`}>
                                        {result.risk_category} Risk
                                    </h3>
                                </div>
                                <div className="text-gray-700 text-lg leading-relaxed font-medium">
                                    <p className="mb-4">{result.explanation || result.recommendation}</p>
                                    
                                    {result.recommendations && result.recommendations.length > 0 && (
                                        <div className="bg-teal-50/50 p-6 rounded-xl border border-teal-100 mb-4">
                                            <h4 className="font-bold text-healthcare-teal mb-3 text-base flex items-center gap-2">
                                                <Activity className="w-5 h-5"/> Personalized Action Plan
                                            </h4>
                                            <ul className="space-y-3">
                                                {result.recommendations.map((rec, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 text-base text-gray-700">
                                                        <div className="mt-1.5 h-2 w-2 rounded-full bg-healthcare-teal flex-shrink-0"></div>
                                                        <span>{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    {result.disclaimer && (
                                        <p className="text-sm italic text-gray-500 mt-6 border-t border-gray-200 pt-4">
                                            * {result.disclaimer}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {result.risk_category !== 'Low' && (
                                <div className="pt-6 border-t border-gray-200/50">
                                    <Link
                                        to="#"
                                        className="inline-flex shadow-xl shadow-blue-500/20 items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-healthcare-blue to-blue-700 hover:from-blue-700 hover:to-blue-900 transition-all transform hover:scale-105"
                                    >
                                        Book Telehealth Consultation
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Doctor's Report (Explainable AI) */}
                    {result.inputs && (
                        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-100 px-8 py-5 flex items-center gap-3">
                                <FileText className="h-6 w-6 text-healthcare-teal" />
                                <h3 className="text-xl font-bold text-gray-900">
                                    AI Doctor's Report
                                </h3>
                                <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Explainable AI Analysis</span>
                            </div>
                            
                            <div className="p-8">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {doctorsReport.map((insight, idx) => (
                                        <motion.div 
                                            key={idx}
                                            whileHover={{ scale: 1.02 }}
                                            className={`p-4 rounded-xl border flex items-start gap-4 transition-all
                                                ${insight.type === 'negative' ? 'bg-red-50 border-red-100' : ''}
                                                ${insight.type === 'positive' ? 'bg-green-50 border-green-100' : ''}
                                                ${insight.type === 'warning' ? 'bg-yellow-50 border-yellow-100' : ''}
                                            `}
                                        >
                                            <div className="mt-1 bg-white p-2 rounded-lg shadow-sm">
                                                {insight.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{insight.title}</h4>
                                                <p className={`text-sm mt-1 leading-snug
                                                    ${insight.type === 'negative' ? 'text-red-800' : ''}
                                                    ${insight.type === 'positive' ? 'text-green-800' : ''}
                                                    ${insight.type === 'warning' ? 'text-yellow-800' : ''}
                                                `}>
                                                    {insight.desc}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                </div>

                {/* Location-Based Doctor Recommendations */}
                <DoctorRecommendations riskCategory={result.risk_category} />

            </motion.div>
        </div>
    );
};

export default Results;
