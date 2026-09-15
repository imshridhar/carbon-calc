import { ArrowRight, Leaf, Globe, Wind } from 'lucide-react';

interface ClosingCTAProps {
  onSignup: () => void;
}

export function ClosingCTA({ onSignup }: ClosingCTAProps) {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-eco-bg-alt overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-[10%] w-32 h-16 bg-white/40 rounded-full blur-xl" />
        <div className="absolute top-20 right-[15%] w-40 h-20 bg-white/30 rounded-full blur-xl" />
      </div>

      {/* Hills at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 200" className="w-full h-auto" preserveAspectRatio="none">
          <defs>
            <linearGradient id="closingHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7BC88D" />
              <stop offset="100%" stopColor="#3D8B5D" />
            </linearGradient>
          </defs>
          <path 
            fill="url(#closingHillGradient)" 
            fillOpacity="0.4"
            d="M0,160L48,154.7C96,149,192,139,288,144C384,149,480,171,576,165.3C672,160,768,128,864,122.7C960,117,1056,139,1152,149.3C1248,160,1344,160,1392,160L1440,160L1440,200L1392,200C1344,200,1248,200,1152,200C1056,200,960,200,864,200C768,200,672,200,576,200C480,200,384,200,288,200C192,200,96,200,48,200L0,200Z"
          />
        </svg>
        
        {/* Decorative elements */}
        <div className="absolute bottom-8 left-[20%]">
          <Leaf className="w-10 h-10 text-eco-green/30" />
        </div>
        <div className="absolute bottom-12 right-[25%]">
          <Globe className="w-8 h-8 text-eco-green/20" />
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* CTA Card */}
        <div className="eco-card p-8 sm:p-12 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-eco-green/10 rounded-full mb-6">
            <Wind className="w-8 h-8 text-eco-green" />
          </div>

          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-eco-forest mb-4">
            Ready to reduce your footprint?
          </h2>

          {/* Subline */}
          <p className="text-base text-eco-sage mb-8 max-w-md mx-auto">
            Join thousands tracking their impact and making greener choices. 
            Every small step counts towards a healthier planet.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-eco-green">10K+</p>
              <p className="text-xs text-eco-sage">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-eco-green">500K+</p>
              <p className="text-xs text-eco-sage">kg CO₂ Saved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-eco-green">50+</p>
              <p className="text-xs text-eco-sage">Countries</p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onSignup}
            className="eco-button inline-flex items-center gap-2 text-base px-8 py-4"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="flex items-center justify-center gap-6 mb-4">
            <button className="text-sm text-eco-sage hover:text-eco-forest transition-colors">
              Privacy
            </button>
            <button className="text-sm text-eco-sage hover:text-eco-forest transition-colors">
              Terms
            </button>
            <button className="text-sm text-eco-sage hover:text-eco-forest transition-colors">
              Support
            </button>
          </div>
          <p className="text-xs text-eco-sage/70">
            © 2026 CarbonCalc. All rights reserved. Made with 💚 for the planet.
          </p>
        </footer>
      </div>
    </section>
  );
}
