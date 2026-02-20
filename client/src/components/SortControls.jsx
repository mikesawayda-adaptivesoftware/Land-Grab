const SORT_OPTIONS = [
  { value: 'pricePerAcre', label: 'Price per Acre' },
  { value: 'price', label: 'Total Price' },
  { value: 'acreage', label: 'Acreage' },
  { value: 'distanceMiles', label: 'Distance from Zip' },
  { value: 'daysOnMarket', label: 'Days on Market' },
];

export default function SortControls({ sortBy, sortDir, onChange, total }) {
  function handleField(e) {
    onChange({ sortBy: e.target.value, sortDir });
  }

  function handleDir(e) {
    onChange({ sortBy, sortDir: e.target.value });
  }

  return (
    <div className="sort-controls">
      <span className="result-count">
        {total} listing{total !== 1 ? 's' : ''} found
      </span>
      <div className="sort-row">
        <label htmlFor="sort-field">Sort by:</label>
        <select id="sort-field" value={sortBy} onChange={handleField}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select id="sort-dir" value={sortDir} onChange={handleDir} aria-label="Sort direction">
          <option value="asc">↑ Low → High</option>
          <option value="desc">↓ High → Low</option>
        </select>
      </div>
    </div>
  );
}

