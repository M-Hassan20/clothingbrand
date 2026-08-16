/**
 * Helper to enrich Cloudinary URLs with dynamic image optimization parameters.
 * Inserts transformation segments like `w_{width},q_auto,f_auto` after the `/upload/` section.
 */
export function getOptimizedImageUrl(url: string | null | undefined, width = 400): string {
  if (!url) return '';
  
  // Return directly if it is not a Cloudinary image (e.g. mock Unsplash placeholder URLs)
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  const uploadSegment = '/upload/';
  const uploadIndex = url.indexOf(uploadSegment);
  
  if (uploadIndex === -1) {
    return url;
  }

  const insertPosition = uploadIndex + uploadSegment.length;
  // w_xxxx -> target width, q_auto -> quality auto, f_auto -> format auto (WebP, AVIF support)
  const transformation = `w_${width},q_auto,f_auto/`;
  
  return url.slice(0, insertPosition) + transformation + url.slice(insertPosition);
}
