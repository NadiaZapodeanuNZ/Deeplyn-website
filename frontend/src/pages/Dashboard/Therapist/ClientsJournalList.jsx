import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, ChevronRight } from "lucide-react";
import { getMyClients } from "../../../api/therapistDashboard";


function LoadingDots() 
{
    return (
        <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
        </div>
    );
}


function ClientRow({ client, onClick }) 
{
    const notesCount = client.shared_notes_count || 0;

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 px-5 py-4 bg-white border border-purple-200 rounded-2xl shadow-sm hover:border-purple-300 hover:bg-purple-50/30 transition group">

            <img
                src={client.profile_photo}
                alt={client.username}
                className="w-11 h-11 rounded-full object-cover flex-shrink-0" />

            <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-purple-900 truncate">
                    {client.first_name} {client.last_name}
                </p>
                <p className="text-xs text-purple-400">@{client.username}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">{notesCount}</p>
                    <p className="text-[10px] text-purple-400">
                        shared note{notesCount !== 1 ? "s" : ""}
                    </p>
                </div>
                <ChevronRight size={16} className="text-purple-300 group-hover:text-purple-500 transition" />
            </div>
        </button>
    );
}


export default function ClientsJournalList() 
{
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        loadClients();
    }, []);

    async function loadClients() 
    {
        setLoading(true);
        try {
            const data = await getMyClients();
            setClients(data);
        } catch (err) {
            setClients([]);
        } finally {
            setLoading(false);
        }
    }

    const searchLower = searchText.toLowerCase().trim();
    let filtered = clients;
    if (searchLower) 
    {
        filtered = clients.filter(c => {
            const fullName = (c.first_name + " " + c.last_name).toLowerCase();
            const username = c.username.toLowerCase();
            if (fullName.includes(searchLower)) return true;
            if (username.includes(searchLower)) return true;
            return false;
        });
    }

    function handleClientClick(clientId) 
    {
        navigate("/therapist/clients/" + clientId + "/journal");
    }


    if (loading) return <LoadingDots />;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 bg-[#FCF7FF]">

            <div className="mb-5">
                <h1 className="text-xl font-semibold text-purple-900">Journals</h1>
                <p className="text-xs text-purple-400 mt-0.5">
                    View shared notes from your active patients.
                </p>
            </div>

            {clients.length > 0 && (
                <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-xl px-4 py-2.5 mb-4 shadow-sm">
                    <Search size={14} className="text-purple-300 flex-shrink-0" />
                    <input
                        type="text"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        placeholder="Search patients..."
                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-purple-200" />
                </div>
            )}

            {clients.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center">
                        <BookOpen size={22} className="text-purple-300" />
                    </div>
                    <p className="text-sm font-medium text-purple-400">No active patients</p>
                    <p className="text-xs text-purple-300">Accept pending requests from patients to see their journals here.</p>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {filtered.map(client => (
                    <ClientRow
                        key={client.client_id}
                        client={client}
                        onClick={() => handleClientClick(client.client_id)}
                    />
                ))}
            </div>

            {clients.length > 0 && filtered.length === 0 && searchText && (
                <div className="text-center py-8">
                    <p className="text-sm text-purple-400">No patients matching "{searchText}"</p>
                </div>
            )}
        </div>
    );
}