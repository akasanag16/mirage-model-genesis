
import * as THREE from 'three';
import { setupLights } from './lightsSetup';
import { toast } from 'sonner';
import { createMapsFromTexture, applyAdvancedDisplacementToGeometry } from './displacementUtils';
import { smoothGeometry, createDetailedGeometry } from './geometryUtils';
import { createHighQualityMaterial, addEnvironmentMap } from './materialUtils';
import { cleanupScene } from './sceneUtils';

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
    
    // Create heightmap and normal map from texture
    const { displacementMap, normalMap } = createMapsFromTexture(texture);
    
    // Create detailed geometry for the 3D model
    const geometry = createDetailedGeometry(texture);
    
    // Create material with the loaded image texture and advanced displacement
    const material = createHighQualityMaterial(texture, displacementMap, normalMap);
    
    // Create the mesh with the geometry and material
    const model = new THREE.Mesh(geometry, material);
    
    // Apply advanced displacement to vertices for 3D effect
    applyAdvancedDisplacementToGeometry(geometry, displacementMap);
    
    // Smooth the geometry for better visual appeal
    smoothGeometry(geometry);
    
    // Clean up any existing model and clear the scene
    cleanupScene(scene, model);
    
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
