import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

/**
 * Compress a local image URI the same way the web client does (max 1200px, quality 0.8).
 * Returns a data URL for JSON upload endpoints (`avatarData` / `mediaData`).
 */
export async function compressImage(
  uri: string,
  maxDimension = 1200,
  quality = 0.8
): Promise<string> {
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
  });

  const actions: ImageManipulator.Action[] = [];
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      actions.push({ resize: { width: maxDimension } });
    } else {
      actions.push({ resize: { height: maxDimension } });
    }
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error('Image compression did not return base64 data.');
  }

  return `data:image/jpeg;base64,${result.base64}`;
}
