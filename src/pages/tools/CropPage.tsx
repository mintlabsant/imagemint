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

type Point = {
  x: number
  y: number
}

const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/webp'

const MIN_CROP_SIZE = 20
const MAX_OUTPUT_DIMENSION = 10000

const ASPECT_PRESETS = [
  {
    label: 'Free',
    value: 'free' as AspectRatioKey,
  },
  {
    label: '1:1',
    value: '1:1' as AspectRatioKey,
    ratio: 1,
  },
  {
    label: '4:3',
    value: '4:3' as AspectRatioKey,
    ratio: 4 / 3,
  },
  {
    label: '3:2',
    value: '3:2' as AspectRatioKey,
    ratio: 3 / 2,
  },
  {
    label: '16:9',
    value: '16:9' as AspectRatioKey,
    ratio: 16 / 9,
  },
  {
    label: '9:16',
    value: '9:16' as AspectRatioKey,
    ratio: 9 / 16,
  },
]

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

function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360
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
    const cropWidth = width * 0.82
    const cropHeight = height * 0.82

    return {
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
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

  return {
    x: clamp(
      crop.x,
      0,
      imageWidth - width,
    ),
    y: clamp(
      crop.y,
      0,
      imageHeight - height,
    ),
    width,
    height,
  }
}

function getTransformedDimensions(
  width: number,
  height: number,
  rotation: number,
) {
  const normalized = normalizeRotation(rotation)

  if (
    normalized === 90 ||
    normalized === 270
  ) {
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

export default function CropPage({
  darkMode,
  onToggleDarkMode,
}: CropPageProps) {
  const stageRef =
    useRef<HTMLDivElement>(null)

  const imageRef =
    useRef<HTMLImageElement>(null)

  const [file, setFile] =
    useState<File | null>(null)

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null)

  const [imageWidth, setImageWidth] =
    useState(0)

  const [imageHeight, setImageHeight] =
    useState(0)

  const [crop, setCrop] =
    useState<CropRect | null>(null)

  const [aspectRatio, setAspectRatio] =
    useState<AspectRatioKey>('free')

  const [customRatioWidth, setCustomRatioWidth] =
    useState(4)

  const [customRatioHeight, setCustomRatioHeight] =
    useState(3)

  const [rotation, setRotation] =
    useState(0)

  const [flipHorizontal, setFlipHorizontal] =
    useState(false)

  const [flipVertical, setFlipVertical] =
    useState(false)

  const [outputFormat, setOutputFormat] =
    useState<OutputFormat>('original')

  const [quality, setQuality] =
    useState(90)

  const [dragMode, setDragMode] =
    useState<DragMode>(null)

  const [dragStart, setDragStart] =
    useState<{
      pointer: Point
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

  const currentAspectRatio =
    useMemo(
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

  const effectiveOutputType =
    useMemo(() => {
      if (!file) {
        return 'image/png'
      }

      return getMimeType(
        outputFormat,
        file.type,
      )
    }, [file, outputFormat])

  const formatLabel =
    useMemo(() => {
      if (
        effectiveOutputType ===
        'image/jpeg'
      ) {
        return 'JPG'
      }

      if (
        effectiveOutputType ===
        'image/webp'
      ) {
        return 'WEBP'
      }

      return 'PNG'
    }, [effectiveOutputType])

  const transformedDimensions =
    useMemo(
      () =>
        getTransformedDimensions(
          imageWidth,
          imageHeight,
          rotation,
        ),
      [
        imageWidth,
        imageHeight,
        rotation,
      ],
    )

  const outputDimensions =
    useMemo(() => {
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
        URL.revokeObjectURL(processedUrl)
      }
    }
  }, [processedUrl])

  const clearProcessedResult =
    useCallback(() => {
      setProcessedUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current)
        }

        return null
      })

      setProcessedSize(null)
    }, [])

  const handleFile = useCallback(
    (selectedFile: File) => {
      if (
        !selectedFile.type ||
        ![
          'image/jpeg',
          'image/png',
          'image/webp',
        ].includes(selectedFile.type)
      ) {
        setError(
          'Please select a JPG, PNG, or WEBP image.',
        )

        return
      }

      setError(null)

      const objectUrl =
        URL.createObjectURL(
          selectedFile,
        )

      const image = new Image()

      image.onload = () => {
        const width =
          image.naturalWidth

        const height =
          image.naturalHeight

        setFile(selectedFile)
        setImageWidth(width)
        setImageHeight(height)

        setCrop(
          createInitialCrop(
            width,
            height,
            null,
          ),
        )

        setAspectRatio('free')
        setCustomRatioWidth(4)
        setCustomRatioHeight(3)

        setRotation(0)
        setFlipHorizontal(false)
        setFlipVertical(false)

        setOutputFormat('original')
        setQuality(90)

        setProcessedUrl(
          (current) => {
            if (current) {
              URL.revokeObjectURL(
                current,
              )
            }

            return null
          },
        )

        setProcessedSize(null)

        URL.revokeObjectURL(
          objectUrl,
        )
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
    },
    [],
  )

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

    setImageWidth(0)
    setImageHeight(0)
    setCrop(null)

    setRotation(0)
    setFlipHorizontal(false)
    setFlipVertical(false)

    setAspectRatio('free')
    setCustomRatioWidth(4)
    setCustomRatioHeight(3)

    setOutputFormat('original')
    setQuality(90)

    setDragMode(null)
    setDragStart(null)

    setError(null)
  }

  function resetSettings() {
    if (!file) {
      return
    }

    clearProcessedResult()

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

    const ratio =
      getAspectRatio(
        nextAspect,
        customRatioWidth,
        customRatioHeight,
      )

    setAspectRatio(nextAspect)

    clearProcessedResult()

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

    const ratio =
      customRatioWidth /
      customRatioHeight

    setAspectRatio('custom')

    clearProcessedResult()

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

      return normalizeRotation(next)
    })

    clearProcessedResult()
  }

  function getPointerPosition(
    event: React.PointerEvent,
  ) {
    const image =
      imageRef.current

    if (!image) {
      return null
    }

    const rect =
      image.getBoundingClientRect()

    if (
      rect.width <= 0 ||
      rect.height <= 0 ||
      imageWidth <= 0 ||
      imageHeight <= 0
    ) {
      return null
    }

    return {
      x: clamp(
        (event.clientX - rect.left) *
          (imageWidth / rect.width),
        0,
        imageWidth,
      ),
      y: clamp(
        (event.clientY - rect.top) *
          (imageHeight / rect.height),
        0,
        imageHeight,
      ),
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

    const pointer =
      getPointerPosition(event)

    if (!pointer) {
      return
    }

    setDragMode(mode)

    setDragStart({
      pointer,
      crop: {
        ...crop,
      },
    })

    event.currentTarget.setPointerCapture(
      event.pointerId,
    )
  }

  function handleCropPointerMove(
    event: React.PointerEvent,
  ) {
    if (
      !crop ||
      !dragStart ||
      !dragMode
    ) {
      return
    }

    const pointer =
      getPointerPosition(event)

    if (!pointer) {
      return
    }

    const dx =
      pointer.x -
      dragStart.pointer.x

    const dy =
      pointer.y -
      dragStart.pointer.y

    const start =
      dragStart.crop

    if (dragMode === 'move') {
      setCrop(
        normalizeCrop(
          {
            ...start,
            x: start.x + dx,
            y: start.y + dy,
          },
          imageWidth,
          imageHeight,
        ),
      )

      clearProcessedResult()

      return
    }

    let left = start.x
    let right =
      start.x + start.width

    let top = start.y
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

    const ratio =
      currentAspectRatio

    if (ratio) {
      const handleHorizontal =
        dragMode.includes('e') ||
        dragMode.includes('w')

      const handleVertical =
        dragMode.includes('n') ||
        dragMode.includes('s')

      if (
        handleHorizontal &&
        !handleVertical
      ) {
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

      if (
        handleVertical &&
        !handleHorizontal
      ) {
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
        handleHorizontal &&
        handleVertical
      ) {
        const widthDelta =
          Math.abs(
            right - start.x,
          )

        const heightDelta =
          Math.abs(
            bottom - start.y,
          )

        const widthFromHeight =
          heightDelta * ratio

        const width =
          widthDelta >=
          widthFromHeight
            ? widthDelta
            : widthFromHeight

        const height =
          width / ratio

        if (
          dragMode.includes('w')
        ) {
          left =
            right - width
        } else {
          right =
            left + width
        }

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

      if (bottom > imageHeight) {
        bottom = imageHeight

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

    const nextCrop =
      normalizeCrop(
        {
          x: left,
          y: top,
          width:
            right - left,
          height:
            bottom - top,
        },
        imageWidth,
        imageHeight,
      )

    setCrop(nextCrop)
    clearProcessedResult()
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
    if (!file || !crop) {
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
        sourceCanvas.getContext('2d')

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
        normalizeRotation(
          rotation,
        )

      const rotatedDimensions =
        getTransformedDimensions(
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

      transformedContext.imageSmoothingEnabled =
        true

      transformedContext.imageSmoothingQuality =
        'high'

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

      /*
       * The crop UI is expressed in the original
       * image coordinate system.
       *
       * Convert that crop into the transformed
       * canvas coordinate system before drawing.
       */
      let transformedCrop: CropRect

      if (
        normalizedRotation === 0
      ) {
        transformedCrop = {
          ...crop,
        }
      } else if (
        normalizedRotation === 90
      ) {
        transformedCrop = {
          x:
            image.naturalHeight -
            crop.y -
            crop.height,
          y: crop.x,
          width: crop.height,
          height: crop.width,
        }
      } else if (
        normalizedRotation === 180
      ) {
        transformedCrop = {
          x:
            image.naturalWidth -
            crop.x -
            crop.width,
          y:
            image.naturalHeight -
            crop.y -
            crop.height,
          width: crop.width,
          height: crop.height,
        }
      } else {
        transformedCrop = {
          x: crop.y,
          y:
            image.naturalWidth -
            crop.x -
            crop.width,
          width: crop.height,
          height: crop.width,
        }
      }

      /*
       * Flip transformations occur around the
       * transformed canvas centre.
       */
      if (flipHorizontal) {
        transformedCrop.x =
          transformedCanvas.width -
          transformedCrop.x -
          transformedCrop.width
      }

      if (flipVertical) {
        transformedCrop.y =
          transformedCanvas.height -
          transformedCrop.y -
          transformedCrop.height
      }

      transformedCrop.x =
        clamp(
          Math.round(
            transformedCrop.x,
          ),
          0,
          transformedCanvas.width,
        )

      transformedCrop.y =
        clamp(
          Math.round(
            transformedCrop.y,
          ),
          0,
          transformedCanvas.height,
        )

      transformedCrop.width =
        clamp(
          Math.round(
            transformedCrop.width,
          ),
          1,
          transformedCanvas.width -
            transformedCrop.x,
        )

      transformedCrop.height =
        clamp(
          Math.round(
            transformedCrop.height,
          ),
          1,
          transformedCanvas.height -
            transformedCrop.y,
        )

      const outputCanvas =
        document.createElement(
          'canvas',
        )

      outputCanvas.width =
        transformedCrop.width

      outputCanvas.height =
        transformedCrop.height

      const outputContext =
        outputCanvas.getContext('2d')

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
          outputCanvas.width,
          outputCanvas.height,
        )
      }

      outputContext.drawImage(
        transformedCanvas,
        transformedCrop.x,
        transformedCrop.y,
        transformedCrop.width,
        transformedCrop.height,
        0,
        0,
        outputCanvas.width,
        outputCanvas.height,
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

      clearProcessedResult()

      const url =
        URL.createObjectURL(blob)

      setProcessedUrl(url)
      setProcessedSize(blob.size)
    } catch {
      setError(
        'Something went wrong while cropping the image. Please try again.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  function downloadImage() {
    if (!processedUrl || !file) {
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
      document.createElement('a')

    link.href = processedUrl

    link.download =
      `${baseName}-cropped-${outputDimensions.width}x${outputDimensions.height}.${extension}`

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)
  }

  const cropStyle =
    crop && imageWidth > 0
      ? {
          left: `${
            (crop.x / imageWidth) *
            100
          }%`,
          top: `${
            (crop.y / imageHeight) *
            100
          }%`,
          width: `${
            (crop.width / imageWidth) *
            100
          }%`,
          height: `${
            (crop.height / imageHeight) *
            100
          }%`,
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
                <UploadDropzone
                  accept={ACCEPTED_TYPES}
                  multiple={false}
                  onFilesSelected={(
                    files,
                  ) => {
                    if (files[0]) {
                      handleFile(
                        files[0],
                      )
                    }
                  }}
                  title="Drop your image here"
                  browseText="Browse Files"
                  helperText="JPG, PNG or WEBP · processed locally"
                />
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
                            draggable={
                              false
                            }
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

                                {(
                                  [
                                    'nw',
                                    'n',
                                    'ne',
                                    'e',
                                    'se',
                                    's',
                                    'sw',
                                    'w',
                                  ] as const
                                ).map(
                                  (
                                    handle,
                                  ) => (
                                    <span
                                      key={
                                        handle
                                      }
                                      className={`crop-handle crop-handle--${handle}`}
                                      onPointerDown={(
                                        event,
                                      ) =>
                                        handleCropPointerDown(
                                          event,
                                          handle,
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
                                    />
                                  ),
                                )}
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
                          {
                            transformedDimensions.width
                          }{' '}
                          ×{' '}
                          {
                            transformedDimensions.height
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Crop area
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
                                event
                                  .target
                                  .value,
                              ),
                            )
                          }
                          aria-label="Custom ratio width"
                        />

                        <span>:</span>

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
                                event
                                  .target
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
                                value,
                              ) =>
                                !value,
                            )

                            clearProcessedResult()
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
                                value,
                              ) =>
                                !value,
                            )

                            clearProcessedResult()
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
                            ) => {
                              setOutputFormat(
                                event
                                  .target
                                  .value as OutputFormat,
                              )

                              clearProcessedResult()
                            }}
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
                            ) => {
                              setQuality(
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                              )

                              clearProcessedResult()
                            }}
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