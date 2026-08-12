import type { ReactNode } from "react";
import "../styles/tool-card.css";

type ToolCardProps = {
  icon: ReactNode;
  title: string;
};

export default function ToolCard({
  icon,
  title,
}: ToolCardProps) {
  return (
    <article className="tool-card">
      <div
        className="tool-card__icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="tool-card__content">
        <h3 className="tool-card__title">
          {title}
        </h3>

        <span className="tool-card__action">
          Open Tool
          <span aria-hidden="true"> →</span>
        </span>
      </div>
    </article>
  );
}