
import { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useModelViewer } from './ModelViewerContext';
import { toast } from 'sonner';

interface ModelLoaderProps {
  imageUrl: string | null;
}

export const ModelLoader: React.FC<ModelLoaderProps> = ({ imageUrl }) => {
  const { 
    scene, 
    model, 
    setModel, 
    setIsLoading, 
    setIsModelReady 
  } = useModelViewer();

  // Load or update 3D model when imageUrl changes
  useEffect(() => {
    if (!imageUrl || !scene) return;
    
    setIsLoading(true);
    setIsModelReady(false);

    // Mock API call to generate 3D model from image
    const generateModel = () => {
      return new Promise<void>((resolve) => {
        // Simulate loading delay - would be replaced with actual API call
        setTimeout(() => {
          resolve();
        }, 2000); // 2 second mock delay
      });
    };

    // Clear previous model if any
    if (model && scene) {
      scene.remove(model);
      setModel(null);
    }

    // Generate and load model
    generateModel().then(() => {
      // Load a reliable default model
      // Using a publicly available model URL that's known to work
      const loader = new GLTFLoader();
      loader.load(
        // Use a reliable model from a public CDN
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
        (gltf) => {
          const newModel = gltf.scene;
          
          // Center and scale the model
          const box = new THREE.Box3().setFromObject(newModel);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          newModel.scale.setScalar(scale);
          
          newModel.position.sub(center.multiplyScalar(scale));
          
          // Enable shadows
          newModel.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              
              // Apply improved materials
              if (node.material) {
                const material = node.material as THREE.MeshStandardMaterial;
                material.roughness = 0.7;
                material.metalness = 0.3;
              }
            }
          });
          
          // Add the model to the scene
          if (scene) {
            scene.add(newModel);
            setModel(newModel);
            setIsModelReady(true);
            toast.success('3D Model generated successfully');
          }
          
          setIsLoading(false);
        },
        (xhr) => {
          // Show loading progress if needed
          console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
          console.error('An error happened loading the model', error);
          toast.error('Failed to generate 3D model');
          
          // Try fallback model if the first one fails
          tryFallbackModel();
        }
      );
    }).catch(error => {
      console.error('Error generating model:', error);
      toast.error('Failed to generate 3D model');
      setIsLoading(false);
    });
  }, [imageUrl, scene, model, setIsLoading, setIsModelReady, setModel]);

  // Fallback model loader function
  const tryFallbackModel = () => {
    if (!scene) return;
    
    const loader = new GLTFLoader();
    loader.load(
      // Another common test model as fallback
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Duck/glTF/Duck.gltf',
      (gltf) => {
        const newModel = gltf.scene;
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(newModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        newModel.scale.setScalar(scale);
        
        newModel.position.sub(center.multiplyScalar(scale));
        
        // Add the model to the scene
        if (scene) {
          scene.add(newModel);
          setModel(newModel);
          setIsModelReady(true);
          toast.success('Fallback 3D Model loaded successfully');
        }
        
        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error('Fallback model failed to load:', error);
        toast.error('Could not load any 3D model');
        setIsLoading(false);
      }
    );
  };

  return null;
};
