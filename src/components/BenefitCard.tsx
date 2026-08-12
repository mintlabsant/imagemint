import type { ReactNode } from "react";
import "../styles/benefit-card.css";

type BenefitCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export default function BenefitCard({
  icon,
  title,
  description,
}: BenefitCardProps) {
  return (
    <article className="benefit-card">
      <div
        className="benefit-card__icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="benefit-card__content">
        <h3 className="benefit-card__title">
          {title}
        </h3>

        <p className="benefit-card__description">
          {description}
        </p>
      </div>
    </article>
  );
}