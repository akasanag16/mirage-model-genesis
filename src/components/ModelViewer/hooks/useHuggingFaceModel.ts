
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { generate3DModelFromImage } from '@/utils/huggingFaceService';
import { toast } from 'sonner';

/**
 * Custom hook for loading 3D models from Hugging Face's API
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

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setIsModelReady(false);
      return;
    }

    const loadModelFromHuggingFace = async () => {
      setIsLoading(true);
      setIsModelReady(false);
      
      try {
        // Attempt to generate a 3D model using Hugging Face
        const modelData = await generate3DModelFromImage(imageUrl);
        
        if (!modelData) {
          console.log('No model data received from Hugging Face, falling back to local generation');
          setIsLoading(false);
          return false; // Signal to fall back to local generation
        }
        
        // Convert the array buffer to a Blob URL
        const blob = new Blob([modelData], { type: 'model/gltf-binary' });
        const modelUrl = URL.createObjectURL(blob);
        
        // Load the model using GLTFLoader
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            console.log('✅ GLTF model loaded successfully');
            
            // Center and scale the model
            const model = gltf.scene;
            
            // Calculate bounding box for proper scaling
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // Scale to reasonable size
            if (maxDim > 0) {
              const scale = 3 / maxDim;
              model.scale.set(scale, scale, scale);
            }
            
            // Center the model
            box.setFromObject(model);
            box.getCenter(model.position);
            model.position.multiplyScalar(-1);
            
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
            console.log(`Loading model: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
          },
          (error) => {
            console.error('Error loading GLTF model:', error);
            toast.error('Failed to load 3D model. Falling back to local generation.');
            setIsLoading(false);
            return false;
          }
        );
        
        return true;
        
      } catch (error) {
        console.error('Error in Hugging Face model generation:', error);
        setIsLoading(false);
        return false;
      }
    };
    
    loadModelFromHuggingFace().then(success => {
      // If Hugging Face model loading fails, we let the fallback happen naturally
      if (!success) {
        console.log('Falling back to local 3D generation');
      }
    });
    
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
