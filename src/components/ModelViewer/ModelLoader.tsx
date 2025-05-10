
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useModelViewer } from './ModelViewerContext';
import { useTextureLoader } from './hooks/useTextureLoader';
import { createImagePlane } from './utils/createImagePlane';
import { useHuggingFaceModel } from './hooks/useHuggingFaceModel';
import { useMeshyAiModel } from './hooks/useMeshyAiModel';
import { toast } from 'sonner';

interface ModelLoaderProps {
  imageUrl: string | null;
}

export const ModelLoader: React.FC<ModelLoaderProps> = ({ imageUrl }) => {
  // Optional API keys for 3D model generation services
  const [meshyApiKey, setMeshyApiKey] = useState<string | undefined>(undefined);
  
  const { 
    scene, 
    setModel, 
    setIsLoading, 
    setIsModelReady 
  } = useModelViewer();
  
  // Setup API keys from localStorage if available
  useEffect(() => {
    const savedMeshyKey = localStorage.getItem('meshyApiKey');
    if (savedMeshyKey) {
      setMeshyApiKey(savedMeshyKey);
    }
  }, []);
  
  // Try to load a model using Meshy AI first (best quality)
  const meshyAiModel = useMeshyAiModel(
    imageUrl,
    meshyApiKey,
    (model) => {
      if (scene && model) {
        // Clean up any existing models in the scene
        cleanScene(scene);
        
        // Add the model to the scene
        scene.add(model);
        setModel(model);
        setIsModelReady(true);
        toast.success('Generated premium 3D model with Meshy AI');
      }
    },
    setIsLoading,
    setIsModelReady
  );
  
  // If Meshy AI fails or is not available, try Hugging Face next
  const huggingFaceModel = useHuggingFaceModel(
    imageUrl,
    (model) => {
      // Only proceed if we don't have a Meshy model
      if (scene && model && !meshyAiModel) {
        // Clean up any existing models in the scene
        cleanScene(scene);
        
        // Add the model to the scene
        scene.add(model);
        setModel(model);
        setIsModelReady(true);
        toast.success('Generated high-quality 3D model with Hugging Face');
      }
    },
    setIsLoading,
    setIsModelReady
  );
  
  // Fallback to our enhanced texture loader if both APIs fail
  useTextureLoader(
    imageUrl,
    (texture) => {
      // Only proceed with local generation if we don't have models from APIs
      if (scene && !meshyAiModel && !huggingFaceModel) {
        // Generate high-quality 3D model from the texture
        createImagePlane(scene, texture, setModel, setIsModelReady, setIsLoading);
      }
    },
    setIsLoading,
    setIsModelReady
  );

  // Display informative message about the model generation
  useEffect(() => {
    if (imageUrl) {
      toast.info('AI 3D generation started - please wait a moment');
    }
  }, [imageUrl]);
  
  // Helper function to clean up the scene
  const cleanScene = (scene: THREE.Scene) => {
    scene.children = scene.children.filter(child => {
      if (child.type === 'Mesh' || child.type === 'Group') {
        // Type guard to check if the object has geometry and material properties
        if ((child as THREE.Mesh).geometry) {
          ((child as THREE.Mesh).geometry as THREE.BufferGeometry).dispose();
        }
        
        if ((child as THREE.Mesh).material) {
          // Check if material is an array
          if (Array.isArray((child as THREE.Mesh).material)) {
            ((child as THREE.Mesh).material as THREE.Material[]).forEach(
              material => material.dispose()
            );
          } else {
            ((child as THREE.Mesh).material as THREE.Material).dispose();
          }
        }
        return false;
      }
      return true; // Keep lights and other scene elements
    });
  };

  return null;
};
