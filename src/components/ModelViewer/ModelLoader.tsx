
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useModelViewer } from './ModelViewerContext';
import { useTextureLoader } from './hooks/useTextureLoader';
import { createImagePlane } from './utils/createImagePlane';
import { useHuggingFaceModel } from './hooks/useHuggingFaceModel';
import { useMeshyAiModel } from './hooks/useMeshyAiModel';
import { useRodinModel } from './hooks/useRodinModel';
import { useCsmModel } from './hooks/useCsmModel';
import { toast } from 'sonner';

interface ModelLoaderProps {
  imageUrl: string | null;
}

export const ModelLoader: React.FC<ModelLoaderProps> = ({ imageUrl }) => {
  // Optional API keys for 3D model generation services
  const [meshyApiKey, setMeshyApiKey] = useState<string | undefined>(undefined);
  const [modelGenerationStatus, setModelGenerationStatus] = useState<string>('');
  
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
  
  // Try to load a model using Meshy AI first (highest quality, premium)
  const meshyAiModel = useMeshyAiModel(
    imageUrl,
    meshyApiKey,
    (model) => {
      if (scene && model) {
        cleanScene(scene);
        scene.add(model);
        setModel(model);
        setIsModelReady(true);
        setModelGenerationStatus('meshy');
        toast.success('Generated premium 3D model with Meshy AI');
      }
    },
    setIsLoading,
    setIsModelReady
  );
  
  // Try Rodin API next (high quality, free)
  const rodinModel = useRodinModel(
    imageUrl,
    (model) => {
      // Only proceed if we don't have a Meshy model
      if (scene && model && !meshyAiModel) {
        cleanScene(scene);
        scene.add(model);
        setModel(model);
        setIsModelReady(true);
        setModelGenerationStatus('rodin');
        toast.success('Generated high-quality 3D model with Rodin AI');
      }
    },
    setIsLoading,
    setIsModelReady
  );
  
  // Try CSM API (good quality, free)
  const csmModel = useCsmModel(
    imageUrl,
    (model) => {
      // Only proceed if we don't have Meshy or Rodin models
      if (scene && model && !meshyAiModel && !rodinModel) {
        cleanScene(scene);
        scene.add(model);
        setModel(model);
        setIsModelReady(true);
        setModelGenerationStatus('csm');
        toast.success('Generated quality 3D model with CSM AI');
      }
    },
    setIsLoading,
    setIsModelReady
  );
  
  // Try improved Hugging Face models
  const huggingFaceModel = useHuggingFaceModel(
    imageUrl,
    (model) => {
      // Only proceed if we don't have models from premium APIs
      if (scene && model && !meshyAiModel && !rodinModel && !csmModel) {
        cleanScene(scene);
        scene.add(model);
        setModel(model);
        setIsModelReady(true);
        setModelGenerationStatus('huggingface');
        toast.success('Generated 3D model with improved Hugging Face AI');
      }
    },
    setIsLoading,
    setIsModelReady
  );
  
  // Fallback to enhanced local texture generation
  useTextureLoader(
    imageUrl,
    (texture) => {
      // Only proceed with local generation if all APIs failed
      if (scene && !meshyAiModel && !rodinModel && !csmModel && !huggingFaceModel) {
        createImagePlane(scene, texture, setModel, setIsModelReady, setIsLoading);
        setModelGenerationStatus('local');
      }
    },
    setIsLoading,
    setIsModelReady
  );

  // Display informative message about the model generation
  useEffect(() => {
    if (imageUrl) {
      toast.info('Starting advanced AI 3D generation - using multiple APIs for best quality');
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
