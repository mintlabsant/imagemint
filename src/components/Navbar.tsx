import { Link } from 'react-router-dom'
import '../styles/navbar.css'

const navLinks = [
  { label: 'Tools', href: '/tools' },
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
]

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar__inner">

        <Link to="/" className="navbar__logo">
          ImageMint
        </Link>

        <div className="navbar__right">

          <div className="navbar__mintlabs">
            <span className="navbar__mintlabs-dot" />
            A Mint Labs Product
          </div>

          <nav aria-label="Main navigation">
            <ul className="navbar__nav">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="navbar__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <button
            className="navbar__theme-toggle"
            type="button"
            aria-label="Toggle dark mode"
          >
            ◐
          </button>

        </div>
      </div>
    </header>
  )
}