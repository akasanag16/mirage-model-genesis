import { useEffect, useState, useCallback } from 'react';
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
  const [retryAttempts, setRetryAttempts] = useState<number>(0);
  const [apiPriority, setApiPriority] = useState<string[]>(
    ['meshy', 'rodin', 'csm', 'huggingface', 'local']
  );
  
  const { 
    scene, 
    setModel, 
    setIsLoading, 
    setIsModelReady, 
    setModelSource
  } = useModelViewer();
  
  // Setup API keys from localStorage if available
  useEffect(() => {
    const savedMeshyKey = localStorage.getItem('meshyApiKey');
    if (savedMeshyKey) {
      setMeshyApiKey(savedMeshyKey);
    }
    
    // Reset state when a new image is loaded
    if (imageUrl) {
      setModelGenerationStatus('');
      setRetryAttempts(0);
      
      // Show informative toast about the process
      toast.info(
        'Starting 3D generation with multiple APIs for best quality. This may take a minute or two.',
        { duration: 5000 }
      );
    }
  }, [imageUrl]);
  
  // Clean up scene helper
  const cleanScene = useCallback((scene: THREE.Scene) => {
    // Remove existing meshes and models but keep lights and cameras
    scene.children = scene.children.filter(child => {
      if (child instanceof THREE.Mesh || (child instanceof THREE.Group && child.type !== 'Camera')) {
        // Dispose materials and geometries to prevent memory leaks
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        } else if (child instanceof THREE.Group) {
          // Also clean up meshes in groups
          child.traverse((groupChild) => {
            if ((groupChild as THREE.Mesh).geometry) {
              ((groupChild as THREE.Mesh).geometry as THREE.BufferGeometry).dispose();
            }
            
            if ((groupChild as THREE.Mesh).material) {
              if (Array.isArray((groupChild as THREE.Mesh).material)) {
                ((groupChild as THREE.Mesh).material as THREE.Material[]).forEach(
                  material => material.dispose()
                );
              } else {
                ((groupChild as THREE.Mesh).material as THREE.Material).dispose();
              }
            }
          });
        }
        return false; // Remove this child
      }
      return true; // Keep lights, cameras, and other scene elements
    });
  }, []);
  
  // Handle model ready state
  const onModelLoaded = useCallback((model: THREE.Object3D, source: string) => {
    if (scene) {
      // Clean up existing models first
      cleanScene(scene);
      // Add the new model
      scene.add(model);
      // Update state
      setModel(model);
      setModelSource(source);
      setIsModelReady(true);
      setModelGenerationStatus(source);
      
      // Show success message based on source
      let sourceMessage = '';
      switch (source) {
        case 'meshy':
          sourceMessage = 'premium Meshy AI';
          break;
        case 'rodin':
          sourceMessage = 'Rodin AI';
          break;
        case 'csm':
          sourceMessage = 'CSM AI';
          break;
        case 'huggingface':
          sourceMessage = 'Hugging Face';
          break;
        case 'local':
          sourceMessage = 'local generation';
          break;
        default:
          sourceMessage = source;
      }
      
      toast.success(`Generated 3D model with ${sourceMessage}!`, {
        duration: 5000
      });
    }
  }, [scene, cleanScene, setModel, setIsModelReady, setModelSource]);
  
  // Meshy AI model generation (premium, highest quality)
  const meshyAiModel = useMeshyAiModel(
    imageUrl,
    meshyApiKey,
    (model) => onModelLoaded(model, 'meshy'),
    setIsLoading,
    setIsModelReady
  );
  
  // Rodin API model generation (free, high quality)
  const rodinModel = useRodinModel(
    imageUrl,
    (model) => {
      // Only proceed if we don't have a Meshy model
      if (!meshyAiModel) {
        onModelLoaded(model, 'rodin');
      }
    },
    setIsLoading,
    setIsModelReady
  );
  
  // CSM API (good quality, free)
  const csmModel = useCsmModel(
    imageUrl,
    (model) => {
      // Only proceed if we don't have Meshy or Rodin models
      if (!meshyAiModel && !rodinModel) {
        onModelLoaded(model, 'csm');
      }
    },
    setIsLoading,
    setIsModelReady
  );
  
  // Improved Hugging Face models
  const huggingFaceModel = useHuggingFaceModel(
    imageUrl,
    (model) => {
      // Only proceed if we don't have models from premium APIs
      if (!meshyAiModel && !rodinModel && !csmModel) {
        onModelLoaded(model, 'huggingface');
      }
    },
    setIsLoading,
    setIsModelReady
  );
  
  // Enhanced fallback to local texture generation
  useTextureLoader(
    imageUrl,
    (texture) => {
      // Only proceed with local generation if all APIs failed
      if (!meshyAiModel && !rodinModel && !csmModel && !huggingFaceModel) {
        if (scene) {
          createImagePlane(
            scene, 
            texture, 
            (model) => onModelLoaded(model, 'local'),
            setIsModelReady,
            setIsLoading
          );
        }
      }
    },
    setIsLoading,
    setIsModelReady
  );

  return null;
};
