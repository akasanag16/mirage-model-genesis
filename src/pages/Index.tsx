
import React from 'react';
import { Header } from '@/components/Header';
import { ImageUploader } from '@/components/ImageUploader';
import { ModelViewer } from '@/components/ModelViewer';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { Button } from '@/components/ui/button';
import { ArrowDown, Image, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsPanel } from '@/components/SettingsPanel';

const Index = () => {
  const [uploadedImage, setUploadedImage] = React.useState<File | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [showTips, setShowTips] = React.useState<boolean>(true);

  // Display tips when the page loads
  React.useEffect(() => {
    if (showTips) {
      setTimeout(() => {
        toast.info(
          'For best results, use clear images with simple backgrounds',
          { duration: 6000 }
        );
        setShowTips(false);
      }, 2000);
    }
  }, [showTips]);

  const handleImageUpload = (file: File, url: string) => {
    console.log("Image uploaded for 3D model generation:", file.name);
    console.log("Image URL for 3D model generation:", url);
    setUploadedImage(file);
    setImageUrl(url);
    setIsGenerating(true);
    toast.success(`Image "${file.name}" uploaded successfully!`);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setImageUrl(null);
    setIsGenerating(false);
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
            Upload any image and watch as advanced AI transforms it into an interactive 3D model using multiple state-of-the-art AI services.
          </p>
        </section>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">Upload Image</h2>
              <div className="flex items-center gap-2">
                <SettingsPanel />
                {uploadedImage && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleReset} 
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try another image
                  </Button>
                )}
              </div>
            </div>
            
            <ImageUploader onImageUpload={handleImageUpload} />
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Supported formats: JPEG, PNG, WebP. For best results, use high-quality images.
              </p>
              
              {uploadedImage && (
                <div className="p-4 bg-secondary/30 rounded-md border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/20 rounded-md flex items-center justify-center">
                      <Image className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {uploadedImage.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(uploadedImage.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/20 rounded-md border border-border/50">
                  <h3 className="text-xs font-medium text-primary mb-2">Best For Results</h3>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Clear, well-lit objects</li>
                    <li>• Simple backgrounds</li>
                    <li>• Single subject focus</li>
                  </ul>
                </div>
                <div className="p-3 bg-secondary/20 rounded-md border border-border/50">
                  <h3 className="text-xs font-medium text-primary mb-2">Avoid</h3>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Busy backgrounds</li>
                    <li>• Multiple objects</li>
                    <li>• Very low resolution</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-6">
            <h2 className="text-2xl font-semibold text-white">Generated 3D Model</h2>
            <ModelViewer 
              imageUrl={imageUrl} 
              className="min-h-[400px] h-full" 
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Drag to rotate, scroll to zoom, double-click to reset view
              </p>
            </div>
            
            <div className="p-3 bg-secondary/20 rounded-md border border-primary/20">
              <h3 className="text-xs font-medium text-primary mb-2">Enhanced AI Pipeline</h3>
              <p className="text-xs text-muted-foreground">
                Our system uses an intelligent fallback approach: Hugging Face (free) → Hyper3D → CSM → Meshy AI → Enhanced Local Generation. 
                Configure API keys in Settings for premium quality results.
              </p>
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
