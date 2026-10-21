import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import Logo from "./Logo.jsx";

const icon = (d) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const NAV = [
  { to: "/", label: "Overview", end: true, d: "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { to: "/transfer", label: "Transfer", d: "M4 8h14m0 0-4-4m4 4-4 4M20 16H6m0 0 4-4m-4 4 4 4" },
  { to: "/activity", label: "Activity", d: "M4 6h16M4 12h10M4 18h7" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = user?.isAdmin
    ? [...NAV, { to: "/admin", label: "Bank admin", d: "M12 3 3 8h18zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" }]
    : NAV;

  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition ${
      isActive ? "bg-paper text-forest-900" : "text-paper/70 hover:bg-forest-800 hover:text-paper"}`;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="grain sticky top-0 z-20 flex items-center justify-between bg-forest-900 px-4 py-3 lg:h-dvh lg:flex-col lg:items-stretch lg:justify-start lg:px-5 lg:py-8">
        <Logo light className="lg:px-3" />
        <nav className="hidden lg:mt-12 lg:flex lg:flex-col lg:gap-1">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={link}>{icon(n.d)}{n.label}</NavLink>
          ))}
        </nav>
        <div className="hidden lg:mt-auto lg:block">
          <div className="rounded-2xl bg-forest-800/70 p-4 text-paper">
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="truncate text-xs text-paper/60">{user.email}</p>
            <button onClick={() => { logout(); navigate("/"); }} className="mt-3 text-xs font-semibold text-copper-200 hover:text-copper-100">
              Sign out →
            </button>
          </div>
          <p className="mt-4 px-1 text-[11px] leading-relaxed text-paper/40">
            Educational simulation. No real money moves here.
          </p>
        </div>
        <button onClick={() => { logout(); navigate("/"); }} className="text-sm font-medium text-copper-200 lg:hidden">Sign out</button>
      </aside>

      <main className="pb-28 lg:pb-12">
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8 lg:pt-10">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-full bg-forest-900/95 p-1.5 shadow-xl backdrop-blur lg:hidden">
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-medium ${isActive ? "bg-paper text-forest-900" : "text-paper/70"}`}>
            {icon(n.d)}{n.label.replace("Bank admin", "Admin")}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
