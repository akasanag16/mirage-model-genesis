
import { useModelViewer } from './ModelViewerContext';
import { useTextureLoader } from './hooks/useTextureLoader';
import { createImagePlane } from './utils/createImagePlane';
import { useHuggingFaceModel } from './hooks/useHuggingFaceModel';

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
  
  // First try to load a high-quality 3D model from Hugging Face
  const huggingFaceModel = useHuggingFaceModel(
    imageUrl,
    (model) => {
      if (scene && model) {
        // Clean up any existing models in the scene
        scene.clear();
        
        // Add the model to the scene
        scene.add(model);
        setModel(model);
        setIsModelReady(true);
      }
    },
    setIsLoading,
    setIsModelReady
  );
  
  // Fallback to our enhanced texture loader if Hugging Face fails
  // The fallback will only execute if huggingFaceModel is null after the API call
  useTextureLoader(
    imageUrl,
    (texture) => {
      // Only proceed with local generation if we don't have a Hugging Face model
      if (scene && !huggingFaceModel) {
        // Generate high-quality 3D model from the texture
        createImagePlane(scene, texture, setModel, setIsModelReady, setIsLoading);
      }
    },
    setIsLoading,
    setIsModelReady
  );

  return null;
};
