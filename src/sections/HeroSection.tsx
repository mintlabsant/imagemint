import '../styles/hero.css'

export default function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container hero__content">
        <h1 id="hero-heading" className="hero__headline">
          ImageMint
        </h1>
        <p className="hero__lead">Powerful browser-based image tools.</p>
        <p className="hero__subheadline">
          Compress, convert, resize and edit images in seconds.
        </p>
        <div className="hero__actions">
          <a href="#upload" className="btn btn--primary">
            Upload Image
          </a>
        </div>
      </div>
    </section>
  )
}
