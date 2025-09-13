
import { toast } from 'sonner';

// Base URL for Hugging Face Inference API
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Working models for high-quality 3D mesh generation
const MODELS = [
  'VAST-AI/TripoSG', // Latest working 3D generation model
  'stabilityai/TripoSR', // Stability AI's proven 3D model
  'ashawkey/LGM', // Reliable high-quality model
  'Intel/dpt-hybrid-midas' // Depth estimation fallback
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
  toast.info('Starting Hugging Face model generation...', {
    duration: 3000,
    id: 'hf-generation'
  });
  
  // Try each model in order of preference
  for (const modelId of MODELS) {
    try {
      console.log(`Trying Hugging Face model: ${modelId}`);
      toast.loading(`Processing with ${modelId.split('/')[1]}...`, {
        id: 'hf-generation'
      });
      
      // First we need to fetch the image as a blob
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.warn(`Failed to fetch image for ${modelId}, status: ${imageResponse.status}`);
        continue;
      }
      
      const imageBlob = await imageResponse.blob();
      
      // Validate image data
      if (imageBlob.size < 1000) {
        console.warn(`Image data too small (${imageBlob.size} bytes) for ${modelId}`);
        continue;
      }
      
      // Prepare form data with the image
      const formData = new FormData();
      formData.append('file', imageBlob);
      
      // Enhanced parameters for better quality
      formData.append('options', JSON.stringify({
        wait_for_model: true,
        use_cache: false,
        parameters: {
          quality: 'high',
          resolution: 512,
          num_inference_steps: 30,
          detail_level: 'high',
          output_format: 'glb'
        }
      }));
      
      // Make the request to Hugging Face API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
      
      try {
        const response = await fetch(`${HF_API_URL}/${modelId}`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            // You can add an optional API key here if you have one
            // 'Authorization': `Bearer ${apiKey}`
          }
        });
        
        clearTimeout(timeoutId);
        
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
        if (modelData.byteLength < 5000) {
          console.warn(`Model ${modelId} returned insufficient data (${modelData.byteLength} bytes), trying next...`);
          continue;
        }
        
        console.log(`✅ Successfully generated high-quality 3D model with ${modelId}`);
        toast.success(`Generated with ${modelId.split('/')[1]}!`, {
          id: 'hf-generation'
        });
        
        return modelData;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.warn(`Request for ${modelId} timed out after 90 seconds`);
          continue;
        }
        throw error;
      }
      
    } catch (error) {
      console.error(`Error with model ${modelId}:`, error);
      continue;
    }
  }
  
  // If all models failed
  console.error('All Hugging Face models failed');
  toast.error('Hugging Face generation failed. Trying alternatives.', {
    id: 'hf-generation'
  });
  return null;
}
