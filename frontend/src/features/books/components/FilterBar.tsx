import type { Genre } from "@/features/books/types";
import Button from "@/shared/components/ui/Button";
import GenreFilter from "./GenreFilter";
import SearchBar from "./SearchBar";

interface FilterBarProps {
  title: string;
  author: string;
  genre: Genre | "";
  onTitleChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onGenreChange: (value: Genre | "") => void;
  onReset: () => void;
  isFiltered?: boolean;
}

function FilterBar({
  title,
  author,
  genre,
  onTitleChange,
  onAuthorChange,
  onGenreChange,
  onReset,
  isFiltered = true,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      <SearchBar
        title={title}
        author={author}
        onTitleChange={onTitleChange}
        onAuthorChange={onAuthorChange}
      />
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-full sm:w-56">
          <GenreFilter value={genre} onChange={onGenreChange} />
        </div>
        {isFiltered && (
          <Button variant="ghost" onClick={onReset}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
