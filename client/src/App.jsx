import { useState, useCallback, useMemo } from 'react';
import { searchListings } from './api/search.js';
import SearchForm, { LAND_HOME_TYPE, isLandType } from './components/SearchForm.jsx';
import SortControls, { DEFAULT_SORT_FOR } from './components/SortControls.jsx';
import FilterControls, { emptyFiltersFor } from './components/FilterControls.jsx';
import ListingCard from './components/ListingCard.jsx';

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
  const [meta, setMeta] = useState(null); // { usingMockData, location, zip, radiusMiles, homeType }
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_FOR(LAND_HOME_TYPE));
  const [sortDir, setSortDir] = useState(DEFAULT_SORT_DIR);
  const [filters, setFilters] = useState(emptyFiltersFor(LAND_HOME_TYPE));

  const activeHomeType = meta?.homeType ?? LAND_HOME_TYPE;

  const handleSearch = useCallback(async ({ zip, radiusMiles, homeType }) => {
    setLoading(true);
    setError(null);
    // Reset sort and filters to type-appropriate defaults on every new search
    const newSortBy = DEFAULT_SORT_FOR(homeType);
    setSortBy(newSortBy);
    setSortDir(DEFAULT_SORT_DIR);
    setFilters(emptyFiltersFor(homeType));
    try {
      const data = await searchListings({ zip, radiusMiles, homeType });
      setRawListings(data.listings ?? []);
      setMeta({
        usingMockData: data.usingMockData,
        location: data.location,
        zip,
        radiusMiles,
        homeType: data.homeType ?? homeType,
      });
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

    const isLand = isLandType(activeHomeType);

    // Common filters (all types)
    const minPrice    = filters.minPrice    !== '' ? parseFloat(filters.minPrice)    : null;
    const maxPrice    = filters.maxPrice    !== '' ? parseFloat(filters.maxPrice)    : null;
    const minDistance = filters.minDistance !== '' ? parseFloat(filters.minDistance) : null;
    const maxDistance = filters.maxDistance !== '' ? parseFloat(filters.maxDistance) : null;

    // Land-only filters
    const minAcres = isLand && filters.minAcres !== '' ? parseFloat(filters.minAcres) : null;
    const maxAcres = isLand && filters.maxAcres !== '' ? parseFloat(filters.maxAcres) : null;

    // House-only filters
    const minSqft      = !isLand && filters.minSqft      !== '' ? parseFloat(filters.minSqft)      : null;
    const maxSqft      = !isLand && filters.maxSqft      !== '' ? parseFloat(filters.maxSqft)      : null;
    const minBeds      = !isLand && filters.minBeds      !== '' ? parseFloat(filters.minBeds)      : null;
    const minBaths     = !isLand && filters.minBaths     !== '' ? parseFloat(filters.minBaths)     : null;
    const minYearBuilt = !isLand && filters.minYearBuilt !== '' ? parseFloat(filters.minYearBuilt) : null;
    const maxYearBuilt = !isLand && filters.maxYearBuilt !== '' ? parseFloat(filters.maxYearBuilt) : null;

    const filtered = rawListings.filter((l) => {
      // Common
      if (minPrice    != null && (l.price         == null || l.price         < minPrice))    return false;
      if (maxPrice    != null && (l.price         == null || l.price         > maxPrice))    return false;
      if (minDistance != null && (l.distanceMiles == null || l.distanceMiles < minDistance)) return false;
      if (maxDistance != null && (l.distanceMiles == null || l.distanceMiles > maxDistance)) return false;

      // Land
      if (minAcres != null && (l.acreage == null || l.acreage < minAcres)) return false;
      if (maxAcres != null && (l.acreage == null || l.acreage > maxAcres)) return false;

      // Houses
      if (minSqft      != null && (l.livingArea == null || l.livingArea < minSqft))      return false;
      if (maxSqft      != null && (l.livingArea == null || l.livingArea > maxSqft))      return false;
      if (minBeds      != null && (l.bedrooms   == null || l.bedrooms   < minBeds))      return false;
      if (minBaths     != null && (l.bathrooms  == null || l.bathrooms  < minBaths))     return false;
      if (minYearBuilt != null && (l.yearBuilt  == null || l.yearBuilt  < minYearBuilt)) return false;
      if (maxYearBuilt != null && (l.yearBuilt  == null || l.yearBuilt  > maxYearBuilt)) return false;

      return true;
    });

    return sortListings(filtered, sortBy, sortDir);
  }, [rawListings, sortBy, sortDir, filters, activeHomeType]);

  const searchingFor = meta
    ? (activeHomeType === LAND_HOME_TYPE ? 'land' : activeHomeType.toLowerCase()) + ' listings'
    : 'listings';

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1>🌾 LandGrab</h1>
          <p className="tagline">Find properties for sale near any US zip code</p>
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
              homeType={activeHomeType}
            />

            <FilterControls
              filters={filters}
              onChange={setFilters}
              totalRaw={rawListings.length}
              totalFiltered={listings.length}
              homeType={activeHomeType}
            />

            {listings.length === 0 ? (
              <div className="no-results">
                <p>No {searchingFor} found within {meta?.radiusMiles} miles of {meta?.zip}.</p>
                <p>Try increasing the search radius or adjusting your filters.</p>
              </div>
            ) : (
              <div className="listings-grid">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} homeType={activeHomeType} />
                ))}
              </div>
            )}
          </section>
        )}

        {!rawListings && !loading && !error && (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <p>Enter a zip code and radius above to start searching for properties.</p>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Searching for {searchingFor}…</p>
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
