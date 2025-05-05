
import { useState, useEffect } from 'react';
import { GithubIcon, MenuIcon, XIcon, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleAudio = () => {
    setIsMuted(!isMuted);
    
    // Audio control logic
    const audio = document.getElementById('background-audio') as HTMLAudioElement;
    
    if (audio) {
      if (isMuted) {
        audio.play().catch(error => {
          console.log("Audio autoplay was prevented:", error);
        });
      } else {
        audio.pause();
      }
    }
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full",
        isScrolled ? "py-3 bg-black/30 backdrop-blur-lg" : "py-5"
      )}
    >
      <div className="container flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-purple to-neon-pink flex items-center justify-center">
            <span className="text-xl font-bold text-white">3D</span>
          </div>
          <span className="text-xl font-bold gradient-text">ModelGen</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-white hover:text-neon-purple transition-colors">Home</a>
          <a href="#" className="text-white hover:text-neon-purple transition-colors">Features</a>
          <a href="#" className="text-white hover:text-neon-purple transition-colors">About</a>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleAudio}
              className="rounded-full"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'} audio</span>
            </Button>
            
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-neon-purple transition-colors"
            >
              <GithubIcon size={22} />
              <span className="sr-only">GitHub</span>
            </a>
          </div>
        </nav>
        
        {/* Mobile menu button */}
        <div className="flex items-center gap-4 md:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleAudio}
            className="rounded-full"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full"
          >
            {isMobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[72px] z-50 bg-background glass p-6 flex flex-col space-y-6">
          <a href="#" className="text-xl font-medium hover:text-neon-purple transition-colors py-3 border-b border-muted">Home</a>
          <a href="#" className="text-xl font-medium hover:text-neon-purple transition-colors py-3 border-b border-muted">Features</a>
          <a href="#" className="text-xl font-medium hover:text-neon-purple transition-colors py-3 border-b border-muted">About</a>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 py-3"
          >
            <GithubIcon size={22} />
            <span>GitHub</span>
          </a>
        </div>
      )}
      
      {/* Hidden audio element */}
      <audio id="background-audio" loop preload="none">
        <source src="https://cdn.pixabay.com/download/audio/2022/01/18/audio_27aa2021b5.mp3?filename=electronic-future-beats-117997.mp3" type="audio/mp3" />
      </audio>
    </header>
  );
};
