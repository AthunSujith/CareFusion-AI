import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Activity, FileText, Upload, ArrowRight, Check, AlertCircle, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiBase, API_ENDPOINTS } from '../utils/apiConfig';

const Signup = () => {
    const [userType, setUserType] = useState('patient'); // 'patient' or 'doctor'
    const [userId] = useState(() => `APP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [uploadedDocs, setUploadedDocs] = useState<Array<{ id: string, name: string }>>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Form States
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [dob, setDob] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('file', file);
        formData.append('doc_type', 'identity_proof');

        try {
            const response = await fetch(`${getApiBase()}${API_ENDPOINTS.SIGNUP}/upload-document`, {
                method: 'POST',
                headers: {
                    'bypass-tunnel-reminder': 'true'
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setUploadedDocs(prev => [...prev, { id: data.doc_id, name: file.name }]);
            } else {
                alert("Upload failed. Please try again.");
            }
        } catch (err) {
            console.error(err);
            alert("Upload error.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (uploadedDocs.length === 0) {
            setError("Please upload at least one identity document.");
            return;
        }

        setIsLoading(true);

        const basePayload = {
            user_id: userId,
            full_name: fullName,
            email: email,
            phone: phone,
            address: address,
            dob: dob,
            password: password,
            documents: uploadedDocs.map(d => ({ doc_id: d.id, doc_type: 'identity_proof', description: 'User Upload' }))
        };

        const payload = userType === 'doctor'
            ? { ...basePayload, license_number: licenseNumber, specialization: 'General' }
            : basePayload;

        const endpoint = userType === 'doctor' ? '/doctor' : '/patient';

        try {
            const response = await fetch(`${getApiBase()}${API_ENDPOINTS.SIGNUP}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'true'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const data = await response.json();
                setError(data.detail || "Signup failed");
            }
        } catch (err) {
            setError("Connection failed.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 border border-emerald-500/30 p-8 rounded-2xl max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                        <Check className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
                    <p className="text-slate-400 mb-8">
                        Your identity verification is pending. Our admin team will review your documents (usually within 24 hours).
                        You will receive an activation email once approved.
                    </p>
                    <Link to="/login">
                        <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all">
                            Back to Login
                        </button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F0E9] py-12 px-4 relative overflow-hidden flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D9CBC2] relative z-10">

                {/* Header */}
                <div className="bg-[#112250] p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E0C58F]/10 rounded-full blur-3xl" />
                    <Link to="/" className="inline-flex items-center gap-2 mb-4 opacity-80 hover:opacity-100 transition-opacity">
                        <Activity className="text-[#E0C58F] w-6 h-6" />
                        <span className="text-white font-bold tracking-tight">CAREFUSION</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-[#E0C58F] text-sm font-medium">Secure Identity & Medical Access</p>
                </div>

                {/* Type Toggle */}
                <div className="p-2 bg-[#F5F0E9] border-b border-[#D9CBC2] flex">
                    <button
                        onClick={() => setUserType('patient')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all rounded-xl flex items-center justify-center gap-2
                        ${userType === 'patient' ? 'bg-white shadow-md text-[#112250]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <User className="w-4 h-4" /> Patient
                    </button>
                    <button
                        onClick={() => setUserType('doctor')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all rounded-xl flex items-center justify-center gap-2
                        ${userType === 'doctor' ? 'bg-white shadow-md text-[#112250]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Stethoscope className="w-4 h-4" /> Medical Provider
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                            <input
                                required
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-[#F5F0E9]/50 border border-[#D9CBC2] rounded-xl px-4 py-3 text-[#112250] focus:ring-2 focus:ring-[#112250]/20 focus:border-[#112250] outline-none transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#F5F0E9]/50 border border-[#D9CBC2] rounded-xl px-4 py-3 text-[#112250] focus:ring-2 focus:ring-[#112250]/20 focus:border-[#112250] outline-none transition-all"
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone</label>
                            <input
                                required
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-[#F5F0E9]/50 border border-[#D9CBC2] rounded-xl px-4 py-3 text-[#112250] focus:ring-2 focus:ring-[#112250]/20 focus:border-[#112250] outline-none transition-all"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date of Birth</label>
                            <input
                                required
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full bg-[#F5F0E9]/50 border border-[#D9CBC2] rounded-xl px-4 py-3 text-[#112250] focus:ring-2 focus:ring-[#112250]/20 focus:border-[#112250] outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Address</label>
                        <input
                            required
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-[#F5F0E9]/50 border border-[#D9CBC2] rounded-xl px-4 py-3 text-[#112250] focus:ring-2 focus:ring-[#112250]/20 focus:border-[#112250] outline-none transition-all"
                            placeholder="123 Medical Plaza, New York, NY"
                        />
                    </div>

                    {userType === 'doctor' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[#112250]">Medical License Number (NMC)</label>
                            <input
                                required
                                type="text"
                                value={licenseNumber}
                                onChange={(e) => setLicenseNumber(e.target.value)}
                                className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 py-3 text-[#112250] focus:ring-2 focus:ring-[#112250]/20 focus:border-[#112250] outline-none transition-all font-mono"
                                placeholder="MD-12345-X"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#F5F0E9]/50 border border-[#D9CBC2] rounded-xl px-4 py-3 text-[#112250] focus:ring-2 focus:ring-[#112250]/20 focus:border-[#112250] outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirm Password</label>
                            <input
                                required
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-[#F5F0E9]/50 border border-[#D9CBC2] rounded-xl px-4 py-3 text-[#112250] focus:ring-2 focus:ring-[#112250]/20 focus:border-[#112250] outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Document Upload */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-[#112250] mb-1">Identity Verification</h3>
                                <p className="text-xs text-slate-500 mb-4">Please upload a valid ID (Passport, Driver's License) or Medical License (for doctors). Documents are encrypted.</p>

                                <div className="flex flex-col gap-2">
                                    {uploadedDocs.map((doc) => (
                                        <div key={doc.id} className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                                            <Check className="w-3 h-3" /> {doc.name}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 relative">
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    <button
                                        type="button"
                                        disabled={isUploading}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors pointer-events-none"
                                    >
                                        {isUploading ? 'Encrypting...' : 'Upload Document'} <Upload className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#112250] hover:bg-[#1E3A8A] text-[#E0C58F] font-bold text-lg py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : 'Submit Application'}
                        {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="text-center">
                        <Link to="/login" className="text-sm text-slate-500 hover:text-[#112250] font-medium underline underline-offset-4">
                            Already have an account? Sign In
                        </Link>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Signup;
