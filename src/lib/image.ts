/**
 * Image normalization utilities.
 *
 * Chrome의 lazy-loading intervention 등으로 인해 <img> 요소가 placeholder
 * 상태로 캡처/전송되는 문제를 방지하기 위해, 항상 Image 객체에 완전히
 * 로드한 뒤 canvas 로 재-그려서 dataURL 을 생성한다.
 */

export class ImageNotLoadedError extends Error {
  constructor(message = "이미지가 아직 로드되지 않았습니다") {
    super(message);
    this.name = "ImageNotLoadedError";
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "sync";
    img.loading = "eager";
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new ImageNotLoadedError());
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다"));
    img.src = src;
  });
}

function drawToDataUrl(img: HTMLImageElement, mimeType = "image/jpeg", quality = 0.9): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 컨텍스트를 만들 수 없습니다");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(mimeType, quality);
}

/** File → Image(onload) → canvas → toDataURL */
export async function fileToNormalizedDataUrl(
  file: File,
  mimeType = "image/jpeg",
  quality = 0.9,
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    return drawToDataUrl(img, mimeType, quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** dataURL 을 Image 에 다시 로드해서 실제 픽셀 데이터가 살아있는지 검증한 뒤 재-인코딩. */
export async function ensureLoadedDataUrl(
  dataUrl: string,
  mimeType = "image/jpeg",
  quality = 0.9,
): Promise<string> {
  const img = await loadImage(dataUrl);
  return drawToDataUrl(img, mimeType, quality);
}

/** API 전송 직전 가드: naturalWidth === 0 이면 throw. */
export function assertImageLoaded(img: HTMLImageElement | null | undefined): asserts img is HTMLImageElement {
  if (!img || img.naturalWidth === 0) {
    throw new ImageNotLoadedError();
  }
}
