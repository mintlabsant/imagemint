import { useEffect, useRef, useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import '../../styles/tools/compress.css'

type CompressPageProps = {
  darkMode: boolean
  onToggleDarkMode: () => void
}

type ImageInfo = {
  width: number
  height: number
  size: number
  type: string
}

type CompressionResult = {
  url: string
  size: number
  width: number
  height: number
  format: string
  savedPercent: number
  usedOriginal: boolean
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_FILE_SIZE = 20 * 1024 * 1024

const FORMAT_OPTIONS = [
  {
    value: 'image/jpeg',
    label: 'JPG',
  },
  {
    value: 'image/webp',
    label: 'WEBP',
  },
  {
    value: 'image/png',
    label: 'PNG',
  },
]

export default function CompressPage({
  darkMode,
  onToggleDarkMode,
}: CompressPageProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null)

  const [imageInfo, setImageInfo] =
    useState<ImageInfo | null>(null)

  const [quality, setQuality] = useState(75)

  const [outputFormat, setOutputFormat] =
    useState('image/jpeg')

  const [maxWidth, setMaxWidth] =
    useState('')

  const [maxHeight, setMaxHeight] =
    useState('')

  const [isDragging, setIsDragging] =
    useState(false)

  const [isCompressing, setIsCompressing] =
    useState(false)

  const [result, setResult] =
    useState<CompressionResult | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const inputRef =
    useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      setImageInfo(null)
      return
    }

    const objectUrl =
      URL.createObjectURL(file)

    setPreviewUrl(objectUrl)

    const image = new Image()

    image.onload = () => {
      setImageInfo({
        width: image.naturalWidth,
        height: image.naturalHeight,
        size: file.size,
        type: file.type,
      })
    }

    image.onerror = () => {
      setError(
        'Unable to read this image. Please choose another file.',
      )
    }

    image.src = objectUrl

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  useEffect(() => {
    return () => {
      if (result?.url) {
        URL.revokeObjectURL(result.url)
      }
    }
  }, [result])

  function formatFileSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  function getFormatLabel(format: string) {
    if (format === 'image/png') {
      return 'PNG'
    }

    if (format === 'image/webp') {
      return 'WEBP'
    }

    return 'JPG'
  }

  function handleFile(
    selectedFile: File | undefined,
  ) {
    if (!selectedFile) {
      return
    }

    setError(null)
    setResult(null)

    if (
      !ACCEPTED_TYPES.includes(
        selectedFile.type,
      )
    ) {
      setError(
        'Please choose a JPG, PNG, or WEBP image.',
      )
      return
    }

    if (
      selectedFile.size > MAX_FILE_SIZE
    ) {
      setError(
        'This image is larger than 20 MB. Please choose a smaller file.',
      )
      return
    }

    setFile(selectedFile)

    if (
      selectedFile.type === 'image/webp'
    ) {
      setOutputFormat('image/webp')
    } else if (
      selectedFile.type === 'image/png'
    ) {
      setOutputFormat('image/png')
    } else {
      setOutputFormat('image/jpeg')
    }
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    handleFile(
      event.target.files?.[0],
    )
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

  function handleDrop(
    event: React.DragEvent<HTMLLabelElement>,
  ) {
    event.preventDefault()
    setIsDragging(false)

    handleFile(
      event.dataTransfer.files[0],
    )
  }

  function openFilePicker() {
    inputRef.current?.click()
  }

  function calculateDimensions(
    width: number,
    height: number,
  ) {
    let newWidth = width
    let newHeight = height

    const widthLimit =
      Number(maxWidth)

    const heightLimit =
      Number(maxHeight)

    if (
      Number.isFinite(widthLimit) &&
      widthLimit > 0 &&
      newWidth > widthLimit
    ) {
      const ratio =
        widthLimit / newWidth

      newWidth = widthLimit
      newHeight =
        newHeight * ratio
    }

    if (
      Number.isFinite(heightLimit) &&
      heightLimit > 0 &&
      newHeight > heightLimit
    ) {
      const ratio =
        heightLimit / newHeight

      newHeight = heightLimit
      newWidth =
        newWidth * ratio
    }

    return {
      width: Math.max(
        1,
        Math.round(newWidth),
      ),
      height: Math.max(
        1,
        Math.round(newHeight),
      ),
    }
  }

  function loadImage(
    image: HTMLImageElement,
    url: string,
  ) {
    return new Promise<void>(
      (resolve, reject) => {
        image.onload = () =>
          resolve()

        image.onerror = () =>
          reject(
            new Error(
              'Could not load the image.',
            ),
          )

        image.src = url
      },
    )
  }

  function canvasToBlob(
    canvas: HTMLCanvasElement,
    format: string,
    imageQuality: number,
  ) {
    return new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          resolve,
          format,
          imageQuality,
        )
      },
    )
  }

  async function compressImage() {
    const currentFile = file
    const currentImageInfo =
      imageInfo

    if (
      !currentFile ||
      !currentImageInfo
    ) {
      return
    }

    setError(null)
    setResult(null)
    setIsCompressing(true)

    let sourceUrl: string | null =
      null

    try {
      sourceUrl =
        URL.createObjectURL(
          currentFile,
        )

      const image =
        new Image()

      await loadImage(
        image,
        sourceUrl,
      )

      const dimensions =
        calculateDimensions(
          currentImageInfo.width,
          currentImageInfo.height,
        )

      const canvas =
        document.createElement(
          'canvas',
        )

      canvas.width =
        dimensions.width

      canvas.height =
        dimensions.height

      const context =
        canvas.getContext('2d')

      if (!context) {
        throw new Error(
          'Your browser does not support image processing.',
        )
      }

      context.imageSmoothingEnabled =
        true

      context.imageSmoothingQuality =
        'high'

      /*
       * PNG is lossless, so the quality
       * slider does not meaningfully
       * control PNG compression.
       */
      const isLossyFormat =
        outputFormat ===
          'image/jpeg' ||
        outputFormat ===
          'image/webp'

      const imageQuality =
        isLossyFormat
          ? quality / 100
          : undefined

      /*
       * JPEG does not support transparency.
       * Fill the canvas with white before
       * drawing when converting to JPEG.
       */
      if (
        outputFormat ===
        'image/jpeg'
      ) {
        context.fillStyle =
          '#ffffff'

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

      const blob =
        await canvasToBlob(
          canvas,
          outputFormat,
          imageQuality ??
            1,
        )

      if (!blob) {
        throw new Error(
          'The browser could not create the compressed image.',
        )
      }

      /*
       * The critical protection:
       *
       * If the generated file is larger
       * than the original, we do NOT use it.
       *
       * This prevents ImageMint from
       * calling a larger file "compressed".
       */
      const generatedIsSmaller =
        blob.size <
        currentFile.size

      if (
        !generatedIsSmaller
      ) {
        const originalUrl =
          URL.createObjectURL(
            currentFile,
          )

        setResult({
          url: originalUrl,
          size: currentFile.size,
          width:
            currentImageInfo.width,
          height:
            currentImageInfo.height,
          format:
            currentFile.type,
          savedPercent: 0,
          usedOriginal: true,
        })

        return
      }

      const compressedUrl =
        URL.createObjectURL(blob)

      const savedPercent =
        Math.round(
          (1 -
            blob.size /
              currentFile.size) *
            100,
        )

      setResult({
        url: compressedUrl,
        size: blob.size,
        width:
          dimensions.width,
        height:
          dimensions.height,
        format: outputFormat,
        savedPercent:
          Math.max(
            0,
            savedPercent,
          ),
        usedOriginal: false,
      })
    } catch (compressionError) {
      console.error(
        compressionError,
      )

      setError(
        'Something went wrong while processing the image. Please try again.',
      )
    } finally {
      if (sourceUrl) {
        URL.revokeObjectURL(
          sourceUrl,
        )
      }

      setIsCompressing(false)
    }
  }

  function downloadResult() {
    const currentResult =
      result

    const currentFile =
      file

    if (
      !currentResult ||
      !currentFile
    ) {
      return
    }

    const extension =
      getFormatLabel(
        currentResult.format,
      ).toLowerCase()

    const originalName =
      currentFile.name.replace(
        /\.[^/.]+$/,
        '',
      )

    const filename =
      currentResult.usedOriginal
        ? `${originalName}.${extension}`
        : `${originalName}-compressed.${extension}`

    const link =
      document.createElement(
        'a',
      )

    link.href =
      currentResult.url

    link.download =
      filename

    document.body.appendChild(
      link,
    )

    link.click()

    link.remove()
  }

  function resetFile() {
    setFile(null)
    setPreviewUrl(null)
    setImageInfo(null)
    setResult(null)
    setError(null)

    setMaxWidth('')
    setMaxHeight('')

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const hasResult =
    Boolean(result)

  return (
    <>
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={
          onToggleDarkMode
        }
      />

      <main className="compress-page">
        <section className="compress-hero">
          <div className="container">
            <span className="compress-eyebrow">
              ImageMint Tool
            </span>

            <h1>
              Compress Images
            </h1>

            <p>
              Make your images smaller
              without unnecessary
              complexity.
            </p>
          </div>
        </section>

        <section className="compress-tool">
          <div className="container">
            <div className="compress-card">
              {!file ? (
                <label
                  className={`compress-upload ${
                    isDragging
                      ? 'compress-upload--dragging'
                      : ''
                  }`}
                  onDrop={
                    handleDrop
                  }
                  onDragOver={
                    handleDragOver
                  }
                  onDragLeave={
                    handleDragLeave
                  }
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={
                      handleInputChange
                    }
                  />

                  <div className="compress-upload__icon">
                    ↑
                  </div>

                  <strong>
                    Drop your image here
                  </strong>

                  <span>
                    or{' '}
                    <button
                      type="button"
                      className="compress-upload__browse"
                      onClick={
                        openFilePicker
                      }
                    >
                      Browse Files
                    </button>
                  </span>

                  <small>
                    JPG, PNG or WEBP ·
                    Maximum 20 MB
                  </small>
                </label>
              ) : (
                <div className="compress-workspace">
                  <div className="compress-main">
                    <div className="compress-preview">
                      <div className="compress-preview__image-wrapper">
                        {previewUrl && (
                          <img
                            src={
                              previewUrl
                            }
                            alt={`Preview of ${file.name}`}
                            className="compress-preview__image"
                          />
                        )}
                      </div>

                      <div className="compress-file-info">
                        <div>
                          <strong>
                            {file.name}
                          </strong>

                          <span>
                            {formatFileSize(
                              file.size,
                            )}
                          </span>
                        </div>

                        {imageInfo && (
                          <span>
                            {
                              imageInfo.width
                            }{' '}
                            ×{' '}
                            {
                              imageInfo.height
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="compress-settings">
                      <div className="compress-settings__header">
                        <div>
                          <h2>
                            Compression
                            Settings
                          </h2>

                          <p>
                            Adjust the
                            output to
                            balance
                            quality and
                            file size.
                          </p>
                        </div>
                      </div>

                      <div className="compress-setting">
                        <div className="compress-setting__label">
                          <label htmlFor="quality">
                            Quality
                          </label>

                          <strong>
                            {quality}%
                          </strong>
                        </div>

                        <input
                          id="quality"
                          className="compress-range"
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={
                            quality
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
                          disabled={
                            outputFormat ===
                            'image/png'
                          }
                        />

                        <div className="compress-range-labels">
                          <span>
                            Smaller
                          </span>

                          <span>
                            Better quality
                          </span>
                        </div>

                        {outputFormat ===
                          'image/png' && (
                          <small>
                            PNG is
                            lossless, so
                            quality does
                            not affect
                            PNG output.
                          </small>
                        )}
                      </div>

                      <div className="compress-setting">
                        <label htmlFor="format">
                          Output Format
                        </label>

                        <select
                          id="format"
                          className="compress-select"
                          value={
                            outputFormat
                          }
                          onChange={(
                            event,
                          ) =>
                            setOutputFormat(
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          {FORMAT_OPTIONS.map(
                            (
                              option,
                            ) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {
                                  option.label
                                }
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div className="compress-setting">
                        <label>
                          Maximum Dimensions
                        </label>

                        <div className="compress-dimensions">
                          <input
                            type="number"
                            min="1"
                            placeholder="Width"
                            value={
                              maxWidth
                            }
                            onChange={(
                              event,
                            ) =>
                              setMaxWidth(
                                event
                                  .target
                                  .value,
                              )
                            }
                          />

                          <span>
                            ×
                          </span>

                          <input
                            type="number"
                            min="1"
                            placeholder="Height"
                            value={
                              maxHeight
                            }
                            onChange={(
                              event,
                            ) =>
                              setMaxHeight(
                                event
                                  .target
                                  .value,
                              )
                            }
                          />
                        </div>

                        <small>
                          Leave blank to
                          keep the
                          original
                          dimensions.
                        </small>
                      </div>

                      {error && (
                        <div className="compress-error">
                          {error}
                        </div>
                      )}

                      {!hasResult ? (
                        <button
                          type="button"
                          className="btn btn--primary compress-action"
                          onClick={
                            compressImage
                          }
                          disabled={
                            isCompressing
                          }
                        >
                          {isCompressing
                            ? 'Compressing…'
                            : 'Compress Image'}
                        </button>
                      ) : (
                        <div className="compress-result">
                          {result?.usedOriginal ? (
                            <div className="compress-result__message">
                              <strong>
                                No reduction
                                achieved
                              </strong>

                              <span>
                                The generated
                                image was
                                larger than
                                the original,
                                so ImageMint
                                kept your
                                original file.
                              </span>
                            </div>
                          ) : (
                            <div className="compress-result__message compress-result__message--success">
                              <strong>
                                {result?.savedPercent}
                                % smaller
                              </strong>

                              <span>
                                Your image
                                was
                                successfully
                                compressed.
                              </span>
                            </div>
                          )}

                          <div className="compress-result__stats">
                            <div>
                              <span>
                                Original
                              </span>

                              <strong>
                                {formatFileSize(
                                  file.size,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Result
                              </span>

                              <strong>
                                {result &&
                                  formatFileSize(
                                    result.size,
                                  )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Dimensions
                              </span>

                              <strong>
                                {result?.width}{' '}
                                ×{' '}
                                {result?.height}
                              </strong>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn--primary compress-action"
                            onClick={
                              downloadResult
                            }
                          >
                            Download Image
                          </button>

                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={
                              compressImage
                            }
                          >
                            Compress Again
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        className="compress-reset"
                        onClick={
                          resetFile
                        }
                      >
                        Choose Another Image
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="compress-privacy">
              Your image is processed
              directly in your browser.
              It is not uploaded to a
              server.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}