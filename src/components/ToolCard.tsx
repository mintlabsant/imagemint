import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import '../styles/tool-card.css'

type ToolCardProps = {
  icon: ReactNode
  title: string
  to: string
}

export default function ToolCard({
  icon,
  title,
  to,
}: ToolCardProps) {
  return (
    <Link to={to} className="tool-card">
      <div className="tool-card__icon">
        {icon}
      </div>

      <h3 className="tool-card__title">
        {title}
      </h3>

      <span className="tool-card__action">
        Open Tool →
      </span>
    </Link>
  )
}