import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import UploadDropzone from '../../components/UploadDropzone'
import '../../styles/tools/merger.css'

type MergerPageProps = {
  darkMode: boolean
  onToggleDarkMode: () => void
}

type MergeDirection = 'vertical' | 'horizontal'
type Alignment = 'start' | 'center' | 'end'
type BackgroundMode = 'transparent' | 'white' | 'black' | 'custom'
type OutputFormat = 'png' | 'jpeg' | 'webp'

type MergerImage = {
  id: string
  file: File
  url: string
  width: number
  height: number
}

type RenderedResult = {
  blob: Blob
  width: number
  height: number
  url: string
}

const MAX_IMAGES = 30
const MAX_FILE_SIZE = 50 * 1024 * 1024

const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const OUTPUT_MIME: Record<OutputFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getExtension(format: OutputFormat) {
  return format === 'jpeg' ? 'jpg' : format
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load one of the images.'))

    image.src = url
  })
}

function getBackgroundColor(
  mode: BackgroundMode,
  customColor: string,
) {
  if (mode === 'white') {
    return '#ffffff'
  }

  if (mode === 'black') {
    return '#000000'
  }

  if (mode === 'custom') {
    return customColor
  }

  return null
}

function calculateCanvasSize(
  images: MergerImage[],
  direction: MergeDirection,
  spacing: number,
) {
  if (images.length === 0) {
    return {
      width: 0,
      height: 0,
    }
  }

  if (direction === 'vertical') {
    return {
      width: Math.max(...images.map((image) => image.width)),
      height:
        images.reduce((total, image) => total + image.height, 0) +
        spacing * Math.max(0, images.length - 1),
    }
  }

  return {
    width:
      images.reduce((total, image) => total + image.width, 0) +
      spacing * Math.max(0, images.length - 1),
    height: Math.max(...images.map((image) => image.height)),
  }
}

export default function MergerPage({
  darkMode,
  onToggleDarkMode,
}: MergerPageProps) {
  const [images, setImages] = useState<MergerImage[]>([])
  const [direction, setDirection] =
    useState<MergeDirection>('vertical')
  const [alignment, setAlignment] =
    useState<Alignment>('center')
  const [spacing, setSpacing] = useState(16)

  const [backgroundMode, setBackgroundMode] =
    useState<BackgroundMode>('transparent')
  const [customColor, setCustomColor] = useState('#ffffff')

  const [outputFormat, setOutputFormat] =
    useState<OutputFormat>('png')
  const [quality, setQuality] = useState(0.92)

  const [draggedId, setDraggedId] = useState<string | null>(null)

  const [isRendering, setIsRendering] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [result, setResult] =
    useState<RenderedResult | null>(null)

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const canvasSize = useMemo(
    () =>
      calculateCanvasSize(
        images,
        direction,
        spacing,
      ),
    [images, direction, spacing],
  )

  const totalOriginalSize = useMemo(
    () =>
      images.reduce(
        (total, image) => total + image.file.size,
        0,
      ),
    [images],
  )

  const clearResult = useCallback(() => {
    setResult((current) => {
      if (current) {
        URL.revokeObjectURL(current.url)
      }

      return null
    })
  }, [])

  useEffect(() => {
    return () => {
      images.forEach((image) => {
        URL.revokeObjectURL(image.url)
      })

      if (result) {
        URL.revokeObjectURL(result.url)
      }
    }
  }, [])

  useEffect(() => {
    clearResult()
  }, [
    images,
    direction,
    alignment,
    spacing,
    backgroundMode,
    customColor,
    outputFormat,
    quality,
    clearResult,
  ])

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setError('')
      setNotice('')

      const availableSlots = MAX_IMAGES - images.length

      if (availableSlots <= 0) {
        setError(
          `You can merge up to ${MAX_IMAGES} images at once.`,
        )
        return
      }

      const selectedFiles = files.slice(0, availableSlots)

      if (files.length > availableSlots) {
        setNotice(
          `Only ${availableSlots} more image${
            availableSlots === 1 ? '' : 's'
          } could be added.`,
        )
      }

      const validFiles = selectedFiles.filter((file) => {
        if (!ACCEPTED_TYPES.has(file.type)) {
          setError(
            'Only JPG, PNG and WEBP images are supported.',
          )
          return false
        }

        if (file.size > MAX_FILE_SIZE) {
          setError(
            `Each image must be smaller than ${formatBytes(
              MAX_FILE_SIZE,
            )}.`,
          )
          return false
        }

        return true
      })

      if (validFiles.length === 0) {
        return
      }

      const loadedImages: MergerImage[] = []

      for (const file of validFiles) {
        const url = URL.createObjectURL(file)

        try {
          const image = await loadImage(url)

          loadedImages.push({
            id: createId(),
            file,
            url,
            width: image.naturalWidth,
            height: image.naturalHeight,
          })
        } catch {
          URL.revokeObjectURL(url)

          setError(
            'One or more images could not be loaded.',
          )
        }
      }

      setImages((current) => [
        ...current,
        ...loadedImages,
      ])
    },
    [images.length],
  )

  function removeImage(id: string) {
    setImages((current) => {
      const image = current.find(
        (item) => item.id === id,
      )

      if (image) {
        URL.revokeObjectURL(image.url)
      }

      return current.filter((item) => item.id !== id)
    })
  }

  function handleDragStart(id: string) {
    setDraggedId(id)
  }

  function handleDragOver(
    event: React.DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault()
  }

  function handleDropOnImage(
    event: React.DragEvent<HTMLDivElement>,
    targetId: string,
  ) {
    event.preventDefault()

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    setImages((current) => {
      const sourceIndex = current.findIndex(
        (item) => item.id === draggedId,
      )

      const targetIndex = current.findIndex(
        (item) => item.id === targetId,
      )

      if (
        sourceIndex === -1 ||
        targetIndex === -1
      ) {
        return current
      }

      const next = [...current]
      const [moved] = next.splice(sourceIndex, 1)

      next.splice(targetIndex, 0, moved)

      return next
    })

    setDraggedId(null)
  }

  function moveImage(
    index: number,
    directionToMove: 'up' | 'down',
  ) {
    setImages((current) => {
      const targetIndex =
        directionToMove === 'up'
          ? index - 1
          : index + 1

      if (
        targetIndex < 0 ||
        targetIndex >= current.length
      ) {
        return current
      }

      const next = [...current]

      const temporary = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temporary

      return next
    })
  }

  function getAlignedOffset(
    availableSpace: number,
  ) {
    if (alignment === 'start') {
      return 0
    }

    if (alignment === 'end') {
      return availableSpace
    }

    return availableSpace / 2
  }

  async function renderMergedImage(): Promise<RenderedResult> {
    if (images.length < 2) {
      throw new Error(
        'Add at least two images before merging.',
      )
    }

    const loaded = await Promise.all(
      images.map((image) => loadImage(image.url)),
    )

    const { width, height } = canvasSize

    if (!width || !height) {
      throw new Error(
        'Unable to calculate the merged image dimensions.',
      )
    }

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error(
        'Your browser does not support canvas rendering.',
      )
    }

    canvas.width = width
    canvas.height = height

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const background = getBackgroundColor(
      backgroundMode,
      customColor,
    )

    if (background) {
      context.fillStyle = background
      context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height,
      )
    }

    let offset = 0

    loaded.forEach((image, index) => {
      if (direction === 'vertical') {
        const availableWidth =
          canvas.width - image.naturalWidth

        const x = getAlignedOffset(availableWidth)

        context.drawImage(
          image,
          x,
          offset,
          image.naturalWidth,
          image.naturalHeight,
        )

        offset += image.naturalHeight

        if (index < loaded.length - 1) {
          offset += spacing
        }
      } else {
        const availableHeight =
          canvas.height - image.naturalHeight

        const y = getAlignedOffset(availableHeight)

        context.drawImage(
          image,
          offset,
          y,
          image.naturalWidth,
          image.naturalHeight,
        )

        offset += image.naturalWidth

        if (index < loaded.length - 1) {
          offset += spacing
        }
      }
    })

    const mime = OUTPUT_MIME[outputFormat]

    const blob = await new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          resolve,
          mime,
          outputFormat === 'png'
            ? undefined
            : quality,
        )
      },
    )

    if (!blob) {
      throw new Error(
        'The browser could not create the merged image.',
      )
    }

    return {
      blob,
      width,
      height,
      url: URL.createObjectURL(blob),
    }
  }

  async function handlePreview() {
    setError('')
    setNotice('')

    if (images.length < 2) {
      setError(
        'Add at least two images to create a merged image.',
      )
      return
    }

    setIsRendering(true)

    try {
      const rendered = await renderMergedImage()

      setResult((current) => {
        if (current) {
          URL.revokeObjectURL(current.url)
        }

        return rendered
      })

      const canvas = previewCanvasRef.current

      if (canvas) {
        const context = canvas.getContext('2d')

        if (context) {
          const image = await loadImage(rendered.url)

          canvas.width = image.naturalWidth
          canvas.height = image.naturalHeight

          context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height,
          )

          context.drawImage(
            image,
            0,
            0,
          )
        }
      }
    } catch (renderError) {
      setError(
        renderError instanceof Error
          ? renderError.message
          : 'Unable to merge the images.',
      )
    } finally {
      setIsRendering(false)
    }
  }

  async function handleDownload() {
    setError('')

    if (images.length < 2) {
      setError(
        'Add at least two images before downloading.',
      )
      return
    }

    setIsDownloading(true)

    try {
      const rendered = await renderMergedImage()

      const link = document.createElement('a')

      link.href = rendered.url
      link.download = `imagemint-merged.${getExtension(
        outputFormat,
      )}`

      document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(rendered.url)

      setResult((current) => {
        if (current) {
          URL.revokeObjectURL(current.url)
        }

        return {
          ...rendered,
          url: URL.createObjectURL(rendered.blob),
        }
      })
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Unable to create the merged image.',
      )
    } finally {
      setIsDownloading(false)
    }
  }

  function handleReset() {
    images.forEach((image) => {
      URL.revokeObjectURL(image.url)
    })

    clearResult()

    setImages([])
    setDirection('vertical')
    setAlignment('center')
    setSpacing(16)
    setBackgroundMode('transparent')
    setCustomColor('#ffffff')
    setOutputFormat('png')
    setQuality(0.92)
    setDraggedId(null)
    setError('')
    setNotice('')
  }

  return (
    <>
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      <main className="merger-page">
        <section className="merger-hero">
          <div className="container">
            <span className="merger-hero__eyebrow">
              ImageMint Tool 06
            </span>

            <h1>Merge images.</h1>

            <p>
              Combine multiple images into one clean image
              directly in your browser.
            </p>
          </div>
        </section>

        <section className="merger-tool">
          <div className="container">
            {images.length === 0 ? (
              <div className="merger-card merger-card--upload">
                <UploadDropzone
                  multiple
                  onFilesSelected={handleFilesSelected}
                  title="Drop your images here"
                  browseText="Browse Files"
                  helperText="JPG, PNG or WEBP • Up to 30 images"
                />

                <p className="merger-privacy">
                  Your images are processed locally in your
                  browser. Nothing is uploaded.
                </p>
              </div>
            ) : (
              <div className="merger-workspace">
                <div className="merger-workspace__main">
                  <section className="merger-preview-panel">
                    <header className="merger-panel-heading">
                      <div>
                        <span>Preview</span>
                        <strong>
                          {images.length} image
                          {images.length === 1 ? '' : 's'}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="merger-reset-link"
                        onClick={handleReset}
                      >
                        Start over
                      </button>
                    </header>

                    <div className="merger-preview-stage">
                      {result ? (
                        <img
                          src={result.url}
                          alt="Merged image preview"
                          className="merger-preview-image"
                        />
                      ) : (
                        <div className="merger-preview-placeholder">
                          <span>
                            {images.length < 2
                              ? 'Add another image to preview the merge'
                              : 'Adjust the settings and preview your merged image'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="merger-preview-meta">
                      <div>
                        <span>Output</span>
                        <strong>
                          {canvasSize.width || '—'} ×{' '}
                          {canvasSize.height || '—'} px
                        </strong>
                      </div>

                      <div>
                        <span>Original files</span>
                        <strong>
                          {formatBytes(totalOriginalSize)}
                        </strong>
                      </div>

                      <div>
                        <span>Format</span>
                        <strong>
                          {outputFormat.toUpperCase()}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <aside className="merger-controls">
                    <header className="merger-controls__header">
                      <div>
                        <span>Merge settings</span>
                        <h2>Build your image</h2>
                      </div>

                      <button
                        type="button"
                        className="merger-reset-settings"
                        onClick={() => {
                          setDirection('vertical')
                          setAlignment('center')
                          setSpacing(16)
                          setBackgroundMode(
                            'transparent',
                          )
                          setCustomColor('#ffffff')
                          setOutputFormat('png')
                          setQuality(0.92)
                        }}
                      >
                        Reset settings
                      </button>
                    </header>

                    <section className="merger-section">
                      <div className="merger-section__heading">
                        <h3>Images</h3>
                        <span>
                          {images.length}/{MAX_IMAGES}
                        </span>
                      </div>

                      <div className="merger-image-list">
                        {images.map((image, index) => (
                          <div
                            key={image.id}
                            className={`merger-image-item ${
                              draggedId === image.id
                                ? 'merger-image-item--dragging'
                                : ''
                            }`}
                            draggable
                            onDragStart={() =>
                              handleDragStart(image.id)
                            }
                            onDragOver={
                              handleDragOver
                            }
                            onDrop={(event) =>
                              handleDropOnImage(
                                event,
                                image.id,
                              )
                            }
                          >
                            <div className="merger-image-item__number">
                              {index + 1}
                            </div>

                            <img
                              src={image.url}
                              alt=""
                              className="merger-image-item__thumbnail"
                            />

                            <div className="merger-image-item__details">
                              <strong>
                                {image.file.name}
                              </strong>

                              <span>
                                {image.width} ×{' '}
                                {image.height} px •{' '}
                                {formatBytes(
                                  image.file.size,
                                )}
                              </span>
                            </div>

                            <div className="merger-image-item__actions">
                              <button
                                type="button"
                                aria-label={`Move ${image.file.name} up`}
                                disabled={index === 0}
                                onClick={() =>
                                  moveImage(
                                    index,
                                    'up',
                                  )
                                }
                              >
                                ↑
                              </button>

                              <button
                                type="button"
                                aria-label={`Move ${image.file.name} down`}
                                disabled={
                                  index ===
                                  images.length - 1
                                }
                                onClick={() =>
                                  moveImage(
                                    index,
                                    'down',
                                  )
                                }
                              >
                                ↓
                              </button>

                              <button
                                type="button"
                                className="merger-image-item__remove"
                                aria-label={`Remove ${image.file.name}`}
                                onClick={() =>
                                  removeImage(
                                    image.id,
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {images.length < MAX_IMAGES && (
                        <UploadDropzone
                          multiple
                          onFilesSelected={
                            handleFilesSelected
                          }
                          title="Add more images"
                          browseText="Browse Files"
                          helperText="JPG, PNG or WEBP"
                        />
                      )}
                    </section>

                    <section className="merger-section">
                      <div className="merger-section__heading">
                        <h3>Direction</h3>
                      </div>

                      <div className="merger-choice-grid">
                        <button
                          type="button"
                          className={
                            direction === 'vertical'
                              ? 'is-active'
                              : ''
                          }
                          onClick={() =>
                            setDirection('vertical')
                          }
                        >
                          <strong>Vertical</strong>
                          <span>
                            Stack images top to bottom
                          </span>
                        </button>

                        <button
                          type="button"
                          className={
                            direction === 'horizontal'
                              ? 'is-active'
                              : ''
                          }
                          onClick={() =>
                            setDirection('horizontal')
                          }
                        >
                          <strong>Horizontal</strong>
                          <span>
                            Place images side by side
                          </span>
                        </button>
                      </div>
                    </section>

                    <section className="merger-section">
                      <div className="merger-section__heading">
                        <h3>Alignment</h3>
                      </div>

                      <div className="merger-segmented">
                        {(
                          [
                            ['start', 'Start'],
                            ['center', 'Centre'],
                            ['end', 'End'],
                          ] as const
                        ).map(([value, label]) => (
                          <button
                            type="button"
                            key={value}
                            className={
                              alignment === value
                                ? 'is-active'
                                : ''
                            }
                            onClick={() =>
                              setAlignment(value)
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="merger-section">
                      <div className="merger-section__heading">
                        <h3>Spacing</h3>
                        <strong>
                          {spacing}px
                        </strong>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={spacing}
                        onChange={(event) =>
                          setSpacing(
                            Number(event.target.value),
                          )
                        }
                        className="merger-range"
                        aria-label="Spacing between images"
                      />

                      <div className="merger-range-labels">
                        <span>0 px</span>
                        <span>100 px</span>
                      </div>
                    </section>

                    <section className="merger-section">
                      <div className="merger-section__heading">
                        <h3>Background</h3>
                      </div>

                      <select
                        className="merger-select"
                        value={backgroundMode}
                        onChange={(event) =>
                          setBackgroundMode(
                            event.target
                              .value as BackgroundMode,
                          )
                        }
                      >
                        <option value="transparent">
                          Transparent
                        </option>
                        <option value="white">
                          White
                        </option>
                        <option value="black">
                          Black
                        </option>
                        <option value="custom">
                          Custom color
                        </option>
                      </select>

                      {backgroundMode ===
                        'custom' && (
                        <div className="merger-color-control">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(event) =>
                              setCustomColor(
                                event.target.value,
                              )
                            }
                            aria-label="Custom background color"
                          />

                          <span>
                            {customColor.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </section>

                    <section className="merger-section">
                      <div className="merger-section__heading">
                        <h3>Output</h3>
                      </div>

                      <div className="merger-output-grid">
                        <label>
                          Format
                          <select
                            className="merger-select"
                            value={outputFormat}
                            onChange={(event) =>
                              setOutputFormat(
                                event.target
                                  .value as OutputFormat,
                              )
                            }
                          >
                            <option value="png">
                              PNG
                            </option>
                            <option value="jpeg">
                              JPEG
                            </option>
                            <option value="webp">
                              WEBP
                            </option>
                          </select>
                        </label>

                        <div>
                          <span className="merger-quality-label">
                            Quality
                          </span>

                          <div className="merger-quality-value">
                            {Math.round(
                              quality * 100,
                            )}
                            %
                          </div>

                          <input
                            type="range"
                            min="0.5"
                            max="1"
                            step="0.01"
                            value={quality}
                            disabled={
                              outputFormat === 'png'
                            }
                            onChange={(event) =>
                              setQuality(
                                Number(
                                  event.target.value,
                                ),
                              )
                            }
                            className="merger-range"
                            aria-label="Output quality"
                          />

                          <small>
                            {outputFormat === 'png'
                              ? 'PNG is lossless.'
                              : 'Higher quality produces a larger file.'}
                          </small>
                        </div>
                      </div>
                    </section>

                    {error && (
                      <p
                        className="merger-error"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}

                    {notice && (
                      <p className="merger-notice">
                        {notice}
                      </p>
                    )}

                    <div className="merger-actions">
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={handlePreview}
                        disabled={
                          images.length < 2 ||
                          isRendering ||
                          isDownloading
                        }
                      >
                        {isRendering
                          ? 'Rendering…'
                          : 'Preview Merge'}
                      </button>

                      <button
                        type="button"
                        className="btn merger-main-button"
                        onClick={handleDownload}
                        disabled={
                          images.length < 2 ||
                          isRendering ||
                          isDownloading
                        }
                      >
                        {isDownloading
                          ? 'Preparing…'
                          : 'Download Merged Image'}
                      </button>
                    </div>

                    <p className="merger-privacy">
                      Your images never leave your device.
                      ImageMint processes the merge locally
                      in your browser.
                    </p>
                  </aside>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <canvas
        ref={previewCanvasRef}
        className="merger-hidden-canvas"
        aria-hidden="true"
      />
    </>
  )
}