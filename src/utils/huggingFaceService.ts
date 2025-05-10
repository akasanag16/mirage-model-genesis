
import { toast } from 'sonner';

// Base URL for Hugging Face Inference API
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Model ID for high-quality 3D mesh generation
// This model is better for producing detailed character models like in the reference image
const MODEL_ID = 'stabilityai/TripoSR';

/**
 * Generates a high-quality 3D model from a 2D image using Hugging Face's API
 * 
 * @param imageUrl - URL of the image to transform into a 3D model
 * @returns Promise with the model data (GLTF format)
 */
export async function generate3DModelFromImage(
  imageUrl: string
): Promise<ArrayBuffer | null> {
  try {
    console.log('Generating detailed 3D model using Hugging Face AI');
    toast.info('Starting advanced 3D model generation...');
    
    // First we need to fetch the image as a blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch image');
    
    const imageBlob = await imageResponse.blob();
    
    // Prepare form data with the image
    const formData = new FormData();
    formData.append('file', imageBlob);
    
    // Optional parameters for better quality
    formData.append('options', JSON.stringify({
      wait_for_model: true,
      use_cache: false
    }));
    
    // Make the request to Hugging Face API
    const response = await fetch(`${HF_API_URL}/${MODEL_ID}`, {
      method: 'POST',
      body: formData,
      headers: {
        // You can add an optional API key here if you have one
        // 'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 503) {
        console.warn('Model is loading, trying one more time...');
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const retryResponse = await fetch(`${HF_API_URL}/${MODEL_ID}`, {
          method: 'POST',
          body: formData,
        });
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          console.error('Hugging Face API retry error:', errorText);
          throw new Error(`Failed to generate 3D model: ${retryResponse.statusText}`);
        }
        
        const modelData = await retryResponse.arrayBuffer();
        console.log('✅ Successfully generated high-quality 3D model after retry');
        toast.success('Advanced 3D model generated successfully!');
        return modelData;
      }
      
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      throw new Error(`Failed to generate 3D model: ${response.statusText}`);
    }
    
    // Response will be the 3D model data
    const modelData = await response.arrayBuffer();
    console.log('✅ Successfully generated high-quality 3D model');
    toast.success('Advanced 3D model generated successfully!');
    
    return modelData;
  } catch (error) {
    console.error('Error generating 3D model:', error);
    toast.error('Failed to generate advanced 3D model. Falling back to local generation.');
    return null;
  }
}
