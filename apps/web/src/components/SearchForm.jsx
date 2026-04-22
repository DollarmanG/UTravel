import { useState } from "react";

export default function SearchForm({ onSearch, loading }) {
  const [form, setForm] = useState({
    origin: "ARN",
    destination: "JED",
    departure_date: "",
    return_date: "",
    adults: 1,
  });

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(form);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <input
        placeholder="From (ex ARN)"
        value={form.origin}
        onChange={(e) =>
          setForm({ ...form, origin: e.target.value.toUpperCase() })
        }
      />

      <input
        placeholder="To (ex JED)"
        value={form.destination}
        onChange={(e) =>
          setForm({ ...form, destination: e.target.value.toUpperCase() })
        }
      />

      <input
        type="date"
        value={form.departure_date}
        onChange={(e) =>
          setForm({ ...form, departure_date: e.target.value })
        }
        required
      />

      <input
        type="date"
        value={form.return_date}
        onChange={(e) => setForm({ ...form, return_date: e.target.value })}
      />

      <input
        type="number"
        min="1"
        value={form.adults}
        onChange={(e) =>
          setForm({ ...form, adults: Number(e.target.value) })
        }
      />

      <button type="submit" disabled={loading}>
        {loading ? "Söker..." : "Sök flyg"}
      </button>
    </form>
  );
}