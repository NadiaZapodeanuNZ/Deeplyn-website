import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { requestTherapistConnection } from '../../../api/therapist';

const SPEC_LABELS = 
{
  ADHD: 'ADHD',
  Addiction: 'Addiction & Recovery',
  Anxiety: 'Anxiety',
  Career: 'Career & Work Stress',
  child_adolescent: 'Child & Adolescent',
  Depression: 'Depression',
  eating_disorders: 'Eating Disorders',
  Grief: 'Grief & Loss',
  Trauma: 'Trauma & PTSD',
  Relationships: 'Relationships & Couples',
  personality_disorders: 'Personality Disorders',
  PTSD: 'PTSD & Trauma',
  OCD: 'OCD',
  Stress: 'Stress',
  Suicide: 'Suicide & Self-Harm',
  Treatment: 'Treatment'
};

function getInitials(firstName, lastName) 
{
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export default function TherapistProfilePage() 
{
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const therapist = location.state?.therapist;
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!therapist) 
  {
    return (
      <div className="min-h-screen bg-[#F6F3FC] flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500 text-sm">Therapist data could not be loaded.</p>
      </div>
    );
  }

  async function handleConnect() 
  {
    setLoading(true);
    setError('');
    try 
    {
      await requestTherapistConnection(id);
      setRequestSent(true);
    } 
    catch (err) 
    {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Something went wrong. Please try again.';
      setError(msg);
    } 
    finally 
    {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FCF7FF] px-6 py-10 flex items-start justify-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 w-full aspect-square md:aspect-auto flex-shrink-0 bg-purple-50">
          {therapist.profile_photo ? (
            <img
              src={therapist.profile_photo}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}/>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-purple-100">
              <span className="text-5xl font-bold text-purple-700">
                {getInitials(therapist.first_name, therapist.last_name)}
              </span>
            </div>
          )}
        </div>
        <div className="md:w-1/2 w-full p-7 flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight">
              {therapist.first_name} {therapist.last_name}
            </h1>

            <p className="text-sm text-gray-400 mt-0.5">
              @{therapist.username}
            </p>
            <p className="text-xs text-gray-300 mt-0.5">
                @{therapist.username}
            </p>

            {therapist.country && (
              <p className="text-xs text-gray-400 mt-1">
                {therapist.country}
              </p>
            )}
            {therapist.is_accepting_clients ? (
              <span className="inline-block mt-2 text-xs bg-green-50 text-green-600 border border-green-200 rounded-full px-2.5 py-0.5">
                Accepting clients
              </span>
            ) : (
              <span className="inline-block mt-2 text-xs bg-gray-50 text-gray-400 border border-gray-200 rounded-full px-2.5 py-0.5">
                Not accepting clients
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              About
            </p>
            <p
              className="text-sm text-gray-700 leading-relaxed break-words"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
              {therapist.bio || 'This therapist has not added a bio yet.'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Specializations
            </p>
            <div className="flex flex-wrap gap-1.5">
              {therapist.specializations.map((spec) => (
                <span
                  key={spec}
                  className="text-xs bg-purple-50 text-purple-600 border border-purple-100 rounded-full px-2.5 py-0.5">
                  {SPEC_LABELS[spec] ?? spec}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-gray-100">
            {requestSent ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-sm text-green-700 font-medium">
                  Request sent successfully!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Waiting for {therapist.first_name} {therapist.last_name} to accept your request.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {error && (
                  <p className="text-sm text-red-500 text-center bg-red-50 border border-red-100 rounded-xl p-3">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? 'Sending request...' : `Connect with ${therapist.first_name}`}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  You can only be connected to one therapist at a time.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

 