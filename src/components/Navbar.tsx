import "../styles/navbar.css";

const navLinks = [
  { label: "Tools", href: "#tools" },
  { label: "About", href: "#why-imagemint" },
  { label: "Privacy", href: "#privacy" },
];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <a
          href="#"
          className="navbar__logo"
          aria-label="ImageMint home"
        >
          <span className="navbar__brand">
            ImageMint

            <svg
              className="navbar__leaf"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 21c-4-1-7-5-7-10 4 0 7 3 7 7 0-4 3-7 7-7 0 5-3 9-7 10Z" />
            </svg>
          </span>
        </a>

        <nav aria-label="Main navigation">
          <ul className="navbar__nav">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="navbar__link"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}