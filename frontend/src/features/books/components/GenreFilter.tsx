import type { ChangeEvent } from "react";
import type { Genre } from "@/features/books/types";
import { GENRE_OPTIONS } from "@/features/books/utils/searchFilters";
import Select from "@/shared/components/ui/Select";

interface GenreFilterProps {
  value: Genre | "";
  onChange: (value: Genre | "") => void;
}

function GenreFilter({ value, onChange }: GenreFilterProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value as Genre | "");
  }

  return (
    <div>
      <label htmlFor="filter-genre" className="mb-1.5 block text-sm font-medium text-parchment">
        Genre
      </label>
      <Select id="filter-genre" value={value} onChange={handleChange}>
        <option value="">All Genres</option>
        {GENRE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export default GenreFilter;