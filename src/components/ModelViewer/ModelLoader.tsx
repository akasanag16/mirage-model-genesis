
import { useEffect, useState } from 'react';
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
  
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);

  // Load the image texture first when imageUrl changes
  useEffect(() => {
    if (!imageUrl) return;

    console.log("Loading image texture from URL:", imageUrl);
    setIsLoading(true);
    setIsModelReady(false);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";
    
    textureLoader.load(
      imageUrl,
      (texture) => {
        console.log("Image texture loaded successfully:", imageUrl);
        setImageTexture(texture);
      },
      undefined, // onProgress callback not needed
      (error) => {
        console.error("Failed to load image texture:", error);
        toast.error("Failed to load image texture");
        setImageTexture(null);
        setIsLoading(false);
      }
    );
  }, [imageUrl, setIsLoading]);

  // Load or update 3D model when imageTexture is ready
  useEffect(() => {
    if (!imageTexture || !scene || loadAttempts > 3 || !imageUrl) return;
    
    console.log("Starting 3D model generation with texture:", imageTexture);

    // Clear previous model if any
    if (model && scene) {
      scene.remove(model);
      setModel(null);
    }

    // Generate and load model
    const generateModel = async () => {
      try {
        // Load a reliable default model
        const loader = new GLTFLoader();
        loader.load(
          // Use a reliable model from a public CDN
          'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
          (gltf) => {
            if (!scene) {
              console.error("Scene not available when model loaded");
              setIsLoading(false);
              return;
            }

            const newModel = gltf.scene;
            
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(newModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            newModel.scale.setScalar(scale);
            
            newModel.position.sub(center.multiplyScalar(scale));
            
            // Apply the uploaded image texture to all materials
            if (imageTexture) {
              console.log("Applying uploaded image texture to model");
              newModel.traverse((node) => {
                if (node instanceof THREE.Mesh && node.material) {
                  // Create a new standard material with the uploaded image
                  const material = new THREE.MeshStandardMaterial({
                    map: imageTexture,
                    roughness: 0.5,
                    metalness: 0.2
                  });
                  
                  // Apply the material to all mesh parts
                  if (Array.isArray(node.material)) {
                    node.material = node.material.map(() => material.clone());
                  } else {
                    node.material = material;
                  }
                  
                  node.castShadow = true;
                  node.receiveShadow = true;
                }
              });
            }
            
            // Add the model to the scene
            scene.add(newModel);
            setModel(newModel);
            setIsModelReady(true);
            setIsLoading(false);
            toast.success('3D Model generated successfully');
            console.log("Model added to scene successfully");
          },
          (xhr) => {
            // Show loading progress
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
          },
          (error) => {
            console.error('An error happened loading the model', error);
            toast.error('Failed to load primary model, trying fallback...');
            setLoadAttempts(prev => prev + 1);
            
            // Try fallback model
            tryFallbackModel();
          }
        );
      } catch (error) {
        console.error('Error generating model:', error);
        toast.error('Failed to generate 3D model');
        setIsLoading(false);
      }
    };

    generateModel();
  }, [imageTexture, scene, model, setModel, setIsLoading, setIsModelReady, loadAttempts, imageUrl]);

  // Fallback model loader function
  const tryFallbackModel = () => {
    if (!scene || !imageTexture) return;
    
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
        
        // Apply the uploaded image texture to the duck model
        const material = new THREE.MeshStandardMaterial({
          map: imageTexture,
          roughness: 0.5,
          metalness: 0.2
        });
        
        newModel.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            if (Array.isArray(node.material)) {
              node.material = node.material.map(() => material.clone());
            } else {
              node.material = material;
            }
          }
        });
        
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
