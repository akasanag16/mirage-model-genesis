
import * as THREE from 'three';
import { setupLights } from './lightsSetup';
import { toast } from 'sonner';

/**
 * Creates a 3D plane with the image texture
 * @param scene The THREE.Scene to add the plane to
 * @param texture The texture to apply to the plane
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
    console.error("Scene not available when creating image plane");
    setIsLoading(false);
    return;
  }

  try {
    // Calculate aspect ratio to maintain image proportions
    const aspectRatio = texture.image.width / texture.image.height;
    
    // Create a plane geometry with the correct aspect ratio
    const width = 3; // Base width
    const height = width / aspectRatio;
    
    const geometry = new THREE.PlaneGeometry(width, height);
    
    // Create material with the loaded image texture
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide, // Visible from both sides
      roughness: 0.4,
      metalness: 0.3
    });
    
    // Create the mesh with the geometry and material
    const imagePlane = new THREE.Mesh(geometry, material);
    
    // Clean up any existing model
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object !== imagePlane) {
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
    
    // Add the image plane to the scene
    scene.add(imagePlane);
    setModel(imagePlane);
    setIsModelReady(true);
    setIsLoading(false);
    toast.success('3D Image created successfully');
    
  } catch (error) {
    console.error('Error creating 3D image:', error);
    toast.error('Failed to create 3D image');
    setIsLoading(false);
  }
};
