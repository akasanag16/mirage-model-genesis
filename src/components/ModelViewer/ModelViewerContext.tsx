
import React, { createContext, useContext, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface ModelViewerContextType {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  controls: OrbitControls | null;
  model: THREE.Object3D | null;
  frameId: number;
  isLoading: boolean;
  isModelReady: boolean;
  mousePosition: { x: number; y: number };
  backgroundColor: THREE.Color;
  setScene: (scene: THREE.Scene) => void;
  setCamera: (camera: THREE.PerspectiveCamera) => void;
  setRenderer: (renderer: THREE.WebGLRenderer) => void;
  setControls: (controls: OrbitControls) => void;
  setModel: (model: THREE.Object3D | null) => void;
  setFrameId: (frameId: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsModelReady: (isModelReady: boolean) => void;
  setMousePosition: (position: { x: number; y: number }) => void;
  setBackgroundColor: (color: THREE.Color | string | number) => void;
}

const ModelViewerContext = createContext<ModelViewerContextType | undefined>(undefined);

export const ModelViewerProvider: React.FC<{ 
  children: React.ReactNode; 
  initialBackgroundColor?: string | number;
}> = ({ children, initialBackgroundColor = 0x111827 }) => {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [frameId, setFrameId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [backgroundColor, setBackgroundColorState] = useState<THREE.Color>(
    new THREE.Color(initialBackgroundColor)
  );

  // Handle background color updates
  const setBackgroundColor = (color: THREE.Color | string | number) => {
    const newColor = color instanceof THREE.Color ? color : new THREE.Color(color);
    setBackgroundColorState(newColor);
    
    // Update scene background if it exists
    if (scene) {
      scene.background = newColor;
    }
  };

  const value = {
    scene,
    camera,
    renderer,
    controls,
    model,
    frameId,
    isLoading,
    isModelReady,
    mousePosition,
    backgroundColor,
    setScene,
    setCamera,
    setRenderer,
    setControls,
    setModel,
    setFrameId,
    setIsLoading,
    setIsModelReady,
    setMousePosition,
    setBackgroundColor
  };

  return (
    <ModelViewerContext.Provider value={value}>
      {children}
    </ModelViewerContext.Provider>
  );
};

export const useModelViewer = (): ModelViewerContextType => {
  const context = useContext(ModelViewerContext);
  if (context === undefined) {
    throw new Error('useModelViewer must be used within a ModelViewerProvider');
  }
  return context;
};
