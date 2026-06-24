import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { getAvailableTherapists, getMyTherapist } from '../../../api/therapist';

const SPEC_LABELS = {ADHD: 'ADHD',
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
                    Treatment: 'Treatment'};


const ALL_SPECS = Object.keys(SPEC_LABELS);

function TherapistCard({ therapist, onReadMore }) 
{
  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 group">
      <div className="flex items-center gap-3">
        <img
          src={therapist.profile_photo}
          alt="Profile"
          className="w-11 h-11 rounded-full object-cover"/>
        <div>
          <p className="font-semibold text-gray-800 text-sm leading-tight">
            {therapist.first_name} {therapist.last_name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            @{therapist.username}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed flex-1 break-words"
        style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {therapist.bio || 'No bio available.'}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {therapist.specializations.slice(0, 3).map((spec) => (
          <span key={spec} className="text-xs bg-purple-50 text-purple-600 border border-purple-100 rounded-full px-2.5 py-0.5 leading-snug">
            {SPEC_LABELS[spec] ?? spec}
          </span>
        ))}
        {therapist.specializations.length > 3 && (
          <span className="text-xs text-gray-400 self-center">
            +{therapist.specializations.length - 3}
          </span>
        )}
      </div>

      <div className="flex justify-end mt-1">
        <button
          onClick={() => onReadMore(therapist)}
          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors group-hover:gap-2 duration-150">
          Read more
        </button>
      </div>
    </div>
  );
}

function FiltersDropdown({ selectedSpecs, onSpecToggle, selectedCountry, onCountryChange, availableCountries = [], onClearAll }) 
{
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalActive = selectedSpecs.length + (selectedCountry ? 1 : 0);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 bg-white hover:border-purple-300 hover:text-purple-700 transition-colors shadow-sm">
        Filters
        {totalActive > 0 && (
          <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center leading-none">
            {totalActive}
          </span>
        )}
        {isOpen ? <ChevronUp  className="w-3.5 h-3.5 text-gray-400"/> : <ChevronDown className="w-3.5 h-3.5 text-gray-400"/>}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 p-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Specializations
            </p>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {ALL_SPECS.map((spec) => (
                <label key={spec} className="flex items-center gap-2.5 cursor-pointer group/label">
                  <input
                    type="checkbox"
                    checked={selectedSpecs.includes(spec)}
                    onChange={() => onSpecToggle(spec)}
                    className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 group-hover/label:text-purple-700 transition-colors">
                    {SPEC_LABELS[spec]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100"/>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Country
            </p>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {availableCountries.length === 0 && (
                <p className="text-xs text-gray-400">No countries available.</p>
              )}
              {availableCountries.map((country) => (
                <label key={country} className="flex items-center gap-2.5 cursor-pointer group/label">
                  <input
                    type="radio"
                    name="country-filter"
                    checked={selectedCountry === country}
                    onChange={() => onCountryChange(country)}
                    className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"/>
                  <span className="text-sm text-gray-600 group-hover/label:text-purple-700 transition-colors">
                    {country}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {totalActive > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-purple-500 hover:text-purple-700 hover:underline transition-colors text-left">
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TherapistDirectory() {
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading]= useState(true);
  const [error, setError] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [activeTherapist, setActiveTherapist] = useState(null);

  useEffect(() => 
  {
    getAvailableTherapists()
      .then((data) => setTherapists(data))
      .catch(() => setError('Could not load therapists. Please try again later.'))
      .finally(() => setLoading(false));

    getMyTherapist()
      .then((data) => setActiveTherapist(data))
      .catch(() => setActiveTherapist(null));
  }, []);

  const availableCountries = [...new Set(therapists.map(t => t.country).filter(Boolean))].sort();

  function handleSpecToggle(spec) {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]);}

  function handleClearAll() {
    setSelectedSpecs([]);
    setSelectedCountry(null);
  }


  const filtered = therapists.filter((t) => {
    const matchesSpecs = selectedSpecs.length === 0 || selectedSpecs.some((spec) => t.specializations.includes(spec));
    const matchesCountry = !selectedCountry || t.country === selectedCountry;
    return matchesSpecs && matchesCountry;
  });

  function handleReadMore(therapist) {
    navigate(`/client/therapist/${therapist.id}`, { state: { therapist } });
  }

  return (
    <div className="min-h-screen bg-[#FCF7FF] px-6 py-8">
      {activeTherapist && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0"></div>
            <div>
              <p className="text-sm font-semibold text-purple-800">
                You already have an active therapist
              </p>
              <p className="text-xs text-purple-500 mt-0.5">
                {activeTherapist.first_name} {activeTherapist.last_name} · @{activeTherapist.username}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/client/my-therapist')}
            className="flex-shrink-0 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
            View my therapist
          </button>
        </div>
      )}

      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
          Find a Therapist
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse therapists who are currently accepting clients.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <FiltersDropdown
          selectedSpecs={selectedSpecs}
          onSpecToggle={handleSpecToggle}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          availableCountries={availableCountries}
          onClearAll={handleClearAll}
        />

        {selectedSpecs.length > 0 && (
          <p className="text-sm text-gray-500">
            Filtering by:{' '}
            <span className="text-purple-600 font-medium">
              {selectedSpecs.map((s) => SPEC_LABELS[s]).join(', ')}
            </span>
          </p>
        )}

        {!loading && !error && (
          <p className="ml-auto text-sm text-gray-400">
            {filtered.length} therapist{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-24">
          <p className="text-gray-400 text-sm animate-pulse">Loading therapists...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex justify-center items-center py-24">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <p className="text-gray-400 text-sm">No therapists match your current filters.</p>
          {(selectedSpecs.length > 0 || selectedCountry) && (
            <button
              onClick={handleClearAll}
              className="text-purple-500 text-sm hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((therapist) => (
            <TherapistCard
              key={therapist.id}
              therapist={therapist}
              onReadMore={handleReadMore}
            />
          ))}
        </div>
      )}
    </div>
  );
}