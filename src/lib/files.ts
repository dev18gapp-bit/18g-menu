export interface ImagePayload {
  data: string;
  contentType: string;
}

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6MB — keep in sync with my-api's image upload limits

export function readImageFile(file: File): Promise<ImagePayload> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('That image is too large — please choose one under 6MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ data: result.split(',')[1] ?? '', contentType: file.type });
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
