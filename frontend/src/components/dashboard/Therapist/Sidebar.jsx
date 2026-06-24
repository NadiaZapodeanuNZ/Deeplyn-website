import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, CalendarDays, NotebookPen, TrendingUp, Settings, ChevronFirst, X, Dumbbell, Brain } from "lucide-react";
import logo from '../../../assets/Landing/logo.svg';
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function sidebarWidth(open) 
{
  if (open) return "w-56";
  return "w-14";
}

function logoContainerClasses(open)
{
  const base = "w-9 h-9 min-w-[36px] rounded-xl bg-white flex items-center justify-center transition-all duration-200";
  if (!open) 
    return base + " cursor-pointer hover:opacity-80 hover:scale-105";
  return base + " cursor-default";
}

function navLinkClasses(isActive) {
  const base = "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors";
  if (isActive) 
    return base + " bg-white text-purple-700 font-semibold";
  return base + " text-white/80 hover:bg-white/10 hover:text-white";
}

function iconColor(isActive) 
{
  if (isActive) return "text-purple-700";
  return "text-white";
}

function NavItem({ to, Icon, label, open, onClose }) {
  return (
    <NavLink to={to} onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}>
      {({ isActive }) => (
        <>
          <Icon size={20} className={iconColor(isActive)} />
          {open && <span className="text-sm">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onClose }) 
{
  const [open, setOpen] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  function expandSidebar() 
  {
    if (!open) 
      setOpen(true);
  }

  function collapseSidebar()
  {
    setOpen(false);
  }

  async function logoutAndRedirect() 
  {
    await logout();
    navigate("/login");
  }

  return (
    <aside className={`flex flex-col h-screen flex-shrink-0 transition-all duration-300 bg-gradient-to-b from-[#7B2FF7] via-[#5A4FF5] to-[#3B82F6] ${sidebarWidth(open)}`}>
      <div className="flex items-center gap-3 px-4 py-5">
        <div
          onClick={expandSidebar}
          className={logoContainerClasses(open)}
          role={!open ? "button" : undefined}
          aria-label={!open ? "Expand sidebar" : undefined}>
          <img src={logo} alt="Logo" className="w-5 h-5" />
        </div>

        {open && (<span className="text-white font-semibold text-base whitespace-nowrap">Deeplyn</span>)}

        {open && (
          <button
            onClick={collapseSidebar}
            className="ml-auto p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition hidden lg:flex"
            aria-label="Collapse sidebar">
            <ChevronFirst size={18} />
          </button>
        )}

        <button
          onClick={onClose}
          className="ml-auto p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition lg:hidden"
          aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1 mt-1">
        <NavItem to="/therapist/dashboard" Icon={LayoutDashboard} label="Dashboard" open={open} onClose={onClose} />
        <NavItem to="/therapist/clients" Icon={Users} label="Patients" open={open} onClose={onClose} />
        <NavItem to="/therapist/sessions" Icon={CalendarDays} label="Sessions" open={open} onClose={onClose} />
        <NavItem to="/therapist/journals" Icon={NotebookPen} label="Journals" open={open} onClose={onClose} />
        <NavItem to="/therapist/exercises" Icon={Dumbbell} label="Exercises" open={open} onClose={onClose} />
        <NavItem to="/therapist/quizzes" Icon={Brain} label="Quizzes" open={open} onClose={onClose} />
        <NavItem to="/therapist/progress" Icon={TrendingUp} label="Progress" open={open} onClose={onClose} />
        <NavItem to="/therapist/profile" Icon={Settings} label="Settings" open={open} onClose={onClose} />
      </nav>

      <div className="px-3 pb-5">
        <button
          onClick={logoutAndRedirect}
          className="w-full flex items-center gap-3 rounded-xl border border-red-300 bg-white px-3 py-2.5 text-red-500 hover:text-orange-500 transition-colors">
          <LogOut className="h-4 w-4" />
          {open && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}