
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { generateMeshyModel } from '@/utils/meshyAiService';
import { toast } from 'sonner';

/**
 * Custom hook for loading high-quality 3D models from Meshy AI's API
 * 
 * @param imageUrl URL of the image to transform
 * @param apiKey Optional Meshy AI API key
 * @param onModelLoaded Callback when model is successfully loaded
 * @param onError Callback when an error occurs
 * @param isActive Boolean to determine if this hook should be active
 */
export const useMeshyAiModel = (
  imageUrl: string | null,
  apiKey: string | undefined,
  onModelLoaded: (model: THREE.Object3D) => void,
  onError: () => void,
  isActive: boolean = true
) => {
  const [model, setModel] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!imageUrl || !apiKey || !isActive) {
      return;
    }

    let isMounted = true;
    const loadModelFromMeshyAi = async () => {
      try {
        // Attempt to generate a high-quality 3D model using Meshy AI
        const modelData = await generateMeshyModel(imageUrl, apiKey);
        
        if (!isMounted) return;
        
        if (!modelData) {
          console.log('No model data received from Meshy AI, falling back to alternatives');
          onError();
          return false; // Signal to fall back to alternatives
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
            
            console.log('✅ High-quality Meshy AI GLTF model loaded successfully');
            
            // Process the model
            const model = gltf.scene;
            
            // Apply enhanced materials to all meshes
            model.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (child.material) {
                  // Enhance material quality
                  if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.roughness = 0.3; // Slightly more shiny than HF models
                    child.material.metalness = 0.7; // More metallic finish
                    child.material.envMapIntensity = 1.4;
                    // Add subtle color enhancement
                    child.material.emissive = new THREE.Color(0x222222);
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
              const scale = 2.5 / maxDim; // Adjusted for better visibility
              model.scale.set(scale, scale, scale);
            }
            
            // Center the model
            box.setFromObject(model);
            box.getCenter(model.position);
            model.position.multiplyScalar(-1);
            
            // Add a slight rotation for better initial view
            model.rotation.y = Math.PI / 8;
            
            // Set model and update state
            setModel(model);
            onModelLoaded(model);
            
            // Clean up the blob URL
            URL.revokeObjectURL(modelUrl);
            
            return true;
          },
          (xhr) => {
            console.log(`Loading Meshy AI model: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
          },
          (error) => {
            if (!isMounted) return;
            
            console.error('Error loading Meshy AI GLTF model:', error);
            toast.error('Failed to load Meshy AI 3D model. Trying alternatives.');
            onError();
            URL.revokeObjectURL(modelUrl);
            return false;
          }
        );
        
        return true;
        
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error in Meshy AI model generation:', error);
        onError();
        return false;
      }
    };
    
    loadModelFromMeshyAi().then(success => {
      // If Meshy AI model loading fails, we let the fallback happen naturally
      if (!success) {
        console.log('Meshy AI failed, falling back to alternatives');
      }
    });
    
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
  }, [imageUrl, apiKey, onModelLoaded, onError, isActive]);

  return model;
};
