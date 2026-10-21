import { Link } from "react-router-dom";
import { acct, money } from "../lib/format.js";

export default function AccountCard({ account, compact = false }) {
  const savings = account.kind === "savings";
  return (
    <Link
      to={`/accounts/${account.number}`}
      className={`grain group relative block overflow-hidden rounded-[1.75rem] p-6 text-paper shadow-[0_12px_30px_-12px_rgba(14,38,32,.5)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-16px_rgba(14,38,32,.6)] ${
        savings ? "bg-linear-to-br from-copper-500 to-copper-600" : "bg-linear-to-br from-forest-800 to-forest-950"
      } ${compact ? "min-h-40" : "min-h-48"}`}
    >
      <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full ${savings ? "bg-copper-200/25" : "bg-copper-500/20"} blur-2xl transition group-hover:scale-125`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/60">{account.kind}</p>
          <p className="mt-1 font-display text-2xl">{account.nickname}</p>
        </div>
        <svg viewBox="0 0 40 30" className="h-7 w-9 opacity-80" aria-hidden="true">
          <rect x="1" y="1" width="38" height="28" rx="6" fill="none" stroke="currentColor" strokeOpacity=".6" />
          <path d="M1 11h12M27 11h12M1 19h12M27 19h12M13 1v28M27 1v28" stroke="currentColor" strokeOpacity=".4" />
        </svg>
      </div>
      <p className="money relative mt-8 text-3xl font-medium">{money(account.balanceCents)}</p>
      <p className="money relative mt-2 text-sm tracking-[0.2em] text-paper/70">•••• {acct(account.number)}</p>
    </Link>
  );
}
