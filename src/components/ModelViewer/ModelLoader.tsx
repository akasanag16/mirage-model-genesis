
import { useModelViewer } from './ModelViewerContext';
import { useTextureLoader } from './hooks/useTextureLoader';
import { createImagePlane } from './utils/createImagePlane';

interface ModelLoaderProps {
  imageUrl: string | null;
}

export const ModelLoader: React.FC<ModelLoaderProps> = ({ imageUrl }) => {
  const { 
    scene, 
    setModel, 
    setIsLoading, 
    setIsModelReady 
  } = useModelViewer();
  
  // Use our custom hook to load the texture
  useTextureLoader(
    imageUrl,
    (texture) => {
      if (scene) {
        createImagePlane(scene, texture, setModel, setIsModelReady, setIsLoading);
      }
    },
    setIsLoading,
    setIsModelReady
  );

  return null;
};
