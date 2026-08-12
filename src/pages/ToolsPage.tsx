import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PopularToolsSection from '../sections/PopularToolsSection'

export default function ToolsPage() {
  return (
    <>
      <Navbar />

      <main className="page">
        <section className="page-hero">
          <div className="container">
            <p className="page-hero__eyebrow">ImageMint Tools</p>

            <h1>Image tools. Made simple.</h1>

            <p>
              Compress, resize, convert, crop and edit your images directly
              in your browser.
            </p>
          </div>
        </section>

        <PopularToolsSection />
      </main>

      <Footer />
    </>
  )
}