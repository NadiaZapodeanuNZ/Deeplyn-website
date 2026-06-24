import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Users, NotebookPen, Brain, TrendingUp, LogOut, Clock, RefreshCw, Dumbbell, Search } from "lucide-react";
import { getMyClients, endClientRelationship } from "../../../api/therapistDashboard";


function LoadingDots() 
{
    return (
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>);
}

function formatDate(isoString) 
{
    if (!isoString) return "";
        return new Date(isoString).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric",});
}

function ClientCard({ client, onViewJournal, onViewExercises, onViewQuiz, onViewProgress, onEndRelationship, isEndLoading }) {
    return (
        <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <img
                    src={client.profile_photo}
                    alt={client.username}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0" />

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-purple-900 text-sm leading-tight truncate">
                        {client.first_name} {client.last_name}
                    </p>
                    <p className="text-xs text-purple-400 mt-0.5">@{client.username}</p>
                    <p className="text-xs text-purple-300 mt-0.5">{client.email}</p>
                </div>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-semibold flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Active
                </span>
            </div>

            <div className="flex items-center gap-1">
                <Clock size={11} className="text-purple-300" />
                <p className="text-xs text-purple-400">Connected since {formatDate(client.connected_since)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onViewJournal(client.client_id); }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 active:scale-95 transition-all duration-150">
                    <NotebookPen size={15} />
                    <span className="text-xs font-semibold">Journal</span>
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onViewExercises(client.client_id); }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 active:scale-95 transition-all duration-150">
                    <Dumbbell size={15} />
                    <span className="text-xs font-semibold">Exercises</span>
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onViewQuiz(client.client_id); }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 active:scale-95 transition-all duration-150">
                    <Brain size={15} />
                    <span className="text-xs font-semibold">Daily Quiz</span>
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onViewProgress(client.client_id); }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all duration-150">
                    <TrendingUp size={15} />
                    <span className="text-xs font-semibold">Progress</span>
                </button>
            </div>

            <div className="flex justify-end mt-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onEndRelationship(client.client_id, client.first_name, client.last_name); }}
                    disabled={isEndLoading}
                    className={"flex items-center gap-1 text-xs font-medium transition-colors "
                        + (isEndLoading
                            ? "text-purple-300 cursor-not-allowed"
                            : "text-red-400 hover:text-red-600")}>
                    <LogOut size={12} />
                    {isEndLoading ? "Ending..." : "End relationship"}
                </button>
            </div>
        </div>
    );
}


export default function MyClients()
{
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get("q") || "";
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [endLoading, setEndLoading] = useState(null);
    const [banner, setBanner] = useState(null);

    useEffect(() => {
        loadClients();
    }, []);

    async function loadClients() 
    {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getMyClients();
            setClients(data);
        } catch (err) {
            setError(err.response?.data?.error?.message || "Could not load patients.");
        } finally {
            setIsLoading(false);
        }
    }

    function showBanner(type, text) 
    {
        setBanner({ type, text });
        setTimeout(() => setBanner(null), 3000);
    }

    async function handleEndRelationship(clientId, firstName, lastName) 
    {
        const confirmed = window.confirm( "Are you sure you want to end your relationship with " + firstName + " " + lastName + "?\n\nAll shared data will become inaccessible.");
        if (!confirmed) return;

        setEndLoading(clientId);
        try{
            await endClientRelationship(clientId);
            setClients(prev => prev.filter(c => c.client_id !== clientId));
            showBanner("success", "Relationship ended with " + firstName + " " + lastName + ".");
           } 
        catch (err) 
        {
            showBanner("error", err.response?.data?.error?.message || "Failed to end relationship.");
        }
        finally 
        {
            setEndLoading(null);
        }
    }

    const filteredClients = clients.filter(client => 
    {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const fullName = (client.first_name + " " + client.last_name).toLowerCase();
        return (client.first_name.toLowerCase().includes(q) ||
                client.last_name.toLowerCase().includes(q) ||
                client.username.toLowerCase().includes(q) ||
                fullName.includes(q));
    });

    if (isLoading) 
        return ( <div className="flex items-center justify-center h-64"><LoadingDots /></div>);
    

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 bg-[#FCF7FF]">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-semibold text-purple-900">My Patients</h1>
                    <p className="text-xs text-purple-400 mt-0.5">
                        {searchQuery
                            ? filteredClients.length + " result" + (filteredClients.length !== 1 ? "s" : "") + " for \"" + searchQuery + "\""
                            : clients.length + " active patient" + (clients.length !== 1 ? "s" : "")}
                    </p>
                </div>
                <button
                    onClick={() => navigate("/therapist/clients/pending")}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-sm font-medium hover:bg-purple-100 transition">
                    Pending requests
                </button>
            </div>

            {banner && (
                <div className={"text-xs font-medium px-3 py-2 rounded-lg mb-4 "
                    + (banner.type === "success" ? "bg-green-50 text-green-600 border border-green-100"
                                                : "bg-red-50 text-red-500 border border-red-100")}>
                    {banner.text}
                </div>
            )}

            {error && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <p className="text-sm text-red-400">{error}</p>
                    <button
                        onClick={loadClients}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition">
                        <RefreshCw size={14} /> Retry
                    </button>
                </div>
            )}

            {!error && clients.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center">
                        <Users size={22} className="text-purple-300" />
                    </div>
                    <p className="text-sm font-medium text-purple-400">No active patients</p>
                    <p className="text-xs text-purple-300">Accept pending requests to see patients here.</p>
                    <button
                        onClick={() => navigate("/therapist/clients/pending")}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition">
                        View pending requests
                    </button>
                </div>
            )}

            {!error && clients.length > 0 && filteredClients.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center">
                        <Search size={22} className="text-purple-300" />
                    </div>
                    <p className="text-sm font-medium text-purple-400">No results for "{searchQuery}"</p>
                    <p className="text-xs text-purple-300">Try a different name or username.</p>
                </div>
            )}

            {!error && filteredClients.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map(client => (
                        <ClientCard
                            key={client.client_id}
                            client={client}
                            onViewJournal={(id) => navigate("/therapist/clients/" + id + "/journal")}
                            onViewExercises={(id) => navigate("/therapist/exercises")}
                            onViewQuiz={(id) => navigate("/therapist/clients/" + id + "/quiz")}
                            onViewProgress={(id) => navigate("/therapist/progress")}
                            onEndRelationship={handleEndRelationship}
                            isEndLoading={endLoading === client.client_id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}