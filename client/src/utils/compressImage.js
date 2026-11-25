// client/src/utils/compressImage.js
//
// Shrinks receipt photos in the browser before upload: longest side max
// 1600 px, saved as JPEG at 75 % quality. A typical 3–5 MB phone photo
// becomes roughly 200–400 KB and the text stays easy to read.
// If anything goes wrong, the original file is used instead.

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

export default async function compressImage(file) {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') return file;

  try {
    // Browsers apply the photo's EXIF rotation when drawing, so it stays upright
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // transparent PNG areas become white, not black
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file; // already small enough

    const name = `${file.name.replace(/\.[^.]+$/, '')}.jpg`;
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (err) {
    console.error('Image compression failed, using the original file:', err);
    return file;
  }
}
