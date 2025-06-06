
import React, { createContext, useContext, useState, useRef } from 'react';
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

  const exportAsGLB = () => {
    if (model && scene) {
      exportModelAsGLB(model);
    }
  };

  const exportAsGLTF = () => {
    if (model && scene) {
      exportModelAsGLTF(model);
    }
  };

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
      exportAsGLTF
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
