import { isLandType } from './SearchForm.jsx';

function fmtPrice(value) {
  if (value == null) return '—';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fmtAcres(value) {
  if (value == null) return '—';
  if (value >= 100) return `${Math.round(value).toLocaleString()} ac`;
  return `${parseFloat(value.toFixed(2)).toLocaleString()} ac`;
}

function fmtSqft(value) {
  if (value == null) return '—';
  return `${value.toLocaleString()} ft²`;
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

function Stat({ label, value, highlight }) {
  return (
    <div className={`stat${highlight ? ' highlight' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value${highlight ? ' price-per-acre' : ''}`}>{value}</span>
    </div>
  );
}

export default function ListingCard({ listing, homeType }) {
  const {
    address,
    city,
    state,
    price,
    acreage,
    pricePerAcre,
    livingArea,
    bedrooms,
    bathrooms,
    yearBuilt,
    pricePerSqFt,
    propertyType,
    daysOnMarket,
    distanceMiles,
    url,
    photoUrl,
  } = listing;

  const cityState = [city, state].filter(Boolean).join(', ');
  const isLand = isLandType(homeType);

  return (
    <article className="listing-card">
      {photoUrl && (
        <div className="card-photo">
          <img src={photoUrl} alt={address} loading="lazy" />
        </div>
      )}

      <div className="card-header">
        <div>
          <p className="card-address">{address}</p>
          {cityState && <p className="card-citystate">{cityState}</p>}
        </div>
        <span className="card-type-badge">{propertyType || (isLand ? 'Land' : 'Home')}</span>
      </div>

      <div className="card-stats">
        <Stat label="Price" value={fmtPrice(price)} />

        {isLand ? (
          <>
            <Stat label="Acreage" value={fmtAcres(acreage)} />
            <Stat label="Price / Acre" value={fmtPrice(pricePerAcre)} highlight />
          </>
        ) : (
          <>
            <Stat label="Sq Ft" value={fmtSqft(livingArea)} />
            <Stat
              label="Beds / Baths"
              value={
                bedrooms != null || bathrooms != null
                  ? `${bedrooms ?? '—'} bd / ${bathrooms ?? '—'} ba`
                  : '—'
              }
            />
            <Stat label="Acreage" value={fmtAcres(acreage)} />
            <Stat label="Price / ft²" value={fmtPrice(pricePerSqFt)} highlight />
            {yearBuilt != null && <Stat label="Year Built" value={yearBuilt} />}
          </>
        )}
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
