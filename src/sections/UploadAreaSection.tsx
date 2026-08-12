import { UploadIcon } from "../components/icons/ToolIcons";
import "../styles/upload-area.css";

export default function UploadAreaSection() {
  return (
    <section
      id="upload"
      className="upload-area-section"
      aria-labelledby="upload-heading"
    >
      <div className="container">
        <div
          className="upload-area"
          role="region"
          aria-label="Image upload"
        >
          <div
            className="upload-area__icon"
            aria-hidden="true"
          >
            <UploadIcon />
          </div>

          <h2
            id="upload-heading"
            className="upload-area__headline"
          >
            Drop an image here
          </h2>

          <p className="upload-area__browse">
            or{" "}
            <span className="upload-area__browse-link">
              Browse Files
            </span>
          </p>

          <p className="upload-area__privacy">
            Your images stay on your device whenever possible.
          </p>

          <p className="upload-area__formats">
            JPG &bull; PNG &bull; WEBP &bull; GIF &bull; SVG
          </p>
        </div>
      </div>
    </section>
  );
}