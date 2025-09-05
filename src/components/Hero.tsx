import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="hero-gradient py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Master Your Pitch with
            <br />
            <span className="text-soft-sky">AI-Powered Practice</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Practice job interviews, investor pitches, and academic defenses with our intelligent AI panel. 
            Get personalized feedback and improve your performance before the real thing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-soft-sky hover:bg-soft-sky/90 text-deep-navy font-semibold px-8 py-4 text-lg group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg bg-transparent"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="text-white/70 text-sm">
            <p className="mb-4">Trusted by professionals at</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="px-4 py-2 border border-white/20 rounded-lg">Quantilytix</div>
              <div className="px-4 py-2 border border-white/20 rounded-lg">Initium</div>
              <div className="px-4 py-2 border border-white/20 rounded-lg">OHA</div>
              <div className="px-4 py-2 border border-white/20 rounded-lg">Vepologic</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
