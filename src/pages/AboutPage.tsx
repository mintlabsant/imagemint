import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="page">
        <section className="page-hero">
          <div className="container">
            <p className="page-hero__eyebrow">About ImageMint</p>

            <h1>Simple image tools for everyone.</h1>

            <p>
              ImageMint is a collection of fast, simple and privacy-focused
              image tools that work directly in your browser.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container page-content">
            <h2>Built by Mint Labs</h2>

            <p>
              ImageMint is a Mint Labs product, built with a simple idea:
              useful image tools should be easy to access without complicated
              software, unnecessary accounts or unnecessary uploads.
            </p>

            <h2>Fast. Free. Private.</h2>

            <p>
              We aim to keep ImageMint lightweight and straightforward,
              allowing you to get your work done without unnecessary friction.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}