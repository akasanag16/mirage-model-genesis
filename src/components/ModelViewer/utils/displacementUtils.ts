
import * as THREE from 'three';

/**
 * Creates displacement and normal maps from the texture for enhanced 3D effect
 * @param texture The original texture
 * @returns Object containing displacement and normal map textures
 */
export function createMapsFromTexture(texture: THREE.Texture): { 
  displacementMap: THREE.Texture, 
  normalMap: THREE.Texture 
} {
  // Create a canvas to process the texture
  const canvas = document.createElement('canvas');
  const width = texture.image.width;
  const height = texture.image.height;
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context for displacement map creation');
  }
  
  // Draw the original texture to the canvas
  ctx.drawImage(texture.image, 0, 0);
  
  // Get image data to process
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Clone the data for the normal map
  const normalMapData = new Uint8ClampedArray(data);
  
  // Convert to grayscale and enhance contrast for better displacement
  for (let i = 0; i < data.length; i += 4) {
    // Calculate luminance (grayscale)
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Enhance contrast for displacement map
    const contrast = 1.8; // higher contrast factor
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const enhancedValue = factor * (luminance - 128) + 128;
    
    // Apply to all channels
    data[i] = data[i + 1] = data[i + 2] = enhancedValue;
  }
  
  // Put the processed data back for displacement map
  ctx.putImageData(imageData, 0, 0);
  const displacementTexture = new THREE.Texture(canvas);
  displacementTexture.needsUpdate = true;
  
  // Create normal map from displacement map
  const normalMapCanvas = document.createElement('canvas');
  normalMapCanvas.width = width;
  normalMapCanvas.height = height;
  const normalCtx = normalMapCanvas.getContext('2d');
  
  if (normalCtx) {
    normalCtx.drawImage(canvas, 0, 0);
    const normalImageData = normalCtx.getImageData(0, 0, width, height);
    const normalData = normalImageData.data;
    
    // Create normal map by comparing neighboring pixels
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Get heights of surrounding pixels
        const left = data[(y * width + (x - 1)) * 4] / 255;
        const right = data[(y * width + (x + 1)) * 4] / 255;
        const up = data[((y - 1) * width + x) * 4] / 255;
        const down = data[((y + 1) * width + x) * 4] / 255;
        
        // Calculate normal vector components
        const dx = (right - left) * 2.0;
        const dy = (down - up) * 2.0;
        const dz = 1.0;
        
        // Normalize
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Convert to RGB (0-255)
        // Normal maps store x in R, y in G, and z in B
        normalData[idx] = Math.floor((dx / length * 0.5 + 0.5) * 255);     // R - x
        normalData[idx + 1] = Math.floor((dy / length * 0.5 + 0.5) * 255); // G - y
        normalData[idx + 2] = Math.floor((dz / length) * 255);             // B - z
        normalData[idx + 3] = 255;                                         // A
      }
    }
    
    normalCtx.putImageData(normalImageData, 0, 0);
  }
  
  const normalMapTexture = new THREE.Texture(normalMapCanvas);
  normalMapTexture.needsUpdate = true;
  
  return { 
    displacementMap: displacementTexture, 
    normalMap: normalMapTexture 
  };
}

/**
 * Applies advanced displacement to the geometry vertices for better 3D effect
 * @param geometry The geometry to modify
 * @param displacementMap The displacement map to use
 */
export function applyAdvancedDisplacementToGeometry(geometry: THREE.PlaneGeometry, displacementMap: THREE.Texture) {
  // Create a canvas to sample the displacement map
  const canvas = document.createElement('canvas');
  const width = displacementMap.image.width;
  const height = displacementMap.image.height;
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Draw the displacement map to the canvas
  ctx.drawImage(displacementMap.image, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height).data;
  
  // Apply advanced displacement to vertices
  const positions = geometry.getAttribute('position');
  
  // Function to sample the displacement value at a UV coordinate
  const sampleDisplacement = (u: number, v: number): number => {
    const x = Math.floor(u * (width - 1));
    const y = Math.floor((1 - v) * (height - 1));
    const index = (y * width + x) * 4;
    return imageData[index] / 255.0; // Normalized value from 0 to 1
  };
  
  // Create a function to apply variable displacement based on image features
  const applyDisplacementToVertex = (i: number, u: number, v: number) => {
    // Sample displacement from map
    const displacement = sampleDisplacement(u, v);
    
    // Apply curve to displacement for more pronounced effect on mid-tones
    const adjustedDisplacement = Math.pow(displacement, 1.5);
    
    // Higher intensity for more pronounced effect
    const displacementIntensity = 0.8;
    
    // Distance from center (0,0 to 1,1)
    const distFromCenter = Math.sqrt(Math.pow((u - 0.5) * 2, 2) + Math.pow((v - 0.5) * 2, 2));
    
    // Create depth falloff from center to edges
    const falloff = 1 - Math.min(1, Math.pow(distFromCenter, 1.2));
    
    // Compute final displacement value
    const zDisplacement = adjustedDisplacement * displacementIntensity * falloff;
    
    // Apply displacement to z coordinate
    positions.setZ(i, zDisplacement);
  };
  
  // Modify vertices based on UV coordinates with advanced displacement
  const uvs = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    const u = uvs.getX(i);
    const v = uvs.getY(i);
    applyDisplacementToVertex(i, u, v);
  }
  
  // Update the geometry
  positions.needsUpdate = true;
  
  // Recalculate normals for better lighting
  geometry.computeVertexNormals();
}
