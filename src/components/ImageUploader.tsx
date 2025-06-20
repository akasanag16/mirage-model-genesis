
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { uploadImage } from '@/utils/storage-helpers';

interface ImageUploaderProps {
  onImageUpload: (file: File, url: string) => void;
  className?: string;
}

export const ImageUploader = ({ onImageUpload, className }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      const file = acceptedFiles[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      
      // Create a local preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Start upload to Supabase
      setIsUploading(true);
      
      try {
        // Upload to Supabase Storage
        const publicUrl = await uploadImage(file);
        
        if (publicUrl) {
          // Upload successful
          onImageUpload(file, publicUrl);
          toast.success('Image uploaded successfully');
        } else {
          // Upload failed but we still have local preview
          toast.error('Failed to upload to storage, using local preview');
          onImageUpload(file, previewUrl);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Image upload failed');
      } finally {
        setIsUploading(false);
      }
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
  };

  return (
    <Card 
      className={cn(
        'border-2 border-dashed overflow-hidden transition-colors',
        isDragActive ? 'border-neon-purple bg-secondary/30' : 'border-gray-700',
        className
      )}
    >
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center p-8 cursor-pointer transition-all relative',
          isUploading ? 'opacity-70' : '',
          preview ? 'min-h-[240px]' : 'min-h-[240px]'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <input {...getInputProps()} disabled={isUploading} />
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader className="h-8 w-8 text-neon-purple animate-spin" />
              <p className="text-white font-medium">Uploading image...</p>
            </div>
          </div>
        )}
        
        {preview ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={preview} 
              alt="Upload preview" 
              className="max-h-[400px] max-w-full object-contain rounded-md shadow-lg"
            />
            <div
              className={cn(
                "absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 transition-opacity",
                (isHovered || isDragActive) && !isUploading && "opacity-100"
              )}
            >
              <p className="text-white mb-4">Drop new image or click to replace</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearImage}
                className="absolute top-2 right-2 w-8 h-8 p-0 rounded-full bg-black/50 hover:bg-black/80"
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove image</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-secondary p-4">
              <Upload className="h-8 w-8 text-neon-purple" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">Upload an image</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop an image or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: JPEG, PNG, WebP
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
