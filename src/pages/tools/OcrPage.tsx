import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import UploadDropzone from '../../components/UploadDropzone'
import '../../styles/tools/ocr.css'

type OcrPageProps = {
  darkMode: boolean
  onToggleDarkMode: () => void
}

type OcrLanguage =
  | 'auto'
  | 'eng'
  | 'hin'
  | 'eng_hin'

type OcrMode =
  | 'balanced'
  | 'accurate'
  | 'fast'

type OutputFormat =
  | 'txt'
  | 'json'
  | 'csv'

type OcrWord = {
  text: string
  confidence: number
  box?: number[][]
}

type OcrResponse = {
  text: string
  words?: OcrWord[]
  confidence?: number
  language?: string
  processingTime?: number
}

const MAX_FILE_SIZE = 20 * 1024 * 1024

const LANGUAGE_OPTIONS: {
  value: OcrLanguage
  label: string
  description: string
}[] = [
  {
    value: 'auto',
    label: 'Auto detect',
    description: 'Let PaddleOCR determine the text language',
  },
  {
    value: 'eng',
    label: 'English',
    description: 'Optimised for English text',
  },
  {
    value: 'hin',
    label: 'Hindi',
    description: 'Optimised for Devanagari text',
  },
  {
    value: 'eng_hin',
    label: 'English + Hindi',
    description: 'Useful for mixed Hindi-English documents',
  },
]

const MODE_OPTIONS: {
  value: OcrMode
  label: string
  description: string
}[] = [
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Best choice for most images',
  },
  {
    value: 'accurate',
    label: 'High accuracy',
    description: 'More processing for difficult images',
  },
  {
    value: 'fast',
    label: 'Fast',
    description: 'Prioritises processing speed',
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

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`
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

export default function OcrPage({
  darkMode,
  onToggleDarkMode,
}: OcrPageProps) {
  const [file, setFile] =
    useState<File | null>(null)

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null)

  const [language, setLanguage] =
    useState<OcrLanguage>('auto')

  const [mode, setMode] =
    useState<OcrMode>('balanced')

  const [enhanceImage, setEnhanceImage] =
    useState(true)

  const [detectTables, setDetectTables] =
    useState(false)

  const [preserveLayout, setPreserveLayout] =
    useState(true)

  const [result, setResult] =
    useState<OcrResponse | null>(null)

  const [editedText, setEditedText] =
    useState('')

  const [isProcessing, setIsProcessing] =
    useState(false)

  const [progress, setProgress] =
    useState(0)

  const [error, setError] =
    useState<string | null>(null)

  const [copied, setCopied] =
    useState(false)

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
      if (copied) {
        setCopied(false)
      }
    }
  }, [copied])

  const averageConfidence =
    useMemo(() => {
      if (!result) {
        return 0
      }

      if (
        typeof result.confidence ===
        'number'
      ) {
        return result.confidence
      }

      if (
        !result.words ||
        result.words.length === 0
      ) {
        return 0
      }

      return (
        result.words.reduce(
          (total, word) =>
            total + word.confidence,
          0,
        ) / result.words.length
      )
    }, [result])

  const wordCount =
    result?.words?.length ??
    editedText
      .trim()
      .split(/\s+/)
      .filter(Boolean).length

  function handleFiles(files: File[]) {
    const selectedFile = files[0]

    if (!selectedFile) {
      return
    }

    setError(null)
    setResult(null)
    setEditedText('')
    setCopied(false)
    setProgress(0)

    if (
      !selectedFile.type.startsWith(
        'image/',
      )
    ) {
      setError(
        'Please select a valid image file.',
      )
      return
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setError(
        `Maximum supported file size is ${formatFileSize(
          MAX_FILE_SIZE,
        )}.`,
      )
      return
    }

    setFile(selectedFile)
  }

  function resetFile() {
    setFile(null)
    setResult(null)
    setEditedText('')
    setError(null)
    setProgress(0)
    setCopied(false)
  }

  function resetSettings() {
    setLanguage('auto')
    setMode('balanced')
    setEnhanceImage(true)
    setDetectTables(false)
    setPreserveLayout(true)
    setError(null)
  }

  async function runOcr() {
    if (!file) {
      setError(
        'Please select an image first.',
      )
      return
    }

    setIsProcessing(true)
    setProgress(10)
    setError(null)
    setResult(null)
    setEditedText('')

    try {
      const formData =
        new FormData()

      formData.append(
        'image',
        file,
      )

      formData.append(
        'language',
        language,
      )

      formData.append(
        'mode',
        mode,
      )

      formData.append(
        'enhance',
        String(enhanceImage),
      )

      formData.append(
        'detectTables',
        String(detectTables),
      )

      formData.append(
        'preserveLayout',
        String(preserveLayout),
      )

      setProgress(25)

      const response =
        await fetch(
          '/api/ocr',
          {
            method: 'POST',
            body: formData,
          },
        )

      setProgress(70)

      const data =
        (await response.json()) as
          | OcrResponse
          | {
              error?: string
            }

      if (!response.ok) {
        throw new Error(
          'error' in data &&
          data.error
            ? data.error
            : 'OCR processing failed.',
        )
      }

      const ocrResult =
        data as OcrResponse

      setResult(ocrResult)
      setEditedText(
        ocrResult.text ?? '',
      )
      setProgress(100)
    } catch (caughtError) {
      setProgress(0)

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Something went wrong while processing the image.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  async function copyText() {
    if (!editedText) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        editedText,
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      setError(
        'Unable to copy the extracted text.',
      )
    }
  }

  function downloadResult(
    format: OutputFormat,
  ) {
    if (!file || !editedText) {
      return
    }

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

    if (format === 'txt') {
      downloadBlob(
        new Blob(
          [editedText],
          {
            type: 'text/plain;charset=utf-8',
          },
        ),
        `${baseName}-ocr.txt`,
      )

      return
    }

    if (format === 'json') {
      const payload = {
        source: file.name,
        language:
          result?.language ??
          language,
        confidence:
          averageConfidence,
        processingTime:
          result?.processingTime ??
          null,
        text: editedText,
        words:
          result?.words ?? [],
      }

      downloadBlob(
        new Blob(
          [
            JSON.stringify(
              payload,
              null,
              2,
            ),
          ],
          {
            type: 'application/json;charset=utf-8',
          },
        ),
        `${baseName}-ocr.json`,
      )

      return
    }

    const rows = [
      [
        'Index',
        'Text',
        'Confidence',
      ],
      ...(result?.words ??
        []).map(
          (word, index) => [
            String(index + 1),
            word.text,
            String(
              word.confidence,
            ),
          ],
        ),
    ]

    const csv = rows
      .map((row) =>
        row
          .map(escapeCsv)
          .join(','),
      )
      .join('\n')

    downloadBlob(
      new Blob(
        [csv],
        {
          type: 'text/csv;charset=utf-8',
        },
      ),
      `${baseName}-ocr.csv`,
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

      <main className="ocr-page">
        <section className="ocr-hero">
          <div className="container">
            <p className="ocr-hero__eyebrow">
              IMAGEMINT TOOL
            </p>

            <h1>
              Image to Text
            </h1>

            <p>
              Extract editable text from
              images with PaddleOCR.
              Process documents, screenshots,
              notes and mixed-language images
              directly through ImageMint.
            </p>

            <div className="ocr-hero__badges">
              <span>
                PaddleOCR
              </span>

              <span>
                Local-first
              </span>

              <span>
                JPG · PNG · WEBP
              </span>
            </div>
          </div>
        </section>

        <section className="ocr-tool">
          <div className="container">
            <div className="ocr-card">
              {!file ? (
                <UploadDropzone
                  accept="image/jpeg,image/png,image/webp"
                  multiple={false}
                  onFilesSelected={
                    handleFiles
                  }
                  title="Drop your image here"
                  browseText="Browse Files"
                  helperText="JPG, PNG or WEBP"
                />
              ) : (
                <div className="ocr-workspace">
                  <div className="ocr-preview-panel">
                    <div className="ocr-panel-heading">
                      <div>
                        <span>
                          Source image
                        </span>

                        <strong>
                          {file.name}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="ocr-reset-link"
                        onClick={
                          resetFile
                        }
                      >
                        Choose another
                      </button>
                    </div>

                    <div className="ocr-image-stage">
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt={`OCR source: ${file.name}`}
                          className="ocr-preview-image"
                        />
                      )}
                    </div>

                    <div className="ocr-image-info">
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

                      <div>
                        <span>
                          Format
                        </span>

                        <strong>
                          {file.type
                            .replace(
                              'image/',
                              '',
                            )
                            .toUpperCase()}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Engine
                        </span>

                        <strong>
                          PaddleOCR
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="ocr-controls">
                    <div className="ocr-controls__top">
                      <div>
                        <span className="ocr-controls__eyebrow">
                          OCR settings
                        </span>

                        <h2>
                          Extract your text
                        </h2>
                      </div>

                      <button
                        type="button"
                        className="ocr-reset-settings"
                        onClick={
                          resetSettings
                        }
                      >
                        Reset
                      </button>
                    </div>

                    <div className="ocr-section">
                      <div className="ocr-section__heading">
                        <h3>
                          Language
                        </h3>
                      </div>

                      <div className="ocr-select-wrapper">
                        <select
                          value={
                            language
                          }
                          onChange={(
                            event,
                          ) =>
                            setLanguage(
                              event
                                .target
                                .value as OcrLanguage,
                            )
                          }
                        >
                          {LANGUAGE_OPTIONS.map(
                            (option) => (
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

                      <p className="ocr-help">
                        {
                          LANGUAGE_OPTIONS.find(
                            (item) =>
                              item.value ===
                              language,
                          )?.description
                        }
                      </p>
                    </div>

                    <div className="ocr-section">
                      <div className="ocr-section__heading">
                        <h3>
                          Processing mode
                        </h3>
                      </div>

                      <div className="ocr-mode-grid">
                        {MODE_OPTIONS.map(
                          (option) => (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              className={
                                mode ===
                                option.value
                                  ? 'is-active'
                                  : ''
                              }
                              onClick={() =>
                                setMode(
                                  option.value,
                                )
                              }
                            >
                              <strong>
                                {
                                  option.label
                                }
                              </strong>

                              <span>
                                {
                                  option.description
                                }
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="ocr-section">
                      <div className="ocr-section__heading">
                        <h3>
                          Recognition options
                        </h3>
                      </div>

                      <div className="ocr-options">
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              enhanceImage
                            }
                            onChange={(
                              event,
                            ) =>
                              setEnhanceImage(
                                event
                                  .target
                                  .checked,
                              )
                            }
                          />

                          <span>
                            <strong>
                              Image enhancement
                            </strong>

                            <small>
                              Improve contrast and
                              readability before OCR
                            </small>
                          </span>
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={
                              preserveLayout
                            }
                            onChange={(
                              event,
                            ) =>
                              setPreserveLayout(
                                event
                                  .target
                                  .checked,
                              )
                            }
                          />

                          <span>
                            <strong>
                              Preserve layout
                            </strong>

                            <small>
                              Keep detected text
                              ordering closer to
                              the original image
                            </small>
                          </span>
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={
                              detectTables
                            }
                            onChange={(
                              event,
                            ) =>
                              setDetectTables(
                                event
                                  .target
                                  .checked,
                              )
                            }
                          />

                          <span>
                            <strong>
                              Table detection
                            </strong>

                            <small>
                              Attempt structured
                              recognition of tables
                            </small>
                          </span>
                        </label>
                      </div>
                    </div>

                    {error && (
                      <div
                        className="ocr-error"
                        role="alert"
                      >
                        {error}
                      </div>
                    )}

                    {isProcessing && (
                      <div className="ocr-progress">
                        <div className="ocr-progress__top">
                          <span>
                            Processing image
                          </span>

                          <strong>
                            {progress}%
                          </strong>
                        </div>

                        <div className="ocr-progress__track">
                          <span
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn--primary ocr-main-button"
                      onClick={runOcr}
                      disabled={
                        isProcessing
                      }
                    >
                      {isProcessing
                        ? 'Extracting text...'
                        : 'Extract Text'}
                    </button>

                    <p className="ocr-privacy">
                      Your image is processed
                      through the configured
                      PaddleOCR service. ImageMint
                      does not store your OCR result.
                    </p>
                  </div>
                </div>
              )}

              {result && (
                <section className="ocr-results">
                  <div className="ocr-results__header">
                    <div>
                      <span>
                        OCR result
                      </span>

                      <h2>
                        Extracted text
                      </h2>
                    </div>

                    <div className="ocr-result-stats">
                      <div>
                        <span>
                          Confidence
                        </span>

                        <strong>
                          {formatConfidence(
                            averageConfidence,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Words
                        </span>

                        <strong>
                          {wordCount}
                        </strong>
                      </div>

                      {result.processingTime !==
                        undefined && (
                        <div>
                          <span>
                            Time
                          </span>

                          <strong>
                            {
                              result.processingTime
                            }
                            ms
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ocr-result-layout">
                    <div className="ocr-text-panel">
                      <div className="ocr-text-panel__top">
                        <span>
                          Editable output
                        </span>

                        <button
                          type="button"
                          onClick={
                            copyText
                          }
                        >
                          {copied
                            ? 'Copied'
                            : 'Copy text'}
                        </button>
                      </div>

                      <textarea
                        value={
                          editedText
                        }
                        onChange={(
                          event,
                        ) =>
                          setEditedText(
                            event.target
                              .value,
                          )
                        }
                        spellCheck={false}
                        aria-label="Extracted OCR text"
                      />
                    </div>

                    <div className="ocr-analysis-panel">
                      <div className="ocr-analysis-card">
                        <span>
                          Recognition
                        </span>

                        <strong>
                          {formatConfidence(
                            averageConfidence,
                          )}
                        </strong>

                        <small>
                          Average OCR confidence
                        </small>
                      </div>

                      <div className="ocr-analysis-card">
                        <span>
                          Detected words
                        </span>

                        <strong>
                          {wordCount}
                        </strong>

                        <small>
                          Recognised text units
                        </small>
                      </div>

                      <div className="ocr-downloads">
                        <span>
                          Export
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            downloadResult(
                              'txt',
                            )
                          }
                        >
                          Download TXT
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            downloadResult(
                              'json',
                            )
                          }
                        >
                          Download JSON
                        </button>

                        <button
                          type="button"
                          disabled={
                            !result.words ||
                            result.words
                              .length ===
                              0
                          }
                          onClick={() =>
                            downloadResult(
                              'csv',
                            )
                          }
                        >
                          Download CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  {result.words &&
                    result.words.length >
                      0 && (
                      <div className="ocr-confidence-section">
                        <div className="ocr-confidence-heading">
                          <div>
                            <span>
                              Recognition detail
                            </span>

                            <h3>
                              Word confidence
                            </h3>
                          </div>

                          <span>
                            {
                              result.words.length
                            }{' '}
                            detected words
                          </span>
                        </div>

                        <div className="ocr-word-list">
                          {result.words.map(
                            (
                              word,
                              index,
                            ) => (
                              <div
                                className="ocr-word-row"
                                key={`${word.text}-${index}`}
                              >
                                <span>
                                  {String(
                                    index +
                                      1,
                                  ).padStart(
                                    2,
                                    '0',
                                  )}
                                </span>

                                <strong>
                                  {
                                    word.text
                                  }
                                </strong>

                                <div className="ocr-word-confidence">
                                  <i
                                    style={{
                                      width: `${Math.max(
                                        0,
                                        Math.min(
                                          100,
                                          word.confidence *
                                            100,
                                        ),
                                      )}%`,
                                    }}
                                  />

                                  <small>
                                    {formatConfidence(
                                      word.confidence,
                                    )}
                                  </small>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  <div className="ocr-result-actions">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={
                        runOcr
                      }
                    >
                      Run OCR Again
                    </button>

                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={
                        resetFile
                      }
                    >
                      Process Another Image
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}