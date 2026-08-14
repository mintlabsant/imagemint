import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import UploadDropzone from '../../components/UploadDropzone'
import '../../styles/tools/resize.css'

type ResizePageProps = {
  darkMode: boolean
  onToggleDarkMode: () => void
}

type OutputFormat =
  | 'original'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'

type Preset = {
  label: string
  width: number
  height: number
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const PRESETS: Preset[] = [
  {
    label: 'Instagram Post',
    width: 1080,
    height: 1080,
  },
  {
    label: 'Instagram Story',
    width: 1080,
    height: 1920,
  },
  {
    label: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
  },
  {
    label: 'HD',
    width: 1280,
    height: 720,
  },
  {
    label: 'Full HD',
    width: 1920,
    height: 1080,
  },
  {
    label: '4K',
    width: 3840,
    height: 2160,
  },
]

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getExtension(type: string) {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'

  return 'png'
}

function getMimeType(
  format: OutputFormat,
  originalType: string,
) {
  if (format === 'original') {
    return originalType
  }

  return format
}

export default function ResizePage({
  darkMode,
  onToggleDarkMode,
}: ResizePageProps) {
  const [file, setFile] = useState<File | null>(null)

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null)

  const [originalWidth, setOriginalWidth] =
    useState(0)

  const [originalHeight, setOriginalHeight] =
    useState(0)

  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  const [lockRatio, setLockRatio] =
    useState(true)

  const [scalePercent, setScalePercent] =
    useState(100)

  const [outputFormat, setOutputFormat] =
    useState<OutputFormat>('original')

  const [quality, setQuality] =
    useState(90)

  const [isProcessing, setIsProcessing] =
    useState(false)

  const [processedUrl, setProcessedUrl] =
    useState<string | null>(null)

  const [processedSize, setProcessedSize] =
    useState<number | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(file)

    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(() => {
    return () => {
      if (processedUrl) {
        URL.revokeObjectURL(processedUrl)
      }
    }
  }, [processedUrl])

  function handleFile(
    selectedFile: File | undefined,
  ) {
    if (!selectedFile) {
      return
    }

    setError(null)
    setProcessedSize(null)

    if (
      !ACCEPTED_TYPES.includes(
        selectedFile.type,
      )
    ) {
      setError(
        'Please select a JPG, PNG, or WEBP image.',
      )

      return
    }

    const image = new Image()

    const imageUrl =
      URL.createObjectURL(
        selectedFile,
      )

    image.onload = () => {
      URL.revokeObjectURL(imageUrl)

      if (processedUrl) {
        URL.revokeObjectURL(processedUrl)
      }

      setFile(selectedFile)

      setOriginalWidth(
        image.naturalWidth,
      )

      setOriginalHeight(
        image.naturalHeight,
      )

      setWidth(
        image.naturalWidth,
      )

      setHeight(
        image.naturalHeight,
      )

      setScalePercent(100)

      setProcessedUrl(null)
      setProcessedSize(null)
      setError(null)
    }

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)

      setError(
        'This image could not be read. Please try another file.',
      )
    }

    image.src = imageUrl
  }

  function handleWidthChange(
    value: number,
  ) {
    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return
    }

    setWidth(value)

    if (
      lockRatio &&
      originalWidth > 0
    ) {
      const ratio =
        originalHeight /
        originalWidth

      setHeight(
        Math.max(
          1,
          Math.round(
            value * ratio,
          ),
        ),
      )
    }

    if (originalWidth > 0) {
      setScalePercent(
        Math.max(
          1,
          Math.round(
            (value /
              originalWidth) *
              100,
          ),
        ),
      )
    }

    setProcessedUrl(null)
    setProcessedSize(null)
  }

  function handleHeightChange(
    value: number,
  ) {
    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return
    }

    setHeight(value)

    if (
      lockRatio &&
      originalHeight > 0
    ) {
      const ratio =
        originalWidth /
        originalHeight

      setWidth(
        Math.max(
          1,
          Math.round(
            value * ratio,
          ),
        ),
      )
    }

    if (originalHeight > 0) {
      setScalePercent(
        Math.max(
          1,
          Math.round(
            (value /
              originalHeight) *
              100,
          ),
        ),
      )
    }

    setProcessedUrl(null)
    setProcessedSize(null)
  }

  function handleScaleChange(
    value: number,
  ) {
    const safeValue =
      Math.min(
        500,
        Math.max(1, value),
      )

    setScalePercent(
      safeValue,
    )

    if (
      originalWidth > 0 &&
      originalHeight > 0
    ) {
      setWidth(
        Math.max(
          1,
          Math.round(
            originalWidth *
              (safeValue /
                100),
          ),
        ),
      )

      setHeight(
        Math.max(
          1,
          Math.round(
            originalHeight *
              (safeValue /
                100),
          ),
        ),
      )
    }

    setProcessedUrl(null)
    setProcessedSize(null)
  }

  function applyPreset(
    preset: Preset,
  ) {
    setWidth(
      preset.width,
    )

    setHeight(
      preset.height,
    )

    if (originalWidth > 0) {
      setScalePercent(
        Math.round(
          (preset.width /
            originalWidth) *
            100,
        ),
      )
    }

    setProcessedUrl(null)
    setProcessedSize(null)
  }

  function resetSettings() {
    setWidth(
      originalWidth,
    )

    setHeight(
      originalHeight,
    )

    setScalePercent(100)

    setLockRatio(true)

    setOutputFormat(
      'original',
    )

    setQuality(90)

    setProcessedUrl(null)
    setProcessedSize(null)
    setError(null)
  }

  function resetFile() {
    if (processedUrl) {
      URL.revokeObjectURL(
        processedUrl,
      )
    }

    setFile(null)
    setPreviewUrl(null)
    setProcessedUrl(null)
    setProcessedSize(null)

    setOriginalWidth(0)
    setOriginalHeight(0)

    setWidth(0)
    setHeight(0)

    setScalePercent(100)

    setOutputFormat(
      'original',
    )

    setQuality(90)

    setLockRatio(true)

    setError(null)
  }

  async function resizeImage() {
    if (!file) {
      setError(
        'Please select an image first.',
      )

      return
    }

    if (
      width <= 0 ||
      height <= 0
    ) {
      setError(
        'Please enter valid dimensions.',
      )

      return
    }

    if (
      width > 10000 ||
      height > 10000
    ) {
      setError(
        'Maximum supported dimension is 10,000 × 10,000 pixels.',
      )

      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const image =
        new Image()

      const imageUrl =
        URL.createObjectURL(file)

      await new Promise<void>(
        (
          resolve,
          reject,
        ) => {
          image.onload = () => {
            URL.revokeObjectURL(
              imageUrl,
            )

            resolve()
          }

          image.onerror = () => {
            URL.revokeObjectURL(
              imageUrl,
            )

            reject(
              new Error(
                'Unable to load image.',
              ),
            )
          }

          image.src =
            imageUrl
        },
      )

      const canvas =
        document.createElement(
          'canvas',
        )

      canvas.width = width
      canvas.height = height

      const context =
        canvas.getContext(
          '2d',
        )

      if (!context) {
        throw new Error(
          'Your browser does not support image processing.',
        )
      }

      context.imageSmoothingEnabled =
        true

      context.imageSmoothingQuality =
        'high'

      const mimeType =
        getMimeType(
          outputFormat,
          file.type,
        )

      if (
        mimeType ===
        'image/jpeg'
      ) {
        context.fillStyle =
          '#ffffff'

        context.fillRect(
          0,
          0,
          width,
          height,
        )
      }

      context.drawImage(
        image,
        0,
        0,
        width,
        height,
      )

      const canvasQuality =
        mimeType ===
          'image/jpeg' ||
        mimeType ===
          'image/webp'
          ? quality / 100
          : undefined

      const blob =
        await new Promise<Blob | null>(
          (resolve) => {
            canvas.toBlob(
              resolve,
              mimeType,
              canvasQuality,
            )
          },
        )

      if (!blob) {
        throw new Error(
          'Could not create the resized image.',
        )
      }

      if (processedUrl) {
        URL.revokeObjectURL(
          processedUrl,
        )
      }

      const url =
        URL.createObjectURL(
          blob,
        )

      setProcessedUrl(url)
      setProcessedSize(
        blob.size,
      )
    } catch {
      setError(
        'Something went wrong while resizing the image. Please try again.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  function downloadImage() {
    if (
      !processedUrl ||
      !file
    ) {
      return
    }

    const extension =
      getExtension(
        getMimeType(
          outputFormat,
          file.type,
        ),
      )

    const baseName =
      file.name
        .replace(
          /\.[^/.]+$/,
          '',
        )
        .replace(
          /\s+/g,
          '-',
        )

    const link =
      document.createElement(
        'a',
      )

    link.href =
      processedUrl

    link.download =
      `${baseName}-${width}x${height}.${extension}`

    document.body.appendChild(
      link,
    )

    link.click()

    document.body.removeChild(
      link,
    )
  }

  const effectiveOutputType =
    file
      ? getMimeType(
          outputFormat,
          file.type,
        )
      : 'image/png'

  const formatLabel =
    effectiveOutputType ===
    'image/jpeg'
      ? 'JPG'
      : effectiveOutputType ===
          'image/png'
        ? 'PNG'
        : 'WEBP'

  return (
    <>
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={
          onToggleDarkMode
        }
      />

      <main className="resize-page">
        <section className="resize-hero">
          <div className="container">
            <p className="resize-hero__eyebrow">
              IMAGEMINT TOOL
            </p>

            <h1>
              Resize Images
            </h1>

            <p>
              Resize your images
              precisely without
              leaving your browser.
              Control dimensions,
              quality, format and
              scaling in one place.
            </p>
          </div>
        </section>

        <section className="resize-tool">
          <div className="container">
            <div className="resize-card">
              {!file ? (
                <UploadDropzone
                  accept="image/jpeg,image/png,image/webp"
                  multiple={false}
                  onFilesSelected={(
                    files,
                  ) => {
                    handleFile(
                      files[0],
                    )
                  }}
                />
              ) : (
                <div className="resize-workspace">
                  <div className="resize-preview-panel">
                    <div className="resize-panel-heading">
                      <div>
                        <span>
                          Preview
                        </span>

                        <strong>
                          {file.name}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="resize-reset-link"
                        onClick={
                          resetFile
                        }
                      >
                        Choose
                        another
                      </button>
                    </div>

                    <div className="resize-image-stage">
                      {previewUrl && (
                        <img
                          src={
                            previewUrl
                          }
                          alt={`Preview of ${file.name}`}
                          className="resize-preview-image"
                        />
                      )}
                    </div>

                    <div className="resize-original-info">
                      <span>
                        Original
                      </span>

                      <strong>
                        {
                          originalWidth
                        }{' '}
                        ×{' '}
                        {
                          originalHeight
                        }
                      </strong>

                      <span>
                        {formatFileSize(
                          file.size,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="resize-controls">
                    <div className="resize-controls__top">
                      <div>
                        <span className="resize-controls__eyebrow">
                          Resize
                          settings
                        </span>

                        <h2>
                          Fine-tune
                          your image
                        </h2>
                      </div>

                      <button
                        type="button"
                        className="resize-reset-settings"
                        onClick={
                          resetSettings
                        }
                      >
                        Reset
                      </button>
                    </div>

                    <div className="resize-section">
                      <div className="resize-section__heading">
                        <h3>
                          Dimensions
                        </h3>

                        <span>
                          {
                            scalePercent
                          }
                          % of
                          original
                        </span>
                      </div>

                      <div className="resize-dimensions">
                        <label>
                          <span>
                            Width
                          </span>

                          <div className="resize-input-with-unit">
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              value={
                                width
                              }
                              onChange={(
                                event,
                              ) =>
                                handleWidthChange(
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                                )
                              }
                            />

                            <em>
                              px
                            </em>
                          </div>
                        </label>

                        <span className="resize-dimensions__x">
                          ×
                        </span>

                        <label>
                          <span>
                            Height
                          </span>

                          <div className="resize-input-with-unit">
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              value={
                                height
                              }
                              onChange={(
                                event,
                              ) =>
                                handleHeightChange(
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                                )
                              }
                            />

                            <em>
                              px
                            </em>
                          </div>
                        </label>
                      </div>

                      <label className="resize-lock">
                        <input
                          type="checkbox"
                          checked={
                            lockRatio
                          }
                          onChange={(
                            event,
                          ) =>
                            setLockRatio(
                              event
                                .target
                                .checked,
                            )
                          }
                        />

                        <span>
                          Lock aspect
                          ratio
                        </span>
                      </label>
                    </div>

                    <div className="resize-section">
                      <div className="resize-section__heading">
                        <h3>
                          Scale
                        </h3>

                        <strong>
                          {
                            scalePercent
                          }
                          %
                        </strong>
                      </div>

                      <input
                        className="resize-range"
                        type="range"
                        min="1"
                        max="500"
                        value={
                          scalePercent
                        }
                        onChange={(
                          event,
                        ) =>
                          handleScaleChange(
                            Number(
                              event
                                .target
                                .value,
                            ),
                          )
                        }
                      />

                      <div className="resize-range-labels">
                        <span>
                          1%
                        </span>

                        <span>
                          100%
                        </span>

                        <span>
                          500%
                        </span>
                      </div>
                    </div>

                    <div className="resize-section">
                      <div className="resize-section__heading">
                        <h3>
                          Quick
                          presets
                        </h3>
                      </div>

                      <div className="resize-presets">
                        {PRESETS.map(
                          (
                            preset,
                          ) => (
                            <button
                              key={
                                preset.label
                              }
                              type="button"
                              onClick={() =>
                                applyPreset(
                                  preset,
                                )
                              }
                            >
                              <strong>
                                {
                                  preset.label
                                }
                              </strong>

                              <span>
                                {
                                  preset.width
                                }{' '}
                                ×{' '}
                                {
                                  preset.height
                                }
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="resize-section resize-section--split">
                      <label>
                        <span>
                          Output
                          format
                        </span>

                        <select
                          value={
                            outputFormat
                          }
                          onChange={(
                            event,
                          ) =>
                            setOutputFormat(
                              event
                                .target
                                .value as OutputFormat,
                            )
                          }
                        >
                          <option value="original">
                            Keep
                            original
                            (
                            {
                              formatLabel
                            }
                            )
                          </option>

                          <option value="image/jpeg">
                            JPG
                          </option>

                          <option value="image/png">
                            PNG
                          </option>

                          <option value="image/webp">
                            WEBP
                          </option>
                        </select>
                      </label>

                      <label>
                        <span>
                          Quality{' '}
                          <strong>
                            {
                              quality
                            }
                            %
                          </strong>
                        </span>

                        <input
                          className="resize-quality"
                          type="range"
                          min="10"
                          max="100"
                          value={
                            quality
                          }
                          disabled={
                            effectiveOutputType ===
                            'image/png'
                          }
                          onChange={(
                            event,
                          ) =>
                            setQuality(
                              Number(
                                event
                                  .target
                                  .value,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="resize-output-summary">
                      <div>
                        <span>
                          Output
                          dimensions
                        </span>

                        <strong>
                          {width} ×{' '}
                          {height}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Result size
                        </span>

                        <strong>
                          {processedSize !==
                          null
                            ? formatFileSize(
                                processedSize,
                              )
                            : 'Calculate'}
                        </strong>
                      </div>
                    </div>

                    {error && (
                      <div
                        className="resize-error"
                        role="alert"
                      >
                        {error}
                      </div>
                    )}

                    <div className="resize-actions">
                      {!processedUrl ? (
                        <button
                          type="button"
                          className="btn btn--primary resize-main-button"
                          onClick={
                            resizeImage
                          }
                          disabled={
                            isProcessing
                          }
                        >
                          {isProcessing
                            ? 'Resizing...'
                            : 'Resize Image'}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn--primary resize-main-button"
                            onClick={
                              downloadImage
                            }
                          >
                            Download{' '}
                            {
                              formatLabel
                            }
                          </button>

                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={
                              resizeImage
                            }
                          >
                            Resize Again
                          </button>
                        </>
                      )}
                    </div>

                    <p className="resize-privacy">
                      Your image is
                      processed
                      directly in your
                      browser. It is not
                      uploaded to a
                      server.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}