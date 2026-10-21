import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Splash from "./components/Splash.jsx";
import { Spinner } from "./components/ui.jsx";
import { useAuth } from "./lib/auth.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import Activity from "./pages/Activity.jsx";
import Admin from "./pages/Admin.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Transfer from "./pages/Transfer.jsx";

const SPLASH_KEY = "copperleaf.splashSeen";

function seenSplash() {
  try { return sessionStorage.getItem(SPLASH_KEY) === "1"; } catch { return false; }
}

export default function App() {
  const { user, ready } = useAuth();
  const [splash, setSplash] = useState(() => !seenSplash());

  const finishSplash = () => {
    try { sessionStorage.setItem(SPLASH_KEY, "1"); } catch { /* private mode */ }
    setSplash(false);
  };

  return (
    <>
      {splash && <Splash onDone={finishSplash} />}
      {!ready ? (
        <div className="grid min-h-dvh place-items-center text-copper-500"><Spinner className="h-8 w-8" /></div>
      ) : !user ? (
        <Routes>
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="*" element={<AuthPage mode="login" />} />
        </Routes>
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts/:number" element={<AccountPage />} />
            <Route path="transfer" element={<Transfer />} />
            <Route path="activity" element={<Activity />} />
            {user.isAdmin && <Route path="admin" element={<Admin />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </>
  );
}
