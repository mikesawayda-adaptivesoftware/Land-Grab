import { isLandType } from './SearchForm.jsx';

export const EMPTY_LAND_FILTERS = {
  minAcres: '',
  maxAcres: '',
  minPrice: '',
  maxPrice: '',
  minDistance: '',
  maxDistance: '',
};

export const EMPTY_HOUSE_FILTERS = {
  minPrice: '',
  maxPrice: '',
  minDistance: '',
  maxDistance: '',
  minSqft: '',
  maxSqft: '',
  minBeds: '',
  minBaths: '',
  minYearBuilt: '',
  maxYearBuilt: '',
};

/** Returns the correct empty-filter shape for a given homeType. */
export function emptyFiltersFor(homeType) {
  return isLandType(homeType) ? { ...EMPTY_LAND_FILTERS } : { ...EMPTY_HOUSE_FILTERS };
}

/** Legacy export used by existing imports in App.jsx (land default). */
export const EMPTY_FILTERS = EMPTY_LAND_FILTERS;

/**
 * Check whether any filter is active.
 */
export function hasActiveFilters(filters) {
  return Object.values(filters).some((v) => v !== '');
}

function RangeInput({ label, nameMin, nameMax, value, onChange, step, unit, placeholder }) {
  return (
    <div className="filter-group">
      <span className="filter-group-label">{label}</span>
      <div className="filter-range">
        <input
          type="number"
          name={nameMin}
          value={value[nameMin]}
          onChange={onChange}
          placeholder="Min"
          min="0"
          step={step}
          aria-label={`Minimum ${label}`}
          className={value[nameMin] !== '' ? 'filter-input--set' : ''}
        />
        <span className="filter-sep">–</span>
        <input
          type="number"
          name={nameMax}
          value={value[nameMax]}
          onChange={onChange}
          placeholder={placeholder ?? 'Max'}
          min="0"
          step={step}
          aria-label={`Maximum ${label}`}
          className={value[nameMax] !== '' ? 'filter-input--set' : ''}
        />
        {unit && <span className="filter-unit">{unit}</span>}
      </div>
    </div>
  );
}

function MinInput({ label, name, value, onChange, step, unit }) {
  return (
    <div className="filter-group">
      <span className="filter-group-label">{label}</span>
      <div className="filter-range">
        <input
          type="number"
          name={name}
          value={value[name]}
          onChange={onChange}
          placeholder="Min"
          min="0"
          step={step}
          aria-label={`Minimum ${label}`}
          className={value[name] !== '' ? 'filter-input--set' : ''}
        />
        {unit && <span className="filter-unit">{unit}</span>}
      </div>
    </div>
  );
}

export default function FilterControls({ filters, onChange, totalRaw, totalFiltered, homeType }) {
  function handleChange(e) {
    const { name, value } = e.target;
    if (value !== '' && (isNaN(value) || parseFloat(value) < 0)) return;
    onChange({ ...filters, [name]: value });
  }

  function handleClear() {
    onChange(emptyFiltersFor(homeType));
  }

  const active = hasActiveFilters(filters);
  const hiddenCount = totalRaw - totalFiltered;
  const isLand = isLandType(homeType);

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
        {/* Price — shown for all types */}
        <RangeInput
          label="Price"
          nameMin="minPrice"
          nameMax="maxPrice"
          value={filters}
          onChange={handleChange}
          step={1000}
          unit="$"
        />

        {/* Distance — shown for all types */}
        <RangeInput
          label="Distance"
          nameMin="minDistance"
          nameMax="maxDistance"
          value={filters}
          onChange={handleChange}
          step={1}
          unit="mi"
        />

        {isLand ? (
          /* Land-specific filters */
          <RangeInput
            label="Acreage"
            nameMin="minAcres"
            nameMax="maxAcres"
            value={filters}
            onChange={handleChange}
            step={0.1}
            unit="ac"
          />
        ) : (
          /* House-specific filters */
          <>
            <RangeInput
              label="Sq Footage"
              nameMin="minSqft"
              nameMax="maxSqft"
              value={filters}
              onChange={handleChange}
              step={100}
              unit="ft²"
            />
            <MinInput
              label="Bedrooms"
              name="minBeds"
              value={filters}
              onChange={handleChange}
              step={1}
              unit="bd+"
            />
            <MinInput
              label="Bathrooms"
              name="minBaths"
              value={filters}
              onChange={handleChange}
              step={0.5}
              unit="ba+"
            />
            <RangeInput
              label="Year Built"
              nameMin="minYearBuilt"
              nameMax="maxYearBuilt"
              value={filters}
              onChange={handleChange}
              step={1}
              placeholder="Max"
            />
          </>
        )}
      </div>
    </div>
  );
}
