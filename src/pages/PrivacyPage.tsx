import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

type PrivacyPageProps = {
  darkMode: boolean
  onToggleDarkMode: () => void
}

export default function PrivacyPage({
  darkMode,
  onToggleDarkMode,
}: PrivacyPageProps) {
  return (
    <>
      <Navbar darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

      <main className="page">
        <section className="page-hero">
          <div className="container">
            <p className="page-hero__eyebrow">ImageMint Privacy</p>

            <h1>Privacy comes first.</h1>

            <p>
              ImageMint is designed to process images directly in your
              browser whenever possible.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container page-content">
            <h2>Local processing</h2>

            <p>
              Whenever a tool can operate entirely in your browser, your
              image can be processed locally on your device instead of being
              uploaded to a server.
            </p>

            <h2>No unnecessary accounts</h2>

            <p>
              ImageMint does not require an account simply to use its basic
              image tools.
            </p>

            <h2>No unnecessary uploads</h2>

            <p>
              We aim to avoid uploading your files whenever the tool can
              perform its work locally.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}