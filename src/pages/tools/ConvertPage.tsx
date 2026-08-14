import { useEffect, useRef, useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import '../../styles/tools/convert.css'

type ConvertPageProps = {
  darkMode: boolean
  onToggleDarkMode: () => void
}

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp'

type ConvertedImage = {
  id: string
  originalFile: File
  originalUrl: string
  outputUrl: string | null
  outputSize: number | null
  width: number
  height: number
  status: 'ready' | 'converting' | 'done' | 'error'
  error?: string
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const FORMAT_OPTIONS: {
  value: OutputFormat
  label: string
  extension: string
}[] = [
  {
    value: 'image/jpeg',
    label: 'JPG',
    extension: 'jpg',
  },
  {
    value: 'image/png',
    label: 'PNG',
    extension: 'png',
  },
  {
    value: 'image/webp',
    label: 'WEBP',
    extension: 'webp',
  },
]

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getExtension(format: OutputFormat) {
  return FORMAT_OPTIONS.find((option) => option.value === format)?.extension ?? 'jpg'
}

function getFormatLabel(format: OutputFormat) {
  return FORMAT_OPTIONS.find((option) => option.value === format)?.label ?? 'JPG'
}

function getBaseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '')
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to read this image.'))
    }

    image.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeQuality =
      format === 'image/png'
        ? undefined
        : quality / 100

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('The browser could not create the converted image.'))
          return
        }

        resolve(blob)
      },
      format,
      mimeQuality,
    )
  })
}

export default function ConvertPage({
  darkMode,
  onToggleDarkMode,
}: ConvertPageProps) {
  const [images, setImages] = useState<ConvertedImage[]>([])
  const [outputFormat, setOutputFormat] =
    useState<OutputFormat>('image/webp')
  const [quality, setQuality] = useState(85)
  const [isDragging, setIsDragging] = useState(false)
  const [isConvertingAll, setIsConvertingAll] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      images.forEach((image) => {
        URL.revokeObjectURL(image.originalUrl)

        if (image.outputUrl) {
          URL.revokeObjectURL(image.outputUrl)
        }
      })
    }
  }, [])

  function addFiles(fileList: FileList | File[]) {
    const incomingFiles = Array.from(fileList)

    const validFiles = incomingFiles.filter((file) =>
      ACCEPTED_TYPES.includes(file.type),
    )

    if (validFiles.length === 0) {
      window.alert('Please select JPG, PNG, or WEBP images.')
      return
    }

    const newImages: ConvertedImage[] = validFiles.map((file) => ({
      id: createId(),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      outputUrl: null,
      outputSize: null,
      width: 0,
      height: 0,
      status: 'ready',
    }))

    setImages((current) => [...current, ...newImages])

    newImages.forEach(async (item) => {
      try {
        const image = await loadImage(item.originalFile)

        setImages((current) =>
          current.map((currentImage) =>
            currentImage.id === item.id
              ? {
                  ...currentImage,
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                }
              : currentImage,
          ),
        )
      } catch {
        setImages((current) =>
          current.map((currentImage) =>
            currentImage.id === item.id
              ? {
                  ...currentImage,
                  status: 'error',
                  error: 'Could not read image.',
                }
              : currentImage,
          ),
        )
      }
    })
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    if (event.target.files) {
      addFiles(event.target.files)
    }

    event.target.value = ''
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)

    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files)
    }
  }

  function removeImage(id: string) {
    setImages((current) => {
      const image = current.find((item) => item.id === id)

      if (image) {
        URL.revokeObjectURL(image.originalUrl)

        if (image.outputUrl) {
          URL.revokeObjectURL(image.outputUrl)
        }
      }

      return current.filter((item) => item.id !== id)
    })
  }

  function clearAll() {
    images.forEach((image) => {
      URL.revokeObjectURL(image.originalUrl)

      if (image.outputUrl) {
        URL.revokeObjectURL(image.outputUrl)
      }
    })

    setImages([])
  }

  async function convertImage(item: ConvertedImage) {
    setImages((current) =>
      current.map((image) =>
        image.id === item.id
          ? {
              ...image,
              status: 'converting',
              error: undefined,
            }
          : image,
      ),
    )

    try {
      const image = await loadImage(item.originalFile)

      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight

      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Canvas is not supported by this browser.')
      }

      /*
       * JPEG does not support transparency.
       * Fill the canvas with white before drawing when
       * converting to JPEG.
       */
      if (outputFormat === 'image/jpeg') {
        context.fillStyle = '#ffffff'
        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height,
        )
      }

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height,
      )

      const blob = await canvasToBlob(
        canvas,
        outputFormat,
        quality,
      )

      const outputUrl = URL.createObjectURL(blob)

      setImages((current) =>
        current.map((currentImage) => {
          if (currentImage.id !== item.id) {
            return currentImage
          }

          if (currentImage.outputUrl) {
            URL.revokeObjectURL(currentImage.outputUrl)
          }

          return {
            ...currentImage,
            outputUrl,
            outputSize: blob.size,
            width: image.naturalWidth,
            height: image.naturalHeight,
            status: 'done',
            error: undefined,
          }
        }),
      )
    } catch (error) {
      setImages((current) =>
        current.map((currentImage) =>
          currentImage.id === item.id
            ? {
                ...currentImage,
                status: 'error',
                error:
                  error instanceof Error
                    ? error.message
                    : 'Conversion failed.',
              }
            : currentImage,
        ),
      )
    }
  }

  async function convertAll() {
    if (images.length === 0) {
      return
    }

    setIsConvertingAll(true)

    for (const image of images) {
      await convertImage(image)
    }

    setIsConvertingAll(false)
  }

  function downloadImage(item: ConvertedImage) {
    if (!item.outputUrl) {
      return
    }

    const link = document.createElement('a')

    link.href = item.outputUrl
    link.download = `${getBaseName(item.originalFile.name)}.${getExtension(
      outputFormat,
    )}`

    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  async function downloadAll() {
    const completedImages = images.filter(
      (image) => image.outputUrl,
    )

    if (completedImages.length === 0) {
      return
    }

    for (const image of completedImages) {
      downloadImage(image)

      await new Promise((resolve) =>
        setTimeout(resolve, 150),
      )
    }
  }

  const completedCount = images.filter(
    (image) => image.status === 'done',
  ).length

  return (
    <>
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      <main className="convert-page">
        <section className="convert-hero">
          <div className="container">
            <span className="convert-hero__eyebrow">
              IMAGE CONVERTER
            </span>

            <h1>Convert Images</h1>

            <p>
              Convert your images between JPG, PNG and WEBP
              without uploading them anywhere.
            </p>
          </div>
        </section>

        <section className="convert-tool">
          <div className="container">

            <div
              className={`convert-dropzone ${
                isDragging
                  ? 'convert-dropzone--dragging'
                  : ''
              }`}
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                setIsDragging(false)
              }}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  inputRef.current?.click()
                }
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleInputChange}
              />

              <div className="convert-dropzone__icon">
                ⇧
              </div>

              <h2>Drop your images here</h2>

              <p>
                or{' '}
                <span className="convert-dropzone__browse">
                  Browse Files
                </span>
              </p>

              <small>
                JPG, PNG or WEBP · Multiple files supported
              </small>
            </div>

            {images.length > 0 && (
              <div className="convert-workspace">

                <div className="convert-controls">

                  <div className="convert-control">
                    <label htmlFor="output-format">
                      Output format
                    </label>

                    <select
                      id="output-format"
                      value={outputFormat}
                      onChange={(event) =>
                        setOutputFormat(
                          event.target.value as OutputFormat,
                        )
                      }
                    >
                      {FORMAT_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="convert-control convert-quality">
                    <div className="convert-quality__header">
                      <label htmlFor="quality">
                        Quality
                      </label>

                      <strong>
                        {quality}%
                      </strong>
                    </div>

                    <input
                      id="quality"
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(event) =>
                        setQuality(
                          Number(event.target.value),
                        )
                      }
                      disabled={
                        outputFormat === 'image/png'
                      }
                    />

                    <small>
                      {outputFormat === 'image/png'
                        ? 'PNG uses lossless compression.'
                        : 'Higher quality produces larger files.'}
                    </small>
                  </div>

                  <div className="convert-control convert-summary">
                    <span>Images</span>
                    <strong>{images.length}</strong>
                  </div>

                  <div className="convert-control convert-summary">
                    <span>Converted</span>
                    <strong>
                      {completedCount}/{images.length}
                    </strong>
                  </div>

                </div>

                <div className="convert-actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={convertAll}
                    disabled={isConvertingAll}
                  >
                    {isConvertingAll
                      ? 'Converting…'
                      : `Convert All to ${getFormatLabel(
                          outputFormat,
                        )}`}
                  </button>

                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={downloadAll}
                    disabled={completedCount === 0}
                  >
                    Download All
                  </button>

                  <button
                    type="button"
                    className="convert-clear"
                    onClick={clearAll}
                  >
                    Clear All
                  </button>
                </div>

                <div className="convert-list">
                  {images.map((image) => (
                    <article
                      className="convert-item"
                      key={image.id}
                    >
                      <div className="convert-item__preview">
                        <img
                          src={image.originalUrl}
                          alt={image.originalFile.name}
                        />
                      </div>

                      <div className="convert-item__details">
                        <strong
                          title={image.originalFile.name}
                        >
                          {image.originalFile.name}
                        </strong>

                        <span>
                          {image.width > 0 &&
                            `${image.width} × ${image.height} · `}
                          {formatFileSize(
                            image.originalFile.size,
                          )}
                        </span>

                        {image.status === 'done' &&
                          image.outputSize !== null && (
                            <span className="convert-item__result">
                              Converted:{' '}
                              {formatFileSize(
                                image.outputSize,
                              )}
                            </span>
                          )}

                        {image.status === 'converting' && (
                          <span className="convert-item__status">
                            Converting…
                          </span>
                        )}

                        {image.status === 'error' && (
                          <span className="convert-item__error">
                            {image.error}
                          </span>
                        )}
                      </div>

                      <div className="convert-item__actions">
                        {image.status !== 'done' && (
                          <button
                            type="button"
                            className="btn btn--primary btn--small"
                            onClick={() =>
                              convertImage(image)
                            }
                            disabled={
                              image.status === 'converting'
                            }
                          >
                            {image.status === 'converting'
                              ? 'Converting…'
                              : 'Convert'}
                          </button>
                        )}

                        {image.status === 'done' && (
                          <button
                            type="button"
                            className="btn btn--primary btn--small"
                            onClick={() =>
                              downloadImage(image)
                            }
                          >
                            Download
                          </button>
                        )}

                        <button
                          type="button"
                          className="convert-remove"
                          onClick={() =>
                            removeImage(image.id)
                          }
                          aria-label={`Remove ${image.originalFile.name}`}
                        >
                          ×
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="convert-privacy">
                  <span aria-hidden="true">✓</span>

                  <div>
                    <strong>Private by design</strong>
                    <p>
                      Your images are processed locally in
                      your browser. They are not uploaded to a
                      server.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}