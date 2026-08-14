import { useEffect, useRef, useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import '../../styles/tools/splitter.css'

type SplitterPageProps = {
  darkMode: boolean
  onToggleDarkMode: () => void
}

type OutputFormat =
  | 'original'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'

type SplitDirection = 'grid' | 'horizontal' | 'vertical'

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_DIMENSION = 10000
const MAX_PARTS = 100

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

function getPartCount(
  direction: SplitDirection,
  rows: number,
  columns: number,
) {
  if (direction === 'horizontal') {
    return rows
  }

  if (direction === 'vertical') {
    return columns
  }

  return rows * columns
}

function clampInteger(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(min, Math.round(value)),
  )
}

export default function SplitterPage({
  darkMode,
  onToggleDarkMode,
}: SplitterPageProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null)

  const [originalWidth, setOriginalWidth] = useState(0)
  const [originalHeight, setOriginalHeight] = useState(0)

  const [direction, setDirection] =
    useState<SplitDirection>('grid')

  const [rows, setRows] = useState(2)
  const [columns, setColumns] = useState(2)

  const [outputFormat, setOutputFormat] =
    useState<OutputFormat>('original')

  const [quality, setQuality] = useState(90)

  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const [processedParts, setProcessedParts] = useState<
    string[]
  >([])

  const [processedSize, setProcessedSize] =
    useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

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
      processedParts.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [processedParts])

  function clearProcessedParts() {
    processedParts.forEach((url) => {
      URL.revokeObjectURL(url)
    })

    setProcessedParts([])
    setProcessedSize(null)
  }

  function handleFile(
    selectedFile: File | undefined,
  ) {
    if (!selectedFile) return

    setError(null)
    clearProcessedParts()

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError(
        'Please select a JPG, PNG, or WEBP image.',
      )
      return
    }

    const image = new Image()
    const imageUrl =
      URL.createObjectURL(selectedFile)

    image.onload = () => {
      URL.revokeObjectURL(imageUrl)

      if (
        image.naturalWidth > MAX_DIMENSION ||
        image.naturalHeight > MAX_DIMENSION
      ) {
        setError(
          `Maximum supported image dimension is ${MAX_DIMENSION.toLocaleString()} × ${MAX_DIMENSION.toLocaleString()} pixels.`,
        )

        return
      }

      setFile(selectedFile)

      setOriginalWidth(image.naturalWidth)
      setOriginalHeight(image.naturalHeight)

      setDirection('grid')
      setRows(2)
      setColumns(2)
      setOutputFormat('original')
      setQuality(90)
    }

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)

      setError(
        'This image could not be read. Please try another file.',
      )
    }

    image.src = imageUrl
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    handleFile(event.target.files?.[0])
  }

  function handleDrop(
    event: React.DragEvent<HTMLLabelElement>,
  ) {
    event.preventDefault()
    setIsDragging(false)

    handleFile(event.dataTransfer.files[0])
  }

  function handleDragOver(
    event: React.DragEvent<HTMLLabelElement>,
  ) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function openFilePicker() {
    inputRef.current?.click()
  }

  function handleDirectionChange(
    value: SplitDirection,
  ) {
    setDirection(value)
    clearProcessedParts()
    setError(null)

    if (value === 'horizontal') {
      setColumns(1)
    }

    if (value === 'vertical') {
      setRows(1)
    }

    if (value === 'grid') {
      setRows(2)
      setColumns(2)
    }
  }

  function handleRowsChange(value: number) {
    const nextRows = clampInteger(
      value,
      1,
      MAX_PARTS,
    )

    if (
      nextRows * columns > MAX_PARTS
    ) {
      setError(
        `You can create a maximum of ${MAX_PARTS} pieces.`,
      )
      return
    }

    setRows(nextRows)
    clearProcessedParts()
    setError(null)
  }

  function handleColumnsChange(value: number) {
    const nextColumns = clampInteger(
      value,
      1,
      MAX_PARTS,
    )

    if (
      rows * nextColumns > MAX_PARTS
    ) {
      setError(
        `You can create a maximum of ${MAX_PARTS} pieces.`,
      )
      return
    }

    setColumns(nextColumns)
    clearProcessedParts()
    setError(null)
  }

  function resetSettings() {
    setDirection('grid')
    setRows(2)
    setColumns(2)
    setOutputFormat('original')
    setQuality(90)
    clearProcessedParts()
    setError(null)
  }

  function resetFile() {
    clearProcessedParts()

    setFile(null)
    setPreviewUrl(null)

    setOriginalWidth(0)
    setOriginalHeight(0)

    setDirection('grid')
    setRows(2)
    setColumns(2)

    setOutputFormat('original')
    setQuality(90)

    setError(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  async function splitImage() {
    if (!file) {
      setError('Please select an image first.')
      return
    }

    if (
      originalWidth <= 0 ||
      originalHeight <= 0
    ) {
      setError('Unable to determine image dimensions.')
      return
    }

    const partCount = getPartCount(
      direction,
      rows,
      columns,
    )

    if (partCount > MAX_PARTS) {
      setError(
        `You can create a maximum of ${MAX_PARTS} pieces.`,
      )
      return
    }

    setIsProcessing(true)
    setError(null)

    clearProcessedParts()

    try {
      const image = new Image()

      const imageUrl =
        URL.createObjectURL(file)

      await new Promise<void>(
        (resolve, reject) => {
          image.onload = () => resolve()

          image.onerror = () =>
            reject(
              new Error(
                'Unable to load image.',
              ),
            )

          image.src = imageUrl
        },
      )

      URL.revokeObjectURL(imageUrl)

      const mimeType = getMimeType(
        outputFormat,
        file.type,
      )

      const canvasQuality =
        mimeType === 'image/jpeg' ||
        mimeType === 'image/webp'
          ? quality / 100
          : undefined

      const generatedUrls: string[] = []
      let totalBytes = 0

      async function createPart(
        sourceX: number,
        sourceY: number,
        partWidth: number,
        partHeight: number,
        index: number,
      ) {
        const canvas =
          document.createElement('canvas')

        canvas.width = partWidth
        canvas.height = partHeight

        const context =
          canvas.getContext('2d')

        if (!context) {
          throw new Error(
            'Your browser does not support image processing.',
          )
        }

        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'

        if (mimeType === 'image/jpeg') {
          context.fillStyle = '#ffffff'
          context.fillRect(
            0,
            0,
            partWidth,
            partHeight,
          )
        }

        context.drawImage(
          image,
          sourceX,
          sourceY,
          partWidth,
          partHeight,
          0,
          0,
          partWidth,
          partHeight,
        )

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
            `Could not create image piece ${index}.`,
          )
        }

        totalBytes += blob.size

        const url =
          URL.createObjectURL(blob)

        generatedUrls.push(url)
      }

      if (direction === 'horizontal') {
        const baseHeight = Math.floor(
          originalHeight / rows,
        )

        for (let row = 0; row < rows; row += 1) {
          const sourceY =
            row * baseHeight

          const partHeight =
            row === rows - 1
              ? originalHeight - sourceY
              : baseHeight

          await createPart(
            0,
            sourceY,
            originalWidth,
            partHeight,
            row + 1,
          )
        }
      } else if (
        direction === 'vertical'
      ) {
        const baseWidth = Math.floor(
          originalWidth / columns,
        )

        for (
          let column = 0;
          column < columns;
          column += 1
        ) {
          const sourceX =
            column * baseWidth

          const partWidth =
            column === columns - 1
              ? originalWidth - sourceX
              : baseWidth

          await createPart(
            sourceX,
            0,
            partWidth,
            originalHeight,
            column + 1,
          )
        }
      } else {
        const baseWidth = Math.floor(
          originalWidth / columns,
        )

        const baseHeight = Math.floor(
          originalHeight / rows,
        )

        let index = 1

        for (
          let row = 0;
          row < rows;
          row += 1
        ) {
          const sourceY =
            row * baseHeight

          const partHeight =
            row === rows - 1
              ? originalHeight - sourceY
              : baseHeight

          for (
            let column = 0;
            column < columns;
            column += 1
          ) {
            const sourceX =
              column * baseWidth

            const partWidth =
              column === columns - 1
                ? originalWidth - sourceX
                : baseWidth

            await createPart(
              sourceX,
              sourceY,
              partWidth,
              partHeight,
              index,
            )

            index += 1
          }
        }
      }

      setProcessedParts(generatedUrls)
      setProcessedSize(totalBytes)
    } catch {
      setError(
        'Something went wrong while splitting the image. Please try again.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  function downloadPart(
    url: string,
    index: number,
  ) {
    if (!file) return

    const extension = getExtension(
      getMimeType(
        outputFormat,
        file.type,
      ),
    )

    const baseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/\s+/g, '-')

    const link =
      document.createElement('a')

    link.href = url

    link.download =
      `${baseName}-part-${String(index + 1).padStart(2, '0')}.${extension}`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function downloadAllParts() {
    processedParts.forEach(
      (url, index) => {
        window.setTimeout(() => {
          downloadPart(url, index)
        }, index * 150)
      },
    )
  }

  const effectiveOutputType = file
    ? getMimeType(
        outputFormat,
        file.type,
      )
    : 'image/png'

  const formatLabel =
    effectiveOutputType === 'image/jpeg'
      ? 'JPG'
      : effectiveOutputType === 'image/png'
        ? 'PNG'
        : 'WEBP'

  const partCount = getPartCount(
    direction,
    rows,
    columns,
  )

  return (
    <>
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      <main className="splitter-page">
        <section className="splitter-hero">
          <div className="container">
            <p className="splitter-hero__eyebrow">
              IMAGEMINT TOOL
            </p>

            <h1>Split Images</h1>

            <p>
              Divide one image into multiple precise
              pieces. Choose a grid, horizontal strips,
              or vertical strips and download every part
              directly from your browser.
            </p>
          </div>
        </section>

        <section className="splitter-tool">
          <div className="container">
            <div className="splitter-card">
              {!file ? (
                <label
                  className={`splitter-upload ${
                    isDragging
                      ? 'splitter-upload--dragging'
                      : ''
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleInputChange}
                  />

                  <span
                    className="splitter-upload__icon"
                    aria-hidden="true"
                  >
                    ⊞
                  </span>

                  <strong>
                    Drop your image here
                  </strong>

                  <span>
                    or{' '}
                    <button
                      type="button"
                      className="splitter-upload__browse"
                      onClick={(event) => {
                        event.preventDefault()
                        openFilePicker()
                      }}
                    >
                      Browse Files
                    </button>
                  </span>

                  <small>
                    JPG, PNG or WEBP · processed locally
                  </small>
                </label>
              ) : (
                <div className="splitter-workspace">
                  <div className="splitter-preview-panel">
                    <div className="splitter-panel-heading">
                      <div>
                        <span>Preview</span>

                        <strong>
                          {file.name}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="splitter-reset-link"
                        onClick={resetFile}
                      >
                        Choose another
                      </button>
                    </div>

                    <div className="splitter-image-stage">
                      {previewUrl && (
                        <>
                          <img
                            src={previewUrl}
                            alt={`Preview of ${file.name}`}
                            className="splitter-preview-image"
                          />

                          <div
                            className="splitter-grid-overlay"
                            style={{
                              gridTemplateColumns:
                                `repeat(${direction === 'horizontal' ? 1 : columns}, 1fr)`,
                              gridTemplateRows:
                                `repeat(${direction === 'vertical' ? 1 : rows}, 1fr)`,
                            }}
                            aria-hidden="true"
                          >
                            {Array.from({
                              length: partCount,
                            }).map(
                              (_, index) => (
                                <span
                                  key={index}
                                />
                              ),
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="splitter-original-info">
                      <div>
                        <span>
                          Original
                        </span>

                        <strong>
                          {originalWidth} ×{' '}
                          {originalHeight}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Pieces
                        </span>

                        <strong>
                          {partCount}
                        </strong>
                      </div>

                      <div>
                        <span>
                          File size
                        </span>

                        <strong>
                          {formatFileSize(
                            file.size,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="splitter-controls">
                    <div className="splitter-controls__top">
                      <div>
                        <span className="splitter-controls__eyebrow">
                          Split settings
                        </span>

                        <h2>
                          Divide your image
                        </h2>
                      </div>

                      <button
                        type="button"
                        className="splitter-reset-settings"
                        onClick={
                          resetSettings
                        }
                      >
                        Reset
                      </button>
                    </div>

                    <div className="splitter-section">
                      <div className="splitter-section__heading">
                        <h3>
                          Split direction
                        </h3>
                      </div>

                      <div className="splitter-direction">
                        <button
                          type="button"
                          className={
                            direction ===
                            'grid'
                              ? 'splitter-option splitter-option--active'
                              : 'splitter-option'
                          }
                          onClick={() =>
                            handleDirectionChange(
                              'grid',
                            )
                          }
                        >
                          <strong>
                            Grid
                          </strong>

                          <span>
                            Rows × columns
                          </span>
                        </button>

                        <button
                          type="button"
                          className={
                            direction ===
                            'horizontal'
                              ? 'splitter-option splitter-option--active'
                              : 'splitter-option'
                          }
                          onClick={() =>
                            handleDirectionChange(
                              'horizontal',
                            )
                          }
                        >
                          <strong>
                            Horizontal
                          </strong>

                          <span>
                            Horizontal strips
                          </span>
                        </button>

                        <button
                          type="button"
                          className={
                            direction ===
                            'vertical'
                              ? 'splitter-option splitter-option--active'
                              : 'splitter-option'
                          }
                          onClick={() =>
                            handleDirectionChange(
                              'vertical',
                            )
                          }
                        >
                          <strong>
                            Vertical
                          </strong>

                          <span>
                            Vertical strips
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="splitter-section">
                      <div className="splitter-section__heading">
                        <h3>
                          Division
                        </h3>

                        <span>
                          {partCount}{' '}
                          {partCount === 1
                            ? 'piece'
                            : 'pieces'}
                        </span>
                      </div>

                      <div className="splitter-dimensions">
                        <label>
                          <span>
                            Rows
                          </span>

                          <input
                            type="number"
                            min="1"
                            max={MAX_PARTS}
                            value={
                              direction ===
                              'vertical'
                                ? 1
                                : rows
                            }
                            disabled={
                              direction ===
                              'vertical'
                            }
                            onChange={(
                              event,
                            ) =>
                              handleRowsChange(
                                Number(
                                  event.target
                                    .value,
                                ),
                              )
                            }
                          />
                        </label>

                        <span className="splitter-dimensions__x">
                          ×
                        </span>

                        <label>
                          <span>
                            Columns
                          </span>

                          <input
                            type="number"
                            min="1"
                            max={MAX_PARTS}
                            value={
                              direction ===
                              'horizontal'
                                ? 1
                                : columns
                            }
                            disabled={
                              direction ===
                              'horizontal'
                            }
                            onChange={(
                              event,
                            ) =>
                              handleColumnsChange(
                                Number(
                                  event.target
                                    .value,
                                ),
                              )
                            }
                          />
                        </label>
                      </div>

                      <small className="splitter-help">
                        Maximum {MAX_PARTS}{' '}
                        pieces per operation.
                      </small>
                    </div>

                    <div className="splitter-section">
                      <div className="splitter-section__heading">
                        <h3>
                          Output format
                        </h3>
                      </div>

                      <div className="splitter-format">
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
                            ) =>
                              setOutputFormat(
                                event.target
                                  .value as OutputFormat,
                              )
                            }
                          >
                            <option value="original">
                              Keep original (
                              {formatLabel})
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
                              {quality}%
                            </strong>
                          </span>

                          <input
                            className="splitter-quality"
                            type="range"
                            min="10"
                            max="100"
                            value={quality}
                            disabled={
                              effectiveOutputType ===
                              'image/png'
                            }
                            onChange={(
                              event,
                            ) =>
                              setQuality(
                                Number(
                                  event.target
                                    .value,
                                ),
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>

                    {error && (
                      <div
                        className="splitter-error"
                        role="alert"
                      >
                        {error}
                      </div>
                    )}

                    <div className="splitter-actions">
                      {processedParts.length ===
                      0 ? (
                        <button
                          type="button"
                          className="btn btn--primary splitter-main-button"
                          onClick={
                            splitImage
                          }
                          disabled={
                            isProcessing
                          }
                        >
                          {isProcessing
                            ? 'Splitting...'
                            : `Split into ${partCount} pieces`}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn--primary splitter-main-button"
                            onClick={
                              downloadAllParts
                            }
                          >
                            Download All
                          </button>

                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={
                              splitImage
                            }
                          >
                            Split Again
                          </button>
                        </>
                      )}
                    </div>

                    <p className="splitter-privacy">
                      Your image is processed directly
                      in your browser. Nothing is
                      uploaded to a server.
                    </p>
                  </div>
                </div>
              )}

              {processedParts.length > 0 && (
                <div className="splitter-results">
                  <div className="splitter-results__header">
                    <div>
                      <span>
                        Generated pieces
                      </span>

                      <h2>
                        {processedParts.length}{' '}
                        pieces ready
                      </h2>
                    </div>

                    {processedSize !== null && (
                      <strong>
                        {formatFileSize(
                          processedSize,
                        )}{' '}
                        total
                      </strong>
                    )}
                  </div>

                  <div className="splitter-results__grid">
                    {processedParts.map(
                      (url, index) => (
                        <article
                          className="splitter-result-card"
                          key={url}
                        >
                          <div className="splitter-result-preview">
                            <img
                              src={url}
                              alt={`Split piece ${index + 1}`}
                            />
                          </div>

                          <div className="splitter-result-info">
                            <strong>
                              Part{' '}
                              {String(
                                index + 1,
                              ).padStart(
                                2,
                                '0',
                              )}
                            </strong>

                            <button
                              type="button"
                              className="splitter-download"
                              onClick={() =>
                                downloadPart(
                                  url,
                                  index,
                                )
                              }
                            >
                              Download
                            </button>
                          </div>
                        </article>
                      ),
                    )}
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