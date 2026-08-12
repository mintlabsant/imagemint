import StepItem from "../components/StepItem";
import "../styles/how-it-works.css";

const steps = [
  {
    number: 1,
    title: "Upload",
    description: "Drop or select your image.",
  },
  {
    number: 2,
    title: "Process",
    description: "Choose a tool and make your changes.",
  },
  {
    number: 3,
    title: "Download",
    description: "Save your finished image instantly.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      className="section section--compact how-it-works"
      aria-labelledby="how-it-works-heading"
    >
      <div className="container">
        <header className="section-header section-header--compact">
          <p className="how-it-works__eyebrow">
            Simple by design
          </p>

          <h2 id="how-it-works-heading">
            How It Works
          </h2>

          <p>
            Get from your original image to your finished result
            in three simple steps.
          </p>
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
  );
}