
import React, { createContext, useContext, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { exportModelAsGLB, exportModelAsGLTF } from './exportUtils';

type ModelViewerContextType = {
  scene: THREE.Scene | null;
  setScene: (scene: THREE.Scene) => void;
  camera: THREE.Camera | null;
  setCamera: (camera: THREE.Camera) => void;
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
  backgroundColor: string | number;
  setBackgroundColor: (color: string | number) => void;
  exportAsGLB: () => void;
  exportAsGLTF: () => void;
};

const ModelViewerContext = createContext<ModelViewerContextType | undefined>(undefined);

interface ModelViewerProviderProps {
  children: React.ReactNode;
  initialBackgroundColor?: string | number;
}

export const ModelViewerProvider: React.FC<ModelViewerProviderProps> = ({ 
  children, 
  initialBackgroundColor = 0x111111 
}) => {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.Camera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [modelSource, setModelSource] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string | number>(initialBackgroundColor);

  const exportAsGLB = () => {
    if (model && scene) {
      exportModelAsGLB(model, scene);
    }
  };

  const exportAsGLTF = () => {
    if (model && scene) {
      exportModelAsGLTF(model, scene);
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
