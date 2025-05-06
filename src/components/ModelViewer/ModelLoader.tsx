
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
      }
    );
  }, [imageUrl]);

  // Load or update 3D model when imageUrl and texture are ready
  useEffect(() => {
    if (!imageUrl || !scene || loadAttempts > 3) return;
    
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
          
          // Apply the uploaded image texture to the model if available
          if (imageTexture) {
            newModel.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                
                // Create a new material with the uploaded image texture
                const material = new THREE.MeshStandardMaterial({
                  map: imageTexture,
                  roughness: 0.5,
                  metalness: 0.2,
                });
                
                // Apply the new material to the mesh
                if (Array.isArray(node.material)) {
                  // If the mesh has multiple materials
                  node.material = node.material.map(() => material.clone());
                } else {
                  // If the mesh has a single material
                  node.material = material;
                }
              }
            });
            
            console.log("Applied uploaded image texture to model");
          } else {
            // Apply default materials if no texture is available
            newModel.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                
                if (node.material) {
                  const material = node.material as THREE.MeshStandardMaterial;
                  material.roughness = 0.7;
                  material.metalness = 0.3;
                }
              }
            });
          }
          
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
          toast.error('Failed to load primary model, trying fallback...');
          setLoadAttempts(prev => prev + 1);
          
          // Try fallback model if the first one fails
          tryFallbackModel();
        }
      );
    }).catch(error => {
      console.error('Error generating model:', error);
      toast.error('Failed to generate 3D model');
      setIsLoading(false);
    });
  }, [imageUrl, imageTexture, scene, model, setIsLoading, setIsModelReady, setModel, loadAttempts]);

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
        
        // Apply the uploaded image texture to the duck model if available
        if (imageTexture) {
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
        }
        
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
