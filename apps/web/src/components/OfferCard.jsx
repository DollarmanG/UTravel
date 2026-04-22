export default function OfferCard({ offer, onSelect }) {
  const firstSlice = offer.slices?.[0];
  const firstSegment = firstSlice?.segments?.[0];
  const lastSegment =
    firstSlice?.segments?.[firstSlice.segments.length - 1];

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <p>
        <strong>Pris:</strong> {offer.total_amount} {offer.total_currency}
      </p>

      <p>
        <strong>Utgår:</strong> {offer.expires_at}
      </p>

      {firstSegment && (
        <>
          <p>
            <strong>Från:</strong> {firstSegment.origin?.iata_code}
          </p>
          <p>
            <strong>Till:</strong> {lastSegment?.destination?.iata_code}
          </p>
          <p>
            <strong>Avgång:</strong> {firstSegment.departing_at}
          </p>
          <p>
            <strong>Ankomst:</strong> {lastSegment?.arriving_at}
          </p>
        </>
      )}

      <button style={{ marginTop: 12 }} onClick={() => onSelect(offer)}>
        Välj denna resa
      </button>
    </div>
  );
}