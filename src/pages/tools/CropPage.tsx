import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import '../../styles/tools/crop.css'

type CropPageProps = {
  darkMode: boolean
  onToggleDarkMode: () => void
}

type OutputFormat =
  | 'original'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'

type AspectRatioKey =
  | 'free'
  | '1:1'
  | '4:3'
  | '3:2'
  | '16:9'
  | '9:16'
  | 'custom'

type AspectRatioPreset = {
  label: string
  value: AspectRatioKey
  ratio?: number
}

type CropRect = {
  x: number
  y: number
  width: number
  height: number
}

type DragMode =
  | 'move'
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | null

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const ASPECT_PRESETS: AspectRatioPreset[] = [
  {
    label: 'Free',
    value: 'free',
  },
  {
    label: '1:1',
    value: '1:1',
    ratio: 1,
  },
  {
    label: '4:3',
    value: '4:3',
    ratio: 4 / 3,
  },
  {
    label: '3:2',
    value: '3:2',
    ratio: 3 / 2,
  },
  {
    label: '16:9',
    value: '16:9',
    ratio: 16 / 9,
  },
  {
    label: '9:16',
    value: '9:16',
    ratio: 9 / 16,
  },
]

const MIN_CROP_SIZE = 20
const MAX_OUTPUT_DIMENSION = 10000

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(Math.max(value, min), max)
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

function getImageDimensionsAfterRotation(
  width: number,
  height: number,
  rotation: number,
) {
  const normalized = ((rotation % 360) + 360) % 360

  if (normalized === 90 || normalized === 270) {
    return {
      width: height,
      height: width,
    }
  }

  return {
    width,
    height,
  }
}

function getAspectRatio(
  aspect: AspectRatioKey,
  customWidth: number,
  customHeight: number,
) {
  if (aspect === 'custom') {
    if (
      customWidth > 0 &&
      customHeight > 0
    ) {
      return customWidth / customHeight
    }

    return null
  }

  const preset = ASPECT_PRESETS.find(
    (item) => item.value === aspect,
  )

  return preset?.ratio ?? null
}

function createInitialCrop(
  width: number,
  height: number,
  ratio: number | null,
): CropRect {
  if (!ratio) {
    const size = Math.min(width, height) * 0.82

    return {
      x: (width - size) / 2,
      y: (height - size) / 2,
      width: size,
      height: size,
    }
  }

  let cropWidth = width * 0.82
  let cropHeight = cropWidth / ratio

  if (cropHeight > height * 0.82) {
    cropHeight = height * 0.82
    cropWidth = cropHeight * ratio
  }

  return {
    x: (width - cropWidth) / 2,
    y: (height - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  }
}

function normalizeCrop(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  const width = clamp(
    crop.width,
    MIN_CROP_SIZE,
    imageWidth,
  )

  const height = clamp(
    crop.height,
    MIN_CROP_SIZE,
    imageHeight,
  )

  const x = clamp(
    crop.x,
    0,
    imageWidth - width,
  )

  const y = clamp(
    crop.y,
    0,
    imageHeight - height,
  )

  return {
    x,
    y,
    width,
    height,
  }
}

export default function CropPage({
  darkMode,
  onToggleDarkMode,
}: CropPageProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)

  const [crop, setCrop] = useState<CropRect | null>(null)

  const [aspectRatio, setAspectRatio] =
    useState<AspectRatioKey>('free')

  const [customRatioWidth, setCustomRatioWidth] =
    useState(4)

  const [customRatioHeight, setCustomRatioHeight] =
    useState(3)

  const [rotation, setRotation] = useState(0)

  const [flipHorizontal, setFlipHorizontal] =
    useState(false)

  const [flipVertical, setFlipVertical] =
    useState(false)

  const [outputFormat, setOutputFormat] =
    useState<OutputFormat>('original')

  const [quality, setQuality] = useState(90)

  const [isDragging, setIsDragging] =
    useState(false)

  const [dragMode, setDragMode] =
    useState<DragMode>(null)

  const [dragStart, setDragStart] = useState<{
    x: number
    y: number
    crop: CropRect
  } | null>(null)

  const [isProcessing, setIsProcessing] =
    useState(false)

  const [processedUrl, setProcessedUrl] =
    useState<string | null>(null)

  const [processedSize, setProcessedSize] =
    useState<number | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const effectiveOutputType = useMemo(() => {
    if (!file) {
      return 'image/png'
    }

    return getMimeType(
      outputFormat,
      file.type,
    )
  }, [file, outputFormat])

  const formatLabel = useMemo(() => {
    if (effectiveOutputType === 'image/jpeg') {
      return 'JPG'
    }

    if (effectiveOutputType === 'image/webp') {
      return 'WEBP'
    }

    return 'PNG'
  }, [effectiveOutputType])

  const currentAspectRatio = useMemo(
    () =>
      getAspectRatio(
        aspectRatio,
        customRatioWidth,
        customRatioHeight,
      ),
    [
      aspectRatio,
      customRatioWidth,
      customRatioHeight,
    ],
  )

  const rotatedImageDimensions = useMemo(
    () =>
      getImageDimensionsAfterRotation(
        imageWidth,
        imageHeight,
        rotation,
      ),
    [imageWidth, imageHeight, rotation],
  )

  const outputDimensions = useMemo(() => {
    if (!crop) {
      return {
        width: 0,
        height: 0,
      }
    }

    return {
      width: Math.round(crop.width),
      height: Math.round(crop.height),
    }
  }, [crop])

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

  const handleFile = useCallback(
    (selectedFile: File | undefined) => {
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
      const objectUrl =
        URL.createObjectURL(selectedFile)

      image.onload = () => {
        const width = image.naturalWidth
        const height = image.naturalHeight

        setFile(selectedFile)
        setImageWidth(width)
        setImageHeight(height)
        setRotation(0)
        setFlipHorizontal(false)
        setFlipVertical(false)
        setAspectRatio('free')
        setCrop(
          createInitialCrop(
            width,
            height,
            null,
          ),
        )
        setOutputFormat('original')
        setQuality(90)
        setProcessedUrl(null)

        URL.revokeObjectURL(objectUrl)
      }

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl)

        setError(
          'This image could not be read. Please try another file.',
        )
      }

      image.src = objectUrl
    },
    [],
  )

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    handleFile(
      event.target.files?.[0],
    )
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

  function resetFile() {
    if (processedUrl) {
      URL.revokeObjectURL(processedUrl)
    }

    setFile(null)
    setPreviewUrl(null)
    setProcessedUrl(null)
    setProcessedSize(null)
    setImageWidth(0)
    setImageHeight(0)
    setCrop(null)
    setRotation(0)
    setFlipHorizontal(false)
    setFlipVertical(false)
    setAspectRatio('free')
    setError(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  function resetSettings() {
    if (!file) {
      return
    }

    setRotation(0)
    setFlipHorizontal(false)
    setFlipVertical(false)
    setAspectRatio('free')
    setCustomRatioWidth(4)
    setCustomRatioHeight(3)
    setOutputFormat('original')
    setQuality(90)

    setCrop(
      createInitialCrop(
        imageWidth,
        imageHeight,
        null,
      ),
    )

    setProcessedUrl(null)
    setProcessedSize(null)
    setError(null)
  }

  function applyAspectRatio(
    nextAspect: AspectRatioKey,
  ) {
    if (
      imageWidth <= 0 ||
      imageHeight <= 0
    ) {
      return
    }

    setAspectRatio(nextAspect)
    setProcessedUrl(null)

    const ratio = getAspectRatio(
      nextAspect,
      customRatioWidth,
      customRatioHeight,
    )

    setCrop(
      createInitialCrop(
        imageWidth,
        imageHeight,
        ratio,
      ),
    )
  }

  function applyCustomRatio() {
    if (
      customRatioWidth <= 0 ||
      customRatioHeight <= 0
    ) {
      setError(
        'Enter valid custom aspect-ratio values.',
      )
      return
    }

    setError(null)
    setAspectRatio('custom')
    setProcessedUrl(null)

    const ratio =
      customRatioWidth /
      customRatioHeight

    setCrop(
      createInitialCrop(
        imageWidth,
        imageHeight,
        ratio,
      ),
    )
  }

  function rotateImage(
    direction: 'left' | 'right',
  ) {
    setRotation((current) => {
      const next =
        direction === 'right'
          ? current + 90
          : current - 90

      return ((next % 360) + 360) % 360
    })

    setProcessedUrl(null)
  }

  function getPointerPosition(
    event: React.PointerEvent,
  ) {
    const stage =
      stageRef.current

    if (!stage) {
      return null
    }

    const rect =
      stage.getBoundingClientRect()

    if (
      !imageWidth ||
      !imageHeight
    ) {
      return null
    }

    const displayWidth =
      imageRef.current?.getBoundingClientRect()
        .width ?? rect.width

    const displayHeight =
      imageRef.current?.getBoundingClientRect()
        .height ?? rect.height

    const imageRect =
      imageRef.current?.getBoundingClientRect()

    if (!imageRect) {
      return null
    }

    const x = clamp(
      (event.clientX -
        imageRect.left) *
        (imageWidth /
          imageRect.width),
      0,
      imageWidth,
    )

    const y = clamp(
      (event.clientY -
        imageRect.top) *
        (imageHeight /
          imageRect.height),
      0,
      imageHeight,
    )

    return {
      x,
      y,
      displayWidth,
      displayHeight,
    }
  }

  function handleCropPointerDown(
    event: React.PointerEvent,
    mode: DragMode,
  ) {
    if (!crop) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const position =
      getPointerPosition(event)

    if (!position) {
      return
    }

    setDragMode(mode)
    setDragStart({
      x: position.x,
      y: position.y,
      crop: { ...crop },
    })

    event.currentTarget.setPointerCapture(
      event.pointerId,
    )
  }

  function handleCropPointerMove(
    event: React.PointerEvent,
  ) {
    if (
      !dragStart ||
      !dragMode ||
      !crop
    ) {
      return
    }

    const position =
      getPointerPosition(event)

    if (!position) {
      return
    }

    const dx =
      position.x - dragStart.x

    const dy =
      position.y - dragStart.y

    const start = dragStart.crop
    const ratio = currentAspectRatio

    let next = {
      ...start,
    }

    if (dragMode === 'move') {
      next.x = clamp(
        start.x + dx,
        0,
        imageWidth - start.width,
      )

      next.y = clamp(
        start.y + dy,
        0,
        imageHeight - start.height,
      )
    } else {
      let left = start.x
      let top = start.y
      let right =
        start.x + start.width
      let bottom =
        start.y + start.height

      if (
        dragMode.includes('w')
      ) {
        left = clamp(
          start.x + dx,
          0,
          right - MIN_CROP_SIZE,
        )
      }

      if (
        dragMode.includes('e')
      ) {
        right = clamp(
          start.x +
            start.width +
            dx,
          left + MIN_CROP_SIZE,
          imageWidth,
        )
      }

      if (
        dragMode.includes('n')
      ) {
        top = clamp(
          start.y + dy,
          0,
          bottom - MIN_CROP_SIZE,
        )
      }

      if (
        dragMode.includes('s')
      ) {
        bottom = clamp(
          start.y +
            start.height +
            dy,
          top + MIN_CROP_SIZE,
          imageHeight,
        )
      }

      if (ratio) {
        const horizontalChange =
          Math.abs(right - left)

        const verticalChange =
          Math.abs(bottom - top)

        const horizontalHandle =
          dragMode.includes('e') ||
          dragMode.includes('w')

        const verticalHandle =
          dragMode.includes('n') ||
          dragMode.includes('s')

        if (
          horizontalHandle &&
          !verticalHandle
        ) {
          const targetHeight =
            horizontalChange /
            ratio

          if (dragMode.includes('n')) {
            top =
              bottom -
              targetHeight
          } else {
            bottom =
              top +
              targetHeight
          }
        } else if (
          verticalHandle &&
          !horizontalHandle
        ) {
          const targetWidth =
            verticalChange *
            ratio

          if (dragMode.includes('w')) {
            left =
              right -
              targetWidth
          } else {
            right =
              left +
              targetWidth
          }
        } else {
          const targetWidth =
            horizontalChange

          const targetHeight =
            targetWidth /
            ratio

          if (
            targetHeight <=
            imageHeight
          ) {
            if (
              dragMode.includes('n')
            ) {
              top =
                bottom -
                targetHeight
            } else {
              bottom =
                top +
                targetHeight
            }
          }
        }

        if (left < 0) {
          left = 0

          const width =
            right - left

          const height =
            width / ratio

          if (
            dragMode.includes('n')
          ) {
            top =
              bottom - height
          } else {
            bottom =
              top + height
          }
        }

        if (right > imageWidth) {
          right = imageWidth

          const width =
            right - left

          const height =
            width / ratio

          if (
            dragMode.includes('n')
          ) {
            top =
              bottom - height
          } else {
            bottom =
              top + height
          }
        }

        if (top < 0) {
          top = 0

          const height =
            bottom - top

          const width =
            height * ratio

          if (
            dragMode.includes('w')
          ) {
            left =
              right - width
          } else {
            right =
              left + width
          }
        }

        if (
          bottom > imageHeight
        ) {
          bottom =
            imageHeight

          const height =
            bottom - top

          const width =
            height * ratio

          if (
            dragMode.includes('w')
          ) {
            left =
              right - width
          } else {
            right =
              left + width
          }
        }
      }

      next = {
        x: left,
        y: top,
        width: Math.max(
          MIN_CROP_SIZE,
          right - left,
        ),
        height: Math.max(
          MIN_CROP_SIZE,
          bottom - top,
        ),
      }
    }

    setCrop(
      normalizeCrop(
        next,
        imageWidth,
        imageHeight,
      ),
    )

    setProcessedUrl(null)
  }

  function handleCropPointerUp(
    event?: React.PointerEvent,
  ) {
    if (
      event &&
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      )
    }

    setDragMode(null)
    setDragStart(null)
  }

  async function cropImage() {
    if (
      !file ||
      !crop
    ) {
      setError(
        'Please select an image first.',
      )
      return
    }

    if (
      outputDimensions.width <= 0 ||
      outputDimensions.height <= 0
    ) {
      setError(
        'Please select a valid crop area.',
      )
      return
    }

    if (
      outputDimensions.width >
        MAX_OUTPUT_DIMENSION ||
      outputDimensions.height >
        MAX_OUTPUT_DIMENSION
    ) {
      setError(
        'Maximum supported output dimension is 10,000 × 10,000 pixels.',
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
        (resolve, reject) => {
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

      const sourceCanvas =
        document.createElement(
          'canvas',
        )

      sourceCanvas.width =
        image.naturalWidth

      sourceCanvas.height =
        image.naturalHeight

      const sourceContext =
        sourceCanvas.getContext(
          '2d',
        )

      if (!sourceContext) {
        throw new Error(
          'Canvas is not supported.',
        )
      }

      sourceContext.imageSmoothingEnabled =
        true

      sourceContext.imageSmoothingQuality =
        'high'

      sourceContext.drawImage(
        image,
        0,
        0,
      )

      const normalizedRotation =
        ((rotation % 360) +
          360) %
        360

      const rotatedDimensions =
        getImageDimensionsAfterRotation(
          image.naturalWidth,
          image.naturalHeight,
          normalizedRotation,
        )

      const transformedCanvas =
        document.createElement(
          'canvas',
        )

      transformedCanvas.width =
        rotatedDimensions.width

      transformedCanvas.height =
        rotatedDimensions.height

      const transformedContext =
        transformedCanvas.getContext(
          '2d',
        )

      if (!transformedContext) {
        throw new Error(
          'Canvas is not supported.',
        )
      }

      transformedContext.save()

      transformedContext.translate(
        transformedCanvas.width / 2,
        transformedCanvas.height / 2,
      )

      transformedContext.rotate(
        (normalizedRotation *
          Math.PI) /
          180,
      )

      transformedContext.scale(
        flipHorizontal
          ? -1
          : 1,
        flipVertical
          ? -1
          : 1,
      )

      transformedContext.drawImage(
        sourceCanvas,
        -image.naturalWidth / 2,
        -image.naturalHeight / 2,
      )

      transformedContext.restore()

      const scaleX =
        transformedCanvas.width /
        imageWidth

      const scaleY =
        transformedCanvas.height /
        imageHeight

      const cropX =
        Math.round(
          crop.x * scaleX,
        )

      const cropY =
        Math.round(
          crop.y * scaleY,
        )

      const cropWidth =
        Math.round(
          crop.width * scaleX,
        )

      const cropHeight =
        Math.round(
          crop.height * scaleY,
        )

      const outputCanvas =
        document.createElement(
          'canvas',
        )

      outputCanvas.width =
        cropWidth

      outputCanvas.height =
        cropHeight

      const outputContext =
        outputCanvas.getContext(
          '2d',
        )

      if (!outputContext) {
        throw new Error(
          'Canvas is not supported.',
        )
      }

      outputContext.imageSmoothingEnabled =
        true

      outputContext.imageSmoothingQuality =
        'high'

      const mimeType =
        effectiveOutputType

      if (
        mimeType ===
        'image/jpeg'
      ) {
        outputContext.fillStyle =
          '#ffffff'

        outputContext.fillRect(
          0,
          0,
          cropWidth,
          cropHeight,
        )
      }

      outputContext.drawImage(
        transformedCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
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
            outputCanvas.toBlob(
              resolve,
              mimeType,
              canvasQuality,
            )
          },
        )

      if (!blob) {
        throw new Error(
          'Could not create the cropped image.',
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
        'Something went wrong while cropping the image. Please try again.',
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
      `${baseName}-cropped-${outputDimensions.width}x${outputDimensions.height}.${extension}`

    document.body.appendChild(
      link,
    )

    link.click()

    document.body.removeChild(
      link,
    )
  }

  const cropStyle = crop
    ? {
        left: `${(crop.x / imageWidth) * 100}%`,
        top: `${(crop.y / imageHeight) * 100}%`,
        width: `${(crop.width / imageWidth) * 100}%`,
        height: `${(crop.height / imageHeight) * 100}%`,
      }
    : undefined

  const previewTransform = `
    rotate(${rotation}deg)
    scaleX(${flipHorizontal ? -1 : 1})
    scaleY(${flipVertical ? -1 : 1})
  `

  return (
    <>
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={
          onToggleDarkMode
        }
      />

      <main className="crop-page">
        <section className="crop-hero">
          <div className="container">
            <p className="crop-hero__eyebrow">
              IMAGEMINT TOOL
            </p>

            <h1>Crop Images</h1>

            <p>
              Crop your images precisely in
              your browser. Choose an exact
              aspect ratio, rotate, flip and
              download the result without
              uploading your image.
            </p>
          </div>
        </section>

        <section className="crop-tool">
          <div className="container">
            <div className="crop-card">
              {!file ? (
                <label
                  className={`crop-upload ${
                    isDragging
                      ? 'crop-upload--dragging'
                      : ''
                  }`}
                  onDrop={handleDrop}
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

                  <span
                    className="crop-upload__icon"
                    aria-hidden="true"
                  >
                    ⌗
                  </span>

                  <strong>
                    Drop your image here
                  </strong>

                  <span>
                    or{' '}
                    <button
                      type="button"
                      className="crop-upload__browse"
                      onClick={(
                        event,
                      ) => {
                        event.preventDefault()
                        openFilePicker()
                      }}
                    >
                      Browse Files
                    </button>
                  </span>

                  <small>
                    JPG, PNG or WEBP ·
                    processed locally
                  </small>
                </label>
              ) : (
                <div className="crop-workspace">
                  <div className="crop-preview-panel">
                    <div className="crop-panel-heading">
                      <div>
                        <span>
                          Crop preview
                        </span>

                        <strong>
                          {file.name}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="crop-reset-link"
                        onClick={
                          resetFile
                        }
                      >
                        Choose another
                      </button>
                    </div>

                    <div
                      ref={stageRef}
                      className="crop-image-stage"
                    >
                      {previewUrl && (
                        <div className="crop-image-wrapper">
                          <img
                            ref={imageRef}
                            src={previewUrl}
                            alt={`Preview of ${file.name}`}
                            className="crop-preview-image"
                            style={{
                              transform:
                                previewTransform,
                            }}
                            draggable={false}
                          />

                          {crop && (
                            <div
                              className="crop-overlay"
                              style={
                                cropStyle
                              }
                              onPointerDown={(
                                event,
                              ) =>
                                handleCropPointerDown(
                                  event,
                                  'move',
                                )
                              }
                              onPointerMove={
                                handleCropPointerMove
                              }
                              onPointerUp={
                                handleCropPointerUp
                              }
                              onPointerCancel={
                                handleCropPointerUp
                              }
                            >
                              <div className="crop-selection">
                                <div className="crop-grid crop-grid--vertical" />
                                <div className="crop-grid crop-grid--horizontal" />

                                <span
                                  className="crop-handle crop-handle--nw"
                                  onPointerDown={(
                                    event,
                                  ) =>
                                    handleCropPointerDown(
                                      event,
                                      'nw',
                                    )
                                  }
                                  onPointerMove={
                                    handleCropPointerMove
                                  }
                                  onPointerUp={
                                    handleCropPointerUp
                                  }
                                />

                                <span
                                  className="crop-handle crop-handle--n"
                                  onPointerDown={(
                                    event,
                                  ) =>
                                    handleCropPointerDown(
                                      event,
                                      'n',
                                    )
                                  }
                                  onPointerMove={
                                    handleCropPointerMove
                                  }
                                  onPointerUp={
                                    handleCropPointerUp
                                  }
                                />

                                <span
                                  className="crop-handle crop-handle--ne"
                                  onPointerDown={(
                                    event,
                                  ) =>
                                    handleCropPointerDown(
                                      event,
                                      'ne',
                                    )
                                  }
                                  onPointerMove={
                                    handleCropPointerMove
                                  }
                                  onPointerUp={
                                    handleCropPointerUp
                                  }
                                />

                                <span
                                  className="crop-handle crop-handle--e"
                                  onPointerDown={(
                                    event,
                                  ) =>
                                    handleCropPointerDown(
                                      event,
                                      'e',
                                    )
                                  }
                                  onPointerMove={
                                    handleCropPointerMove
                                  }
                                  onPointerUp={
                                    handleCropPointerUp
                                  }
                                />

                                <span
                                  className="crop-handle crop-handle--se"
                                  onPointerDown={(
                                    event,
                                  ) =>
                                    handleCropPointerDown(
                                      event,
                                      'se',
                                    )
                                  }
                                  onPointerMove={
                                    handleCropPointerMove
                                  }
                                  onPointerUp={
                                    handleCropPointerUp
                                  }
                                />

                                <span
                                  className="crop-handle crop-handle--s"
                                  onPointerDown={(
                                    event,
                                  ) =>
                                    handleCropPointerDown(
                                      event,
                                      's',
                                    )
                                  }
                                  onPointerMove={
                                    handleCropPointerMove
                                  }
                                  onPointerUp={
                                    handleCropPointerUp
                                  }
                                />

                                <span
                                  className="crop-handle crop-handle--sw"
                                  onPointerDown={(
                                    event,
                                  ) =>
                                    handleCropPointerDown(
                                      event,
                                      'sw',
                                    )
                                  }
                                  onPointerMove={
                                    handleCropPointerMove
                                  }
                                  onPointerUp={
                                    handleCropPointerUp
                                  }
                                />

                                <span
                                  className="crop-handle crop-handle--w"
                                  onPointerDown={(
                                    event,
                                  ) =>
                                    handleCropPointerDown(
                                      event,
                                      'w',
                                    )
                                  }
                                  onPointerMove={
                                    handleCropPointerMove
                                  }
                                  onPointerUp={
                                    handleCropPointerUp
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="crop-image-info">
                      <div>
                        <span>
                          Original
                        </span>

                        <strong>
                          {rotatedImageDimensions.width}{' '}
                          ×{' '}
                          {rotatedImageDimensions.height}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Crop area
                        </span>

                        <strong>
                          {outputDimensions.width}{' '}
                          ×{' '}
                          {outputDimensions.height}
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

                  <div className="crop-controls">
                    <div className="crop-controls__top">
                      <div>
                        <span className="crop-controls__eyebrow">
                          Crop settings
                        </span>

                        <h2>
                          Fine-tune your image
                        </h2>
                      </div>

                      <button
                        type="button"
                        className="crop-reset-settings"
                        onClick={
                          resetSettings
                        }
                      >
                        Reset
                      </button>
                    </div>

                    <div className="crop-section">
                      <div className="crop-section__heading">
                        <h3>
                          Aspect ratio
                        </h3>

                        <span>
                          {aspectRatio ===
                          'custom'
                            ? `${customRatioWidth}:${customRatioHeight}`
                            : aspectRatio}
                        </span>
                      </div>

                      <div className="crop-ratio-presets">
                        {ASPECT_PRESETS.map(
                          (preset) => (
                            <button
                              key={
                                preset.value
                              }
                              type="button"
                              className={
                                aspectRatio ===
                                preset.value
                                  ? 'is-active'
                                  : ''
                              }
                              onClick={() =>
                                applyAspectRatio(
                                  preset.value,
                                )
                              }
                            >
                              {
                                preset.label
                              }
                            </button>
                          ),
                        )}
                      </div>

                      <div className="crop-custom-ratio">
                        <input
                          type="number"
                          min="1"
                          value={
                            customRatioWidth
                          }
                          onChange={(
                            event,
                          ) =>
                            setCustomRatioWidth(
                              Number(
                                event.target
                                  .value,
                              ),
                            )
                          }
                          aria-label="Custom ratio width"
                        />

                        <span>
                          :
                        </span>

                        <input
                          type="number"
                          min="1"
                          value={
                            customRatioHeight
                          }
                          onChange={(
                            event,
                          ) =>
                            setCustomRatioHeight(
                              Number(
                                event.target
                                  .value,
                              ),
                            )
                          }
                          aria-label="Custom ratio height"
                        />

                        <button
                          type="button"
                          onClick={
                            applyCustomRatio
                          }
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    <div className="crop-section">
                      <div className="crop-section__heading">
                        <h3>
                          Transform
                        </h3>
                      </div>

                      <div className="crop-transform-actions">
                        <button
                          type="button"
                          onClick={() =>
                            rotateImage(
                              'left',
                            )
                          }
                        >
                          ↶ Rotate left
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            rotateImage(
                              'right',
                            )
                          }
                        >
                          ↷ Rotate right
                        </button>

                        <button
                          type="button"
                          className={
                            flipHorizontal
                              ? 'is-active'
                              : ''
                          }
                          onClick={() => {
                            setFlipHorizontal(
                              (
                                current,
                              ) =>
                                !current,
                              )
                            setProcessedUrl(
                              null,
                            )
                          }}
                        >
                          ↔ Flip horizontal
                        </button>

                        <button
                          type="button"
                          className={
                            flipVertical
                              ? 'is-active'
                              : ''
                          }
                          onClick={() => {
                            setFlipVertical(
                              (
                                current,
                              ) =>
                                !current,
                              )
                            setProcessedUrl(
                              null,
                            )
                          }}
                        >
                          ↕ Flip vertical
                        </button>
                      </div>
                    </div>

                    <div className="crop-section">
                      <div className="crop-section__heading">
                        <h3>
                          Output
                        </h3>
                      </div>

                      <div className="crop-output-grid">
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
                              {formatLabel}
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
                              {quality}%
                            </strong>
                          </span>

                          <input
                            className="crop-quality"
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
                                  event.target
                                    .value,
                                ),
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="crop-output-summary">
                      <div>
                        <span>
                          Crop dimensions
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
                        className="crop-error"
                        role="alert"
                      >
                        {error}
                      </div>
                    )}

                    <div className="crop-actions">
                      {!processedUrl ? (
                        <button
                          type="button"
                          className="btn btn--primary crop-main-button"
                          onClick={
                            cropImage
                          }
                          disabled={
                            isProcessing
                          }
                        >
                          {isProcessing
                            ? 'Cropping...'
                            : 'Crop Image'}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn--primary crop-main-button"
                            onClick={
                              downloadImage
                            }
                          >
                            Download{' '}
                            {formatLabel}
                          </button>

                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={
                              cropImage
                            }
                          >
                            Crop Again
                          </button>
                        </>
                      )}
                    </div>

                    <p className="crop-privacy">
                      Your image is processed
                      directly in your browser.
                      It is never uploaded to a
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