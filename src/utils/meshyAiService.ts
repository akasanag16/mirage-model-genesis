
import { toast } from 'sonner';

// Base URL for Meshy AI API
const MESHY_API_URL = 'https://api.meshy.ai/v2';

/**
 * Generates a high-quality 3D model from a 2D image using Meshy AI's API
 * 
 * @param imageUrl - URL of the image to transform into a 3D model
 * @param apiKey - Meshy AI API key
 * @returns Promise with the model data (GLB format)
 */
export async function generateMeshyModel(
  imageUrl: string,
  apiKey?: string
): Promise<ArrayBuffer | null> {
  // Without an API key, we can't use Meshy.ai
  if (!apiKey) {
    console.log('Meshy AI API key not provided, skipping Meshy generation');
    return null;
  }

  try {
    console.log('Generating detailed 3D model using Meshy AI');
    toast.loading('Processing with Meshy AI...', {
      id: 'meshy-generation'
    });
    
    // First we need to fetch the image as a blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`Failed to fetch image for Meshy AI API: ${imageResponse.status}`);
      toast.error('Failed to process image for Meshy AI', {
        id: 'meshy-generation'
      });
      return null;
    }
    
    const imageBlob = await imageResponse.blob();
    
    // Validate image data
    if (imageBlob.size < 1000) {
      console.error(`Image too small for Meshy AI API: ${imageBlob.size} bytes`);
      toast.error('Image too small for processing with Meshy AI', {
        id: 'meshy-generation'
      });
      return null;
    }
    
    // Prepare form data with the image and enhanced parameters
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('type', 'textured-mesh');
    formData.append('quality', 'high');
    formData.append('detail', 'high');
    
    // Set up API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout for premium service
    
    try {
      // Make the request to Meshy AI API to start the generation job
      const initiateResponse = await fetch(`${MESHY_API_URL}/image-to-3d`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        body: formData
      });
      
      clearTimeout(timeoutId);
      
      if (!initiateResponse.ok) {
        // Handle common API key errors
        if (initiateResponse.status === 401) {
          console.error('Meshy AI API error: Invalid API key');
          toast.error('Invalid Meshy AI API key. Please check your settings.', {
            id: 'meshy-generation',
            duration: 5000
          });
          return null;
        }
        
        const errorText = await initiateResponse.text();
        console.error('Meshy AI API error:', errorText);
        toast.error('Failed to start Meshy AI generation', {
          id: 'meshy-generation'
        });
        return null;
      }
      
      // Get the job ID from the response
      const initiateData = await initiateResponse.json();
      const jobId = initiateData.id;
      
      if (!jobId) {
        console.error('No job ID received from Meshy AI API');
        toast.error('Invalid response from Meshy AI', {
          id: 'meshy-generation'
        });
        return null;
      }
      
      // Poll for job completion with progress updates
      let modelUrl: string | null = null;
      let attempts = 0;
      const maxAttempts = 35; // Premium service gets more polling attempts
      
      while (attempts < maxAttempts && !modelUrl) {
        // Wait between polling attempts
        const waitTime = Math.min(2000 + attempts * 300, 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Update progress toast
        const progress = Math.min(Math.round((attempts / maxAttempts) * 100), 95);
        toast.loading(`Meshy AI generation: ${progress}% complete`, {
          id: 'meshy-generation'
        });
        
        // Check job status
        const statusResponse = await fetch(`${MESHY_API_URL}/image-to-3d/${jobId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });
        
        if (!statusResponse.ok) {
          console.error(`Meshy AI status check error: ${statusResponse.status}`);
          attempts++;
          continue;
        }
        
        const statusData = await statusResponse.json();
        
        // Check if the job is completed
        if (statusData.status === 'completed' && statusData.output?.glb) {
          modelUrl = statusData.output.glb;
          break;
        } else if (statusData.status === 'failed') {
          console.error('Meshy AI model generation failed:', statusData.error || 'Unknown error');
          toast.error('Meshy AI model generation failed', {
            id: 'meshy-generation'
          });
          return null;
        }
        
        attempts++;
      }
      
      if (!modelUrl) {
        console.error(`Meshy AI model generation timed out after ${maxAttempts} attempts`);
        toast.error('Meshy AI generation timed out', {
          id: 'meshy-generation'
        });
        return null;
      }
      
      // Enhanced model validation and download
      const modelResponse = await fetch(modelUrl);
      if (!modelResponse.ok) {
        console.error(`Failed to download model from Meshy AI: ${modelResponse.status}`);
        toast.error('Failed to download Meshy AI model', {
          id: 'meshy-generation'
        });
        return null;
      }
      
      // Get the model data
      const modelData = await modelResponse.arrayBuffer();
      
      // Validate model data
      if (modelData.byteLength < 5000) {
        console.error(`Meshy AI returned invalid model data: ${modelData.byteLength} bytes`);
        toast.error('Invalid model data from Meshy AI', {
          id: 'meshy-generation'
        });
        return null;
      }
      
      console.log('✅ Successfully generated premium 3D model from Meshy AI');
      toast.success('Meshy AI model generated successfully!', {
        id: 'meshy-generation'
      });
      
      return modelData;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Meshy AI API request timed out');
        toast.error('Meshy AI request timed out', {
          id: 'meshy-generation'
        });
        return null;
      }
      
      console.error('Error in Meshy AI API request:', error);
      toast.error('Meshy AI request failed', {
        id: 'meshy-generation'
      });
      return null;
    }
    
  } catch (error) {
    console.error('Error generating 3D model with Meshy AI:', error);
    toast.error('Meshy AI generation failed. Trying alternative methods.', {
      id: 'meshy-generation'
    });
    return null;
  }
}
