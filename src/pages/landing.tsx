// Import the image from src/assets/
import welcomeImage from '../assets/welcome.webp';
import { Button } from "../components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);

  const handleNavigation = () => {
    setTransitioning(true);
    setTimeout(() => {
      navigate("/main");
    }, 750); // Match the transition duration
  };

  return (
    <div className={`flex min-h-screen ${transitioning ? 'transition-all duration-750 ease-in-out' : ''}`}>
      <div
        className={`flex-1 bg-cover bg-center bg-no-repeat relative transition-opacity duration-750 ease-in-out ${transitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{
          backgroundImage: `url(${welcomeImage})`,
        }}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r from-black/80 to-transparent transition-transform duration-750 ease-in-out transform ${transitioning ? 'translate-x-[-100%]' : ''}`}
        ></div>
        <div
          className={`flex min-h-screen w-full max-w-lg items-center p-10 relative transition-transform duration-750 ease-in-out transform ${transitioning ? 'translate-x-[-100%]' : ''}`}
        >
          <div className="flex w-full max-w-sm flex-col items-start gap-6 bg-black/50 p-8 rounded-lg">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Welcome
            </h1>
            <p className="text-lg text-gray-300">
              Man, what can I say
            </p>
            <Button size="lg" variant="secondary" onClick={handleNavigation}>
              Get started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

