
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { generateCsmModel } from '@/utils/csmService';
import { toast } from 'sonner';

/**
 * Custom hook for loading 3D models from CSM's API
 * 
 * @param imageUrl URL of the image to transform
 * @param onModelLoaded Callback when model is successfully loaded
 * @param onError Callback when an error occurs
 * @param isActive Boolean to determine if this hook should be active
 */
export const useCsmModel = (
  imageUrl: string | null,
  onModelLoaded: (model: THREE.Object3D) => void,
  onError: () => void,
  isActive: boolean = true
) => {
  const [model, setModel] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!imageUrl || !isActive) {
      return;
    }

    let isMounted = true;
    const loadModelFromCsm = async () => {
      try {
        // Attempt to generate a 3D model using CSM
        const modelData = await generateCsmModel(imageUrl);
        
        if (!isMounted) return;
        
        if (!modelData) {
          console.log('No model data received from CSM, falling back to alternatives');
          onError();
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
            if (!isMounted) {
              URL.revokeObjectURL(modelUrl);
              return;
            }
            
            console.log('✅ CSM GLTF model loaded successfully');
            
            // Process the model
            const model = gltf.scene;
            
            // Apply enhanced materials to all meshes
            model.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (child.material) {
                  // Enhance material quality for CSM models
                  if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.roughness = 0.45;
                    child.material.metalness = 0.55;
                    child.material.envMapIntensity = 1.1;
                    child.material.emissive = new THREE.Color(0x0f0f0f);
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
            model.rotation.y = Math.PI / 12;
            
            // Set model and update state
            setModel(model);
            onModelLoaded(model);
            
            // Clean up the blob URL
            URL.revokeObjectURL(modelUrl);
            
            return true;
          },
          (xhr) => {
            console.log(`Loading CSM model: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
          },
          (error) => {
            if (!isMounted) return;
            
            console.error('Error loading CSM GLTF model:', error);
            toast.error('Failed to load CSM 3D model. Trying alternatives.');
            onError();
            URL.revokeObjectURL(modelUrl);
            return false;
          }
        );
        
        return true;
        
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error in CSM model generation:', error);
        onError();
        return false;
      }
    };
    
    loadModelFromCsm();
    
    return () => {
      isMounted = false;
      
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
  }, [imageUrl, onModelLoaded, onError, isActive]);

  return model;
};
