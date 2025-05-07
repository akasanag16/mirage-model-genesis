
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
  
  // Use our enhanced texture loader for high-quality textures
  useTextureLoader(
    imageUrl,
    (texture) => {
      if (scene) {
        // Generate high-quality 3D model from the texture
        createImagePlane(scene, texture, setModel, setIsModelReady, setIsLoading);
      }
    },
    setIsLoading,
    setIsModelReady
  );

  return null;
};
