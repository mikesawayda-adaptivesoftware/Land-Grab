function fmt(value, opts) {
  if (value == null) return '—';
  return value.toLocaleString('en-US', opts);
}

function fmtPrice(value) {
  if (value == null) return '—';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fmtAcres(value) {
  if (value == null) return '—';
  if (value >= 100) return `${Math.round(value).toLocaleString()} ac`;
  return `${parseFloat(value.toFixed(2)).toLocaleString()} ac`;
}

function fmtDom(days) {
  if (days == null) return '—';
  if (days === 0) return 'Listed today';
  if (days === 1) return '1 day on market';
  return `${days} days on market`;
}

function fmtDistance(miles) {
  if (miles == null) return null;
  return `${miles.toFixed(1)} mi away`;
}

export default function ListingCard({ listing }) {
  const {
    address,
    city,
    state,
    price,
    acreage,
    pricePerAcre,
    propertyType,
    daysOnMarket,
    distanceMiles,
    url,
  } = listing;

  const cityState = [city, state].filter(Boolean).join(', ');

  return (
    <article className="listing-card">
      <div className="card-header">
        <div>
          <p className="card-address">{address}</p>
          {cityState && <p className="card-citystate">{cityState}</p>}
        </div>
        <span className="card-type-badge">{propertyType || 'Land'}</span>
      </div>

      <div className="card-stats">
        <div className="stat">
          <span className="stat-label">Price</span>
          <span className="stat-value price">{fmtPrice(price)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Acreage</span>
          <span className="stat-value">{fmtAcres(acreage)}</span>
        </div>
        <div className="stat highlight">
          <span className="stat-label">Price / Acre</span>
          <span className="stat-value price-per-acre">{fmtPrice(pricePerAcre)}</span>
        </div>
      </div>

      <div className="card-footer">
        <span className="card-meta">{fmtDom(daysOnMarket)}</span>
        {distanceMiles != null && (
          <span className="card-meta distance">{fmtDistance(distanceMiles)}</span>
        )}
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="card-link">
            View Listing →
          </a>
        )}
      </div>
    </article>
  );
}

