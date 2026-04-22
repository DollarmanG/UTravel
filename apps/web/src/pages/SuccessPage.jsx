import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getBooking } from "../api/flights";

export default function SuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setError("Ingen session_id hittades");
      setLoading(false);
      return;
    }

    async function fetchBooking() {
      try {
        const data = await getBooking(sessionId);
        setBooking(data);
      } catch (err) {
        setError(err.message || "Kunde inte hämta bokning");
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [params]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Hämtar bokning...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Något gick fel</h1>
        <pre>{error}</pre>
        <button onClick={() => navigate("/")}>Till startsidan</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
      <h1>Bokningsstatus</h1>

      <p>
        <strong>Status:</strong> {booking?.status}
      </p>

      <p>
        <strong>Email:</strong> {booking?.customer_email}
      </p>

      <p>
        <strong>Belopp:</strong> {booking?.amount} {booking?.currency}
      </p>

      <button onClick={() => navigate("/")}>Till startsidan</button>
    </div>
  );
}