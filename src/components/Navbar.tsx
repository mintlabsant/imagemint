import { Link } from 'react-router-dom'
import '../styles/navbar.css'

type NavbarProps = {
  darkMode: boolean
  onToggleDarkMode: () => void
}

export default function Navbar({
  darkMode,
  onToggleDarkMode,
}: NavbarProps) {
  return (
    <header className="navbar">
      <div className="container navbar__inner">

        <Link to="/" className="navbar__brand">
          ImageMint
        </Link>

        <div className="navbar__right">

          <span className="navbar__mint">
            <span className="navbar__mint-dot" />
            A Mint Labs Product
          </span>

          <nav className="navbar__links" aria-label="Main navigation">
            <Link to="/tools">Tools</Link>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>

          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleDarkMode}
            aria-label={
              darkMode
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
          >
            {darkMode ? '☾' : '☀'}
          </button>

        </div>
      </div>
    </header>
  )
}