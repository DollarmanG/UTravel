function formatDateTime(value) {
  if (!value) return { time: '-', date: '-' };

  const date = new Date(value);

  return {
    time: date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    date: date.toLocaleDateString('sv-SE'),
  };
}

function formatDuration(isoDuration) {
  if (!isoDuration) return '-';

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;

  const hours = match[1] ? `${match[1]} h` : '';
  const minutes = match[2] ? `${match[2]} min` : '';

  return `${hours} ${minutes}`.trim();
}

function formatPrice(offer) {
  if (offer.display_amount_sek != null) {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(offer.display_amount_sek);
  }

  if (offer.total_amount && offer.total_currency) {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: offer.total_currency,
    }).format(Number(offer.total_amount));
  }

  return '-';
}

export default function OfferCard({ offer, onSelect }) {
  const firstSlice = offer.slices?.[0];
  const segments = firstSlice?.segments || [];

  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  const departure = formatDateTime(firstSegment?.departing_at);
  const arrival = formatDateTime(lastSegment?.arriving_at);

  const stops = Math.max(segments.length - 1, 0);
  const duration = formatDuration(firstSlice?.duration);

  const airlineName =
    offer.owner?.name || firstSegment?.operating_carrier?.name || 'Flygbolag';

  const airlineLogo = offer.owner?.logo_symbol_url;
  const displayPrice = formatPrice(offer);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {airlineLogo ? (
              <img
                src={airlineLogo}
                alt={airlineName}
                style={{
                  width: 32,
                  height: 32,
                  objectFit: 'contain',
                }}
              />
            ) : null}

            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#0f172a',
                }}
              >
                {airlineName}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: '#64748b',
                }}
              >
                {stops === 0 ? 'Direktflyg' : `${stops} stopp`}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                {departure.time}
              </div>
              <div style={{ fontSize: 14, color: '#475569' }}>
                {firstSegment?.origin?.iata_code || '-'}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                {departure.date}
              </div>
            </div>

            <div style={{ textAlign: 'center', minWidth: 120 }}>
              <div
                style={{
                  fontSize: 14,
                  color: '#64748b',
                  marginBottom: 6,
                }}
              >
                {duration}
              </div>

              <div
                style={{
                  height: 2,
                  background: '#cbd5e1',
                  position: 'relative',
                  borderRadius: 999,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#1d4ed8',
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    transform: 'translateY(-50%)',
                  }}
                />
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#1d4ed8',
                    position: 'absolute',
                    top: '50%',
                    right: 0,
                    transform: 'translateY(-50%)',
                  }}
                />
              </div>

              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>
                {stops === 0 ? 'Direkt' : `${stops} stopp`}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                {arrival.time}
              </div>
              <div style={{ fontSize: 14, color: '#475569' }}>
                {lastSegment?.destination?.iata_code || '-'}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                {arrival.date}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 13,
              color: '#64748b',
            }}
          >
            Offert giltig till:{' '}
            {offer.expires_at
              ? new Date(offer.expires_at).toLocaleString('sv-SE')
              : '-'}
          </div>
        </div>

        <div
          style={{
            minWidth: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 12,
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 14,
                color: '#64748b',
                marginBottom: 4,
              }}
            >
              Totalpris
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1,
              }}
            >
              {displayPrice}
            </div>

            {offer.display_amount_sek != null && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: '#94a3b8',
                }}
              >
                Originalpris:{' '}
                {new Intl.NumberFormat('sv-SE', {
                  style: 'currency',
                  currency: offer.total_currency,
                }).format(Number(offer.total_amount))}
              </div>
            )}
          </div>

          <button
            style={{
              background: '#1d4ed8',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 18px',
              fontWeight: 700,
              cursor: 'pointer',
              minWidth: 150,
            }}
            onClick={() => onSelect(offer)}
          >
            Välj resa
          </button>
        </div>
      </div>
    </div>
  );
}