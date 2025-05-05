
import { useState } from 'react';
import { Header } from '@/components/Header';
import { ImageUploader } from '@/components/ImageUploader';
import { ModelViewer } from '@/components/ModelViewer';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { Button } from '@/components/ui/button';
import { ArrowDown, Download } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleDownload = () => {
    // In a real app, this would download the actual 3D model
    toast.info('This is a demo. In a production app, this would download the 3D model.');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <BackgroundAnimation />
      <Header />
      
      <main className="flex-1 container pt-24 pb-12">
        <section className="max-w-4xl mx-auto text-center mb-12 pt-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text animate-pulse-glow">
            2D to 3D Model Generator
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload any portrait or object image and watch as AI transforms it into an interactive 3D model in seconds.
          </p>
        </section>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="flex flex-col space-y-6">
            <h2 className="text-2xl font-semibold text-white">Upload Image</h2>
            <ImageUploader onImageUpload={handleImageUpload} />
            <p className="text-sm text-muted-foreground">
              Supported formats: JPEG, PNG, WebP. For best results, use images with clear subjects and good lighting.
            </p>
          </div>
          
          <div className="flex flex-col space-y-6">
            <h2 className="text-2xl font-semibold text-white">Generated 3D Model</h2>
            <ModelViewer imageUrl={imageUrl} className="min-h-[400px] h-full" />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Drag to rotate, scroll to zoom, double-click to reset view
              </p>
              {imageUrl && (
                <Button onClick={handleDownload} variant="outline" className="gradient-border">
                  <Download className="w-4 h-4 mr-2" />
                  Download Model
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-16">
          <Button
            variant="ghost"
            size="icon"
            className="animate-bounce rounded-full"
            onClick={() => {
              window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth'
              });
            }}
          >
            <ArrowDown className="w-6 h-6" />
            <span className="sr-only">Scroll down</span>
          </Button>
        </div>
      </main>
      
      <footer className="py-6 border-t border-muted">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} 3D ModelGen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
