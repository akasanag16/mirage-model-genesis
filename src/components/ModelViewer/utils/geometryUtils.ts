
import * as THREE from 'three';

/**
 * Smooths geometry by averaging vertex positions with neighbors
 * @param geometry The geometry to smooth
 */
export function smoothGeometry(geometry: THREE.BufferGeometry) {
  // This is a simplified smoothing algorithm
  // For a real production app, consider using specialized libraries
  
  // Clone the current positions
  const positions = geometry.getAttribute('position');
  const originalPositions = positions.clone();
  
  // Simple smoothing - average with neighbors where possible
  // Note: This is a simplified approach that works for grid-based geometries
  if (geometry instanceof THREE.PlaneGeometry) {
    const widthSegments = geometry.parameters.widthSegments;
    const heightSegments = geometry.parameters.heightSegments;
    
    // Skip edge vertices for simplicity
    for (let i = 1; i < widthSegments; i++) {
      for (let j = 1; j < heightSegments; j++) {
        const idx = j * (widthSegments + 1) + i;
        
        // Get neighboring indices
        const left = j * (widthSegments + 1) + (i - 1);
        const right = j * (widthSegments + 1) + (i + 1);
        const up = (j - 1) * (widthSegments + 1) + i;
        const down = (j + 1) * (widthSegments + 1) + i;
        
        // Average z values with neighbors (smoothing)
        const avgZ = (
          originalPositions.getZ(left) +
          originalPositions.getZ(right) +
          originalPositions.getZ(up) +
          originalPositions.getZ(down) +
          originalPositions.getZ(idx)
        ) / 5;
        
        // Apply smoothed z value
        positions.setZ(idx, avgZ);
      }
    }
    positions.needsUpdate = true;
  }
}

/**
 * Creates a detailed geometry based on texture dimensions
 * @param texture The texture to base dimensions on
 * @returns An optimized plane geometry
 */
export function createDetailedGeometry(texture: THREE.Texture): THREE.PlaneGeometry {
  // Calculate aspect ratio to maintain image proportions
  const aspectRatio = texture.image.width / texture.image.height;
  
  // Create detailed geometry for the 3D model
  const width = 3; // Base width
  const height = width / aspectRatio;
  const widthSegments = 256; // Higher number for more detailed mesh
  const heightSegments = Math.floor(widthSegments / aspectRatio);
  
  // Create a more detailed plane geometry with many segments
  return new THREE.PlaneGeometry(
    width, height, 
    widthSegments, heightSegments
  );
}
