import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function pickImageAsync(
  aspect: [number, number] = [1, 1],
  permissionTitle = 'Permission needed',
  permissionMessage = 'Enable photo library access to upload photos.',
): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(permissionTitle, permissionMessage);
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function uploadImageAsync(uri: string, path: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

// Shared pick-then-upload-then-save flow for business photos (avatar, cover, portfolio).
// Used by ProfileScreen and BusinessDetailsScreen so the upload logic lives in one place.
export async function uploadBusinessImage(options: {
  uid: string;
  aspect: [number, number];
  storagePath: string;
  save: (uid: string, url: string) => Promise<void>;
  setUploading: (uploading: boolean) => void;
  errorLabel: string;
  errorMessage: string;
  onSuccess?: () => void;
  uploadFailedTitle?: string;
  permissionTitle?: string;
  permissionMessage?: string;
}): Promise<void> {
  const uri = await pickImageAsync(options.aspect, options.permissionTitle, options.permissionMessage);
  if (!uri) return;
  options.setUploading(true);
  try {
    const url = await uploadImageAsync(uri, options.storagePath);
    await options.save(options.uid, url);
    options.onSuccess?.();
  } catch (err) {
    console.error(`${options.errorLabel} failed:`, err);
    Alert.alert(options.uploadFailedTitle ?? 'Upload failed', options.errorMessage);
  } finally {
    options.setUploading(false);
  }
}
