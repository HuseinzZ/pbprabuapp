import { createClient } from "@/lib/supabase/client";

/**
 * Extracts the storage path (relative to the bucket) from a Supabase public URL.
 * Example URL:
 * https://your-project.supabase.co/storage/v1/object/public/gallery/gallery/12345.jpg?t=123
 * Output: gallery/12345.jpg
 */
export function extractStoragePath(url: string | null | undefined, bucketId: string): string | null {
  if (!url) return null;
  const searchStr = `/public/${bucketId}/`;
  const index = url.indexOf(searchStr);
  if (index === -1) return null;
  let path = url.substring(index + searchStr.length);
  // remove query parameters like ?t=123
  const qIndex = path.indexOf('?');
  if (qIndex !== -1) {
    path = path.substring(0, qIndex);
  }
  return decodeURIComponent(path);
}

/**
 * Helper to delete a file from Supabase storage if it exists.
 */
export async function deleteStorageFile(url: string | null | undefined, bucketId: string) {
  const path = extractStoragePath(url, bucketId);
  if (!path) return;

  const supabase = createClient();
  const { error } = await supabase.storage.from(bucketId).remove([path]);
  if (error) {
    console.error(`Failed to delete storage file from bucket '${bucketId}' at path '${path}':`, error.message);
  } else {
    console.log(`Successfully deleted storage file from bucket '${bucketId}' at path '${path}'`);
  }
}
