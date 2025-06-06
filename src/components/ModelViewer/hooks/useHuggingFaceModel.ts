
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { generate3DModelFromImage } from '@/utils/huggingFaceService';
import { toast } from 'sonner';

/**
 * Custom hook for loading high-quality 3D models from Hugging Face's API
 * 
 * @param imageUrl URL of the image to transform
 * @param onModelLoaded Callback when model is successfully loaded
 * @param setIsLoading Function to update loading state
 * @param setIsModelReady Function to update model ready state
 */
export const useHuggingFaceModel = (
  imageUrl: string | null,
  onModelLoaded: (model: THREE.Object3D) => void,
  setIsLoading: (isLoading: boolean) => void,
  setIsModelReady: (isReady: boolean) => void
) => {
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setIsModelReady(false);
      return;
    }

    let isMounted = true;
    const loadModelFromHuggingFace = async () => {
      setIsLoading(true);
      setIsModelReady(false);
      setError(null);
      
      try {
        // Attempt to generate a high-quality 3D model using Hugging Face
        const modelData = await generate3DModelFromImage(imageUrl);
        
        // If component unmounted during async operation, abort
        if (!isMounted) return;
        
        if (!modelData) {
          console.log('No model data received from Hugging Face, falling back to local generation');
          setIsLoading(false);
          return false; // Signal to fall back to local generation
        }
        
        // Convert the array buffer to a Blob URL
        const blob = new Blob([modelData], { type: 'model/gltf-binary' });
        const modelUrl = URL.createObjectURL(blob);
        
        // Load the model using GLTFLoader with timeout
        const loader = new GLTFLoader();
        
        // Set up timeout for model loading
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Model loading timed out')), 30000);
        });
        
        const loadingPromise = new Promise<THREE.Group>((resolve, reject) => {
          loader.load(
            modelUrl,
            (gltf) => resolve(gltf.scene),
            (xhr) => {
              console.log(`Loading Hugging Face model: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
            },
            (error) => reject(error)
          );
        });
        
        try {
          // Race between loading and timeout
          const gltfScene = await Promise.race([loadingPromise, timeoutPromise]);
          
          // If component unmounted during async operation, abort
          if (!isMounted) {
            URL.revokeObjectURL(modelUrl);
            return;
          }
          
          console.log('✅ Hugging Face GLTF model loaded successfully');
          
          // Process the model
          const model = gltfScene;
          
          // Apply enhanced materials to all meshes
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.material) {
                // Enhance material quality
                if (child.material instanceof THREE.MeshStandardMaterial) {
                  // Enhanced material properties for Hugging Face models
                  child.material.roughness = 0.4;
                  child.material.metalness = 0.6;
                  child.material.envMapIntensity = 1.3;
                  // Add subtle color enhancement
                  child.material.emissive = new THREE.Color(0x141414);
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
          model.rotation.y = Math.PI / 6;
          
          // Set model and update state
          setModel(model);
          onModelLoaded(model);
          setIsModelReady(true);
          setIsLoading(false);
          
          // Clean up the blob URL
          URL.revokeObjectURL(modelUrl);
          
          return true;
        } catch (error) {
          // If component unmounted during async operation, abort
          if (!isMounted) return;
          
          if (error.message === 'Model loading timed out') {
            console.error('Loading Hugging Face model timed out');
            toast.error('Loading Hugging Face model timed out. Falling back to local generation.');
          } else {
            console.error('Error loading Hugging Face GLTF model:', error);
            toast.error('Failed to load Hugging Face model. Falling back to local generation.');
          }
          
          // Clean up the blob URL
          URL.revokeObjectURL(modelUrl);
          setIsLoading(false);
          setError(error);
          return false;
        }
        
      } catch (error) {
        // If component unmounted during async operation, abort
        if (!isMounted) return;
        
        console.error('Error in Hugging Face model generation:', error);
        setIsLoading(false);
        setError(error);
        return false;
      }
    };
    
    loadModelFromHuggingFace();
    
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
  }, [imageUrl, onModelLoaded, setIsLoading, setIsModelReady]);

  return model;
};
