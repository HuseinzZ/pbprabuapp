import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file to a specified Supabase Storage bucket.
 * @param file The file to upload
 * @param bucket The name of the storage bucket
 * @returns The public URL of the uploaded file
 */
export async function uploadStorageFile(file: File, bucket: string): Promise<string> {
  const supabase = createClient();
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Deletes a file from a specified Supabase Storage bucket based on its public URL.
 * @param fileUrl The public URL of the file to delete
 * @param bucket The name of the storage bucket
 */
export async function deleteStorageFile(fileUrl: string, bucket: string): Promise<void> {
  if (!fileUrl) return;
  
  try {
    const supabase = createClient();
    
    // Extract the file path from the public URL
    // Public URL format: https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[filepath]
    const parts = fileUrl.split(`/public/${bucket}/`);
    if (parts.length > 1) {
      const filePath = parts[1];
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) {
        console.error("Failed to delete storage file:", error.message);
      }
    }
  } catch (err) {
    console.error("Error deleting storage file:", err);
  }
}
