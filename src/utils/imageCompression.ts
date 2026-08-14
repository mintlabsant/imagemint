export type CompressionResult = {
  blob: Blob
  size: number
  width: number
  height: number
}

export async function compressImage(
  file: File,
  quality: number,
  outputType: 'image/jpeg' | 'image/webp',
): Promise<CompressionResult> {
  const image = await loadImage(file)

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Could not create image canvas.')
  }

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  const blob = await canvasToBlob(
    canvas,
    outputType,
    quality,
  )

  return {
    blob,
    size: blob.size,
    width: canvas.width,
    height: canvas.height,
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load the image.'))
    }

    image.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/jpeg' | 'image/webp',
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Image compression failed.'))
          return
        }

        resolve(blob)
      },
      type,
      quality,
    )
  })
}