const EMPTY_FILTERS = {
  minAcres: '',
  maxAcres: '',
  minPrice: '',
  maxPrice: '',
  minDistance: '',
  maxDistance: '',
};

export { EMPTY_FILTERS };

/**
 * Check whether any filter is active.
 */
export function hasActiveFilters(filters) {
  return Object.values(filters).some((v) => v !== '');
}

export default function FilterControls({ filters, onChange, totalRaw, totalFiltered }) {
  function handleChange(e) {
    const { name, value } = e.target;
    // Only allow non-negative numbers
    if (value !== '' && (isNaN(value) || parseFloat(value) < 0)) return;
    onChange({ ...filters, [name]: value });
  }

  function handleClear() {
    onChange({ ...EMPTY_FILTERS });
  }

  const active = hasActiveFilters(filters);
  const hiddenCount = totalRaw - totalFiltered;

  return (
    <div className={`filter-controls${active ? ' filter-controls--active' : ''}`}>
      <div className="filter-header">
        <span className="filter-title">Filters</span>
        {active && (
          <span className="filter-status">
            Showing {totalFiltered.toLocaleString()} of {totalRaw.toLocaleString()}
            {hiddenCount > 0 && ` (${hiddenCount.toLocaleString()} hidden)`}
          </span>
        )}
        {active && (
          <button type="button" className="filter-clear-btn" onClick={handleClear}>
            Clear all
          </button>
        )}
      </div>

      <div className="filter-grid">
        {/* Acres */}
        <div className="filter-group">
          <span className="filter-group-label">Acreage</span>
          <div className="filter-range">
            <input
              type="number"
              name="minAcres"
              value={filters.minAcres}
              onChange={handleChange}
              placeholder="Min"
              min="0"
              step="0.1"
              aria-label="Minimum acres"
              className={filters.minAcres !== '' ? 'filter-input--set' : ''}
            />
            <span className="filter-sep">–</span>
            <input
              type="number"
              name="maxAcres"
              value={filters.maxAcres}
              onChange={handleChange}
              placeholder="Max"
              min="0"
              step="0.1"
              aria-label="Maximum acres"
              className={filters.maxAcres !== '' ? 'filter-input--set' : ''}
            />
            <span className="filter-unit">ac</span>
          </div>
        </div>

        {/* Price */}
        <div className="filter-group">
          <span className="filter-group-label">Price</span>
          <div className="filter-range">
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleChange}
              placeholder="Min"
              min="0"
              step="1000"
              aria-label="Minimum price"
              className={filters.minPrice !== '' ? 'filter-input--set' : ''}
            />
            <span className="filter-sep">–</span>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleChange}
              placeholder="Max"
              min="0"
              step="1000"
              aria-label="Maximum price"
              className={filters.maxPrice !== '' ? 'filter-input--set' : ''}
            />
            <span className="filter-unit">$</span>
          </div>
        </div>

        {/* Distance */}
        <div className="filter-group">
          <span className="filter-group-label">Distance</span>
          <div className="filter-range">
            <input
              type="number"
              name="minDistance"
              value={filters.minDistance}
              onChange={handleChange}
              placeholder="Min"
              min="0"
              step="1"
              aria-label="Minimum distance in miles"
              className={filters.minDistance !== '' ? 'filter-input--set' : ''}
            />
            <span className="filter-sep">–</span>
            <input
              type="number"
              name="maxDistance"
              value={filters.maxDistance}
              onChange={handleChange}
              placeholder="Max"
              min="0"
              step="1"
              aria-label="Maximum distance in miles"
              className={filters.maxDistance !== '' ? 'filter-input--set' : ''}
            />
            <span className="filter-unit">mi</span>
          </div>
        </div>
      </div>
    </div>
  );
}

