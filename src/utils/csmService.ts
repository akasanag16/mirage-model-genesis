
import { toast } from 'sonner';

// Updated CSM API endpoint with proper configuration
const CSM_API_URL = 'https://api.csm.ai/v1';

// Get API key from localStorage or environment
const getApiKey = () => {
  return localStorage.getItem('csmApiKey') || '';
};

/**
 * Generates a 3D model from a 2D image using CSM's free API
 * 
 * @param imageUrl - URL of the image to transform into a 3D model
 * @returns Promise with the model data (GLB format)
 */
export async function generateCsmModel(
  imageUrl: string
): Promise<ArrayBuffer | null> {
  try {
    console.log('Generating 3D model using CSM API');
    toast.loading('Processing with CSM AI...', {
      id: 'csm-generation'
    });
    
    // First we need to fetch the image as a blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`Failed to fetch image for CSM API: ${imageResponse.status}`);
      toast.error('Failed to process image for CSM AI', {
        id: 'csm-generation'
      });
      return null;
    }
    
    const imageBlob = await imageResponse.blob();
    
    // Validate image data
    if (imageBlob.size < 1000) {
      console.error(`Image too small for CSM API: ${imageBlob.size} bytes`);
      toast.error('Image too small for processing with CSM AI', {
        id: 'csm-generation'
      });
      return null;
    }
    
    // Prepare form data with the image and enhanced parameters
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('workflow', 'image_to_3d');
    formData.append('output_format', 'glb');
    formData.append('quality', 'high');
    formData.append('detail', 'high');
    
    // Set up API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    try {
      // Make the request to CSM API
      const response = await fetch(`${CSM_API_URL}/image-to-3d`, {
        method: 'POST',
        signal: controller.signal,
        body: formData
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CSM API error:', errorText);
        toast.error('Failed to start CSM AI generation', {
          id: 'csm-generation'
        });
        return null;
      }
      
      // Get the response data
      const responseData = await response.json();
      
      if (responseData.status === 'processing') {
        // Poll for completion if processing
        const taskId = responseData.task_id;
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
          // Wait with increasing intervals
          const waitTime = Math.min(3000 + attempts * 500, 6000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Update progress toast
          const progress = Math.min(Math.round((attempts / maxAttempts) * 100), 95);
          toast.loading(`CSM AI generation: ${progress}% complete`, {
            id: 'csm-generation'
          });
          
          const statusResponse = await fetch(`${CSM_API_URL}/task/${taskId}`);
          
          if (!statusResponse.ok) {
            console.error(`CSM API status check error: ${statusResponse.status}`);
            attempts++;
            continue;
          }
          
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed' && statusData.output_url) {
            // Validate and download the model
            const modelResponse = await fetch(statusData.output_url);
            
            if (!modelResponse.ok) {
              console.error(`Failed to download model from CSM AI: ${modelResponse.status}`);
              toast.error('Failed to download CSM AI model', {
                id: 'csm-generation'
              });
              return null;
            }
            
            const modelData = await modelResponse.arrayBuffer();
            
            // Validate model data
            if (modelData.byteLength < 5000) {
              console.error(`CSM AI returned invalid model data: ${modelData.byteLength} bytes`);
              toast.error('Invalid model data from CSM AI', {
                id: 'csm-generation'
              });
              return null;
            }
            
            console.log('✅ Successfully generated 3D model from CSM AI');
            toast.success('CSM AI model generated successfully!', {
              id: 'csm-generation'
            });
            
            return modelData;
          } else if (statusData.status === 'failed') {
            console.error('CSM AI model generation failed:', statusData.error || 'Unknown error');
            toast.error('CSM AI model generation failed', {
              id: 'csm-generation'
            });
            return null;
          }
          
          attempts++;
        }
        
        console.error(`CSM AI model generation timed out after ${maxAttempts} attempts`);
        toast.error('CSM AI generation timed out', {
          id: 'csm-generation'
        });
        return null;
      } else if (responseData.output_url) {
        // Direct response with model URL
        const modelResponse = await fetch(responseData.output_url);
        
        if (!modelResponse.ok) {
          console.error(`Failed to download model from CSM AI: ${modelResponse.status}`);
          toast.error('Failed to download CSM AI model', {
            id: 'csm-generation'
          });
          return null;
        }
        
        const modelData = await modelResponse.arrayBuffer();
        
        // Validate model data
        if (modelData.byteLength < 5000) {
          console.error(`CSM AI returned invalid model data: ${modelData.byteLength} bytes`);
          toast.error('Invalid model data from CSM AI', {
            id: 'csm-generation'
          });
          return null;
        }
        
        console.log('✅ Successfully generated 3D model from CSM AI');
        toast.success('CSM AI model generated successfully!', {
          id: 'csm-generation'
        });
        
        return modelData;
      } else {
        console.error('Unexpected response from CSM API:', responseData);
        toast.error('Unexpected response from CSM AI', {
          id: 'csm-generation'
        });
        return null;
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('CSM API request timed out');
        toast.error('CSM AI request timed out', {
          id: 'csm-generation'
        });
        return null;
      }
      
      console.error('Error in CSM API request:', error);
      toast.error('CSM AI request failed', {
        id: 'csm-generation'
      });
      return null;
    }
    
  } catch (error) {
    console.error('Error generating 3D model with CSM AI:', error);
    toast.error('CSM AI generation failed. Trying next method.', {
      id: 'csm-generation'
    });
    return null;
  }
}
