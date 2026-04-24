import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";
import PassengerPage from "./pages/PassengerPage";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";
import FindBookingPage from "./pages/FindBookingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/passengers" element={<PassengerPage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/cancel" element={<CancelPage />} />
      <Route path="/hitta-bokning" element={<FindBookingPage />} />
    </Routes>
  );
}