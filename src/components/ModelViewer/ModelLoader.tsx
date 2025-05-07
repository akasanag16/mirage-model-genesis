
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useModelViewer } from './ModelViewerContext';
import { toast } from 'sonner';

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
  
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);

  // Load the image texture when imageUrl changes
  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setIsModelReady(false);
      return;
    }

    console.log("Starting to load image texture from URL:", imageUrl);
    setIsLoading(true);
    setIsModelReady(false);

    // Clear previous texture
    if (imageTexture) {
      imageTexture.dispose();
      setImageTexture(null);
    }

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";
    
    textureLoader.load(
      imageUrl,
      (texture) => {
        console.log("✅ Image texture loaded successfully");
        setImageTexture(texture);
        toast.success("Image loaded successfully");
        createImagePlane(texture);
      },
      (xhr) => {
        console.log(`Loading texture: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error("❌ Failed to load image texture:", error);
        toast.error("Failed to load image. Please try again with a different image.");
        setImageTexture(null);
        setIsLoading(false);
      }
    );
  }, [imageUrl, setIsLoading]);

  // Create a 3D representation of the image
  const createImagePlane = (texture: THREE.Texture) => {
    if (!scene) {
      console.error("Scene not available when creating image plane");
      setIsLoading(false);
      return;
    }

    try {
      // Calculate aspect ratio to maintain image proportions
      const aspectRatio = texture.image.width / texture.image.height;
      
      // Create a plane geometry with the correct aspect ratio
      const width = 3; // Base width
      const height = width / aspectRatio;
      
      const geometry = new THREE.PlaneGeometry(width, height);
      
      // Create material with the loaded image texture
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide, // Visible from both sides
        roughness: 0.4,
        metalness: 0.3
      });
      
      // Create the mesh with the geometry and material
      const imagePlane = new THREE.Mesh(geometry, material);
      
      // Clean up any existing model
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object !== imagePlane) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      scene.clear();
      
      // Add lights back to the scene
      setupLights(scene);
      
      // Add the image plane to the scene
      scene.add(imagePlane);
      setModel(imagePlane);
      setIsModelReady(true);
      setIsLoading(false);
      toast.success('3D Image created successfully');
      
    } catch (error) {
      console.error('Error creating 3D image:', error);
      toast.error('Failed to create 3D image');
      setIsLoading(false);
    }
  };

  // Setup lights for the scene
  const setupLights = (scene: THREE.Scene) => {
    // Create ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Create directional lights
    const directionalLight1 = new THREE.DirectionalLight(0x8b5cf6, 1);
    directionalLight1.position.set(2, 2, 2);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xec4899, 1);
    directionalLight2.position.set(-2, -2, 2);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0x06b6d4, 1);
    directionalLight3.position.set(0, 0, -5);
    scene.add(directionalLight3);
  };

  return null;
};
