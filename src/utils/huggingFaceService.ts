
import { toast } from 'sonner';

// Base URL for Hugging Face Inference API
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Updated model IDs for better quality 3D mesh generation
const MODELS = [
  'ashawkey/LGM', // High-quality 3D generation model
  'facebook/meshformer', // Meta's mesh generation model
  'stabilityai/TripoSR' // Fallback stable model
];

/**
 * Generates a high-quality 3D model from a 2D image using improved Hugging Face models
 * 
 * @param imageUrl - URL of the image to transform into a 3D model
 * @returns Promise with the model data (GLTF format)
 */
export async function generate3DModelFromImage(
  imageUrl: string
): Promise<ArrayBuffer | null> {
  // Try each model in order of preference
  for (const modelId of MODELS) {
    try {
      console.log(`Trying Hugging Face model: ${modelId}`);
      toast.info(`Generating with ${modelId.split('/')[1]}...`);
      
      // First we need to fetch the image as a blob
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) continue;
      
      const imageBlob = await imageResponse.blob();
      
      // Prepare form data with the image
      const formData = new FormData();
      formData.append('file', imageBlob);
      
      // Optional parameters for better quality
      formData.append('options', JSON.stringify({
        wait_for_model: true,
        use_cache: false,
        parameters: {
          quality: 'high',
          resolution: 512,
          num_inference_steps: 20
        }
      }));
      
      // Make the request to Hugging Face API
      const response = await fetch(`${HF_API_URL}/${modelId}`, {
        method: 'POST',
        body: formData,
        headers: {
          // You can add an optional API key here if you have one
          // 'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 503) {
          console.warn(`Model ${modelId} is loading, trying next model...`);
          continue;
        }
        
        const errorText = await response.text();
        console.error(`Hugging Face API error for ${modelId}:`, errorText);
        continue;
      }
      
      // Response will be the 3D model data
      const modelData = await response.arrayBuffer();
      
      // Validate that we received actual model data
      if (modelData.byteLength < 1000) {
        console.warn(`Model ${modelId} returned insufficient data, trying next...`);
        continue;
      }
      
      console.log(`✅ Successfully generated high-quality 3D model with ${modelId}`);
      toast.success(`High-quality 3D model generated with ${modelId.split('/')[1]}!`);
      
      return modelData;
      
    } catch (error) {
      console.error(`Error with model ${modelId}:`, error);
      continue;
    }
  }
  
  // If all models failed
  console.error('All Hugging Face models failed');
  toast.error('Hugging Face generation failed. Falling back to local generation.');
  return null;
}
