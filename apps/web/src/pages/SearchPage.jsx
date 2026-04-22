import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchForm from "../components/SearchForm";
import { searchFlights } from "../api/flights";

export default function SearchPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(form) {
    setLoading(true);
    setError("");

    try {
      const data = await searchFlights(form);

      navigate("/results", {
        state: {
          offers: data.offers || [],
          search: form,
        },
      });
    } catch (err) {
      setError(err.message || "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h1>Utravel</h1>
      <p>Sök flyg</p>

      <SearchForm onSearch={handleSearch} loading={loading} />

      {error && (
        <pre style={{ color: "red", marginTop: 16, whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      )}
    </div>
  );
}