import "../styles/hero.css";

export default function HeroSection() {
  return (
    <section
      className="hero"
      aria-labelledby="hero-heading"
    >
      <div className="container hero__content">
        <div className="hero__badge" aria-label="A Mint Labs product">
          <span
            className="hero__badge-dot"
            aria-hidden="true"
          />
          A Mint Labs Product
        </div>

        <h1
          id="hero-heading"
          className="hero__headline"
        >
          Powerful Image Tools.
          <br />
          <span>Simple. Fast. Private.</span>
        </h1>

        <p className="hero__subheadline">
          Compress, resize, convert, crop and edit your
          images directly in your browser.
        </p>

        <p className="hero__privacy">
          No sign-up. No unnecessary uploads. No complicated
          software.
        </p>

        <div className="hero__actions">
          <a
            href="#upload"
            className="btn btn--primary"
          >
            Start Using ImageMint
          </a>

          <a
            href="#tools"
            className="btn btn--secondary"
          >
            Explore Tools
          </a>
        </div>

        <p className="hero__tagline">
          Fast. Free. Private.
        </p>
      </div>
    </section>
  );
}