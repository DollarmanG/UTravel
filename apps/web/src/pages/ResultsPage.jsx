import { useLocation, useNavigate } from "react-router-dom";
import OfferCard from "../components/OfferCard";

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const offers = state?.offers || [];
  const search = state?.search;

  function handleSelectOffer(offer) {
    navigate("/passengers", {
      state: {
        offer,
        search,
      },
    });
  }

  if (!search) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Ingen sökning hittades</h2>
        <button onClick={() => navigate("/")}>Tillbaka</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <h1>Flygresultat</h1>

      <p>
        {search.origin} → {search.destination}
      </p>

      <button onClick={() => navigate("/")}>Ny sökning</button>

      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {offers.length === 0 && <p>Inga offers hittades.</p>}

        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onSelect={handleSelectOffer}
          />
        ))}
      </div>
    </div>
  );
}