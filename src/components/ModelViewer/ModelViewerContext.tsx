
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { exportModelAsGLB, exportModelAsGLTF } from './exportUtils';

type ModelViewerContextType = {
  scene: THREE.Scene | null;
  setScene: (scene: THREE.Scene) => void;
  camera: THREE.PerspectiveCamera | null;
  setCamera: (camera: THREE.PerspectiveCamera) => void;
  renderer: THREE.WebGLRenderer | null;
  setRenderer: (renderer: THREE.WebGLRenderer) => void;
  controls: OrbitControls | null;
  setControls: (controls: OrbitControls) => void;
  model: THREE.Object3D | null;
  setModel: (model: THREE.Object3D) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isModelReady: boolean;
  setIsModelReady: (isReady: boolean) => void;
  modelSource: string;
  setModelSource: (source: string) => void;
  backgroundColor: THREE.Color | number;
  setBackgroundColor: (color: THREE.Color | number) => void;
  mousePosition: { x: number; y: number };
  setMousePosition: (position: { x: number; y: number }) => void;
  frameId: number | null;
  setFrameId: (id: number | null) => void;
  exportAsGLB: () => void;
  exportAsGLTF: () => void;
  cleanupScene: () => void;
  cancelAllRequests: () => void;
  apiPriority: string[];
  setApiPriority: (priority: string[]) => void;
  activeApi: string | null;
  setActiveApi: (api: string | null) => void;
};

const ModelViewerContext = createContext<ModelViewerContextType | undefined>(undefined);

interface ModelViewerProviderProps {
  children: React.ReactNode;
  initialBackgroundColor?: THREE.Color | number;
}

export const ModelViewerProvider: React.FC<ModelViewerProviderProps> = ({ 
  children, 
  initialBackgroundColor = 0x111111 
}) => {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [modelSource, setModelSource] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<THREE.Color | number>(initialBackgroundColor);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [frameId, setFrameId] = useState<number | null>(null);
  const [apiPriority, setApiPriority] = useState<string[]>(['meshy', 'rodin', 'csm', 'huggingface', 'local']);
  const [activeApi, setActiveApi] = useState<string | null>(null);
  
  // Store abort controllers for API requests
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const cleanupScene = useCallback(() => {
    if (scene && model) {
      console.log('Cleaning up scene and models');
      
      // First remove the model from the scene
      scene.remove(model);
      
      // Recursively dispose geometries and materials
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => {
                if (material.map) material.map.dispose();
                material.dispose();
              });
            } else {
              if (child.material.map) child.material.map.dispose();
              child.material.dispose();
            }
          }
        }
      });
      
      // Clear the model reference
      setModel(null);
      setIsModelReady(false);
    }
  }, [scene, model]);

  // Cancel all pending API requests
  const cancelAllRequests = useCallback(() => {
    console.log('Cancelling all API requests');
    abortControllersRef.current.forEach((controller, key) => {
      console.log(`Aborting request: ${key}`);
      controller.abort();
    });
    abortControllersRef.current.clear();
    setActiveApi(null);
  }, []);

  const exportAsGLB = useCallback(() => {
    if (model && scene) {
      exportModelAsGLB(model);
    }
  }, [model, scene]);

  const exportAsGLTF = useCallback(() => {
    if (model && scene) {
      exportModelAsGLTF(model);
    }
  }, [model, scene]);

  return (
    <ModelViewerContext.Provider value={{
      scene,
      setScene,
      camera,
      setCamera,
      renderer,
      setRenderer,
      controls,
      setControls,
      model,
      setModel,
      isLoading,
      setIsLoading,
      isModelReady,
      setIsModelReady,
      modelSource,
      setModelSource,
      backgroundColor,
      setBackgroundColor,
      mousePosition,
      setMousePosition,
      frameId,
      setFrameId,
      exportAsGLB,
      exportAsGLTF,
      cleanupScene,
      cancelAllRequests,
      apiPriority,
      setApiPriority,
      activeApi,
      setActiveApi
    }}>
      {children}
    </ModelViewerContext.Provider>
  );
};

export const useModelViewer = () => {
  const context = useContext(ModelViewerContext);
  if (context === undefined) {
    throw new Error('useModelViewer must be used within a ModelViewerProvider');
  }
  return context;
};
