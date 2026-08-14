import ToolCard from "../components/ToolCard";

import {
  CompressIcon,
  ConvertIcon,
  CropIcon,
  ResizeIcon,
  RotateIcon,
  WatermarkIcon,
} from "../components/icons/ToolIcons";

import "../styles/popular-tools.css";

const tools = [
  {
    icon: <CompressIcon />,
    title: 'Compress Images',
    to: '/tools/compress',
  },
  {
    icon: <ResizeIcon />,
    title: 'Resize Images',
    to: '/tools/resize',
  },
  {
    icon: <ConvertIcon />,
    title: 'Convert Image Formats',
    to: '/tools/convert',
  },
  {
    icon: <CropIcon />,
    title: 'Crop Images',
    to: '/tools/crop',
  },
  {
    icon: <WatermarkIcon />,
    title: 'Watermark Images',
    to: '/tools/watermark',
  },
  {
    icon: <RotateIcon />,
    title: 'Rotate & Flip',
    to: '/tools/rotate',
  },
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
          <p className="popular-tools__eyebrow">
            Everything you need
          </p>

          <h2 id="tools-heading">
            Popular Image Tools
          </h2>

          <p>
            Simple tools for the image tasks you use every day.
          </p>
        </header>

        <div className="popular-tools__grid">
          {tools.map((tool) => (
            <ToolCard
              key={tool.title}
              icon={tool.icon}
              title={tool.title}
              to={tool.to}
            />
          ))}
        </div>
      </div>
    </section>
  );
}