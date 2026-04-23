const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export function downloadBookingPdf(reference) {
  if (!reference) return;
  window.open(`${API_BASE_URL}/bookings/${reference}/pdf`, "_blank");
}

async function parseJsonResponse(res) {
  const raw = await res.text();

  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Ogiltigt svar från API: ${raw || "tomt svar"}`);
  }

  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : JSON.stringify(data?.error || "API request failed")
    );
  }

  return data;
}

export async function searchFlights(payload) {
  const res = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
}

export async function createCheckout(payload) {
  const res = await fetch(`${API_BASE_URL}/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
}

export async function getBooking(sessionId) {
  const res = await fetch(`${API_BASE_URL}/bookings/${sessionId}`);
  return parseJsonResponse(res);
}

export async function getPlaceSuggestions(query) {
  const res = await fetch(
    `${API_BASE_URL}/places/suggestions?q=${encodeURIComponent(query)}`
  );

  return parseJsonResponse(res);
}