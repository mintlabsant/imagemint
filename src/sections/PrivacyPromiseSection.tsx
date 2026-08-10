import '../styles/privacy-promise.css'

export default function PrivacyPromiseSection() {
  return (
    <section
      id="privacy"
      className="section privacy-promise"
      aria-labelledby="privacy-heading"
    >
      <div className="container privacy-promise__content">
        <h2 id="privacy-heading">Privacy Comes First</h2>
        <p>
          Whenever possible, ImageMint processes files directly inside your
          browser.
        </p>
        <p>No unnecessary uploads.</p>
        <p>No account required.</p>
      </div>
    </section>
  )
}
