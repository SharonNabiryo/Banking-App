import { useState } from "react";
import { Link } from "react-router-dom";
import AccountCard from "../components/AccountCard.jsx";
import BalanceChart from "../components/BalanceChart.jsx";
import OpenAccountModal from "../components/OpenAccountModal.jsx";
import TransactionList from "../components/TransactionList.jsx";
import { Alert, EmptyState, Spinner } from "../components/ui.jsx";
import { useAuth } from "../lib/auth.jsx";
import { greeting, money } from "../lib/format.js";
import { useApi } from "../lib/useApi.js";

export default function Dashboard() {
  const { user } = useAuth();
  const accounts = useApi("/accounts");
  const summary = useApi("/summary");
  const recent = useApi("/transactions?limit=6");
  const [opening, setOpening] = useState(false);

  const refresh = () => { accounts.reload(); summary.reload(); recent.reload(); };
  const list = accounts.data?.accounts || [];
  const s = summary.data;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="text-muted">{greeting()},</p>
          <h1 className="font-display text-5xl sm:text-6xl">{user.firstName}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/transfer" className="btn-ghost">Transfer</Link>
          <button onClick={() => setOpening(true)} className="btn-copper">+ Open account</button>
        </div>
      </header>

      <Alert>{accounts.error?.message || summary.error?.message}</Alert>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-6 animate-rise" style={{ animationDelay: ".05s" }}>
          <p className="text-sm text-muted">Total balance</p>
          <p className="money mt-1 text-4xl font-medium sm:text-5xl">{s ? money(s.totalBalanceCents) : "—"}</p>
          <div className="mt-6">{s && <BalanceChart series={s.series} />}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 animate-rise" style={{ animationDelay: ".1s" }}>
          <Stat label="In · 30 days" value={s && money(s.moneyInCents)} tone="text-good" />
          <Stat label="Out · 30 days" value={s && money(s.moneyOutCents)} tone="text-copper-600" />
          <Stat label="Open accounts" value={s?.openAccounts} />
          <Stat label="Transactions" value={s?.transactionCount} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-3xl">Accounts</h2>
        {accounts.loading && !accounts.data ? (
          <Spinner className="h-6 w-6 text-copper-500" />
        ) : list.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((a, i) => (
              <div key={a.number} className="animate-rise" style={{ animationDelay: `${0.05 * i}s` }}><AccountCard account={a} /></div>
            ))}
          </div>
        ) : (
          <EmptyState title="No accounts yet">
            <button onClick={() => setOpening(true)} className="btn-copper mt-4">Open your first account</button>
          </EmptyState>
        )}
      </section>

      <section className="panel p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-3xl">Recent activity</h2>
          <Link to="/activity" className="text-sm font-semibold text-copper-600 hover:underline">See all</Link>
        </div>
        {recent.data?.transactions.length ? (
          <TransactionList transactions={recent.data.transactions} showAccount />
        ) : (
          <p className="py-6 text-sm text-muted">Nothing here yet — make a deposit to get started.</p>
        )}
      </section>

      <OpenAccountModal open={opening} onClose={() => setOpening(false)} onOpened={refresh} />
    </div>
  );
}

function Stat({ label, value, tone = "" }) {
  return (
    <div className="panel flex flex-col justify-between p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className={`money mt-3 text-xl font-medium sm:text-2xl ${tone}`}>{value ?? "—"}</p>
    </div>
  );
}
