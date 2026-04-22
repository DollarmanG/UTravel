const API_URL = import.meta.env.VITE_API_URL;

export async function searchFlights(payload) {
  const res = await fetch(`${API_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : JSON.stringify(data?.error || "Search failed")
    );
  }

  return data;
}

export async function createCheckout(payload) {
  const res = await fetch(`${API_URL}/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : JSON.stringify(data?.error || "Checkout failed")
    );
  }

  return data;
}

export async function getBooking(sessionId) {
  const res = await fetch(`${API_URL}/booking/${sessionId}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : JSON.stringify(data?.error || "Booking fetch failed")
    );
  }

  return data;
}