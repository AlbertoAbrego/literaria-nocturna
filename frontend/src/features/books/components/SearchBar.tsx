import type { ChangeEvent } from "react";
import Input from "@/shared/components/ui/Input";

interface SearchBarProps {
  title: string;
  author: string;
  onTitleChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
}

function SearchBar({ title, author, onTitleChange, onAuthorChange }: SearchBarProps) {
  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    onTitleChange(event.target.value);
  }

  function handleAuthorChange(event: ChangeEvent<HTMLInputElement>) {
    onAuthorChange(event.target.value);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="filter-title" className="mb-1.5 block text-sm font-medium text-parchment">
          Title
        </label>
        <Input
          id="filter-title"
          type="search"
          value={title}
          onChange={handleTitleChange}
          placeholder="Search by title"
        />
      </div>
      <div>
        <label htmlFor="filter-author" className="mb-1.5 block text-sm font-medium text-parchment">
          Author
        </label>
        <Input
          id="filter-author"
          type="search"
          value={author}
          onChange={handleAuthorChange}
          placeholder="Search by author"
        />
      </div>
    </div>
  );
}

export default SearchBar;
