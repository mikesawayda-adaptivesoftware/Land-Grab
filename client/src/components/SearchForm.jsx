import { useRef, useState } from 'react';

const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 150, 200];

export default function SearchForm({ onSearch, loading }) {
  const zipRef = useRef(null);
  const radiusRef = useRef(null);
  const [zipError, setZipError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const zip = (zipRef.current?.value || '').trim();
    const radius = parseInt(radiusRef.current?.value || '50', 10);

    if (!/^\d{5}$/.test(zip)) {
      setZipError('Enter a valid 5-digit US zip code.');
      zipRef.current?.focus();
      return;
    }
    setZipError('');
    onSearch({ zip, radiusMiles: radius });
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-row">
        <div className="field-group">
          <label htmlFor="zip">Zip Code</label>
          <input
            id="zip"
            ref={zipRef}
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="e.g. 62701"
            className={zipError ? 'input-error' : ''}
            onChange={() => zipError && setZipError('')}
            disabled={loading}
          />
          {zipError && <span className="error-msg">{zipError}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="radius">Search Radius</label>
          <select id="radius" ref={radiusRef} defaultValue={50} disabled={loading}>
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} miles
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? (
            <span className="btn-inner">
              <span className="spinner" />
              Searching…
            </span>
          ) : (
            <span className="btn-inner">🔍 Search</span>
          )}
        </button>
      </div>
    </form>
  );
}
