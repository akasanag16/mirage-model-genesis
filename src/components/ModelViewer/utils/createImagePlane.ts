
import * as THREE from 'three';
import { setupLights } from './lightsSetup';
import { toast } from 'sonner';

/**
 * Creates a 3D model from an image texture using displacement mapping
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
    // Calculate aspect ratio to maintain image proportions
    const aspectRatio = texture.image.width / texture.image.height;
    
    // Create heightmap from texture
    const displacementMap = createDisplacementMap(texture);
    
    // Create detailed geometry for the 3D model
    const width = 3; // Base width
    const height = width / aspectRatio;
    const widthSegments = 128; // Higher number for more detailed mesh
    const heightSegments = Math.floor(widthSegments / aspectRatio);
    
    // Create a more detailed plane geometry with many segments
    const geometry = new THREE.PlaneGeometry(
      width, height, 
      widthSegments, heightSegments
    );
    
    // Create material with the loaded image texture and displacement
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      roughness: 0.4,
      metalness: 0.3,
      displacementMap: displacementMap,
      displacementScale: 0.5,
      bumpMap: displacementMap,
      bumpScale: 0.02,
      normalScale: new THREE.Vector2(1, 1)
    });
    
    // Create the mesh with the geometry and material
    const model = new THREE.Mesh(geometry, material);
    
    // Apply displacement to vertices for 3D effect
    applyDisplacementToGeometry(geometry, displacementMap);
    
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
    
    // Add the 3D model to the scene
    scene.add(model);
    setModel(model);
    setIsModelReady(true);
    setIsLoading(false);
    toast.success('3D Model created successfully');
    
  } catch (error) {
    console.error('Error creating 3D model:', error);
    toast.error('Failed to create 3D model');
    setIsLoading(false);
  }
};

/**
 * Creates a displacement map from the texture for 3D effect
 * @param texture The original texture
 * @returns A new displacement map texture
 */
function createDisplacementMap(texture: THREE.Texture): THREE.Texture {
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
  
  // Convert to grayscale and enhance contrast for better displacement
  for (let i = 0; i < data.length; i += 4) {
    // Calculate luminance (grayscale)
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Enhance contrast
    const contrast = 1.5; // contrast factor
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const enhancedValue = factor * (luminance - 128) + 128;
    
    // Apply to all channels
    data[i] = data[i + 1] = data[i + 2] = enhancedValue;
  }
  
  // Put the processed data back
  ctx.putImageData(imageData, 0, 0);
  
  // Create new texture from canvas
  const displacementTexture = new THREE.Texture(canvas);
  displacementTexture.needsUpdate = true;
  
  return displacementTexture;
}

/**
 * Applies additional vertex displacement to the geometry for more 3D effect
 * @param geometry The geometry to modify
 * @param displacementMap The displacement map to use
 */
function applyDisplacementToGeometry(geometry: THREE.PlaneGeometry, displacementMap: THREE.Texture) {
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
  
  // Apply additional displacement to vertices
  const positions = geometry.getAttribute('position');
  
  // Function to sample the displacement value at a UV coordinate
  const sampleDisplacement = (u: number, v: number): number => {
    const x = Math.floor(u * (width - 1));
    const y = Math.floor((1 - v) * (height - 1));
    const index = (y * width + x) * 4;
    return imageData[index] / 255.0; // Normalized value from 0 to 1
  };
  
  // Modify vertices based on UV coordinates
  const uvs = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    const u = uvs.getX(i);
    const v = uvs.getY(i);
    
    // Sample displacement and apply it in Z direction with variable intensity
    const displacement = sampleDisplacement(u, v);
    const displacementIntensity = 0.5; // Adjust as needed
    
    // Apply more displacement to center and less to edges for a more natural look
    const distFromCenter = Math.sqrt(Math.pow((u - 0.5) * 2, 2) + Math.pow((v - 0.5) * 2, 2));
    const falloff = 1 - Math.min(1, distFromCenter);
    const zDisplacement = displacement * displacementIntensity * falloff;
    
    positions.setZ(i, zDisplacement);
  }
  
  // Update the geometry
  positions.needsUpdate = true;
  geometry.computeVertexNormals(); // Recalculate normals for lighting
}

