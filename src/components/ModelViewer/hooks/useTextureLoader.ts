
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { toast } from 'sonner';

/**
 * Custom hook for loading high-quality image textures
 * @param imageUrl URL of the image to load
 * @param onTextureLoaded Callback when texture is successfully loaded
 * @param setIsLoading Function to update loading state
 * @param setIsModelReady Function to update model ready state
 */
export const useTextureLoader = (
  imageUrl: string | null,
  onTextureLoaded: (texture: THREE.Texture) => void,
  setIsLoading: (isLoading: boolean) => void,
  setIsModelReady: (isReady: boolean) => void
) => {
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);

  // Load the image texture when imageUrl changes
  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setIsModelReady(false);
      return;
    }

    console.log("Starting to load image for 3D model generation:", imageUrl);
    setIsLoading(true);
    setIsModelReady(false);

    // Clear previous texture
    if (imageTexture) {
      imageTexture.dispose();
      setImageTexture(null);
    }

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";
    
    // Configure texture loader for high quality
    textureLoader.load(
      imageUrl,
      (texture) => {
        console.log("✅ Image texture loaded successfully for 3D model generation");
        
        // Enable high-quality texture filtering
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 16; // Higher anisotropy for better quality at angles
        
        // Enable mipmapping for better performance at different distances
        texture.generateMipmaps = true;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        
        setImageTexture(texture);
        toast.success("High-quality image loaded");
        onTextureLoaded(texture);
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

    // Cleanup function
    return () => {
      if (imageTexture) {
        imageTexture.dispose();
      }
    };
  }, [imageUrl, setIsLoading]);

  return imageTexture;
};
