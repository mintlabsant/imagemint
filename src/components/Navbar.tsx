import '../styles/navbar.css'

const navLinks = [
  { label: 'Tools', href: '#tools' },
  { label: 'About', href: '#why-imagemint' },
  { label: 'Privacy', href: '#privacy' },
]

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <a href="#" className="navbar__logo">
          ImageMint
        </a>
        <nav aria-label="Main navigation">
          <ul className="navbar__nav">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="navbar__link">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
