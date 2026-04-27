import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";
import PassengerPage from "./pages/PassengerPage";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";
import FindBookingPage from "./pages/FindBookingPage";

import AboutPage from "./pages/AboutPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import CookiesPage from "./pages/CookiesPage";
import FaqPage from "./pages/FaqPage";
import PaymentBookingPage from "./pages/PaymentBookingPage";
import CancellationChangesPage from "./pages/CancellationChangesPage";
import ContactPage from "./pages/ContactPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/passengers" element={<PassengerPage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/cancel" element={<CancelPage />} />
      <Route path="/hitta-bokning" element={<FindBookingPage />} />

      <Route path="/om-oss" element={<AboutPage />} />
      <Route path="/resevillkor" element={<TermsPage />} />
      <Route path="/integritetspolicy" element={<PrivacyPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/vanliga-fragor" element={<FaqPage />} />
      <Route path="/betalning-bokning" element={<PaymentBookingPage />} />
      <Route path="/avbokning-andringar" element={<CancellationChangesPage />} />
      <Route path="/kontakta-oss" element={<ContactPage />} />
    </Routes>
  );
}