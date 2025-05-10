
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
    toast.info('Starting Meshy AI 3D model generation...');
    
    // First we need to fetch the image as a blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch image');
    
    const imageBlob = await imageResponse.blob();
    
    // Prepare form data with the image
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('type', 'textured-mesh');
    
    // Make the request to Meshy AI API to start the generation job
    const initiateResponse = await fetch(`${MESHY_API_URL}/image-to-3d`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    if (!initiateResponse.ok) {
      const errorText = await initiateResponse.text();
      console.error('Meshy AI API error:', errorText);
      throw new Error(`Failed to start 3D model generation: ${initiateResponse.statusText}`);
    }
    
    // Get the job ID from the response
    const initiateData = await initiateResponse.json();
    const jobId = initiateData.id;
    
    // Poll for job completion
    let modelUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 30; // Maximum polling attempts (30 * 2 seconds = 60 seconds max)
    
    while (attempts < maxAttempts && !modelUrl) {
      // Wait 2 seconds between polling attempts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check job status
      const statusResponse = await fetch(`${MESHY_API_URL}/image-to-3d/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Meshy AI status check error:', errorText);
        throw new Error(`Failed to check 3D model status: ${statusResponse.statusText}`);
      }
      
      const statusData = await statusResponse.json();
      
      // Check if the job is completed
      if (statusData.status === 'completed') {
        modelUrl = statusData.output?.glb;
        break;
      } else if (statusData.status === 'failed') {
        throw new Error('Meshy AI model generation failed');
      }
      
      attempts++;
      console.log(`Waiting for Meshy AI model generation... (${attempts}/${maxAttempts})`);
    }
    
    if (!modelUrl) {
      throw new Error('Meshy AI model generation timed out');
    }
    
    // Download the GLB model
    const modelResponse = await fetch(modelUrl);
    if (!modelResponse.ok) {
      throw new Error('Failed to download model from Meshy AI');
    }
    
    // Response will be the 3D model data
    const modelData = await modelResponse.arrayBuffer();
    console.log('✅ Successfully generated high-quality 3D model from Meshy AI');
    toast.success('Meshy AI 3D model generated successfully!');
    
    return modelData;
  } catch (error) {
    console.error('Error generating 3D model with Meshy AI:', error);
    toast.error('Failed to generate Meshy AI 3D model. Trying alternative methods.');
    return null;
  }
}
