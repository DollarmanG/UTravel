import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OfferCard from '../components/OfferCard';

function getPriceValue(offer) {
  if (offer.display_amount_sek != null) return offer.display_amount_sek;
  return Number(offer.total_amount || 0);
}

function getDurationValue(offer) {
  const duration = offer.slices?.[0]?.duration;
  if (!duration) return Number.MAX_SAFE_INTEGER;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);

  return hours * 60 + minutes;
}

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const offers = state?.offers || [];
  const search = state?.search;

  const [sortBy, setSortBy] = useState('cheapest');

  function handleSelectOffer(offer) {
    navigate('/passengers', {
      state: {
        offer,
        search,
      },
    });
  }

  const sortedOffers = useMemo(() => {
    const copied = [...offers];

    if (sortBy === 'cheapest') {
      copied.sort((a, b) => getPriceValue(a) - getPriceValue(b));
    }

    if (sortBy === 'fastest') {
      copied.sort((a, b) => getDurationValue(a) - getDurationValue(b));
    }

    return copied;
  }, [offers, sortBy]);

  if (!search) {
    return (
      <div style={{ padding: 24, color: 'white' }}>
        <h2>Ingen sökning hittades</h2>
        <button onClick={() => navigate('/')}>Tillbaka</button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '40px auto',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: 24,
          marginBottom: 24,
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 36,
                color: '#0f172a',
              }}
            >
              Flygresultat
            </h1>

            <p
              style={{
                margin: '8px 0 0',
                color: '#475569',
                fontSize: 16,
              }}
            >
              {search.origin} → {search.destination}
              {search.departure_date ? ` · Avresa ${search.departure_date}` : ''}
              {search.return_date ? ` · Retur ${search.return_date}` : ''}
              {search.adults ? ` · ${search.adults} vuxen` : ''}
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            style={{
              background: '#e2e8f0',
              color: '#0f172a',
              border: 'none',
              borderRadius: 12,
              padding: '12px 16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Ny sökning
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ color: 'white', fontSize: 15 }}>
          {sortedOffers.length} resor hittades
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'white',
          }}
        >
          <label htmlFor="sortBy">Sortera:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #334155',
              background: '#0f172a',
              color: 'white',
            }}
          >
            <option value="cheapest">Billigast</option>
            <option value="fastest">Snabbast</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        {sortedOffers.length === 0 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: 24,
              color: '#0f172a',
            }}
          >
            Inga offers hittades.
          </div>
        )}

        {sortedOffers.map((offer) => (
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