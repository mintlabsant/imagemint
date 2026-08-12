import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__content">
        <div className="footer__brand-row">
          <p className="footer__brand">ImageMint</p>

          <span className="footer__mint-badge">
            <span
              className="footer__mint-dot"
              aria-hidden="true"
            />
            Mint Labs
          </span>
        </div>

        <p className="footer__description">
          Fast, free and private image tools that work directly
          in your browser.
        </p>

        <p className="footer__tagline">
          Fast. Free. Private.
        </p>

        <div className="footer__links">
          <a href="#tools">Tools</a>
          <a href="#why-imagemint">About</a>
          <a href="#privacy">Privacy</a>
        </div>

        <p className="footer__credit">
          Built with care by Mint Labs.
        </p>

        <p className="footer__copyright">
          © 2026 Mint Labs
        </p>

        <p className="footer__product">
          A Mint Labs Product
        </p>
      </div>
    </footer>
  );
}