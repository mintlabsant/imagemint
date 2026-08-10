import ToolCard from '../components/ToolCard'
import {
  CompressIcon,
  ConvertIcon,
  CropIcon,
  ResizeIcon,
  RotateIcon,
  WatermarkIcon,
} from '../components/icons/ToolIcons'
import '../styles/popular-tools.css'

const tools = [
  { icon: <CompressIcon />, title: 'Compress Images' },
  { icon: <ResizeIcon />, title: 'Resize Images' },
  { icon: <ConvertIcon />, title: 'Convert Image Formats' },
  { icon: <CropIcon />, title: 'Crop Images' },
  { icon: <WatermarkIcon />, title: 'Watermark Images' },
  { icon: <RotateIcon />, title: 'Rotate & Flip' },
]

export default function PopularToolsSection() {
  return (
    <section
      id="tools"
      className="section popular-tools"
      aria-labelledby="tools-heading"
    >
      <div className="container">
        <header className="section-header section-header--compact">
          <h2 id="tools-heading">Popular Tools</h2>
        </header>
        <div className="popular-tools__grid">
          {tools.map((tool) => (
            <ToolCard key={tool.title} icon={tool.icon} title={tool.title} />
          ))}
        </div>
      </div>
    </section>
  )
}
