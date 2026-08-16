import {
  useEffect,
  useMemo,
  useState,
} from 'react'
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

type ResizeMode =
  | 'dimensions'
  | 'percentage'
  | 'fit'

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_DIMENSION = 10000
const MIN_DIMENSION = 1

const PRESETS = [
  {
    label: 'Instagram',
    width: 1080,
    height: 1080,
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

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(min, value),
  )
}

function clampInteger(
  value: number,
  min: number,
  max: number,
) {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.round(
    clamp(value, min, max),
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`
}

function getExtension(type: string) {
  if (type === 'image/jpeg') {
    return 'jpg'
  }

  if (type === 'image/webp') {
    return 'webp'
  }

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

function calculateFitDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
) {
  if (
    sourceWidth <= maxWidth &&
    sourceHeight <= maxHeight
  ) {
    return {
      width: sourceWidth,
      height: sourceHeight,
    }
  }

  const scale = Math.min(
    maxWidth / sourceWidth,
    maxHeight / sourceHeight,
  )

  return {
    width: Math.max(
      MIN_DIMENSION,
      Math.round(
        sourceWidth * scale,
      ),
    ),
    height: Math.max(
      MIN_DIMENSION,
      Math.round(
        sourceHeight * scale,
      ),
    ),
  }
}

export default function ResizePage({
  darkMode,
  onToggleDarkMode,
}: ResizePageProps) {
  const [file, setFile] =
    useState<File | null>(null)

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null)

  const [originalWidth, setOriginalWidth] =
    useState(0)

  const [originalHeight, setOriginalHeight] =
    useState(0)

  const [width, setWidth] =
    useState(0)

  const [height, setHeight] =
    useState(0)

  const [aspectLocked, setAspectLocked] =
    useState(true)

  const [resizeMode, setResizeMode] =
    useState<ResizeMode>('dimensions')

  const [percentage, setPercentage] =
    useState(100)

  const [fitWidth, setFitWidth] =
    useState(1920)

  const [fitHeight, setFitHeight] =
    useState(1080)

  const [preventUpscale, setPreventUpscale] =
    useState(true)

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

  const aspectRatio =
    useMemo(() => {
      if (
        originalWidth <= 0 ||
        originalHeight <= 0
      ) {
        return 1
      }

      return (
        originalWidth /
        originalHeight
      )
    }, [
      originalWidth,
      originalHeight,
    ])

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
          'image/webp'
        ? 'WEBP'
        : 'PNG'

  const outputDimensions =
    useMemo(() => {
      if (
        originalWidth <= 0 ||
        originalHeight <= 0
      ) {
        return {
          width: 0,
          height: 0,
        }
      }

      if (
        resizeMode ===
        'percentage'
      ) {
        const scale =
          clamp(
            percentage,
            1,
            1000,
          ) / 100

        let nextWidth =
          Math.round(
            originalWidth *
              scale,
          )

        let nextHeight =
          Math.round(
            originalHeight *
              scale,
          )

        if (
          preventUpscale &&
          scale > 1
        ) {
          nextWidth =
            originalWidth

          nextHeight =
            originalHeight
        }

        return {
          width: clampInteger(
            nextWidth,
            MIN_DIMENSION,
            MAX_DIMENSION,
          ),
          height: clampInteger(
            nextHeight,
            MIN_DIMENSION,
            MAX_DIMENSION,
          ),
        }
      }

      if (
        resizeMode === 'fit'
      ) {
        let maxWidth =
          clampInteger(
            fitWidth,
            MIN_DIMENSION,
            MAX_DIMENSION,
          )

        let maxHeight =
          clampInteger(
            fitHeight,
            MIN_DIMENSION,
            MAX_DIMENSION,
          )

        if (
          preventUpscale
        ) {
          maxWidth =
            Math.min(
              maxWidth,
              originalWidth,
            )

          maxHeight =
            Math.min(
              maxHeight,
              originalHeight,
            )
        }

        return calculateFitDimensions(
          originalWidth,
          originalHeight,
          maxWidth,
          maxHeight,
        )
      }

      return {
        width: clampInteger(
          width,
          MIN_DIMENSION,
          MAX_DIMENSION,
        ),
        height: clampInteger(
          height,
          MIN_DIMENSION,
          MAX_DIMENSION,
        ),
      }
    }, [
      originalWidth,
      originalHeight,
      resizeMode,
      percentage,
      fitWidth,
      fitHeight,
      preventUpscale,
      width,
      height,
    ])

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const url =
      URL.createObjectURL(file)

    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(() => {
    return () => {
      if (processedUrl) {
        URL.revokeObjectURL(
          processedUrl,
        )
      }
    }
  }, [processedUrl])

  function clearProcessed() {
    if (processedUrl) {
      URL.revokeObjectURL(
        processedUrl,
      )
    }

    setProcessedUrl(null)
    setProcessedSize(null)
  }

  function handleFile(
    selectedFile: File | undefined,
  ) {
    if (!selectedFile) {
      return
    }

    setError(null)
    clearProcessed()

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

    const objectUrl =
      URL.createObjectURL(
        selectedFile,
      )

    image.onload = () => {
      URL.revokeObjectURL(
        objectUrl,
      )

      const naturalWidth =
        image.naturalWidth

      const naturalHeight =
        image.naturalHeight

      if (
        naturalWidth >
          MAX_DIMENSION ||
        naturalHeight >
          MAX_DIMENSION
      ) {
        setError(
          `Maximum supported image dimension is ${MAX_DIMENSION.toLocaleString()} × ${MAX_DIMENSION.toLocaleString()} pixels.`,
        )

        return
      }

      setFile(selectedFile)

      setOriginalWidth(
        naturalWidth,
      )

      setOriginalHeight(
        naturalHeight,
      )

      setWidth(naturalWidth)
      setHeight(naturalHeight)

      setResizeMode(
        'dimensions',
      )

      setPercentage(100)

      setFitWidth(1920)
      setFitHeight(1080)

      setAspectLocked(true)

      setPreventUpscale(true)

      setOutputFormat(
        'original',
      )

      setQuality(90)
    }

    image.onerror = () => {
      URL.revokeObjectURL(
        objectUrl,
      )

      setError(
        'This image could not be read. Please try another file.',
      )
    }

    image.src = objectUrl
  }

  function handleWidthChange(
    value: number,
  ) {
    const nextWidth =
      clampInteger(
        value,
        MIN_DIMENSION,
        MAX_DIMENSION,
      )

    setWidth(nextWidth)

    if (
      aspectLocked &&
      aspectRatio > 0
    ) {
      setHeight(
        clampInteger(
          nextWidth /
            aspectRatio,
          MIN_DIMENSION,
          MAX_DIMENSION,
        ),
      )
    }

    clearProcessed()
  }

  function handleHeightChange(
    value: number,
  ) {
    const nextHeight =
      clampInteger(
        value,
        MIN_DIMENSION,
        MAX_DIMENSION,
      )

    setHeight(nextHeight)

    if (
      aspectLocked &&
      aspectRatio > 0
    ) {
      setWidth(
        clampInteger(
          nextHeight *
            aspectRatio,
          MIN_DIMENSION,
          MAX_DIMENSION,
        ),
      )
    }

    clearProcessed()
  }

  function handlePercentageChange(
    value: number,
  ) {
    const nextPercentage =
      clampInteger(
        value,
        1,
        1000,
      )

    setPercentage(
      nextPercentage,
    )

    clearProcessed()
  }

  function applyPreset(
    presetWidth: number,
    presetHeight: number,
  ) {
    setResizeMode(
      'dimensions',
    )

    setAspectLocked(false)

    setWidth(
      clampInteger(
        presetWidth,
        MIN_DIMENSION,
        MAX_DIMENSION,
      ),
    )

    setHeight(
      clampInteger(
        presetHeight,
        MIN_DIMENSION,
        MAX_DIMENSION,
      ),
    )

    clearProcessed()
    setError(null)
  }

  function resetSettings() {
    if (!file) {
      return
    }

    setResizeMode(
      'dimensions',
    )

    setWidth(
      originalWidth,
    )

    setHeight(
      originalHeight,
    )

    setPercentage(100)

    setFitWidth(1920)
    setFitHeight(1080)

    setAspectLocked(true)

    setPreventUpscale(true)

    setOutputFormat(
      'original',
    )

    setQuality(90)

    clearProcessed()
    setError(null)
  }

  function resetFile() {
    clearProcessed()

    setFile(null)
    setPreviewUrl(null)

    setOriginalWidth(0)
    setOriginalHeight(0)

    setWidth(0)
    setHeight(0)

    setPercentage(100)

    setFitWidth(1920)
    setFitHeight(1080)

    setResizeMode(
      'dimensions',
    )

    setAspectLocked(true)

    setPreventUpscale(true)

    setOutputFormat(
      'original',
    )

    setQuality(90)

    setError(null)
  }

  async function resizeImage() {
    if (!file) {
      setError(
        'Please select an image first.',
      )
      return
    }

    const targetWidth =
      outputDimensions.width

    const targetHeight =
      outputDimensions.height

    if (
      targetWidth < MIN_DIMENSION ||
      targetHeight < MIN_DIMENSION
    ) {
      setError(
        'Please enter valid output dimensions.',
      )
      return
    }

    if (
      targetWidth >
        MAX_DIMENSION ||
      targetHeight >
        MAX_DIMENSION
    ) {
      setError(
        `Maximum supported output dimension is ${MAX_DIMENSION.toLocaleString()} × ${MAX_DIMENSION.toLocaleString()} pixels.`,
      )
      return
    }

    if (
      preventUpscale &&
      (
        targetWidth >
          originalWidth ||
        targetHeight >
          originalHeight
      )
    ) {
      setError(
        'Upscaling is disabled. Turn off “Prevent upscaling” to create a larger image.',
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
          image.onload = () =>
            resolve()

          image.onerror = () =>
            reject(
              new Error(
                'Unable to load image.',
              ),
            )

          image.src = imageUrl
        },
      )

      URL.revokeObjectURL(
        imageUrl,
      )

      const canvas =
        document.createElement(
          'canvas',
        )

      canvas.width =
        targetWidth

      canvas.height =
        targetHeight

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
        effectiveOutputType

      if (
        mimeType ===
        'image/jpeg'
      ) {
        context.fillStyle =
          '#ffffff'

        context.fillRect(
          0,
          0,
          targetWidth,
          targetHeight,
        )
      }

      context.drawImage(
        image,
        0,
        0,
        targetWidth,
        targetHeight,
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
        URL.createObjectURL(blob)

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
        effectiveOutputType,
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
      `${baseName}-${outputDimensions.width}x${outputDimensions.height}.${extension}`

    document.body.appendChild(
      link,
    )

    link.click()

    document.body.removeChild(
      link,
    )
  }

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

            <h1>Resize Images</h1>

            <p>
              Resize images precisely in
              your browser. Set exact
              dimensions, scale by
              percentage, or fit an image
              inside a maximum size without
              uploading your files.
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
                  title="Drop your image here"
                  browseText="Browse Files"
                  helperText="JPG, PNG or WEBP · processed locally"
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
                          {
                            file.name
                          }
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="resize-reset-link"
                        onClick={
                          resetFile
                        }
                      >
                        Choose another
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

                    <div className="resize-dimensions-info">
                      <div>
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
                      </div>

                      <div>
                        <span>
                          Output
                        </span>

                        <strong>
                          {
                            outputDimensions.width
                          }{' '}
                          ×{' '}
                          {
                            outputDimensions.height
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Source size
                        </span>

                        <strong>
                          {formatFileSize(
                            file.size,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="resize-controls">
                    <div className="resize-controls__top">
                      <div>
                        <span className="resize-controls__eyebrow">
                          Resize settings
                        </span>

                        <h2>
                          Scale your
                          image
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
                          Resize method
                        </h3>
                      </div>

                      <div className="resize-mode">
                        <button
                          type="button"
                          className={
                            resizeMode ===
                            'dimensions'
                              ? 'resize-mode__option is-active'
                              : 'resize-mode__option'
                          }
                          onClick={() => {
                            setResizeMode(
                              'dimensions',
                            )
                            clearProcessed()
                          }}
                        >
                          <strong>
                            Dimensions
                          </strong>

                          <span>
                            Exact width &
                            height
                          </span>
                        </button>

                        <button
                          type="button"
                          className={
                            resizeMode ===
                            'percentage'
                              ? 'resize-mode__option is-active'
                              : 'resize-mode__option'
                          }
                          onClick={() => {
                            setResizeMode(
                              'percentage',
                            )
                            clearProcessed()
                          }}
                        >
                          <strong>
                            Percentage
                          </strong>

                          <span>
                            Scale by %
                          </span>
                        </button>

                        <button
                          type="button"
                          className={
                            resizeMode ===
                            'fit'
                              ? 'resize-mode__option is-active'
                              : 'resize-mode__option'
                          }
                          onClick={() => {
                            setResizeMode(
                              'fit',
                            )
                            clearProcessed()
                          }}
                        >
                          <strong>
                            Fit within
                          </strong>

                          <span>
                            Maximum bounds
                          </span>
                        </button>
                      </div>
                    </div>

                    {resizeMode ===
                      'dimensions' && (
                      <div className="resize-section">
                        <div className="resize-section__heading">
                          <h3>
                            Dimensions
                          </h3>

                          <span>
                            {
                              outputDimensions.width
                            }{' '}
                            ×{' '}
                            {
                              outputDimensions.height
                            }{' '}
                            px
                          </span>
                        </div>

                        <div className="resize-dimension-fields">
                          <label>
                            <span>
                              Width
                            </span>

                            <input
                              type="number"
                              min={
                                MIN_DIMENSION
                              }
                              max={
                                MAX_DIMENSION
                              }
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
                          </label>

                          <button
                            type="button"
                            className={
                              aspectLocked
                                ? 'resize-lock is-active'
                                : 'resize-lock'
                            }
                            aria-label={
                              aspectLocked
                                ? 'Unlock aspect ratio'
                                : 'Lock aspect ratio'
                            }
                            title={
                              aspectLocked
                                ? 'Unlock aspect ratio'
                                : 'Lock aspect ratio'
                            }
                            onClick={() => {
                              setAspectLocked(
                                (
                                  current,
                                ) =>
                                  !current,
                              )
                            }}
                          >
                            {aspectLocked
                              ? '🔒'
                              : '🔓'}
                          </button>

                          <label>
                            <span>
                              Height
                            </span>

                            <input
                              type="number"
                              min={
                                MIN_DIMENSION
                              }
                              max={
                                MAX_DIMENSION
                              }
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
                          </label>
                        </div>

                        <p className="resize-ratio-note">
                          Original ratio:{' '}
                          {
                            originalWidth
                          }
                          :
                          {
                            originalHeight
                          }
                        </p>
                      </div>
                    )}

                    {resizeMode ===
                      'percentage' && (
                      <div className="resize-section">
                        <div className="resize-section__heading">
                          <h3>
                            Scale
                          </h3>

                          <span>
                            {
                              outputDimensions.width
                            }{' '}
                            ×{' '}
                            {
                              outputDimensions.height
                            }{' '}
                            px
                          </span>
                        </div>

                        <div className="resize-percentage">
                          <label>
                            <span>
                              Percentage
                            </span>

                            <input
                              type="number"
                              min="1"
                              max="1000"
                              value={
                                percentage
                              }
                              onChange={(
                                event,
                              ) =>
                                handlePercentageChange(
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                                )
                              }
                            />
                          </label>

                          <input
                            type="range"
                            min="1"
                            max="500"
                            value={Math.min(
                              percentage,
                              500,
                            )}
                            onChange={(
                              event,
                            ) =>
                              handlePercentageChange(
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                    )}

                    {resizeMode ===
                      'fit' && (
                      <div className="resize-section">
                        <div className="resize-section__heading">
                          <h3>
                            Maximum size
                          </h3>

                          <span>
                            Preserve aspect
                            ratio
                          </span>
                        </div>

                        <div className="resize-fit-fields">
                          <label>
                            <span>
                              Max width
                            </span>

                            <input
                              type="number"
                              min={
                                MIN_DIMENSION
                              }
                              max={
                                MAX_DIMENSION
                              }
                              value={
                                fitWidth
                              }
                              onChange={(
                                event,
                              ) => {
                                setFitWidth(
                                  clampInteger(
                                    Number(
                                      event
                                        .target
                                        .value,
                                    ),
                                    MIN_DIMENSION,
                                    MAX_DIMENSION,
                                  ),
                                )

                                clearProcessed()
                              }}
                            />
                          </label>

                          <span>
                            ×
                          </span>

                          <label>
                            <span>
                              Max height
                            </span>

                            <input
                              type="number"
                              min={
                                MIN_DIMENSION
                              }
                              max={
                                MAX_DIMENSION
                              }
                              value={
                                fitHeight
                              }
                              onChange={(
                                event,
                              ) => {
                                setFitHeight(
                                  clampInteger(
                                    Number(
                                      event
                                        .target
                                        .value,
                                    ),
                                    MIN_DIMENSION,
                                    MAX_DIMENSION,
                                  ),
                                )

                                clearProcessed()
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="resize-section">
                      <div className="resize-section__heading">
                        <h3>
                          Quick sizes
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
                                  preset.width,
                                  preset.height,
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

                    <div className="resize-section">
                      <label className="resize-checkbox">
                        <input
                          type="checkbox"
                          checked={
                            preventUpscale
                          }
                          onChange={(
                            event,
                          ) => {
                            setPreventUpscale(
                              event
                                .target
                                .checked,
                            )

                            clearProcessed()
                          }}
                        />

                        <span>
                          <strong>
                            Prevent
                            upscaling
                          </strong>

                          <small>
                            Never enlarge the
                            original image
                          </small>
                        </span>
                      </label>
                    </div>

                    <div className="resize-section">
                      <div className="resize-section__heading">
                        <h3>
                          Output
                        </h3>
                      </div>

                      <div className="resize-output">
                        <label>
                          <span>
                            Format
                          </span>

                          <select
                            value={
                              outputFormat
                            }
                            onChange={(
                              event,
                            ) => {
                              setOutputFormat(
                                event
                                  .target
                                  .value as OutputFormat,
                              )

                              clearProcessed()
                            }}
                          >
                            <option value="original">
                              Keep original (
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
                              }%
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
                            ) => {
                              setQuality(
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                              )

                              clearProcessed()
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="resize-output-summary">
                      <div>
                        <span>
                          Output dimensions
                        </span>

                        <strong>
                          {
                            outputDimensions.width
                          }{' '}
                          ×{' '}
                          {
                            outputDimensions.height
                          }{' '}
                          px
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
                      Your image is processed
                      directly in your browser.
                      Nothing is uploaded to a
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