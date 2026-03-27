import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, Stethoscope, AlertTriangle, RefreshCw, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DoctorCard from './DoctorCard';

const API_BASE = 'http://127.0.0.1:8000';

// Static fallback in case everything fails
const FALLBACK_DOCTORS = [
    {
        name: "Dr. Sample Dermatologist",
        clinic: "Sample Skin & Hair Clinic",
        speciality: "Dermatologist",
        address: "Please add real doctors to backend/data/doctors.json",
        rating: 5.0,
        reviews: 0,
        phone: "",
        maps_url: "https://maps.google.com/?q=dermatologist+near+me",
        website: "",
        available: ""
    }
];

const DoctorRecommendations = ({ riskCategory }) => {
    const [city, setCity] = useState('');
    const [inputCity, setInputCity] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle | detecting | done | denied
    const [showManual, setShowManual] = useState(false);

    // Do not render for Low risk
    if (riskCategory === 'Low') return null;

    const isHighRisk = riskCategory === 'High';

    // ─── Fetch doctors from backend ────────────────────────────────────
    const fetchDoctors = useCallback(async (searchCity) => {
        if (!searchCity) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/doctors?location=${encodeURIComponent(searchCity)}`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setDoctors(data.length > 0 ? data : FALLBACK_DOCTORS);
        } catch (err) {
            console.error('Doctor fetch failed:', err);
            setError('Could not load doctors. Showing sample list.');
            setDoctors(FALLBACK_DOCTORS);
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Auto detect city via browser geolocation ─────────────────────
    const detectLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setShowManual(true);
            setLocationStatus('denied');
            return;
        }
        setLocationStatus('detecting');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    // Nominatim reverse geocoding — completely free, no key required
                    const resp = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const geo = await resp.json();
                    const detectedCity =
                        geo.address?.city ||
                        geo.address?.town ||
                        geo.address?.village ||
                        geo.address?.county ||
                        '';
                    if (detectedCity) {
                        setCity(detectedCity);
                        setInputCity(detectedCity);
                        setLocationStatus('done');
                        fetchDoctors(detectedCity);
                    } else {
                        setShowManual(true);
                        setLocationStatus('denied');
                    }
                } catch {
                    setShowManual(true);
                    setLocationStatus('denied');
                }
            },
            () => {
                setShowManual(true);
                setLocationStatus('denied');
            },
            { timeout: 8000 }
        );
    }, [fetchDoctors]);

    // Auto-trigger on mount
    useEffect(() => {
        detectLocation();
    }, [detectLocation]);

    const handleManualSearch = (e) => {
        e.preventDefault();
        if (!inputCity.trim()) return;
        setCity(inputCity.trim());
        fetchDoctors(inputCity.trim());
        setShowManual(false);
    };

    // ─── Styling based on risk ─────────────────────────────────────────
    const sectionBorder = isHighRisk ? 'border-red-200' : 'border-yellow-200';
    const headerBg = isHighRisk
        ? 'bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100'
        : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100';
    const iconColor = isHighRisk ? 'text-red-500' : 'text-yellow-500';
    const badgeStyle = isHighRisk
        ? 'bg-red-100 text-red-700 border border-red-200'
        : 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    const headingColor = isHighRisk ? 'text-red-800' : 'text-yellow-800';

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.2 }}
            className={`bg-white rounded-2xl shadow-md border ${sectionBorder} overflow-hidden`}
        >
            {/* Section Header */}
            <div className={`px-8 py-5 flex items-center gap-3 ${headerBg}`}>
                <Stethoscope className={`h-6 w-6 ${iconColor}`} />
                <div className="flex-1">
                    <h3 className={`text-xl font-bold ${headingColor}`}>
                        {isHighRisk ? '🚨 Consult a Specialist — Strongly Recommended' : '📋 Optional: Consult a Hair Specialist'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isHighRisk
                            ? 'Your results indicate significant hair loss risk. A dermatologist can provide a proper diagnosis and treatment plan.'
                            : 'Your results show moderate risk. A professional consultation could help prevent further progression.'}
                    </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${badgeStyle}`}>
                    {riskCategory} Risk
                </span>
            </div>

            {/* Location Bar */}
            <div className="px-8 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-teal-500" />
                        {locationStatus === 'detecting' && (
                            <span className="flex items-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />
                                Detecting your location...
                            </span>
                        )}
                        {locationStatus === 'done' && city && (
                            <span>Showing doctors near <strong className="text-gray-800">{city}</strong></span>
                        )}
                        {(locationStatus === 'denied' || locationStatus === 'idle') && !city && (
                            <span className="text-gray-500">Location not detected</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {city && (
                            <button
                                onClick={() => { setShowManual(true); setCity(''); setInputCity(''); setDoctors([]); }}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <X className="h-3 w-3" /> Change city
                            </button>
                        )}
                        {!showManual && locationStatus !== 'detecting' && (
                            <button
                                onClick={() => setShowManual(true)}
                                className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                            >
                                Search manually
                            </button>
                        )}
                    </div>
                </div>

                {/* Manual city input */}
                <AnimatePresence>
                    {showManual && (
                        <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleManualSearch}
                            className="mt-3 flex gap-2 overflow-hidden"
                        >
                            <input
                                type="text"
                                value={inputCity}
                                onChange={(e) => setInputCity(e.target.value)}
                                placeholder="Enter your city (e.g. Chennai, Mumbai)"
                                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-xl hover:bg-teal-600 transition-colors cursor-pointer"
                            >
                                <Search className="h-4 w-4" /> Search
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            {/* Content Area */}
            <div className="p-8">
                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="h-10 w-10 text-teal-500 animate-spin" />
                        <p className="text-gray-500 text-sm">Finding specialists near {city}...</p>
                    </div>
                )}

                {/* Error Banner */}
                {error && !loading && (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                        <button onClick={() => fetchDoctors(city)} className="ml-auto flex items-center gap-1 font-medium hover:text-amber-900 cursor-pointer">
                            <RefreshCw className="h-3.5 w-3.5" /> Retry
                        </button>
                    </div>
                )}

                {/* Doctor Cards Grid */}
                {!loading && doctors.length > 0 && (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {doctors.map((doctor, idx) => (
                            <DoctorCard key={idx} doctor={doctor} index={idx} />
                        ))}
                    </div>
                )}

                {/* Empty / Waiting State */}
                {!loading && doctors.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MapPin className="h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm">Enter your city above to find nearby specialists.</p>
                    </div>
                )}

                <p className="text-xs text-gray-400 text-center mt-6">
                    * Doctor information is provided for reference only. Always verify availability before visiting.
                </p>
            </div>
        </motion.div>
    );
};

export default DoctorRecommendations;
