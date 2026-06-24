import { useState, useEffect } from "react";
import { Check, X, Clock, User, RefreshCw } from "lucide-react";
import { getPendingRequests, acceptClient, rejectClient } from "../../../api/therapistDashboard";


function LoadingDots() {
    return (
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
    );
}

function formatDate(isoString)
{
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-US", {day: "numeric", month: "short", year: "numeric",});
}

function ClientRequestCard({ client, onAccept, onReject, isLoading }) 
{
    return (
        <div className="bg-white border border-purple-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                <img src={client.profile_photo} alt="Profile" className="w-full h-full object-cover rounded-full" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-purple-900 truncate">
                    {client.first_name} {client.last_name}
                </p>
                <p className="text-xs text-purple-400">@{client.username}</p>
                <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-purple-300" />
                    <p className="text-xs text-purple-300">Requested {formatDate(client.requested_at)}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => onAccept(client.client_id)} disabled={isLoading}
                    className={"flex items-center gap-1.5 px-3 py-1.5 text-white rounded-xl text-xs font-semibold transition "+ (isLoading ? "bg-green-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600")}>
                    <Check size={13} /> Accept
                </button>
                <button
                    onClick={() => onReject(client.client_id)} disabled={isLoading}
                    className={"flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition " + (isLoading ? "border-purple-100 text-purple-300 cursor-not-allowed" : "border-red-200 text-red-400 hover:bg-red-50")}>
                    <X size={13} /> Reject
                </button>
            </div>
        </div>
    );
}


export default function ClientsPendingList() 
{
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [banner, setBanner] = useState(null);

    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() 
    {
        setIsLoading(true);
        setError(null);
        try 
        {
            const data = await getPendingRequests();
            setRequests(data);
        } 
        catch (err) 
        {
            setError(err.response?.data?.error?.message || "Could not load pending requests.");
        } finally
         {
            setIsLoading(false);
        }
    }

    function showBanner(type, text) 
    {
        setBanner({ type, text });
        setTimeout(() => setBanner(null), 3000);
    }

    async function handleAccept(clientId)
    {
        setActionLoading(clientId);
        try {
            await acceptClient(clientId);
            setRequests(prev => prev.filter(r => r.client_id !== clientId));
            showBanner("success", "Patient accepted successfully.");
        } catch (err)
         {
            showBanner("error", err.response?.data?.error?.message || "Failed to accept patient.");
        } finally 
        {
            setActionLoading(null);
        }
    }

    async function handleReject(clientId) 
    {
        setActionLoading(clientId);
        try 
        {
            await rejectClient(clientId);
            setRequests(prev => prev.filter(r => r.client_id !== clientId));
            showBanner("success", "Request rejected.");
        } catch (err) 
        {
            showBanner("error", err.response?.data?.error?.message || "Failed to reject. URL may be missing in backend.");
        } finally {
            setActionLoading(null);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingDots />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-sm text-red-400">{error}</p>
                <button
                    onClick={loadRequests}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition">
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 bg-[#FCF7FF]">

            <div className="mb-5">
                <h1 className="text-xl font-semibold text-purple-900">Pending Requests</h1>
                <p className="text-xs text-purple-400 mt-0.5">
                    {requests.length > 0
                        ? requests.length + " patient" + (requests.length !== 1 ? "s" : "") + " waiting for your response."
                        : "No pending requests at the moment."}
                </p>
            </div>

            {banner && (
                <div className={"text-xs font-medium px-3 py-2 rounded-lg mb-4 "+ (banner.type === "success" ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100")}>
                    {banner.text}
                </div>
            )}

            {requests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center">
                        <User size={22} className="text-purple-300" />
                    </div>
                    <p className="text-sm font-medium text-purple-400">No pending requests</p>
                    <p className="text-xs text-purple-300">New patient requests will appear here.</p>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {requests.map(client => (
                    <ClientRequestCard
                        key={client.client_id}
                        client={client}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        isLoading={actionLoading === client.client_id}
                    />
                ))}
            </div>

        </div>
    );
}