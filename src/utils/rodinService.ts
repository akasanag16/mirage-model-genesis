
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
    toast.info('Starting Rodin AI 3D model generation...');
    
    // First we need to fetch the image as a blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch image');
    
    const imageBlob = await imageResponse.blob();
    
    // Prepare form data with the image
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('type', 'image_to_3d');
    formData.append('quality', 'high');
    
    // Make the request to Rodin API to start the generation job
    const initiateResponse = await fetch(`${RODIN_API_URL}/image-to-3d`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    });
    
    if (!initiateResponse.ok) {
      const errorText = await initiateResponse.text();
      console.error('Rodin API error:', errorText);
      throw new Error(`Failed to start 3D model generation: ${initiateResponse.statusText}`);
    }
    
    // Get the job ID from the response
    const initiateData = await initiateResponse.json();
    const jobId = initiateData.task_id;
    
    if (!jobId) {
      throw new Error('No job ID received from Rodin API');
    }
    
    // Poll for job completion
    let modelUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 20; // Maximum polling attempts
    
    while (attempts < maxAttempts && !modelUrl) {
      // Wait 3 seconds between polling attempts
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check job status
      const statusResponse = await fetch(`${RODIN_API_URL}/task/${jobId}`, {
        method: 'GET'
      });
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Rodin API status check error:', errorText);
        throw new Error(`Failed to check 3D model status: ${statusResponse.statusText}`);
      }
      
      const statusData = await statusResponse.json();
      
      // Check if the job is completed
      if (statusData.status === 'completed' && statusData.result?.model_url) {
        modelUrl = statusData.result.model_url;
        break;
      } else if (statusData.status === 'failed') {
        throw new Error('Rodin AI model generation failed');
      }
      
      attempts++;
      console.log(`Waiting for Rodin AI model generation... (${attempts}/${maxAttempts})`);
    }
    
    if (!modelUrl) {
      throw new Error('Rodin AI model generation timed out');
    }
    
    // Download the GLB model
    const modelResponse = await fetch(modelUrl);
    if (!modelResponse.ok) {
      throw new Error('Failed to download model from Rodin AI');
    }
    
    // Response will be the 3D model data
    const modelData = await modelResponse.arrayBuffer();
    console.log('✅ Successfully generated high-quality 3D model from Rodin AI');
    toast.success('Rodin AI 3D model generated successfully!');
    
    return modelData;
  } catch (error) {
    console.error('Error generating 3D model with Rodin AI:', error);
    toast.error('Rodin AI generation failed. Trying next method...');
    return null;
  }
}
