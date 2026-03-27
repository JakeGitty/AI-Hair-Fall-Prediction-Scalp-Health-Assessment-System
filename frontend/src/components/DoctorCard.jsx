import React from 'react';
import { Star, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const DoctorCard = ({ doctor, index }) => {
    const handleBooking = () => {
        const url = doctor.maps_url || doctor.website || `https://maps.google.com/?q=${encodeURIComponent(doctor.name + ' ' + doctor.address)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const renderStars = (rating) => {
        if (!rating) return null;
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < full ? 'text-amber-400 fill-amber-400' : i === full && half ? 'text-amber-400 fill-amber-200' : 'text-gray-300 fill-gray-100'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.12)' }}
            className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden flex flex-col transition-all duration-300"
        >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h4 className="text-white font-bold text-base leading-tight">{doctor.name}</h4>
                        {doctor.clinic && (
                            <p className="text-teal-100 text-xs mt-0.5 font-medium">{doctor.clinic}</p>
                        )}
                    </div>
                    {doctor.speciality && (
                        <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                            {doctor.speciality.split('&')[0].trim()}
                        </span>
                    )}
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex flex-col flex-grow gap-3">

                {/* Rating */}
                {doctor.rating && (
                    <div className="flex items-center gap-2">
                        {renderStars(doctor.rating)}
                        <span className="text-sm font-bold text-gray-800">{doctor.rating}</span>
                        {doctor.reviews > 0 && (
                            <span className="text-xs text-gray-500">({doctor.reviews.toLocaleString()} reviews)</span>
                        )}
                    </div>
                )}

                {/* Address */}
                {doctor.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{doctor.address}</span>
                    </div>
                )}

                {/* Phone */}
                {doctor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 text-teal-500 flex-shrink-0" />
                        <a href={`tel:${doctor.phone}`} className="hover:text-teal-600 transition-colors">{doctor.phone}</a>
                    </div>
                )}

                {/* Availability */}
                {doctor.available && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4 text-teal-500 flex-shrink-0" />
                        <span>{doctor.available}</span>
                    </div>
                )}

                {/* CTA Button */}
                <div className="mt-auto pt-3 border-t border-gray-100">
                    <button
                        onClick={handleBooking}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm font-bold rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all transform hover:scale-[1.02] shadow-md shadow-teal-200 cursor-pointer"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Get Directions / Book
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default DoctorCard;
