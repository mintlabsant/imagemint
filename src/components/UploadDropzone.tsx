import { useRef, useState } from 'react'
import '../styles/upload-dropzone.css'

type UploadDropzoneProps = {
  accept?: string
  multiple?: boolean
  onFilesSelected: (files: File[]) => void
  title?: string
  browseText?: string
  helperText?: string
}

export default function UploadDropzone({
  accept = 'image/jpeg,image/png,image/webp',
  multiple = false,
  onFilesSelected,
  title = 'Drop your image here',
  browseText = 'Browse Files',
  helperText = 'JPG, PNG or WEBP',
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)

    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    if (event.target.files) {
      handleFiles(event.target.files)
    }

    event.target.value = ''
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)

    if (event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files)
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
  }

  function openFilePicker() {
    inputRef.current?.click()
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openFilePicker()
    }
  }

  return (
    <div
      className={`upload-dropzone ${
        isDragging ? 'upload-dropzone--dragging' : ''
      }`}
      onClick={openFilePicker}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Upload image"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={handleInputChange}
      />

      <div
        className="upload-dropzone__icon"
        aria-hidden="true"
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
      </div>

      <strong className="upload-dropzone__title">
        {title}
      </strong>

      <span className="upload-dropzone__browse-line">
        or{' '}
        <span className="upload-dropzone__browse">
          {browseText}
        </span>
      </span>

      <small className="upload-dropzone__helper">
        {helperText}
      </small>
    </div>
  )
}