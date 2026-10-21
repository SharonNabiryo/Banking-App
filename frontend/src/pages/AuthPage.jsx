import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { Alert, Field, Spinner } from "../components/ui.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useAction } from "../lib/useApi.js";

const FEATURES = [
  ["Open accounts", "Eight-digit numbers & four-digit PINs, generated for you."],
  ["Move money", "Deposits, withdrawals and transfers with insufficient-funds checks."],
  ["ATM & coins", "Get the $20/$10/$5 bill breakdown, or tip in a jar of change."],
];

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { run, busy, error } = useAction();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", ssn: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      if (isRegister) await register(form);
      else await login(form.email, form.password);
      navigate("/");
    });
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.1fr_1fr]">
      <section className="grain relative hidden overflow-hidden bg-forest-900 p-12 text-paper lg:flex lg:flex-col">
        <div className="absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-copper-500/25 blur-3xl" />
        <Logo light />
        <div className="relative my-auto max-w-lg">
          <h1 className="font-display text-7xl leading-[0.95]">
            Your money, <em className="text-copper-400">minted</em> fresh.
          </h1>
          <p className="mt-6 text-lg text-paper/70">
            A full-stack banking simulator built on the CSC6003 Banking Management System.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(([t, d], i) => (
              <li key={t} className="flex gap-4 animate-rise" style={{ animationDelay: `${0.1 * i}s` }}>
                <span className="money mt-0.5 text-xs text-copper-400">0{i + 1}</span>
                <div><p className="font-medium">{t}</p><p className="text-sm text-paper/60">{d}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-paper/40">Educational simulation — use fictional data only.</p>
      </section>

      <section className="flex min-h-dvh flex-col px-5 py-8 sm:px-12">
        <Logo className="lg:hidden" />
        <div className="mx-auto my-auto w-full max-w-md animate-rise py-10">
          <h2 className="font-display text-5xl">{isRegister ? "Open your membership" : "Welcome back"}</h2>
          <p className="mt-2 text-muted">
            {isRegister ? "Already a member? " : "New to Copperleaf? "}
            <Link to={isRegister ? "/" : "/register"} className="font-semibold text-copper-600 underline-offset-4 hover:underline">
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name"><input className="input" value={form.firstName} onChange={set("firstName")} required autoComplete="given-name" /></Field>
                <Field label="Last name"><input className="input" value={form.lastName} onChange={set("lastName")} required autoComplete="family-name" /></Field>
              </div>
            )}
            <Field label="Email"><input className="input" type="email" value={form.email} onChange={set("email")} required autoComplete="email" /></Field>
            <Field label="Password" hint={isRegister ? "At least 8 characters." : null}>
              <input className="input" type="password" value={form.password} onChange={set("password")} required minLength={isRegister ? 8 : undefined}
                autoComplete={isRegister ? "new-password" : "current-password"} />
            </Field>
            {isRegister && (
              <Field label="Social Security Number" hint="Test data only: 9 digits starting with 999, e.g. 999-12-3456. Stored as a keyed hash.">
                <input className="input money" value={form.ssn} onChange={set("ssn")} required inputMode="numeric" placeholder="999-00-0000" maxLength={11} />
              </Field>
            )}
            <Alert>{error}</Alert>
            <button className="btn-primary w-full py-3.5" disabled={busy}>
              {busy && <Spinner className="h-4 w-4" />}{isRegister ? "Create membership" : "Sign in"}
            </button>
          </form>
          {!isRegister && (
            <p className="mt-6 rounded-2xl bg-copper-100/60 px-4 py-3 text-xs text-copper-600">
              Demo: sign in as <b>jane@copperleaf.test</b> / <b>password123</b> — account PIN <b>1234</b>.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
