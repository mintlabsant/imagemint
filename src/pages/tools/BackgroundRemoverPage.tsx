import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import UploadDropzone from '../../components/UploadDropzone'
import '../../styles/tools/background-remover.css'

import { removeBackground } from '@imgly/background-removal'

type BackgroundRemoverPageProps = {
  darkMode: boolean
  onToggleDarkMode: () => void
}

type BackgroundMode =
  | 'transparent'
  | 'white'
  | 'black'
  | 'custom'
  | 'gradient'

type OutputFormat =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'

type ProcessingDevice = 'gpu' | 'cpu'

type ModelQuality =
  | 'isnet_fp16'
  | 'isnet'
  | 'isnet_quint8'

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_DIMENSION = 10000

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
  if (format === 'image/jpeg') {
    return 'jpg'
  }

  if (format === 'image/webp') {
    return 'webp'
  }

  return 'png'
}

function getImageDimensions(file: File) {
  return new Promise<{
    width: number
    height: number
  }>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      }

      URL.revokeObjectURL(url)
      resolve(dimensions)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to read image.'))
    }

    image.src = url
  })
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const image = new Image()

      image.onload = () => resolve(image)

      image.onerror = () =>
        reject(
          new Error('Unable to load processed image.'),
        )

      image.src = url
    },
  )
}

function downloadBlob(
  blob: Blob,
  filename: string,
) {
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

function createGradient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const gradient = context.createLinearGradient(
    0,
    0,
    width,
    height,
  )

  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(0.5, '#dbeafe')
  gradient.addColorStop(1, '#ede9fe')

  return gradient
}

export default function BackgroundRemoverPage({
  darkMode,
  onToggleDarkMode,
}: BackgroundRemoverPageProps) {
  const [file, setFile] = useState<File | null>(null)

  const [sourceUrl, setSourceUrl] =
    useState<string | null>(null)

  const [resultUrl, setResultUrl] =
    useState<string | null>(null)

  const [compositedUrl, setCompositedUrl] =
    useState<string | null>(null)

  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)

  const [backgroundMode, setBackgroundMode] =
    useState<BackgroundMode>('transparent')

  const [customColor, setCustomColor] =
    useState('#ffffff')

  const [outputFormat, setOutputFormat] =
    useState<OutputFormat>('image/png')

  const [quality, setQuality] = useState(92)

  const [device, setDevice] =
    useState<ProcessingDevice>('gpu')

  const [model, setModel] =
    useState<ModelQuality>('isnet_fp16')

  const [isProcessing, setIsProcessing] =
    useState(false)

  const [progress, setProgress] = useState(0)

  const [processingStage, setProcessingStage] =
    useState('')

  const [processedSize, setProcessedSize] =
    useState<number | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const processingIdRef = useRef(0)

  const displayUrl =
    compositedUrl ??
    resultUrl

  const outputLabel = useMemo(() => {
    if (outputFormat === 'image/jpeg') {
      return 'JPG'
    }

    if (outputFormat === 'image/webp') {
      return 'WEBP'
    }

    return 'PNG'
  }, [outputFormat])

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const selectedFile = files[0]

      if (!selectedFile) {
        return
      }

      setError(null)
      setProcessedSize(null)
      setProgress(0)
      setProcessingStage('')

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

      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(
          `Maximum supported file size is ${formatFileSize(
            MAX_FILE_SIZE,
          )}.`,
        )
        return
      }

      try {
        const dimensions =
          await getImageDimensions(
            selectedFile,
          )

        if (
          dimensions.width >
            MAX_DIMENSION ||
          dimensions.height >
            MAX_DIMENSION
        ) {
          setError(
            `Maximum supported image dimension is ${MAX_DIMENSION.toLocaleString()} × ${MAX_DIMENSION.toLocaleString()} pixels.`,
          )
          return
        }

        if (sourceUrl) {
          URL.revokeObjectURL(sourceUrl)
        }

        if (resultUrl) {
          URL.revokeObjectURL(resultUrl)
        }

        if (compositedUrl) {
          URL.revokeObjectURL(
            compositedUrl,
          )
        }

        const url =
          URL.createObjectURL(
            selectedFile,
          )

        setFile(selectedFile)
        setSourceUrl(url)

        setResultUrl(null)
        setCompositedUrl(null)

        setImageWidth(
          dimensions.width,
        )

        setImageHeight(
          dimensions.height,
        )

        setBackgroundMode(
          'transparent',
        )

        setOutputFormat(
          'image/png',
        )

        setQuality(92)
        setProgress(0)
        setProcessingStage('')
      } catch {
        setError(
          'This image could not be read. Please try another file.',
        )
      }
    },
    [
      sourceUrl,
      resultUrl,
      compositedUrl,
    ],
  )

  useEffect(() => {
    return () => {
      if (sourceUrl) {
        URL.revokeObjectURL(sourceUrl)
      }

      if (resultUrl) {
        URL.revokeObjectURL(resultUrl)
      }

      if (compositedUrl) {
        URL.revokeObjectURL(
          compositedUrl,
        )
      }
    }
  }, [])

  function clearResult() {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl)
    }

    if (compositedUrl) {
      URL.revokeObjectURL(
        compositedUrl,
      )
    }

    setResultUrl(null)
    setCompositedUrl(null)
    setProcessedSize(null)
    setProgress(0)
    setProcessingStage('')
  }

  function resetFile() {
    processingIdRef.current += 1

    clearResult()

    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl)
    }

    setFile(null)
    setSourceUrl(null)

    setImageWidth(0)
    setImageHeight(0)

    setBackgroundMode('transparent')
    setCustomColor('#ffffff')

    setOutputFormat('image/png')
    setQuality(92)

    setDevice('gpu')
    setModel('isnet_fp16')

    setIsProcessing(false)
    setError(null)
  }

  async function removeImageBackground() {
    if (!file) {
      setError(
        'Please select an image first.',
      )
      return
    }

    const currentProcessingId =
      ++processingIdRef.current

    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setProcessingStage(
      'Preparing image…',
    )

    clearResult()

    try {
      const config = {
        device,
        model,

        output: {
          format: 'image/png' as const,
          type: 'foreground' as const,
        },

        progress: (
          key: string,
          current: number,
          total: number,
        ) => {
          if (
            processingIdRef.current !==
            currentProcessingId
          ) {
            return
          }

          if (total > 0) {
            const percentage =
              Math.min(
                95,
                Math.round(
                  (current /
                    total) *
                    70,
                ),
              )

            setProgress(
              percentage,
            )
          }

          if (
            key
              .toLowerCase()
              .includes('model')
          ) {
            setProcessingStage(
              'Loading AI model…',
            )
          } else if (
            key
              .toLowerCase()
              .includes('wasm')
          ) {
            setProcessingStage(
              'Preparing processing engine…',
            )
          } else {
            setProcessingStage(
              'Removing background…',
            )
          }
        },
      }

      setProcessingStage(
        'Removing background…',
      )

      const blob =
        await removeBackground(
          file,
          config,
        )

      if (
        processingIdRef.current !==
        currentProcessingId
      ) {
        return
      }

      const url =
        URL.createObjectURL(blob)

      setResultUrl(url)
      setProgress(100)
      setProcessingStage(
        'Background removed',
      )

      if (
        backgroundMode ===
        'transparent'
      ) {
        setProcessedSize(blob.size)
      }

      await rebuildComposite(
        url,
        backgroundMode,
        customColor,
        outputFormat,
        quality,
      )
    } catch (processingError) {
      console.error(
        processingError,
      )

      setError(
        'Background removal failed. Your browser may not have enough memory for this image. Try a smaller image or switch the processing device to CPU.',
      )

      setProgress(0)
      setProcessingStage('')
    } finally {
      if (
        processingIdRef.current ===
        currentProcessingId
      ) {
        setIsProcessing(false)
      }
    }
  }

  async function rebuildComposite(
    foregroundUrl: string,
    mode: BackgroundMode,
    color: string,
    format: OutputFormat,
    outputQuality: number,
  ) {
    const foreground =
      await loadImage(
        foregroundUrl,
      )

    const canvas =
      document.createElement(
        'canvas',
      )

    canvas.width = imageWidth
    canvas.height = imageHeight

    const context =
      canvas.getContext('2d')

    if (!context) {
      throw new Error(
        'Canvas is not supported.',
      )
    }

    context.imageSmoothingEnabled =
      true

    context.imageSmoothingQuality =
      'high'

    if (
      mode === 'white'
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

    if (
      mode === 'black'
    ) {
      context.fillStyle =
        '#000000'

      context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height,
      )
    }

    if (
      mode === 'custom'
    ) {
      context.fillStyle =
        color

      context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height,
      )
    }

    if (
      mode === 'gradient'
    ) {
      context.fillStyle =
        createGradient(
          context,
          canvas.width,
          canvas.height,
        )

      context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height,
      )
    }

    context.drawImage(
      foreground,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    if (
      mode === 'transparent'
    ) {
      const transparentBlob =
        await fetch(
          foregroundUrl,
        ).then(
          (response) =>
            response.blob(),
        )

      if (
        format ===
        'image/png'
      ) {
        if (
          compositedUrl
        ) {
          URL.revokeObjectURL(
            compositedUrl,
          )
        }

        const url =
          URL.createObjectURL(
            transparentBlob,
          )

        setCompositedUrl(
          url,
        )

        setProcessedSize(
          transparentBlob.size,
        )

        return
      }
    }

    const mime =
      format

    const blob =
      await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            resolve,
            mime,
            mime ===
              'image/png'
              ? undefined
              : outputQuality /
                100,
          )
        },
      )

    if (!blob) {
      throw new Error(
        'Unable to encode the processed image.',
      )
    }

    if (
      compositedUrl
    ) {
      URL.revokeObjectURL(
        compositedUrl,
      )
    }

    const url =
      URL.createObjectURL(blob)

    setCompositedUrl(url)
    setProcessedSize(blob.size)
  }

  async function handleBackgroundChange(
    mode: BackgroundMode,
  ) {
    setBackgroundMode(mode)

    if (!resultUrl) {
      return
    }

    try {
      await rebuildComposite(
        resultUrl,
        mode,
        customColor,
        outputFormat,
        quality,
      )
    } catch {
      setError(
        'Unable to update the background preview.',
      )
    }
  }

  async function handleCustomColorChange(
    color: string,
  ) {
    setCustomColor(color)

    if (
      !resultUrl ||
      backgroundMode !==
        'custom'
    ) {
      return
    }

    try {
      await rebuildComposite(
        resultUrl,
        'custom',
        color,
        outputFormat,
        quality,
      )
    } catch {
      setError(
        'Unable to update the preview.',
      )
    }
  }

  async function handleOutputFormatChange(
    format: OutputFormat,
  ) {
    setOutputFormat(format)

    if (!resultUrl) {
      return
    }

    try {
      await rebuildComposite(
        resultUrl,
        backgroundMode,
        customColor,
        format,
        quality,
      )
    } catch {
      setError(
        'Unable to update the output format.',
      )
    }
  }

  async function handleQualityChange(
    nextQuality: number,
  ) {
    setQuality(nextQuality)

    if (
      !resultUrl ||
      outputFormat ===
        'image/png'
    ) {
      return
    }

    try {
      await rebuildComposite(
        resultUrl,
        backgroundMode,
        customColor,
        outputFormat,
        nextQuality,
      )
    } catch {
      setError(
        'Unable to update output quality.',
      )
    }
  }

  function downloadResult() {
    if (!displayUrl || !file) {
      return
    }

    fetch(displayUrl)
      .then(
        (response) =>
          response.blob(),
      )
      .then((blob) => {
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

        downloadBlob(
          blob,
          `${baseName}-background-removed.${getExtension(
            outputFormat,
          )}`,
        )
      })
      .catch(() => {
        setError(
          'Unable to prepare the download.',
        )
      })
  }

  const hasResult =
    Boolean(resultUrl)

  return (
    <>
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={
          onToggleDarkMode
        }
      />

      <main className="background-remover-page">
        <section className="background-remover-hero">
          <div className="container">
            <p className="background-remover-hero__eyebrow">
              IMAGEMINT TOOL
            </p>

            <h1>
              Remove Image Backgrounds
            </h1>

            <p>
              Automatically isolate the
              foreground from your image
              using AI. Everything runs
              locally in your browser.
            </p>
          </div>
        </section>

        <section className="background-remover-tool">
          <div className="container">
            <div className="background-remover-card">
              {!file ? (
                <UploadDropzone
                  accept="image/jpeg,image/png,image/webp"
                  multiple={false}
                  onFilesSelected={
                    handleFilesSelected
                  }
                  title="Drop your image here"
                  browseText="Browse Files"
                  helperText="JPG, PNG or WEBP"
                />
              ) : (
                <div className="background-remover-workspace">
                  <div className="background-remover-preview-panel">
                    <div className="background-remover-panel-heading">
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
                        className="background-remover-reset-link"
                        onClick={
                          resetFile
                        }
                      >
                        Choose another
                      </button>
                    </div>

                    <div
                      className={`background-remover-stage ${
                        backgroundMode ===
                        'transparent'
                          ? 'background-remover-stage--checkerboard'
                          : ''
                      }`}
                    >
                      {sourceUrl &&
                        !hasResult && (
                          <img
                            src={
                              sourceUrl
                            }
                            alt={`Original ${file.name}`}
                            className="background-remover-preview-image"
                          />
                        )}

                      {displayUrl && (
                        <img
                          src={
                            displayUrl
                          }
                          alt={`Background removed from ${file.name}`}
                          className="background-remover-preview-image"
                        />
                      )}

                      {isProcessing && (
                        <div className="background-remover-processing">
                          <div className="background-remover-spinner" />

                          <strong>
                            {processingStage ||
                              'Processing…'}
                          </strong>

                          <div className="background-remover-progress">
                            <span
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>

                          <small>
                            {progress}%
                          </small>
                        </div>
                      )}

                      {!isProcessing &&
                        !displayUrl && (
                          <div className="background-remover-empty-preview">
                            <span>
                              AI preview
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="background-remover-image-info">
                      <div>
                        <span>
                          Dimensions
                        </span>

                        <strong>
                          {imageWidth} ×{' '}
                          {imageHeight}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Original size
                        </span>

                        <strong>
                          {formatFileSize(
                            file.size,
                          )}
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
                            : '—'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="background-remover-controls">
                    <div className="background-remover-controls__top">
                      <div>
                        <span className="background-remover-controls__eyebrow">
                          AI background removal
                        </span>

                        <h2>
                          Make your subject
                          stand out
                        </h2>
                      </div>

                      <button
                        type="button"
                        className="background-remover-reset-settings"
                        onClick={() => {
                          setBackgroundMode(
                            'transparent',
                          )

                          setOutputFormat(
                            'image/png',
                          )

                          setQuality(
                            92,
                          )

                          setDevice(
                            'gpu',
                          )

                          setModel(
                            'isnet_fp16',
                          )

                          clearResult()
                        }}
                      >
                        Reset
                      </button>
                    </div>

                    <div className="background-remover-section">
                      <div className="background-remover-section-heading">
                        <h3>
                          Background
                        </h3>

                        <span>
                          {backgroundMode ===
                          'transparent'
                            ? 'Transparent'
                            : backgroundMode ===
                              'gradient'
                              ? 'Gradient'
                              : backgroundMode ===
                                'custom'
                                ? 'Custom'
                                : backgroundMode ===
                                  'white'
                                  ? 'White'
                                  : 'Black'}
                        </span>
                      </div>

                      <div className="background-remover-background-options">
                        <button
                          type="button"
                          className={
                            backgroundMode ===
                            'transparent'
                              ? 'is-active'
                              : ''
                          }
                          onClick={() =>
                            handleBackgroundChange(
                              'transparent',
                            )
                          }
                        >
                          <span className="background-option-preview background-option-preview--transparent" />
                          Transparent
                        </button>

                        <button
                          type="button"
                          className={
                            backgroundMode ===
                            'white'
                              ? 'is-active'
                              : ''
                          }
                          onClick={() =>
                            handleBackgroundChange(
                              'white',
                            )
                          }
                        >
                          <span className="background-option-preview background-option-preview--white" />
                          White
                        </button>

                        <button
                          type="button"
                          className={
                            backgroundMode ===
                            'black'
                              ? 'is-active'
                              : ''
                          }
                          onClick={() =>
                            handleBackgroundChange(
                              'black',
                            )
                          }
                        >
                          <span className="background-option-preview background-option-preview--black" />
                          Black
                        </button>

                        <button
                          type="button"
                          className={
                            backgroundMode ===
                            'gradient'
                              ? 'is-active'
                              : ''
                          }
                          onClick={() =>
                            handleBackgroundChange(
                              'gradient',
                            )
                          }
                        >
                          <span className="background-option-preview background-option-preview--gradient" />
                          Gradient
                        </button>
                      </div>

                      <div className="background-remover-custom-color">
                        <label>
                          <span>
                            Custom colour
                          </span>

                          <div>
                            <input
                              type="color"
                              value={
                                customColor
                              }
                              onChange={(
                                event,
                              ) =>
                                handleCustomColorChange(
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />

                            <code>
                              {
                                customColor
                              }
                            </code>
                          </div>
                        </label>

                        <button
                          type="button"
                          className={
                            backgroundMode ===
                            'custom'
                              ? 'is-active'
                              : ''
                          }
                          onClick={() =>
                            handleBackgroundChange(
                              'custom',
                            )
                          }
                        >
                          Use custom
                        </button>
                      </div>
                    </div>

                    <div className="background-remover-section">
                      <div className="background-remover-section-heading">
                        <h3>
                          AI engine
                        </h3>

                        <span>
                          Advanced
                        </span>
                      </div>

                      <div className="background-remover-engine-grid">
                        <label>
                          <span>
                            Processing
                            device
                          </span>

                          <select
                            value={
                              device
                            }
                            onChange={(
                              event,
                            ) =>
                              setDevice(
                                event
                                  .target
                                  .value as ProcessingDevice,
                              )
                            }
                            disabled={
                              isProcessing
                            }
                          >
                            <option value="gpu">
                              GPU / WebGPU
                            </option>

                            <option value="cpu">
                              CPU
                            </option>
                          </select>
                        </label>

                        <label>
                          <span>
                            AI model
                          </span>

                          <select
                            value={
                              model
                            }
                            onChange={(
                              event,
                            ) =>
                              setModel(
                                event
                                  .target
                                  .value as ModelQuality,
                              )
                            }
                            disabled={
                              isProcessing
                            }
                          >
                            <option value="isnet_fp16">
                              Balanced
                            </option>

                            <option value="isnet">
                              High quality
                            </option>

                            <option value="isnet_quint8">
                              Lightweight
                            </option>
                          </select>
                        </label>
                      </div>

                      <p className="background-remover-help">
                        GPU mode can be faster on
                        compatible browsers. The
                        lightweight model uses less
                        memory; the higher-quality
                        model can improve difficult
                        edges.
                      </p>
                    </div>

                    <div className="background-remover-section">
                      <div className="background-remover-section-heading">
                        <h3>
                          Output
                        </h3>
                      </div>

                      <div className="background-remover-output-grid">
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
                              handleOutputFormatChange(
                                event
                                  .target
                                  .value as OutputFormat,
                              )
                            }
                            disabled={
                              isProcessing
                            }
                          >
                            <option value="image/png">
                              PNG — transparent
                            </option>

                            <option value="image/jpeg">
                              JPG — solid background
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
                            className="background-remover-quality"
                            type="range"
                            min="40"
                            max="100"
                            value={
                              quality
                            }
                            disabled={
                              isProcessing ||
                              outputFormat ===
                                'image/png'
                            }
                            onChange={(
                              event,
                            ) =>
                              handleQualityChange(
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
                    </div>

                    {error && (
                      <div
                        className="background-remover-error"
                        role="alert"
                      >
                        {error}
                      </div>
                    )}

                    <div className="background-remover-actions">
                      {!hasResult ? (
                        <button
                          type="button"
                          className="btn btn--primary background-remover-main-button"
                          onClick={
                            removeImageBackground
                          }
                          disabled={
                            isProcessing
                          }
                        >
                          {isProcessing
                            ? 'Removing background…'
                            : 'Remove Background'}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn--primary background-remover-main-button"
                            onClick={
                              downloadResult
                            }
                          >
                            Download{' '}
                            {
                              outputLabel
                            }
                          </button>

                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={
                              removeImageBackground
                            }
                            disabled={
                              isProcessing
                            }
                          >
                            Process Again
                          </button>
                        </>
                      )}
                    </div>

                    <div className="background-remover-privacy">
                      <span>
                        ✓
                      </span>

                      <p>
                        Your image stays on
                        your device. AI
                        background removal
                        runs directly in
                        your browser.
                      </p>
                    </div>
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