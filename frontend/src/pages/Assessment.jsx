import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, ChevronLeft, Activity, Info, Camera, ClipboardList, AlertTriangle } from 'lucide-react';

const Assessment = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState(null); // 'photo' or 'questionnaire'
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        age: 25,
        stress_level: 'Medium',
        diet: 'Average',
        sleep_hours: 7.0,
        scalp_condition: 'Normal',
        heredity: false,
    });
    const [photos, setPhotos] = useState([]);

    const baseSteps = [
        { id: 1, title: 'Personal Info' },
        { id: 2, title: 'Lifestyle & Diet' },
        { id: 3, title: 'Scalp Health' },
    ];
    const questionnaireSteps = mode === 'combined' ? [...baseSteps, { id: 4, title: 'Photo Upload' }] : baseSteps;

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setPhotos(prev => [...prev, ...newFiles]);
        }
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const validateStep = () => {
        if ((mode === 'questionnaire' || mode === 'combined') && currentStep === 1) {
            if (formData.age < 1 || formData.age > 120) {
                setError("Please enter a valid age.");
                return false;
            }
        }
        if ((mode === 'photo' || (mode === 'combined' && currentStep === 4)) && photos.length === 0) {
            setError("Please upload at least one scalp photo.");
            return false;
        }
        setError('');
        return true;
    };

    const nextStep = (e) => {
        if (e) e.preventDefault();
        if (validateStep() && currentStep < questionnaireSteps.length) {
            setCurrentStep(curr => curr + 1);
        }
    };

    const prevStep = (e) => {
        if (e) e.preventDefault();
        if (currentStep > 1) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validateStep()) return;

        setLoading(true);
        setError('');

        try {
            const payload = new FormData();
            payload.append('mode', mode);

            if (mode === 'questionnaire' || mode === 'combined') {
                payload.append('age', formData.age);
                payload.append('stress_level', formData.stress_level);
                payload.append('diet', formData.diet);
                payload.append('sleep_hours', formData.sleep_hours);
                payload.append('scalp_condition', formData.scalp_condition);
                payload.append('heredity', formData.heredity);
            }

            if (photos.length > 0) {
                photos.forEach((photo) => {
                    payload.append('photos', photo);
                });
            }

            const response = await fetch('http://127.0.0.1:8000/predict/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: payload,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Your session has expired. Please log out and log in again.');
                }
                const errorData = await response.json();
                throw new Error(errorData.detail || errorData.msg || 'Failed to submit assessment');
            }

            const result = await response.json();
            navigate('/results', { state: { result } });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setMode(null);
        setError('');
        setCurrentStep(1);
    };

    // =================== MODE SELECTION ===================
    if (!mode) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <Activity className="mx-auto h-12 w-12 text-healthcare-teal" />
                        <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Hair Fall Risk Assessment</h2>
                        <p className="mt-2 text-sm text-gray-600">Choose how you'd like to be assessed</p>
                    </div>

                    {/* Comprehensive Analysis Card */}
                    <button
                        onClick={() => setMode('combined')}
                        className="w-full relative bg-white rounded-xl shadow-md border-2 border-transparent hover:border-healthcare-blue hover:shadow-lg transition-all duration-300 p-8 text-left group mb-6"
                    >
                        <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Highest Accuracy
                            </span>
                        </div>
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 text-healthcare-blue mb-5 group-hover:scale-110 transition-transform">
                            <Activity className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Comprehensive Analysis (Recommended)</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Combines AI Photo Analysis with your lifestyle and health data using an advanced Ensemble Late Fusion model for the most accurate prediction.
                        </p>
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Photo Analysis Card */}
                        <button
                            onClick={() => setMode('photo')}
                            className="relative bg-white rounded-xl shadow-md border-2 border-transparent hover:border-healthcare-teal hover:shadow-lg transition-all duration-300 p-8 text-left group"
                        >
                            <div className="absolute top-4 right-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Recommended
                                </span>
                            </div>
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-teal-50 text-healthcare-teal mb-5 group-hover:scale-110 transition-transform">
                                <Camera className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Photo Analysis</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Upload photos of your scalp and hairline. Our AI analyzes the images using a trained CNN model for accurate results.
                            </p>
                            <div className="flex items-center text-sm font-medium text-healthcare-teal">
                                <span className="mr-1">84% accuracy</span>
                                <span className="text-gray-400">•</span>
                                <span className="ml-1 text-gray-500">~5 seconds</span>
                            </div>
                        </button>

                        {/* Questionnaire Card */}
                        <button
                            onClick={() => setMode('questionnaire')}
                            className="relative bg-white rounded-xl shadow-md border-2 border-transparent hover:border-orange-300 hover:shadow-lg transition-all duration-300 p-8 text-left group"
                        >
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-orange-50 text-orange-500 mb-5 group-hover:scale-110 transition-transform">
                                <ClipboardList className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Questionnaire Only</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Answer questions about your lifestyle, diet, and health history. No photos required.
                            </p>
                            <div className="flex items-center text-sm">
                                <AlertTriangle className="h-4 w-4 text-orange-500 mr-1.5" />
                                <span className="text-orange-600 font-medium">Limited accuracy — under development</span>
                            </div>
                        </button>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-8">
                        This tool is for informational purposes only and does not replace professional medical advice.
                    </p>
                </div>
            </div>
        );
    }

    // =================== PHOTO MODE ===================
    if (mode === 'photo') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <Camera className="mx-auto h-12 w-12 text-healthcare-teal" />
                        <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Photo Analysis</h2>
                        <p className="mt-2 text-sm text-gray-600">Upload clear photos of your scalp from multiple angles for the best results</p>
                    </div>

                    <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-100">
                        <div className="px-4 py-8 sm:p-8">

                            {error && (
                                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Photo grid */}
                            {photos.length > 0 && (
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    {photos.map((photo, index) => (
                                        <div key={index} className="relative group">
                                            <div className="h-32 w-full rounded-lg overflow-hidden bg-white shadow border">
                                                <img src={URL.createObjectURL(photo)} alt={`Scalp photo ${index + 1}`} className="h-full w-full object-cover" />
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1 truncate">{photo.name}</p>
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow opacity-0 group-hover:opacity-100"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload area */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 transition-colors hover:border-healthcare-teal bg-gray-50 text-center">
                                <div className="space-y-4">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-healthcare-blue">
                                        <Camera className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <label htmlFor="photo-upload" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-healthcare-teal transition-all inline-block">
                                            <span>{photos.length > 0 ? 'Add More Photos' : 'Select Photos'}</span>
                                            <input id="photo-upload" name="photo-upload" type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoChange} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG up to 5MB each — top, front, and side angles recommended
                                    </p>
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-healthcare-blue mb-2">Tips for better results:</h4>
                                <ul className="text-xs text-gray-600 space-y-1">
                                    <li>• Use good lighting — natural light works best</li>
                                    <li>• Upload multiple angles: top-down, front hairline, and sides</li>
                                    <li>• Keep hair dry and unstyled for the most accurate reading</li>
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex justify-between pt-5 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-healthcare-teal transition-colors"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading || photos.length === 0}
                                    className={`inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-healthcare-teal to-healthcare-blue hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-healthcare-teal transition-all shadow-md active:scale-95 ${photos.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? 'Analyzing...' : `Analyze ${photos.length} Photo${photos.length !== 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // =================== QUESTIONNAIRE MODE ===================
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700">
                                Age
                                <div className="group relative ml-2">
                                    <Info className="h-4 w-4 text-gray-400 hover:text-healthcare-blue cursor-pointer" />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-xs bg-gray-800 text-white text-center rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        Age is a primary factor in hereditary hair loss.
                                    </span>
                                </div>
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                min="1"
                                max="120"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-healthcare-teal focus:border-healthcare-teal sm:text-sm"
                            />
                        </div>
                        <div className="flex items-center h-5 mt-4">
                            <input
                                id="heredity"
                                name="heredity"
                                type="checkbox"
                                checked={formData.heredity}
                                onChange={handleChange}
                                className="focus:ring-healthcare-teal h-4 w-4 text-healthcare-teal border-gray-300 rounded"
                            />
                            <label htmlFor="heredity" className="ml-3 text-sm text-gray-700 font-medium flex items-center">
                                Family history of hair loss
                                <div className="group relative ml-2">
                                    <Info className="h-4 w-4 text-gray-400 hover:text-healthcare-blue cursor-pointer" />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-xs bg-gray-800 text-white text-center rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        Select if parents or grandparents experienced significant thinning.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stress Level</label>
                            <select
                                name="stress_level"
                                value={formData.stress_level}
                                onChange={handleChange}
                                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-healthcare-teal focus:border-healthcare-teal sm:text-sm"
                            >
                                <option value="Low">Low (Manageable routine)</option>
                                <option value="Medium">Medium (Occasional high stress)</option>
                                <option value="High">High (Constant pressure / anxiety)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Overall Diet Quality</label>
                            <select
                                name="diet"
                                value={formData.diet}
                                onChange={handleChange}
                                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-healthcare-teal focus:border-healthcare-teal sm:text-sm"
                            >
                                <option value="Good">Good (Balanced, nutrient-rich)</option>
                                <option value="Average">Average (Occasional fast food)</option>
                                <option value="Poor">Poor (High sugar, processed foods)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Average Sleep Hours</label>
                            <input
                                type="number"
                                step="0.5"
                                name="sleep_hours"
                                value={formData.sleep_hours}
                                onChange={handleChange}
                                min="0"
                                max="24"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-healthcare-teal focus:border-healthcare-teal sm:text-sm"
                            />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Scalp Condition</label>
                            <select
                                name="scalp_condition"
                                value={formData.scalp_condition}
                                onChange={handleChange}
                                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-healthcare-teal focus:border-healthcare-teal sm:text-sm"
                            >
                                <option value="Normal">Normal</option>
                                <option value="Dry">Dry / Flaky</option>
                                <option value="Oily">Oily</option>
                                <option value="Dandruff">Severe Dandruff</option>
                            </select>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 transition-colors hover:border-healthcare-teal bg-gray-50 text-center">
                            <div className="space-y-4">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-healthcare-blue">
                                    <Camera className="h-6 w-6" />
                                </div>
                                <div>
                                    <label htmlFor="photo-upload-step" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-healthcare-teal transition-all inline-block">
                                        <span>{photos.length > 0 ? 'Add More Photos' : 'Select Photos'}</span>
                                        <input id="photo-upload-step" name="photo-upload" type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoChange} />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">
                                    PNG, JPG up to 5MB each. Please upload multiple angles (top, front).
                                </p>
                            </div>
                        </div>

                        {photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative group">
                                        <div className="h-24 w-full rounded-lg overflow-hidden bg-white shadow border">
                                            <img src={URL.createObjectURL(photo)} alt={`Scalp photo ${index + 1}`} className="h-full w-full object-cover" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow opacity-0 group-hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">

                <div className="text-center mb-10">
                    <ClipboardList className="mx-auto h-12 w-12 text-orange-500" />
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                        {mode === 'combined' ? 'Comprehensive Assessment' : 'Questionnaire Assessment'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {mode === 'combined' ? 'Complete the lifestyle questions and upload your photos for the best result.' : 'Answer a few questions about your lifestyle and health.'}
                    </p>
                </div>

                {/* Warning banner */}
                {mode === 'questionnaire' && (
                    <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-orange-800">Limited Accuracy Notice</p>
                            <p className="text-xs text-orange-600 mt-1">
                                The questionnaire model is still under development and may not provide clinically accurate predictions.
                                For more reliable results, go back and use <strong>Photo Analysis</strong> instead.
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-100">
                    {/* Progress Bar */}
                    <div className="bg-gray-200 h-2.5 w-full">
                        <div
                            className="bg-orange-400 h-2.5 transition-all duration-500 ease-in-out"
                            style={{ width: `${(currentStep / questionnaireSteps.length) * 100}%` }}
                        ></div>
                    </div>

                    <div className="px-4 py-5 sm:p-6">

                        {/* Step Indicators */}
                        <div className="flex justify-between mb-8">
                            {questionnaireSteps.map((step) => (
                                <div key={step.id} className="flex flex-col items-center">
                                    <div className={`flex items-center justify-center h-8 w-8 rounded-full border-2 ${currentStep >= step.id ? 'border-orange-400 bg-orange-50 text-orange-500' : 'border-gray-300 text-gray-300'}`}>
                                        <span className="text-sm font-medium">{step.id}</span>
                                    </div>
                                    <span className={`mt-2 text-xs font-medium ${currentStep >= step.id ? 'text-orange-600' : 'text-gray-400'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div>                            <div className="min-h-[250px]">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6 border-b pb-2">
                                {questionnaireSteps[currentStep - 1].title}
                            </h3>
                            {renderStepContent()}
                        </div>

                            <div className="mt-8 flex justify-between pt-5 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={currentStep === 1 ? goBack : prevStep}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-healthcare-teal transition-colors"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    {currentStep === 1 ? 'Change Mode' : 'Back'}
                                </button>

                                {currentStep < questionnaireSteps.length ? (
                                    <button
                                        key="next-btn"
                                        type="button"
                                        onClick={nextStep}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 transition-colors"
                                    >
                                        Next Step
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        key="submit-btn"
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 transition-all shadow-md active:scale-95"
                                    >
                                        {loading ? 'Analyzing...' : 'View Results'}
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Assessment;
