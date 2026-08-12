import { useEffect, useState } from 'react'
import '../styles/navbar.css'

const navLinks = [
  { label: 'Tools', href: '#tools' },
  { label: 'About', href: '#why-imagemint' },
  { label: 'Privacy', href: '#privacy' },
]

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('imagemint-theme')

    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  function toggleTheme() {
    const nextMode = !darkMode

    setDarkMode(nextMode)

    if (nextMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('imagemint-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('imagemint-theme', 'light')
    }
  }

  return (
    <header className="navbar">
      <div className="container navbar__inner">

        <a href="#" className="navbar__logo">
          ImageMint
        </a>

        <div className="navbar__center-brand">
          <span className="navbar__leaf">◆</span>
          A Mint Labs Product
        </div>

        <nav aria-label="Main navigation">
          <ul className="navbar__nav">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="navbar__link">
                  {link.label}
                </a>
              </li>
            ))}

            <li>
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={
                  darkMode
                    ? 'Switch to light theme'
                    : 'Switch to dark theme'
                }
              >
                {darkMode ? '☀' : '☾'}
              </button>
            </li>
          </ul>
        </nav>

      </div>
    </header>
  )
}