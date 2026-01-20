export async function fileToBase64(file: File | Blob): Promise<string> {
  // Check if we're in Node.js environment (API route)
  if (typeof window === 'undefined') {
    // Node.js environment - use Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  }

  // Browser environment - use FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file as File);
  });
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: 'No file provided. Please select an image file.',
    };
  }

  // Check file size
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty. Please select a valid image file.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please upload an image smaller than 10MB.`,
    };
  }

  // Check file type
  if (!file.type || !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type (${file.type || 'unknown'}). Please upload a PNG, JPG, or WebP image.`,
    };
  }

  // Check file name extension as fallback
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension && !file.type) {
    return {
      valid: false,
      error: 'Invalid file extension. Please upload a PNG, JPG, or WebP image.',
    };
  }

  return { valid: true };
}
