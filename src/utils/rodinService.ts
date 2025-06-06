
import { toast } from 'sonner';

// Base URL for Rodin API
const RODIN_API_URL = 'https://hyperhuman.deemos.com/api';

/**
 * Generates a high-quality 3D model from a 2D image using Rodin's free API
 * 
 * @param imageUrl - URL of the image to transform into a 3D model
 * @returns Promise with the model data (GLB format)
 */
export async function generateRodinModel(
  imageUrl: string
): Promise<ArrayBuffer | null> {
  try {
    console.log('Generating high-quality 3D model using Rodin API');
    toast.loading('Processing with Rodin AI...', {
      id: 'rodin-generation'
    });
    
    // Image validation and preprocessing
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`Failed to fetch image for Rodin API: ${imageResponse.status}`);
      toast.error('Failed to process image for Rodin AI', {
        id: 'rodin-generation'
      });
      return null;
    }
    
    const imageBlob = await imageResponse.blob();
    
    // Validate image data
    if (imageBlob.size < 1000) {
      console.error(`Image too small for Rodin API: ${imageBlob.size} bytes`);
      toast.error('Image too small for processing with Rodin AI', {
        id: 'rodin-generation'
      });
      return null;
    }
    
    // Prepare form data with the image and enhanced parameters
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('type', 'image_to_3d');
    formData.append('quality', 'high');
    formData.append('detail', 'high');
    
    // Set up API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    try {
      // Make the request to Rodin API to start the generation job
      const initiateResponse = await fetch(`${RODIN_API_URL}/image-to-3d`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      });
      
      clearTimeout(timeoutId);
      
      if (!initiateResponse.ok) {
        const errorText = await initiateResponse.text();
        console.error('Rodin API error:', errorText);
        toast.error('Failed to start Rodin AI generation', {
          id: 'rodin-generation'
        });
        return null;
      }
      
      // Get the job ID from the response
      const initiateData = await initiateResponse.json();
      const jobId = initiateData.task_id;
      
      if (!jobId) {
        console.error('No job ID received from Rodin API');
        toast.error('Invalid response from Rodin AI', {
          id: 'rodin-generation'
        });
        return null;
      }
      
      // Poll for job completion with progress updates
      let modelUrl: string | null = null;
      let attempts = 0;
      const maxAttempts = 25; // Maximum polling attempts
      
      while (attempts < maxAttempts && !modelUrl) {
        // Wait between polling attempts with increasing intervals
        const waitTime = Math.min(3000 + attempts * 500, 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Check job status
        const statusResponse = await fetch(`${RODIN_API_URL}/task/${jobId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!statusResponse.ok) {
          console.error(`Rodin API status check error: ${statusResponse.status}`);
          attempts++;
          continue;
        }
        
        const statusData = await statusResponse.json();
        
        // Update progress toast
        const progress = Math.min(Math.round((attempts / maxAttempts) * 100), 95);
        toast.loading(`Rodin AI generation: ${progress}% complete`, {
          id: 'rodin-generation'
        });
        
        // Check if the job is completed
        if (statusData.status === 'completed' && statusData.result?.model_url) {
          modelUrl = statusData.result.model_url;
          break;
        } else if (statusData.status === 'failed') {
          console.error('Rodin AI model generation failed:', statusData.error || 'Unknown error');
          toast.error('Rodin AI generation failed', {
            id: 'rodin-generation'
          });
          return null;
        }
        
        attempts++;
      }
      
      if (!modelUrl) {
        console.error(`Rodin AI model generation timed out after ${maxAttempts} attempts`);
        toast.error('Rodin AI generation timed out', {
          id: 'rodin-generation'
        });
        return null;
      }
      
      // Enhanced model validation and download
      const modelResponse = await fetch(modelUrl);
      if (!modelResponse.ok) {
        console.error(`Failed to download model from Rodin AI: ${modelResponse.status}`);
        toast.error('Failed to download Rodin AI model', {
          id: 'rodin-generation'
        });
        return null;
      }
      
      // Get the model data
      const modelData = await modelResponse.arrayBuffer();
      
      // Validate model data
      if (modelData.byteLength < 5000) {
        console.error(`Rodin AI returned invalid model data: ${modelData.byteLength} bytes`);
        toast.error('Invalid model data from Rodin AI', {
          id: 'rodin-generation'
        });
        return null;
      }
      
      console.log('✅ Successfully generated high-quality 3D model from Rodin AI');
      toast.success('Rodin AI model generated successfully!', {
        id: 'rodin-generation'
      });
      
      return modelData;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Rodin API request timed out');
        toast.error('Rodin AI request timed out', {
          id: 'rodin-generation'
        });
        return null;
      }
      
      console.error('Error in Rodin API request:', error);
      toast.error('Rodin AI request failed', {
        id: 'rodin-generation'
      });
      return null;
    }
    
  } catch (error) {
    console.error('Error generating 3D model with Rodin AI:', error);
    toast.error('Rodin AI generation failed. Trying next method.', {
      id: 'rodin-generation'
    });
    return null;
  }
}
