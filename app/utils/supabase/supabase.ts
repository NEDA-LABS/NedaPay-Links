import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (for public operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
// Server-side Supabase client (for admin operations)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (!supabaseServiceKey) {
  throw new Error('Missing Supabase service role key');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Helper function to get storage bucket (using admin client)
export const getStorageBucket = async (bucketName: string) => {
  const { data: buckets, error } = await supabaseAdmin.storage.getBucket(bucketName);
  if (error) throw error;
  return buckets;
};

// Helper function to upload file to bucket (using admin client)
export const uploadToBucket = async (bucketName: string, filePath: string, file: File) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, file, {
      upsert: false, // Set to true if you want to overwrite existing files
      duplex: 'half' // Required for File uploads in some environments
    });
  
  if (error) {
    console.error('Upload error:', error);
    throw error;
  }
  return data;
};

// Helper function to get public URL for a file (can use either client)
export const getPublicUrl = (bucketName: string, filePath: string) => {
  const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
};

// Helper function to delete file from bucket (using admin client)
export const deleteFromBucket = async (bucketName: string, filePath: string) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .remove([filePath]);
  
  if (error) throw error;
  return data;
};

// Helper function to get signed URL for private files (using admin client)
export const getSignedUrl = async (bucketName: string, filePath: string, expiresIn = 3600) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(filePath, expiresIn);
  
  if (error) throw error;
  return data.signedUrl;
};