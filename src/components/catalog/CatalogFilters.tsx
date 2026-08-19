import type { CatalogFilters as Filters } from "../../services/movieService";

interface CatalogFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  genres: string[];
  decades: number[];
}

export function CatalogFilters({ filters, onChange, genres, decades }: CatalogFiltersProps) {
  return (
    <div className='mb-6 flex flex-wrap gap-3'>
      <input
        type='text'
        placeholder='Search by title...'
        value={filters.query ?? ""}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
        className='min-w-50 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none'
      />
      <select
        value={filters.genre ?? ""}
        onChange={(e) => onChange({ ...filters, genre: e.target.value || undefined })}
        className='rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none'
      >
        <option value=''>All genres</option>
        {genres.map((genre) => (
          <option key={genre} value={genre}>
            {genre}
          </option>
        ))}
      </select>
      <select
        value={filters.decade ?? ""}
        onChange={(e) =>
          onChange({ ...filters, decade: e.target.value ? Number(e.target.value) : undefined })
        }
        className='rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none'
      >
        <option value=''>All decades</option>
        {decades.map((decade) => (
          <option key={decade} value={decade}>
            {decade}s
          </option>
        ))}
      </select>
    </div>
  );
}
