import { isLandType } from './SearchForm.jsx';

const LAND_SORT_OPTIONS = [
  { value: 'pricePerAcre',  label: 'Price per Acre' },
  { value: 'price',         label: 'Total Price' },
  { value: 'acreage',       label: 'Acreage' },
  { value: 'distanceMiles', label: 'Distance from Zip' },
  { value: 'daysOnMarket',  label: 'Days on Market' },
];

const HOUSE_SORT_OPTIONS = [
  { value: 'price',         label: 'Total Price' },
  { value: 'pricePerSqFt', label: 'Price per Sq Ft' },
  { value: 'livingArea',   label: 'Sq Footage' },
  { value: 'bedrooms',     label: 'Bedrooms' },
  { value: 'distanceMiles', label: 'Distance from Zip' },
  { value: 'daysOnMarket',  label: 'Days on Market' },
];

export const DEFAULT_SORT_FOR = (homeType) =>
  isLandType(homeType) ? 'pricePerAcre' : 'price';

export default function SortControls({ sortBy, sortDir, onChange, total, homeType }) {
  const sortOptions = isLandType(homeType) ? LAND_SORT_OPTIONS : HOUSE_SORT_OPTIONS;

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
          {sortOptions.map((opt) => (
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
