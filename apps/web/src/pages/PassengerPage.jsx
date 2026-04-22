import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { createCheckout } from "../api/flights";

export default function PassengerPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const offer = state?.offer;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [passenger, setPassenger] = useState({
    given_name: "",
    family_name: "",
    born_on: "",
    gender: "m",
  });

  async function handleCheckout(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const passengers = [
        {
          id: "pas_1",
          type: "adult",
          given_name: passenger.given_name,
          family_name: passenger.family_name,
          born_on: passenger.born_on,
          gender: passenger.gender,
        },
      ];

      const data = await createCheckout({
        offer_id: offer.id,
        passengers,
        customer_email: email,
      });

      window.location.href = data.url;
    } catch (err) {
      alert(err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  if (!offer) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Ingen resa vald</h1>
        <button onClick={() => navigate("/")}>Till startsidan</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h1>Passageraruppgifter</h1>

      <p>
        <strong>Pris:</strong> {offer.total_amount} {offer.total_currency}
      </p>

      <form onSubmit={handleCheckout} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          placeholder="Förnamn"
          value={passenger.given_name}
          onChange={(e) =>
            setPassenger({ ...passenger, given_name: e.target.value })
          }
          required
        />

        <input
          placeholder="Efternamn"
          value={passenger.family_name}
          onChange={(e) =>
            setPassenger({ ...passenger, family_name: e.target.value })
          }
          required
        />

        <input
          type="date"
          value={passenger.born_on}
          onChange={(e) =>
            setPassenger({ ...passenger, born_on: e.target.value })
          }
          required
        />

        <select
          value={passenger.gender}
          onChange={(e) =>
            setPassenger({ ...passenger, gender: e.target.value })
          }
        >
          <option value="m">Male</option>
          <option value="f">Female</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Skickar till betalning..." : "Fortsätt till betalning"}
        </button>
      </form>
    </div>
  );
}