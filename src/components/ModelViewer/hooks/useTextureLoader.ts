
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { toast } from 'sonner';

/**
 * Custom hook for loading image textures
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
    
    textureLoader.load(
      imageUrl,
      (texture) => {
        console.log("✅ Image texture loaded successfully for 3D model generation");
        // Enable texture filtering for better quality
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        setImageTexture(texture);
        toast.success("Image loaded successfully");
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
