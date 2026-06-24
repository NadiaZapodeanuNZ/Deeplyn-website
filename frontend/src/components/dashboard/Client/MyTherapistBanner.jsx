import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTherapist } from '../../../api/therapist';

export default function MyTherapistBanner() 
{
    const navigate = useNavigate();
    const [therapist, setTherapist] = useState(null);

    useEffect(() => 
    {
        async function checkActiveTherapist() 
        {
            try 
            {
                const data = await getMyTherapist();
                setTherapist(data);
            } 
            catch (err) 
            {
                setTherapist(null);
            }
        }
        checkActiveTherapist();
    }, []);

    if (!therapist) return null;

    return (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0"></div>
                <div>
                    <p className="text-sm font-semibold text-purple-800">You already have an active therapist</p>
                    <p className="text-xs text-purple-600">
                        {therapist.first_name} {therapist.last_name} · @{therapist.username}
                    </p>
                </div>
            </div>
            <button onClick={() => navigate('/client/my-therapist')} className="flex-shrink-0 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">View my therapist</button>
        </div>
    );
}