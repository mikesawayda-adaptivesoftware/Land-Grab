import { useState, useCallback, useMemo } from 'react';
import { searchListings } from './api/search.js';
import SearchForm from './components/SearchForm.jsx';
import SortControls from './components/SortControls.jsx';
import FilterControls, { EMPTY_FILTERS } from './components/FilterControls.jsx';
import ListingCard from './components/ListingCard.jsx';

const DEFAULT_SORT_BY = 'pricePerAcre';
const DEFAULT_SORT_DIR = 'asc';

/** Sort a listings array by field. Nulls always sort last. */
function sortListings(listings, sortBy, sortDir) {
  const dir = sortDir === 'desc' ? -1 : 1;
  return [...listings].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return dir * (av < bv ? -1 : av > bv ? 1 : 0);
  });
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // rawListings holds the unmodified data from the API — never re-fetched just to re-sort/filter
  const [rawListings, setRawListings] = useState(null);
  const [meta, setMeta] = useState(null); // { usingMockData, location, zip, radiusMiles }
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortDir, setSortDir] = useState(DEFAULT_SORT_DIR);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const handleSearch = useCallback(async ({ zip, radiusMiles }) => {
    setLoading(true);
    setError(null);
    // Reset sort and filters to defaults on a new search
    setSortBy(DEFAULT_SORT_BY);
    setSortDir(DEFAULT_SORT_DIR);
    setFilters(EMPTY_FILTERS);
    try {
      const data = await searchListings({ zip, radiusMiles });
      setRawListings(data.listings ?? []);
      setMeta({ usingMockData: data.usingMockData, location: data.location, zip, radiusMiles });
    } catch (err) {
      setError(err.message);
      setRawListings(null);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sort/filter happen entirely in the browser — no API call needed
  function handleSortChange({ sortBy: newSortBy, sortDir: newSortDir }) {
    setSortBy(newSortBy);
    setSortDir(newSortDir);
  }

  // Apply filters then sort — all client-side
  const listings = useMemo(() => {
    if (!rawListings) return [];

    const minAcres    = filters.minAcres    !== '' ? parseFloat(filters.minAcres)    : null;
    const maxAcres    = filters.maxAcres    !== '' ? parseFloat(filters.maxAcres)    : null;
    const minPrice    = filters.minPrice    !== '' ? parseFloat(filters.minPrice)    : null;
    const maxPrice    = filters.maxPrice    !== '' ? parseFloat(filters.maxPrice)    : null;
    const minDistance = filters.minDistance !== '' ? parseFloat(filters.minDistance) : null;
    const maxDistance = filters.maxDistance !== '' ? parseFloat(filters.maxDistance) : null;

    const filtered = rawListings.filter((l) => {
      if (minAcres    != null && (l.acreage      == null || l.acreage      < minAcres))    return false;
      if (maxAcres    != null && (l.acreage      == null || l.acreage      > maxAcres))    return false;
      if (minPrice    != null && (l.price        == null || l.price        < minPrice))    return false;
      if (maxPrice    != null && (l.price        == null || l.price        > maxPrice))    return false;
      if (minDistance != null && (l.distanceMiles == null || l.distanceMiles < minDistance)) return false;
      if (maxDistance != null && (l.distanceMiles == null || l.distanceMiles > maxDistance)) return false;
      return true;
    });

    return sortListings(filtered, sortBy, sortDir);
  }, [rawListings, sortBy, sortDir, filters]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1>🌾 LandGrab</h1>
          <p className="tagline">Find land for sale near any US zip code</p>
        </div>
      </header>

      <main className="app-main">
        <section className="search-section">
          <SearchForm onSearch={handleSearch} loading={loading} />
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {meta?.usingMockData && (
          <div className="mock-banner" role="status">
            <strong>Demo mode:</strong> Showing sample data. Add your RapidAPI key in{' '}
            <code>.env</code> to see real listings.
          </div>
        )}

        {rawListings && (
          <section className="results-section">
            <SortControls
              sortBy={sortBy}
              sortDir={sortDir}
              onChange={handleSortChange}
              total={listings.length}
            />

            <FilterControls
              filters={filters}
              onChange={setFilters}
              totalRaw={rawListings.length}
              totalFiltered={listings.length}
            />

            {listings.length === 0 ? (
              <div className="no-results">
                <p>No land listings found within {meta?.radiusMiles} miles of {meta?.zip}.</p>
                <p>Try increasing the search radius.</p>
              </div>
            ) : (
              <div className="listings-grid">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </section>
        )}

        {!rawListings && !loading && !error && (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <p>Enter a zip code and radius above to start searching for land.</p>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Searching for land listings…</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Listings via{' '}
          <a href="https://rapidapi.com/oneapiproject/api/zllw-working-api" target="_blank" rel="noopener noreferrer">
            Zillow (ZLLW API)
          </a>{' '}
          · Geocoding via{' '}
          <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noopener noreferrer">
            Nominatim / OpenStreetMap
          </a>
        </p>
      </footer>
    </div>
  );
}

