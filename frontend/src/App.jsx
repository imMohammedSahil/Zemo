import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import PriceHistoryPage from "./pages/PriceHistoryPage";
import InsightsPage from "./pages/InsightsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationBell from "./components/NotificationBell";

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

function AppLayout() {

  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  // Bypassing login for user access
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Demo User", email: "demo@zemo.ai" };

  // if (!user) {
  //   return <LoginPage />;
  // }

  return (

    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}

      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">

        <h1 className="text-2xl font-bold text-blue-400">Zemo</h1>

        <div className="flex items-center gap-6 relative">

          <NotificationBell />

          {/* Profile Button */}

          <button
            onClick={() => navigate("/profile")}
            className="text-gray-300 hover:text-white text-xl"
          >
            👤
          </button>

        </div>

      </nav>

      {/* Routes */}

      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/product/:id/graph" element={<PriceHistoryPage />} />

        <Route path="/product/:id/insights" element={<InsightsPage />} />

        <Route path="/profile" element={<ProfilePage />} />

      </Routes>

    </div>

  );
}

export default App;