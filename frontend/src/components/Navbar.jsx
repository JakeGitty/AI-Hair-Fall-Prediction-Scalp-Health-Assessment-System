import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <Activity className="h-8 w-8 text-healthcare-teal" />
                            <span className="font-bold text-xl text-healthcare-blue hidden sm:block">
                                TeleHair Health
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-6">
                                <span className="text-sm font-medium text-gray-700">
                                    {user.full_name}
                                </span>
                                <Link
                                    to="/dashboard"
                                    className="hidden sm:inline-flex items-center text-sm font-medium text-gray-700 hover:text-healthcare-teal transition"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={logout}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-healthcare-blue bg-healthcare-lightBlue hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-healthcare-blue transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-500 hover:text-healthcare-blue px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-healthcare-teal text-white hover:bg-teal-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
