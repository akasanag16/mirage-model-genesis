import * as THREE from 'three';
import { toast } from 'sonner';

/**
 * Enhanced local 3D model generation with advanced displacement techniques
 */
export class Enhanced3DGenerator {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  /**
   * Creates multiple displacement maps from an image using various techniques
   */
  createAdvancedMaps(texture: THREE.Texture) {
    const image = texture.image;
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.context.drawImage(image, 0, 0);
    
    const imageData = this.context.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;
    
    // Create multiple maps
    const heightMap = this.createHeightMap(data, image.width, image.height);
    const normalMap = this.createEnhancedNormalMap(data, image.width, image.height);
    const edgeMap = this.createEdgeMap(data, image.width, image.height);
    const depthMap = this.createSimulatedDepthMap(data, image.width, image.height);
    
    return {
      heightMap: this.dataToTexture(heightMap, image.width, image.height),
      normalMap: this.dataToTexture(normalMap, image.width, image.height),
      edgeMap: this.dataToTexture(edgeMap, image.width, image.height),
      depthMap: this.dataToTexture(depthMap, image.width, image.height)
    };
  }

  /**
   * Creates a height map using luminance and contrast enhancement
   */
  private createHeightMap(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const heightData = new Uint8ClampedArray(width * height * 4);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Enhanced luminance calculation with saturation boost
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      
      // Combine luminance with saturation for better height detection
      let height = (luminance * 0.7 + saturation * 0.3);
      
      // Apply contrast enhancement
      height = Math.pow(height / 255, 0.8) * 255;
      
      const idx = Math.floor(i / 4) * 4;
      heightData[idx] = height;
      heightData[idx + 1] = height;
      heightData[idx + 2] = height;
      heightData[idx + 3] = 255;
    }
    
    return heightData;
  }

  /**
   * Creates an enhanced normal map with better edge detection
   */
  private createEnhancedNormalMap(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const normalData = new Uint8ClampedArray(width * height * 4);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Sample surrounding pixels with enhanced kernel
        const tl = this.getLuminance(data, (y - 1) * width + (x - 1));
        const tm = this.getLuminance(data, (y - 1) * width + x);
        const tr = this.getLuminance(data, (y - 1) * width + (x + 1));
        const ml = this.getLuminance(data, y * width + (x - 1));
        const mr = this.getLuminance(data, y * width + (x + 1));
        const bl = this.getLuminance(data, (y + 1) * width + (x - 1));
        const bm = this.getLuminance(data, (y + 1) * width + x);
        const br = this.getLuminance(data, (y + 1) * width + (x + 1));
        
        // Sobel operator with enhanced weighting
        const sobelX = (tr + 2 * mr + br) - (tl + 2 * ml + bl);
        const sobelY = (bl + 2 * bm + br) - (tl + 2 * tm + tr);
        
        // Calculate normal vector
        const strength = 4.0; // Increased strength for better effect
        const nx = sobelX / 255 * strength;
        const ny = sobelY / 255 * strength;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        
        // Convert to 0-255 range
        normalData[idx] = Math.floor((nx + 1) * 127.5);
        normalData[idx + 1] = Math.floor((ny + 1) * 127.5);
        normalData[idx + 2] = Math.floor(nz * 255);
        normalData[idx + 3] = 255;
      }
    }
    
    return normalData;
  }

  /**
   * Creates an edge detection map for enhanced geometry
   */
  private createEdgeMap(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const edgeData = new Uint8ClampedArray(width * height * 4);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Laplacian edge detection
        const center = this.getLuminance(data, y * width + x);
        const top = this.getLuminance(data, (y - 1) * width + x);
        const bottom = this.getLuminance(data, (y + 1) * width + x);
        const left = this.getLuminance(data, y * width + (x - 1));
        const right = this.getLuminance(data, y * width + (x + 1));
        
        const edge = Math.abs(4 * center - top - bottom - left - right);
        const normalizedEdge = Math.min(255, edge);
        
        edgeData[idx] = normalizedEdge;
        edgeData[idx + 1] = normalizedEdge;
        edgeData[idx + 2] = normalizedEdge;
        edgeData[idx + 3] = 255;
      }
    }
    
    return edgeData;
  }

  /**
   * Simulates depth using color analysis and perspective cues
   */
  private createSimulatedDepthMap(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const depthData = new Uint8ClampedArray(width * height * 4);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Simulate depth using multiple cues
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      const warmth = (r - b) / 255; // Warm colors appear closer
      const contrast = Math.max(r, g, b) - Math.min(r, g, b);
      
      // Combine cues for depth estimation
      let depth = luminance * 0.4 + (warmth + 1) * 127.5 * 0.3 + contrast * 0.3;
      depth = Math.max(0, Math.min(255, depth));
      
      const idx = Math.floor(i / 4) * 4;
      depthData[idx] = depth;
      depthData[idx + 1] = depth;
      depthData[idx + 2] = depth;
      depthData[idx + 3] = 255;
    }
    
    return depthData;
  }

  /**
   * Applies advanced displacement to geometry using multiple maps
   */
  applyAdvancedDisplacement(
    geometry: THREE.PlaneGeometry,
    maps: ReturnType<typeof this.createAdvancedMaps>
  ) {
    const positions = geometry.attributes.position;
    const { heightMap, edgeMap, depthMap } = maps;
    
    // Get image data from textures
    const heightCanvas = document.createElement('canvas');
    const heightCtx = heightCanvas.getContext('2d')!;
    heightCanvas.width = heightMap.image.width;
    heightCanvas.height = heightMap.image.height;
    heightCtx.drawImage(heightMap.image, 0, 0);
    const heightData = heightCtx.getImageData(0, 0, heightCanvas.width, heightCanvas.height);
    
    const edgeCanvas = document.createElement('canvas');
    const edgeCtx = edgeCanvas.getContext('2d')!;
    edgeCanvas.width = edgeMap.image.width;
    edgeCanvas.height = edgeMap.image.height;
    edgeCtx.drawImage(edgeMap.image, 0, 0);
    const edgeData = edgeCtx.getImageData(0, 0, edgeCanvas.width, edgeCanvas.height);
    
    // Apply displacement with multiple techniques
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // Convert 3D coordinates to UV coordinates
      const u = (x + 1) / 2;
      const v = (y + 1) / 2;
      
      // Sample height and edge maps
      const heightValue = this.sampleTexture(heightData.data, u, v, heightCanvas.width, heightCanvas.height);
      const edgeValue = this.sampleTexture(edgeData.data, u, v, edgeCanvas.width, edgeCanvas.height);
      
      // Combine height and edge information for displacement
      const baseHeight = (heightValue / 255) * 0.5; // Base height from image
      const edgeBoost = (edgeValue / 255) * 0.2; // Extra height for edges
      
      const totalDisplacement = baseHeight + edgeBoost;
      
      // Apply non-linear curve for more natural look
      const finalHeight = Math.pow(totalDisplacement, 1.2) * 2.0; // Increased intensity
      
      positions.setZ(i, finalHeight);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    toast.success('Advanced 3D displacement applied');
  }

  /**
   * Creates a high-quality PBR material with all maps
   */
  createEnhancedMaterial(
    texture: THREE.Texture,
    maps: ReturnType<typeof this.createAdvancedMaps>
  ): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      displacementMap: maps.heightMap,
      displacementScale: 1.5,
      normalMap: maps.normalMap,
      normalScale: new THREE.Vector2(2.0, 2.0),
      roughnessMap: maps.edgeMap,
      roughness: 0.7,
      metalness: 0.1,
      envMapIntensity: 1.0
    });
    
    // Ensure proper texture settings
    [texture, maps.heightMap, maps.normalMap, maps.edgeMap].forEach(tex => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    });
    
    return material;
  }

  private getLuminance(data: Uint8ClampedArray, pixelIndex: number): number {
    const idx = pixelIndex * 4;
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  private sampleTexture(data: Uint8ClampedArray, u: number, v: number, width: number, height: number): number {
    const x = Math.floor(u * width);
    const y = Math.floor(v * height);
    const idx = (y * width + x) * 4;
    return data[idx];
  }

  private dataToTexture(data: Uint8ClampedArray, width: number, height: number): THREE.Texture {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    const imageData = new ImageData(data, width, height);
    context.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
}