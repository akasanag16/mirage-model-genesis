
import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [currentApiIndex, setCurrentApiIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const previousImageRef = useRef<string | null>(null);
  
  const { 
    scene, 
    setModel, 
    setIsLoading, 
    setIsModelReady, 
    setModelSource,
    cleanupScene,
    cancelAllRequests,
    apiPriority,
    setActiveApi
  } = useModelViewer();
  
  // Setup API keys from localStorage if available
  useEffect(() => {
    const savedMeshyKey = localStorage.getItem('meshyApiKey');
    if (savedMeshyKey) {
      setMeshyApiKey(savedMeshyKey);
    }
    
    return () => {
      // Always clean up when component unmounts
      cancelAllRequests();
    };
  }, [cancelAllRequests]);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (imageUrl && imageUrl !== previousImageRef.current) {
      console.log('New image detected, starting 3D generation process');
      previousImageRef.current = imageUrl;
      
      // Clean up previous model and scene
      cleanupScene();
      
      // Cancel any pending API requests
      cancelAllRequests();
      
      // Reset state
      setModelGenerationStatus('');
      setCurrentApiIndex(0);
      setIsProcessing(false);
      
      // Show informative toast about the process
      toast.info(
        'Starting 3D generation with sequential API processing for best quality',
        { duration: 5000, id: 'api-progress' }
      );
      
      // Start loading indicator
      setIsLoading(true);
    }
    
    // Clean up when component unmounts or image changes
    return () => {
      if (imageUrl !== previousImageRef.current) {
        cancelAllRequests();
      }
    };
  }, [imageUrl, cleanupScene, cancelAllRequests, setIsLoading]);

  // Sequential API processing with priority
  useEffect(() => {
    const processNextApi = async () => {
      if (!imageUrl || isProcessing || !scene) return;
      
      // If we've tried all APIs, show fallback
      if (currentApiIndex >= apiPriority.length) {
        setIsLoading(false);
        
        if (!modelGenerationStatus) {
          toast.error('All 3D generation methods failed. Please try a different image.', { 
            id: 'api-progress', 
            duration: 5000 
          });
        }
        return;
      }
      
      // Get the next API to try
      const apiToTry = apiPriority[currentApiIndex];
      console.log(`Trying API ${currentApiIndex + 1}/${apiPriority.length}: ${apiToTry}`);
      
      // Update active API for UI
      setActiveApi(apiToTry);
      setIsProcessing(true);
      
      // Skip Meshy if no API key
      if (apiToTry === 'meshy' && !meshyApiKey) {
        console.log('Skipping Meshy AI (no API key)');
        setCurrentApiIndex(prev => prev + 1);
        setIsProcessing(false);
        return;
      }
      
      // Update toast with current API
      toast.loading(`Processing with ${getApiDisplayName(apiToTry)}...`, {
        id: 'api-progress'
      });
      
      try {
        let modelGenerated = false;
        
        // Try the current API
        switch (apiToTry) {
          case 'meshy':
            // Will be handled by the custom hook
            break;
          case 'rodin':
            // Will be handled by the custom hook
            break;
          case 'csm':
            // Will be handled by the custom hook
            break;
          case 'huggingface':
            // Will be handled by the custom hook
            break;
          case 'local':
            // Process local texture generation (fallback)
            // Handled separately below
            break;
        }
        
        // Move to next API if this one fails
        setTimeout(() => {
          if (!modelGenerated && apiToTry !== 'local') {
            console.log(`${apiToTry} API timed out or failed to respond in time, trying next API`);
            setCurrentApiIndex(prev => prev + 1);
            setIsProcessing(false);
          }
        }, 30000); // 30 second timeout before moving to next API
        
      } catch (error) {
        console.error(`Error with ${apiToTry} API:`, error);
        // Move to next API
        setCurrentApiIndex(prev => prev + 1);
        setIsProcessing(false);
      }
    };
    
    processNextApi();
  }, [imageUrl, currentApiIndex, isProcessing, scene, apiPriority, meshyApiKey, setIsLoading, setActiveApi]);
  
  // Handle model ready state
  const onModelLoaded = useCallback((model: THREE.Object3D, source: string) => {
    if (scene) {
      // Add the new model
      cleanupScene();
      scene.add(model);
      
      // Update state
      setModel(model);
      setModelSource(source);
      setIsModelReady(true);
      setIsLoading(false);
      setModelGenerationStatus(source);
      setActiveApi(null);
      
      // Show success message
      toast.success(`Generated 3D model with ${getApiDisplayName(source)}!`, {
        id: 'api-progress',
        duration: 5000
      });
    }
  }, [scene, cleanupScene, setModel, setIsModelReady, setIsLoading, setModelSource, setActiveApi]);
  
  // Helper function to get display name for APIs
  const getApiDisplayName = (apiKey: string): string => {
    switch (apiKey) {
      case 'meshy': return 'premium Meshy AI';
      case 'rodin': return 'Rodin AI';
      case 'csm': return 'CSM AI';
      case 'huggingface': return 'Hugging Face';
      case 'local': return 'local generation';
      default: return apiKey;
    }
  };
  
  // Meshy AI model generation (premium, highest quality)
  useMeshyAiModel(
    imageUrl,
    meshyApiKey,
    (model) => {
      if (apiPriority[currentApiIndex] === 'meshy') {
        onModelLoaded(model, 'meshy');
        setIsProcessing(false);
      }
    },
    () => {
      if (apiPriority[currentApiIndex] === 'meshy') {
        setCurrentApiIndex(prev => prev + 1);
        setIsProcessing(false);
      }
    }
  );
  
  // Rodin API model generation (free, high quality)
  useRodinModel(
    imageUrl,
    (model) => {
      if (apiPriority[currentApiIndex] === 'rodin') {
        onModelLoaded(model, 'rodin');
        setIsProcessing(false);
      }
    },
    () => {
      if (apiPriority[currentApiIndex] === 'rodin') {
        setCurrentApiIndex(prev => prev + 1);
        setIsProcessing(false);
      }
    },
    apiPriority[currentApiIndex] === 'rodin' // isActive parameter
  );
  
  // CSM API (good quality, free)
  useCsmModel(
    imageUrl,
    (model) => {
      if (apiPriority[currentApiIndex] === 'csm') {
        onModelLoaded(model, 'csm');
        setIsProcessing(false);
      }
    },
    () => {
      if (apiPriority[currentApiIndex] === 'csm') {
        setCurrentApiIndex(prev => prev + 1);
        setIsProcessing(false);
      }
    },
    apiPriority[currentApiIndex] === 'csm' // isActive parameter
  );
  
  // Improved Hugging Face models
  useHuggingFaceModel(
    imageUrl,
    (model) => {
      if (apiPriority[currentApiIndex] === 'huggingface') {
        onModelLoaded(model, 'huggingface');
        setIsProcessing(false);
      }
    },
    () => {
      if (apiPriority[currentApiIndex] === 'huggingface') {
        setCurrentApiIndex(prev => prev + 1);
        setIsProcessing(false);
      }
    },
    apiPriority[currentApiIndex] === 'huggingface' // isActive parameter
  );
  
  // Enhanced fallback to local texture generation
  useTextureLoader(
    imageUrl,
    (texture) => {
      if (apiPriority[currentApiIndex] === 'local' && scene) {
        createImagePlane(
          scene, 
          texture, 
          (model) => {
            onModelLoaded(model, 'local');
            setIsProcessing(false);
          },
          () => setIsModelReady(true), // Fixed: Pass a function that calls setIsModelReady
          () => {
            setCurrentApiIndex(prev => prev + 1);
            setIsProcessing(false);
          }
        );
      }
    },
    () => {
      if (apiPriority[currentApiIndex] === 'local') {
        setCurrentApiIndex(prev => prev + 1);
        setIsProcessing(false);
      }
    },
    apiPriority[currentApiIndex] === 'local' // isActive parameter
  );

  return null;
};
