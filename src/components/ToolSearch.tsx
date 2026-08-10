import { SearchIcon } from './icons/ToolIcons'
import '../styles/tool-search.css'

export default function ToolSearch() {
  return (
    <div className="tool-search">
      <div className="container">
        <label htmlFor="tool-search-input" className="visually-hidden">
          Search image tools
        </label>
        <div className="tool-search__wrapper">
          <SearchIcon className="tool-search__icon" />
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
    </div>
  )
}
