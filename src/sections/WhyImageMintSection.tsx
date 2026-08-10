import BenefitCard from '../components/BenefitCard'
import '../styles/why-imagemint.css'

const benefits = [
  {
    icon: <span className="benefit-card__emoji" aria-hidden="true">⚡</span>,
    title: 'Lightning Fast',
    description: 'Instant processing in your browser.',
  },
  {
    icon: <span className="benefit-card__emoji" aria-hidden="true">🔒</span>,
    title: 'Privacy First',
    description: 'Files stay on your device.',
  },
  {
    icon: <span className="benefit-card__emoji" aria-hidden="true">💻</span>,
    title: 'Browser Based',
    description: 'No installs or accounts needed.',
  },
  {
    icon: <span className="benefit-card__emoji" aria-hidden="true">🆓</span>,
    title: 'Free Forever',
    description: 'Every tool, always free.',
  },
]

export default function WhyImageMintSection() {
  return (
    <section
      id="why-imagemint"
      className="section why-imagemint"
      aria-labelledby="why-heading"
    >
      <div className="container">
        <header className="section-header section-header--compact">
          <h2 id="why-heading">Why ImageMint</h2>
        </header>
        <div className="why-imagemint__grid">
          {benefits.map((benefit) => (
            <BenefitCard
              key={benefit.title}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
