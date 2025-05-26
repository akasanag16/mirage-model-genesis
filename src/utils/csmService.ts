
import { toast } from 'sonner';

// Base URL for CSM API
const CSM_API_URL = 'https://api.csm.ai/v1';

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
    toast.info('Starting CSM AI 3D model generation...');
    
    // First we need to fetch the image as a blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch image');
    
    const imageBlob = await imageResponse.blob();
    
    // Prepare form data with the image
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('workflow', 'image_to_3d');
    formData.append('output_format', 'glb');
    
    // Make the request to CSM API
    const response = await fetch(`${CSM_API_URL}/image-to-3d`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CSM API error:', errorText);
      throw new Error(`Failed to generate 3D model: ${response.statusText}`);
    }
    
    // Get the response data
    const responseData = await response.json();
    
    if (responseData.status === 'processing') {
      // Poll for completion if processing
      const taskId = responseData.task_id;
      let attempts = 0;
      const maxAttempts = 15;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const statusResponse = await fetch(`${CSM_API_URL}/task/${taskId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed' && statusData.output_url) {
          const modelResponse = await fetch(statusData.output_url);
          const modelData = await modelResponse.arrayBuffer();
          
          console.log('✅ Successfully generated 3D model from CSM AI');
          toast.success('CSM AI 3D model generated successfully!');
          return modelData;
        } else if (statusData.status === 'failed') {
          throw new Error('CSM AI model generation failed');
        }
        
        attempts++;
        console.log(`Waiting for CSM AI model generation... (${attempts}/${maxAttempts})`);
      }
      
      throw new Error('CSM AI model generation timed out');
    } else if (responseData.output_url) {
      // Direct response with model URL
      const modelResponse = await fetch(responseData.output_url);
      const modelData = await modelResponse.arrayBuffer();
      
      console.log('✅ Successfully generated 3D model from CSM AI');
      toast.success('CSM AI 3D model generated successfully!');
      return modelData;
    } else {
      throw new Error('Unexpected response from CSM API');
    }
    
  } catch (error) {
    console.error('Error generating 3D model with CSM AI:', error);
    toast.error('CSM AI generation failed. Trying next method...');
    return null;
  }
}
