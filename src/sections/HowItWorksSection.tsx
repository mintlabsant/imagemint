import StepItem from '../components/StepItem'
import '../styles/how-it-works.css'

const steps = [
  { number: 1, title: 'Upload', description: 'Drop or select your image.' },
  { number: 2, title: 'Process', description: 'Adjust and apply changes.' },
  { number: 3, title: 'Download', description: 'Save your result instantly.' },
]

export default function HowItWorksSection() {
  return (
    <section
      className="section section--compact how-it-works"
      aria-labelledby="how-it-works-heading"
    >
      <div className="container">
        <header className="section-header section-header--compact">
          <h2 id="how-it-works-heading">How It Works</h2>
        </header>
        <div className="how-it-works__steps">
          {steps.map((step) => (
            <StepItem
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
