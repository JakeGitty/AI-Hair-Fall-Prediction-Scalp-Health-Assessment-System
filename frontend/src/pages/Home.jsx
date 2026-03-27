import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Activity, HeartHandshake, ChevronRight, CheckCircle2 } from 'lucide-react';

const Home = () => {
    const { user } = useAuth();

    const features = [
        {
            name: 'AI Risk Prediction',
            description: 'Advanced machine learning (Random Forest) analyzes your lifestyle, heredity, and stress factors to predict hair fall risk with high accuracy.',
            icon: Brain,
        },
        {
            name: 'Personalized Plans',
            description: 'Receive data-driven, actionable recommendations to mitigate hair fall, guided by explainable AI insights.',
            icon: Activity,
        },
        {
            name: 'Telehealth Consultations',
            description: 'Seamlessly book virtual appointments with leading dermatologists for professional medical advice.',
            icon: HeartHandshake,
        },
    ];

    const steps = [
        { id: 1, name: 'Complete Assessment', description: 'Answer a structured questionnaire covering your sleep, diet, stress, and medical history.' },
        { id: 2, name: 'AI Analysis', description: 'Our models process your data instantly to categorize your hair fall risk.' },
        { id: 3, name: 'Review Recommendations', description: 'Understand contributing factors through SHAP graphs and get customized lifestyle tips.' },
        { id: 4, name: 'Consult Experts', description: 'Connect with healthcare professionals if your risk profile is moderate or high.' },
    ];

    return (
        <div className="bg-healthcare-background overflow-hidden relative">

            {/* Dynamic Background Gradients */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-healthcare-teal to-healthcare-blue opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
            </div>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
                <h1 className="mx-auto max-w-4xl font-display text-5xl font-extrabold tracking-tight text-healthcare-text sm:text-7xl">
                    Early Detection for <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-healthcare-teal to-healthcare-blue">
                        Healthier Hair
                    </span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-gray-600">
                    TeleHair combines state-of-the-art predictive AI with telehealth access to help you understand and manage your hair fall risks proactively.
                </p>
                <div className="mt-10 flex justify-center gap-x-6">
                    <Link
                        to={user ? "/assessment" : "/register"}
                        className="group inline-flex items-center justify-center rounded-full py-3 px-8 text-sm font-semibold text-white bg-healthcare-blue hover:bg-healthcare-teal transition-all duration-300 shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        Start Free Assessment
                        <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    {!user && (
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center rounded-full py-3 px-8 text-sm font-semibold text-healthcare-text ring-1 ring-gray-900/10 hover:ring-gray-900/20 hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Log in
                        </Link>
                    )}
                </div>
            </div>

            {/* Feature Section */}
            <div className="py-24 sm:py-32 bg-white/50 backdrop-blur-lg border-y border-white/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-base font-semibold leading-7 text-healthcare-teal">Innovation in Care</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-healthcare-text sm:text-4xl">
                            Everything you need to understand your scalp health
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                            {features.map((feature) => (
                                <div key={feature.name} className="flex flex-col group p-6 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 hover:shadow-xl hover:ring-healthcare-teal/30 transition-all duration-300">
                                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-healthcare-text">
                                        <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-healthcare-lightBlue text-healthcare-blue group-hover:bg-healthcare-teal group-hover:text-white transition-colors duration-300">
                                            <feature.icon className="h-6 w-6" aria-hidden="true" />
                                        </div>
                                        {feature.name}
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                        <p className="flex-auto">{feature.description}</p>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>

            {/* How it Works */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-healthcare-blue">Simple Process</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-healthcare-text sm:text-4xl">
                            How TeleHair works
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16 lg:gap-x-8">
                            {steps.map((step) => (
                                <div key={step.id} className="relative pl-16">
                                    <dt className="text-base font-semibold leading-7 text-healthcare-text">
                                        <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-healthcare-teal to-healthcare-blue text-white shadow-lg">
                                            {step.id}
                                        </div>
                                        {step.name}
                                    </dt>
                                    <dd className="mt-2 text-base leading-7 text-gray-600">{step.description}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>

            {/* Testimonials or CTA */}
            <div className="bg-healthcare-blue py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                        Ready to take control of your hair health?
                    </h2>
                    <p className="mt-4 text-lg leading-6 text-healthcare-lightBlue max-w-2xl mx-auto">
                        Join thousands of users who have discovered actionable insights to slow down hair fall and maintain a healthy scalp.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Link
                            to={user ? "/assessment" : "/register"}
                            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-healthcare-blue bg-white hover:bg-gray-50 shadow-xl active:scale-95 transition-all duration-200"
                        >
                            Get Started Now
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Home;
