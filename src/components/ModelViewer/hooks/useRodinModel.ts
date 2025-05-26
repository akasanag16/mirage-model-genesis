
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { generateRodinModel } from '@/utils/rodinService';
import { toast } from 'sonner';

/**
 * Custom hook for loading high-quality 3D models from Rodin's API
 * 
 * @param imageUrl URL of the image to transform
 * @param onModelLoaded Callback when model is successfully loaded
 * @param setIsLoading Function to update loading state
 * @param setIsModelReady Function to update model ready state
 */
export const useRodinModel = (
  imageUrl: string | null,
  onModelLoaded: (model: THREE.Object3D) => void,
  setIsLoading: (isLoading: boolean) => void,
  setIsModelReady: (isReady: boolean) => void
) => {
  const [model, setModel] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      return;
    }

    const loadModelFromRodin = async () => {
      setIsLoading(true);
      setIsModelReady(false);
      
      try {
        // Attempt to generate a high-quality 3D model using Rodin
        const modelData = await generateRodinModel(imageUrl);
        
        if (!modelData) {
          console.log('No model data received from Rodin, falling back to alternatives');
          setIsLoading(false);
          return false;
        }
        
        // Convert the array buffer to a Blob URL
        const blob = new Blob([modelData], { type: 'model/gltf-binary' });
        const modelUrl = URL.createObjectURL(blob);
        
        // Load the model using GLTFLoader
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            console.log('✅ High-quality Rodin GLTF model loaded successfully');
            
            // Process the model
            const model = gltf.scene;
            
            // Apply enhanced materials to all meshes
            model.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (child.material) {
                  // Enhance material quality for Rodin models
                  if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.roughness = 0.35;
                    child.material.metalness = 0.65;
                    child.material.envMapIntensity = 1.3;
                    child.material.emissive = new THREE.Color(0x1a1a1a);
                  }
                  
                  // Enable shadows
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              }
            });
            
            // Calculate bounding box for proper scaling
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // Scale to reasonable size
            if (maxDim > 0) {
              const scale = 2.5 / maxDim;
              model.scale.set(scale, scale, scale);
            }
            
            // Center the model
            box.setFromObject(model);
            box.getCenter(model.position);
            model.position.multiplyScalar(-1);
            
            // Add a slight rotation for better initial view
            model.rotation.y = Math.PI / 6;
            
            // Set model and update state
            setModel(model);
            onModelLoaded(model);
            setIsModelReady(true);
            setIsLoading(false);
            
            // Clean up the blob URL
            URL.revokeObjectURL(modelUrl);
            
            return true;
          },
          (xhr) => {
            console.log(`Loading Rodin model: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
          },
          (error) => {
            console.error('Error loading Rodin GLTF model:', error);
            toast.error('Failed to load Rodin 3D model. Trying alternatives.');
            setIsLoading(false);
            return false;
          }
        );
        
        return true;
        
      } catch (error) {
        console.error('Error in Rodin model generation:', error);
        setIsLoading(false);
        return false;
      }
    };
    
    loadModelFromRodin();
    
    return () => {
      // Cleanup function
      if (model) {
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
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
      }
    };
  }, [imageUrl, onModelLoaded, setIsLoading, setIsModelReady]);

  return model;
};
