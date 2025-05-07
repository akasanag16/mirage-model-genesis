
import * as THREE from 'three';
import { setupLights } from './lightsSetup';
import { toast } from 'sonner';

/**
 * Creates a high-quality 3D model from an image texture using advanced displacement mapping
 * @param scene The THREE.Scene to add the model to
 * @param texture The texture to apply to the model
 * @param setModel Function to set the model reference
 * @param setIsModelReady Function to update model ready state
 * @param setIsLoading Function to update loading state
 */
export const createImagePlane = (
  scene: THREE.Scene,
  texture: THREE.Texture,
  setModel: (model: THREE.Object3D | null) => void,
  setIsModelReady: (isReady: boolean) => void,
  setIsLoading: (isLoading: boolean) => void
) => {
  if (!scene) {
    console.error("Scene not available when creating 3D model");
    setIsLoading(false);
    return;
  }

  try {
    console.log("Creating high-quality 3D model from image texture");
    
    // Calculate aspect ratio to maintain image proportions
    const aspectRatio = texture.image.width / texture.image.height;
    
    // Create heightmap and normal map from texture
    const { displacementMap, normalMap } = createMapsFromTexture(texture);
    
    // Create detailed geometry for the 3D model
    const width = 3; // Base width
    const height = width / aspectRatio;
    const widthSegments = 256; // Higher number for more detailed mesh
    const heightSegments = Math.floor(widthSegments / aspectRatio);
    
    // Create a more detailed plane geometry with many segments
    const geometry = new THREE.PlaneGeometry(
      width, height, 
      widthSegments, heightSegments
    );
    
    // Create material with the loaded image texture and advanced displacement
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      roughness: 0.4,
      metalness: 0.3,
      displacementMap: displacementMap,
      displacementScale: 0.5,
      bumpMap: displacementMap,
      bumpScale: 0.05,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(1.5, 1.5),
      envMapIntensity: 1.0
    });
    
    // Create the mesh with the geometry and material
    const model = new THREE.Mesh(geometry, material);
    
    // Apply advanced displacement to vertices for 3D effect
    applyAdvancedDisplacementToGeometry(geometry, displacementMap);
    
    // Clean up any existing model
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object !== model) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
    
    scene.clear();
    
    // Add lights back to the scene
    setupLights(scene);
    
    // Add environment map for better reflections
    addEnvironmentMap(scene, material);
    
    // Add the 3D model to the scene
    scene.add(model);
    setModel(model);
    setIsModelReady(true);
    setIsLoading(false);
    toast.success('High-quality 3D Model created');
    
  } catch (error) {
    console.error('Error creating 3D model:', error);
    toast.error('Failed to create 3D model');
    setIsLoading(false);
  }
};

/**
 * Creates displacement and normal maps from the texture for enhanced 3D effect
 * @param texture The original texture
 * @returns Object containing displacement and normal map textures
 */
function createMapsFromTexture(texture: THREE.Texture): { 
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
function applyAdvancedDisplacementToGeometry(geometry: THREE.PlaneGeometry, displacementMap: THREE.Texture) {
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
  
  // Smooth geometry for better look
  smoothGeometry(geometry);
}

/**
 * Smooths geometry by averaging vertex positions with neighbors
 * @param geometry The geometry to smooth
 */
function smoothGeometry(geometry: THREE.BufferGeometry) {
  // This is a simplified smoothing algorithm
  // For a real production app, consider using specialized libraries
  
  // Clone the current positions
  const positions = geometry.getAttribute('position');
  const originalPositions = positions.clone();
  
  // Simple smoothing - average with neighbors where possible
  // Note: This is a simplified approach that works for grid-based geometries
  if (geometry instanceof THREE.PlaneGeometry) {
    const widthSegments = geometry.parameters.widthSegments;
    const heightSegments = geometry.parameters.heightSegments;
    
    // Skip edge vertices for simplicity
    for (let i = 1; i < widthSegments; i++) {
      for (let j = 1; j < heightSegments; j++) {
        const idx = j * (widthSegments + 1) + i;
        
        // Get neighboring indices
        const left = j * (widthSegments + 1) + (i - 1);
        const right = j * (widthSegments + 1) + (i + 1);
        const up = (j - 1) * (widthSegments + 1) + i;
        const down = (j + 1) * (widthSegments + 1) + i;
        
        // Average z values with neighbors (smoothing)
        const avgZ = (
          originalPositions.getZ(left) +
          originalPositions.getZ(right) +
          originalPositions.getZ(up) +
          originalPositions.getZ(down) +
          originalPositions.getZ(idx)
        ) / 5;
        
        // Apply smoothed z value
        positions.setZ(idx, avgZ);
      }
    }
    positions.needsUpdate = true;
  }
}

/**
 * Adds an environment map to the scene for better reflections
 * @param scene The THREE.Scene to add the environment to
 * @param material The material to apply the environment map to
 */
function addEnvironmentMap(scene: THREE.Scene, material: THREE.MeshStandardMaterial) {
  // Create a simple environment map
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
  const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
  
  // Add a simple skybox
  const cubeTexture = new THREE.CubeTexture([]);
  cubeTexture.format = THREE.RGBAFormat;
  cubeTexture.needsUpdate = true;
  
  // Simple procedural environment mapping
  const colors = [
    new THREE.Color(0x111122), // right
    new THREE.Color(0x112211), // left
    new THREE.Color(0x221111), // top
    new THREE.Color(0x111122), // bottom
    new THREE.Color(0x112211), // front
    new THREE.Color(0x221111)  // back
  ];
  
  // Create canvas textures for each cube face
  cubeTexture.image = [];
  for (let i = 0; i < 6; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      // Create a simple gradient for each face
      const gradient = context.createLinearGradient(0, 0, 128, 128);
      gradient.addColorStop(0, colors[i].getStyle());
      gradient.addColorStop(1, '#000000');
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
    }
    cubeTexture.image.push(canvas);
  }
  
  // Set the environment map
  scene.background = new THREE.Color(0x111827); // Keep original background
  material.envMap = cubeRenderTarget.texture;
  material.envMapIntensity = 0.5; // Subtle reflection
  material.needsUpdate = true;
}
