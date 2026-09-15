import { useScrollReveal } from '../hooks/use-scroll-reveal';
import { ArrowRight, Leaf, Globe, Wind } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-eco-bg"
    >
      {/* Background Clouds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-[10%] w-32 h-16 bg-white/60 rounded-full blur-xl animate-float" />
        <div className="absolute top-20 right-[15%] w-40 h-20 bg-white/50 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-40 left-[5%] w-24 h-12 bg-white/40 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-32 right-[8%] w-28 h-14 bg-white/45 rounded-full blur-lg animate-float" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[8%] animate-float">
          <Leaf className="w-8 h-8 text-eco-green-pale/60" />
        </div>
        <div className="absolute top-[30%] right-[12%] animate-float" style={{ animationDelay: '1.5s' }}>
          <Globe className="w-10 h-10 text-eco-green-light/50" />
        </div>
        <div className="absolute bottom-[35%] left-[15%] animate-float" style={{ animationDelay: '0.8s' }}>
          <Wind className="w-6 h-6 text-eco-sage/40" />
        </div>
      </div>

      {/* Hills Illustration (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 320" className="w-full h-auto" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hillGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A8D9B5" />
              <stop offset="100%" stopColor="#7BC88D" />
            </linearGradient>
            <linearGradient id="hillGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7BC88D" />
              <stop offset="100%" stopColor="#3D8B5D" />
            </linearGradient>
          </defs>
          {/* Back hills */}
          <path 
            fill="url(#hillGradient1)" 
            fillOpacity="0.6"
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          {/* Front hills */}
          <path 
            fill="url(#hillGradient2)" 
            fillOpacity="0.8"
            d="M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,213.3C672,203,768,213,864,224C960,235,1056,245,1152,234.7C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        
        {/* Decorative elements on hills */}
        <div className="absolute bottom-20 left-[15%]">
          <Wind className="w-12 h-12 text-white/60" />
        </div>
        <div className="absolute bottom-24 right-[20%]">
          <svg className="w-10 h-10 text-white/50" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="eco-card p-8 sm:p-12 lg:p-16 text-center scroll-reveal">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-eco-green/10 rounded-full mb-6">
            <Leaf className="w-4 h-4 text-eco-green" />
            <span className="text-sm font-medium text-eco-green">Eco-Friendly Tracking</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-eco-forest mb-4 leading-tight">
            Track Your Carbon Footprint
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-eco-sage max-w-2xl mx-auto mb-8 leading-relaxed">
            Log daily activities, see your impact, and compete with friends to build greener habits. 
            Small changes make a big difference for our planet.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-10">
            <div className="flex items-center gap-2 text-sm text-eco-sage">
              <div className="w-8 h-8 bg-eco-green/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-eco-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span>Track Progress</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-eco-sage">
              <div className="w-8 h-8 bg-eco-green/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-eco-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Earn Rewards</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-eco-sage">
              <div className="w-8 h-8 bg-eco-green/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-eco-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span>Join Community</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onStart}
            className="eco-button inline-flex items-center gap-2 text-base px-8 py-4"
          >
            Start Tracking
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Trust indicators */}
          <p className="mt-6 text-xs text-eco-sage/70">
            Join 10,000+ eco-conscious individuals making a difference
          </p>
        </div>
      </div>
    </section>
  );
}
