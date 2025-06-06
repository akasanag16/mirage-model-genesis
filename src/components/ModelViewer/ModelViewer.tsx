
import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import * as THREE from 'three';
import { ModelViewerProvider } from './ModelViewerContext';
import { SceneSetup } from './SceneSetup';
import { ModelLoader } from './ModelLoader';
import { ViewerUI } from './ViewerUI';

interface ModelViewerProps {
  imageUrl: string | null;
  className?: string;
  backgroundColor?: string | number;
}

export const ModelViewer = ({ imageUrl, className, backgroundColor }: ModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Convert string backgroundColor to THREE.Color or number if provided
  let processedBackgroundColor: THREE.Color | number = 0x111111; // Default color
  
  if (backgroundColor !== undefined) {
    if (typeof backgroundColor === 'number') {
      processedBackgroundColor = backgroundColor;
    } else if (typeof backgroundColor === 'string') {
      try {
        // Create a THREE.Color from the string
        processedBackgroundColor = new THREE.Color(backgroundColor);
      } catch (error) {
        console.error("Invalid background color:", error);
        // Fallback to default
        processedBackgroundColor = 0x111111;
      }
    }
  }
  
  // Performance monitoring
  useEffect(() => {
    // Log memory usage for debugging
    if (process.env.NODE_ENV === 'development') {
      const intervalId = setInterval(() => {
        if (window.performance && 'memory' in window.performance) {
          const memory = (window.performance as any).memory;
          console.debug('Memory usage:', {
            totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
            usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
            jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
          });
        }
      }, 10000);
      
      return () => clearInterval(intervalId);
    }
  }, []);

  return (
    <Card className={cn('relative overflow-hidden h-full', className)}>
      <ModelViewerProvider initialBackgroundColor={processedBackgroundColor}>
        <div 
          ref={containerRef} 
          className="w-full h-full min-h-[400px]"
        />
        <SceneSetup containerRef={containerRef} />
        <ModelLoader imageUrl={imageUrl} />
        <ViewerUI imageUrl={imageUrl} />
      </ModelViewerProvider>
    </Card>
  );
};
