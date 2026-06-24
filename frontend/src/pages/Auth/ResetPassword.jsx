import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../api/auth';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-4">Invalid link. The token is missing.</p>
                    <button onClick={() => navigate('/forgot-password')} className="text-purple-700 underline">
                        Request a new link
                    </button>
                </div>
            </div>
        );
    }

    async function handleSubmit(e) 
    {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await resetPassword(token, password, confirmPass);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } 
        catch (err) 
        {
            const msg = err.response?.data?.error?.message || 'Something went wrong. Please try again.';
            setError(msg);
        } 
        finally 
        {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#fdf4ff_0%,_#f0e6ff_30%,_#c4b5fd_65%,_#8b5cf6_100%)]">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-purple-800 mb-2">Reset your password</h1>
                <p className="text-gray-500 text-sm mb-6"> Choose a new password for your Deeplyn account.</p>
                {success ? (
                    <div className="text-center">
                        <p className="text-green-600 font-medium mb-2">Password reset successfully!</p>
                        <p className="text-gray-500 text-sm">Redirecting you to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New password
                            </label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 8 characters" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"required/>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                            <input type="password" value={confirmPass}onChange={(e) => setConfirmPass(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"required
                                placeholder="Repeat your new password"/>
                        </div>
                        {error && (<p className="text-red-500 text-sm mb-4">{error}</p>)}
                        <button type="submit" disabled={loading} className="w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-800 disabled:opacity-50 transition-colors">
                            {loading ? 'Resetting...' : 'Reset password'}
                        </button>
                        <button type="button" onClick={() => navigate('/login')} className="w-full mt-3 text-gray-500 text-sm hover:text-purple-700 transition-colors">
                            Back to login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;