
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
  setScene: (scene: THREE.Scene) => void;
  setCamera: (camera: THREE.PerspectiveCamera) => void;
  setRenderer: (renderer: THREE.WebGLRenderer) => void;
  setControls: (controls: OrbitControls) => void;
  setModel: (model: THREE.Object3D | null) => void;
  setFrameId: (frameId: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsModelReady: (isModelReady: boolean) => void;
  setMousePosition: (position: { x: number; y: number }) => void;
}

const ModelViewerContext = createContext<ModelViewerContextType | undefined>(undefined);

export const ModelViewerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [frameId, setFrameId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
    setScene,
    setCamera,
    setRenderer,
    setControls,
    setModel,
    setFrameId,
    setIsLoading,
    setIsModelReady,
    setMousePosition
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
