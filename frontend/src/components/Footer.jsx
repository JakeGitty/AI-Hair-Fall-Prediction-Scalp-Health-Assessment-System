import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
                <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
                    <div className="px-5 py-2">
                        <a href="#" className="text-base text-gray-500 hover:text-healthcare-teal transition-colors">
                            About
                        </a>
                    </div>
                    <div className="px-5 py-2">
                        <a href="#" className="text-base text-gray-500 hover:text-healthcare-teal transition-colors">
                            Assessments
                        </a>
                    </div>
                    <div className="px-5 py-2">
                        <a href="#" className="text-base text-gray-500 hover:text-healthcare-teal transition-colors">
                            Consultations
                        </a>
                    </div>
                    <div className="px-5 py-2">
                        <a href="#" className="text-base text-gray-500 hover:text-healthcare-teal transition-colors">
                            Privacy
                        </a>
                    </div>
                </nav>
                <div className="mt-8 flex justify-center space-x-6">
                    <span className="text-gray-400">
                        * This system provides predictive insights and is not a substitute for professional medical diagnosis.
                    </span>
                </div>
                <p className="mt-8 text-center text-base text-gray-400">
                    &copy; 2024 TeleHair Health Inc. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
