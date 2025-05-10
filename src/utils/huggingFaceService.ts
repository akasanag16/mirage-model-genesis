
import { toast } from 'sonner';

// Base URL for Hugging Face Inference API
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Model ID for 3D mesh generation
// Using a free public model that's good for 3D generation
const MODEL_ID = 'svenhw/SDXLPointGeneration';

/**
 * Generates a 3D model from a 2D image using Hugging Face's API
 * 
 * @param imageUrl - URL of the image to transform into a 3D model
 * @returns Promise with the model data (GLTF format)
 */
export async function generate3DModelFromImage(
  imageUrl: string
): Promise<ArrayBuffer | null> {
  try {
    console.log('Generating 3D model from image using Hugging Face API');
    toast.info('Starting advanced 3D model generation...');
    
    // First we need to fetch the image as a blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch image');
    
    const imageBlob = await imageResponse.blob();
    
    // Prepare form data with the image
    const formData = new FormData();
    formData.append('file', imageBlob);
    
    // Make the request to Hugging Face API
    // Note: This uses their public API which has rate limits
    // For production use, you would want to add proper authentication
    const response = await fetch(`${HF_API_URL}/${MODEL_ID}`, {
      method: 'POST',
      body: formData,
      // Don't include any auth headers for free public access
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      throw new Error(`Failed to generate 3D model: ${response.statusText}`);
    }
    
    // Response will be the 3D model data
    const modelData = await response.arrayBuffer();
    console.log('✅ Successfully generated 3D model from Hugging Face API');
    toast.success('Advanced 3D model generated successfully!');
    
    return modelData;
  } catch (error) {
    console.error('Error generating 3D model:', error);
    toast.error('Failed to generate advanced 3D model. Falling back to local generation.');
    return null;
  }
}
