import '../styles/hero.css'

export default function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-heading">

      <div className="mint-leaf-animation" aria-hidden="true">
        <span className="mint-leaf">🍃</span>
      </div>

      <div className="container hero__content">

        <h1 id="hero-heading" className="hero__headline">
  Powerful Image tools. Made simple.
</h1>

        <p className="hero__description">
          Compress, resize, convert, crop and edit your images
          directly in your browser.
        </p>

        <p className="hero__supporting">
          No sign-up. No unnecessary uploads. No complicated software.
        </p>

        <div className="hero__actions">

          <a href="#upload" className="btn btn--primary hero__upload-button">
            <span className="hero__button-icon">↑</span>
            Start Using ImageMint
          </a>

          <a href="#tools" className="btn btn--secondary">
            Explore Tools
          </a>

        </div>

        <p className="hero__tagline">
          FAST. FREE. PRIVATE.
        </p>

      </div>
    </section>
  )
}