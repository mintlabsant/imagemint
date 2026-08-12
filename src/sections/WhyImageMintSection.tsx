import BenefitCard from "../components/BenefitCard";
import "../styles/why-imagemint.css";

const benefits = [
  {
    icon: (
      <span
        className="benefit-card__symbol"
        aria-hidden="true"
      >
        ⚡
      </span>
    ),
    title: "Lightning Fast",
    description:
      "Process images directly in your browser without unnecessary waiting.",
  },
  {
    icon: (
      <span
        className="benefit-card__symbol"
        aria-hidden="true"
      >
        🔒
      </span>
    ),
    title: "Privacy First",
    description:
      "Your images stay on your device whenever local processing is supported.",
  },
  {
    icon: (
      <span
        className="benefit-card__symbol"
        aria-hidden="true"
      >
        ◉
      </span>
    ),
    title: "Browser Based",
    description:
      "No software to install and no account required to get started.",
  },
  {
    icon: (
      <span
        className="benefit-card__symbol"
        aria-hidden="true"
      >
        ✓
      </span>
    ),
    title: "Free to Use",
    description:
      "Useful image tools without subscriptions or unnecessary barriers.",
  },
];

export default function WhyImageMintSection() {
  return (
    <section
      id="why-imagemint"
      className="section why-imagemint"
      aria-labelledby="why-heading"
    >
      <div className="container">
        <header className="section-header section-header--compact">
          <p className="why-imagemint__eyebrow">
            Built differently
          </p>

          <h2 id="why-heading">
            Why ImageMint?
          </h2>

          <p>
            Image tools designed around speed, simplicity and
            privacy.
          </p>
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
  );
}