import "../styles/step-item.css";

type StepItemProps = {
  number: number;
  title: string;
  description: string;
};

export default function StepItem({
  number,
  title,
  description,
}: StepItemProps) {
  return (
    <article className="step-item">
      <div
        className="step-item__number"
        aria-hidden="true"
      >
        {number}
      </div>

      <div className="step-item__content">
        <h3 className="step-item__title">
          {title}
        </h3>

        <p className="step-item__description">
          {description}
        </p>
      </div>
    </article>
  );
}