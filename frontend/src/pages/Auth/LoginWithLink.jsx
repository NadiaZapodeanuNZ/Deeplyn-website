import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginWithLink } from '../../api/auth';

function LoginWithLink() 
{
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [message,setMessage] = useState('Logging you in...');
    const [isError,setIsError] = useState(false);

    useEffect(() => {
        async function handleLogin() 
        {
            const token = searchParams.get('token');

            if (!token) 
            {
                setMessage('Invalid link. Token is missing.');
                setIsError(true);
                return;
            }

            try {
                const data = await loginWithLink(token);
                const role = data.user.role;

                if (role === 'client') 
                    navigate('/client/dashboard');

                else if (role === 'therapist') 
                    navigate('/therapist/dashboard');

                else 
                    navigate('/login');
                
            } 
            catch (error) 
            {
                const msg = error.response?.data?.error?.message || 'This link is invalid or has expired.';
                setMessage(msg);
                setIsError(true);
            }
        }
        handleLogin();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#fdf4ff_0%,_#f0e6ff_30%,_#c4b5fd_65%,_#8b5cf6_100%)]">
            <div className="text-center">
                {isError ? (<div>
                                <p className="text-red-500 text-lg mb-4">{message}</p>
                                <button onClick={() => navigate('/forgot-password')} className="text-purple-700 underline">
                            Request a new link
                                </button>
                            </div>) : ( <p className="text-gray-600 text-lg">{message}</p>)}
            </div>
        </div>
        );
}

export default LoginWithLink;