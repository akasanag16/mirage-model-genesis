
import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
  
  console.log("ModelViewer received imageUrl:", imageUrl);

  return (
    <Card className={cn('relative overflow-hidden h-full', className)}>
      <ModelViewerProvider initialBackgroundColor={backgroundColor}>
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
