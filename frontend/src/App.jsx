import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Need from "./pages/Need";
import Offer from "./pages/Offer";
import Matches from "./pages/Matches";
import GroupDashboard from "./pages/GroupDashboard";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/need" element={<Need />} />
          <Route path="/offer" element={<Offer />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/group" element={<GroupDashboard />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
          <Route path="/chat" element={<Chat />} />

        </Routes>
      </div>
    </BrowserRouter>
  );
}
