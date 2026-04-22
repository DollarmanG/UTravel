import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getBooking } from '../api/flights';

function formatBookingAmount(amount, currency) {
  if (amount == null || !currency) return '-';

  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(Number(amount) / 100);
}

function getStatusLabel(status) {
  if (status === 'pending_payment') return 'Bekräftar din bokning...';
  if (status === 'confirmed_test_only') return 'Bokning bekräftad (testläge)';
  if (status === 'confirmed') return 'Bokning bekräftad';
  if (status === 'order_failed') return 'Bokningen kunde inte bekräftas';
  return status || '-';
}

export default function SuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = useMemo(() => params.get('session_id'), [params]);

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(sessionId ? '' : 'Ingen session_id hittades');
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let intervalId;

    async function fetchBooking() {
      try {
        const data = await getBooking(sessionId);

        if (cancelled) return;

        setBooking(data);
        setLoading(false);

        if (
          data.status === 'confirmed_test_only' ||
          data.status === 'confirmed' ||
          data.status === 'order_failed'
        ) {
          clearInterval(intervalId);
        }
      } catch (err) {
        if (cancelled) return;

        setError(err.message || 'Kunde inte hämta bokning');
        setLoading(false);
        clearInterval(intervalId);
      }
    }

    fetchBooking();
    intervalId = setInterval(fetchBooking, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 20, color: 'white' }}>
        <h1>Hämtar bokning...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 20, color: 'white' }}>
        <h1>Något gick fel</h1>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{error}</pre>
        <button onClick={() => navigate('/')}>Till startsidan</button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 820,
        margin: '40px auto',
        padding: 20,
        color: 'white',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 20,
            fontSize: 48,
            lineHeight: 1.1,
          }}
        >
          Bokningsstatus
        </h1>

        <div style={{ display: 'grid', gap: 12, fontSize: 20 }}>
          <p style={{ margin: 0 }}>
            <strong>Status:</strong> {getStatusLabel(booking?.status)}
          </p>

          <p style={{ margin: 0 }}>
            <strong>Email:</strong> {booking?.customer_email || '-'}
          </p>

          <p style={{ margin: 0 }}>
            <strong>Belopp:</strong>{' '}
            {formatBookingAmount(booking?.amount, booking?.currency)}
          </p>

          {booking?.duffel_order_id && (
            <p style={{ margin: 0 }}>
              <strong>Duffel order:</strong> {booking.duffel_order_id}
            </p>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#1d4ed8',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 18px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Till startsidan
          </button>
        </div>
      </div>
    </div>
  );
}