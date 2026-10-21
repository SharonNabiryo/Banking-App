import { useState } from "react";
import TransactionList from "../components/TransactionList.jsx";
import { EmptyState, Spinner } from "../components/ui.jsx";
import { useApi } from "../lib/useApi.js";

const FILTERS = [
  ["", "All"],
  ["deposit,coins,transfer_in,interest", "Money in"],
  ["withdrawal,atm,transfer_out", "Money out"],
  ["transfer_in,transfer_out", "Transfers"],
  ["interest", "Interest"],
];
const PAGE = 20;

export default function Activity() {
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(0);
  const { data, loading } = useApi(`/transactions?limit=${PAGE}&offset=${page * PAGE}${kind ? `&kind=${kind}` : ""}`);
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-5xl sm:text-6xl">Activity</h1>
        <p className="mt-1 text-muted">Every transaction across all of your accounts.</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([k, label]) => (
          <button key={label} onClick={() => { setKind(k); setPage(0); }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${kind === k ? "bg-forest-900 text-paper" : "border border-line bg-card hover:border-copper-400"}`}>
            {label}
          </button>
        ))}
      </div>
      <section className="panel p-6">
        {loading && !data ? <Spinner className="h-6 w-6 text-copper-500" /> :
          data?.transactions.length ? <TransactionList transactions={data.transactions} showAccount /> :
          <EmptyState title="No transactions">Try a different filter.</EmptyState>}
        {total > PAGE && (
          <div className="mt-4 flex items-center justify-between">
            <button className="btn-ghost py-2" disabled={page === 0} onClick={() => setPage(page - 1)}>Newer</button>
            <span className="text-xs text-muted">Page {page + 1} of {Math.ceil(total / PAGE)}</span>
            <button className="btn-ghost py-2" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(page + 1)}>Older</button>
          </div>
        )}
      </section>
    </div>
  );
}
