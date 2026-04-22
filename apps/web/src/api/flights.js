const API_URL = import.meta.env.VITE_API_URL;

async function parseJsonResponse(res) {
  const raw = await res.text();

  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Ogiltigt svar från API: ${raw || 'tomt svar'}`);
  }

  if (!res.ok) {
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : JSON.stringify(data?.error || 'API request failed')
    );
  }

  return data;
}

export async function searchFlights(payload) {
  const res = await fetch(`${API_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
}

export async function createCheckout(payload) {
  const res = await fetch(`${API_URL}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
}

export async function getBooking(sessionId) {
  const res = await fetch(`${API_URL}/booking/${sessionId}`);
  return parseJsonResponse(res);
}