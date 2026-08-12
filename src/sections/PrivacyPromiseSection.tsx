import "../styles/privacy-promise.css";

export default function PrivacyPromiseSection() {
  return (
    <section
      id="privacy"
      className="section privacy-promise"
      aria-labelledby="privacy-heading"
    >
      <div className="container">
        <div className="privacy-promise__content">
          <p className="privacy-promise__eyebrow">
            Your images stay yours
          </p>

          <h2 id="privacy-heading">
            Privacy Comes First
          </h2>

          <p className="privacy-promise__description">
            Whenever possible, ImageMint processes your images
            directly inside your browser.
          </p>

          <div className="privacy-promise__points">
            <span>No unnecessary uploads.</span>
            <span>No account required.</span>
            <span>Simple and private by design.</span>
          </div>
        </div>
      </div>
    </section>
  );
}