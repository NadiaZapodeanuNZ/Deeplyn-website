import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "../Client/Sidebar";

export default function DashboardLayout({ children }) 
{
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMenuOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 lg:static lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onClose={() => setMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-purple-100 lg:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition">
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-purple-900">Deeplyn</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}