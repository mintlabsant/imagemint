import { SearchIcon } from "./icons/ToolIcons";
import "../styles/tool-search.css";

export default function ToolSearch() {
  return (
    <section
      className="tool-search"
      aria-label="Find ImageMint tools"
    >
      <div className="container">
        <label
          htmlFor="tool-search-input"
          className="visually-hidden"
        >
          Search image tools
        </label>

        <div className="tool-search__wrapper">
          <SearchIcon
            className="tool-search__icon"
            aria-hidden="true"
          />

          <input
            id="tool-search-input"
            type="search"
            className="tool-search__input"
            placeholder="Search image tools..."
            readOnly
            aria-label="Search image tools"
          />
        </div>
      </div>
    </section>
  );
}