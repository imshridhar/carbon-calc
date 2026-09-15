import { useState } from 'react';
import { Car, Utensils, Zap, ChevronRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType, View } from '../App';
import { useScrollReveal } from '../hooks/use-scroll-reveal';
import { submitSurvey } from '../lib/api';

interface LifestyleSurveyProps {
  user: UserType;
  onNavigate: (view: View) => void;
}

export function LifestyleSurvey({ user: _user, onNavigate }: LifestyleSurveyProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const [transportMode, setTransportMode] = useState('');
  const [dailyDistance, setDailyDistance] = useState('');
  const [dietType, setDietType] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState('3');
  const [eatingOutFrequency, setEatingOutFrequency] = useState('');
  const [monthlyElectricity, setMonthlyElectricity] = useState('');
  const [renewableEnergy, setRenewableEnergy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!transportMode || !dailyDistance || !dietType || !monthlyElectricity) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSurvey({
        primaryTransport: transportMode,
        weeklyDrivingKm: parseFloat(dailyDistance) * 7,
        carType: 'sedan',
        homeHeating: 'gas',
        monthlyElectricityKwh: parseFloat(monthlyElectricity),
        hasRenewableEnergy: renewableEnergy,
        dietType: dietType,
        meatMealsPerWeek: dietType === 'vegan' ? 0 : dietType === 'vegetarian' ? 0 : parseInt(mealsPerDay) * 3,
        buysLocalFood: true,
        shoppingHabits: 'moderate',
        buysSecondHand: false,
        shortFlightsPerYear: 2,
        longFlightsPerYear: 1,
      });
      toast.success('Footprint calculated! Redirecting to dashboard...');
      setTimeout(() => onNavigate('dashboard'), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} className="min-h-screen bg-eco-bg pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-4 scroll-reveal">
          <span className="text-sm text-eco-green font-medium">Step 1 of 1</span>
          <span className="text-sm text-eco-sage mx-2">·</span>
          <span className="text-sm text-eco-sage">Setup Profile</span>
        </div>

        {/* Title */}
        <div className="mb-8 scroll-reveal">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-eco-forest mb-2">Lifestyle Assessment</h1>
          <p className="text-sm text-eco-sage leading-relaxed">Help us calculate your personal carbon footprint by answering a few questions about your daily habits.</p>
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Transport Information */}
          <div className="eco-card p-6 scroll-reveal">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Car className="w-5 h-5 text-blue-600" /></div>
              <div><h3 className="font-heading font-bold text-eco-forest">Transport Information</h3><p className="text-xs text-eco-sage">How do you get around on a daily basis?</p></div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-eco-forest mb-1.5">Primary Mode</label>
                <select value={transportMode} onChange={(e) => setTransportMode(e.target.value)} className="eco-input appearance-none cursor-pointer">
                  <option value="" disabled>Select mode...</option>
                  <option value="car">Car</option><option value="bus">Bus</option><option value="train">Train</option>
                  <option value="bicycle">Bicycle</option><option value="walking">Walking</option><option value="motorcycle">Motorcycle</option>
                  <option value="electric_vehicle">Electric Vehicle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-forest mb-1.5">Average Daily Distance (km)</label>
                <div className="relative">
                  <input type="number" value={dailyDistance} onChange={(e) => setDailyDistance(e.target.value)} placeholder="e.g. 15" className="eco-input pr-12" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-eco-sage">km</span>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-eco-sage"><Info className="w-3.5 h-3.5" />Tip: Include your commute and errands.</p>
              </div>
            </div>
          </div>

          {/* Food & Diet Information */}
          <div className="eco-card p-6 scroll-reveal">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><Utensils className="w-5 h-5 text-orange-600" /></div>
              <div><h3 className="font-heading font-bold text-eco-forest">Food & Diet Information</h3><p className="text-xs text-eco-sage">What does your typical plate look like?</p></div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-eco-forest mb-1.5">Diet Type</label>
                  <select value={dietType} onChange={(e) => setDietType(e.target.value)} className="eco-input appearance-none cursor-pointer">
                    <option value="" disabled>Select diet...</option>
                    <option value="vegan">Vegan</option><option value="vegetarian">Vegetarian</option><option value="pescatarian">Pescatarian</option>
                    <option value="omnivore">Omnivore</option><option value="keto">Keto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-eco-forest mb-1.5">Meals Per Day</label>
                  <input type="number" value={mealsPerDay} onChange={(e) => setMealsPerDay(e.target.value)} placeholder="3" min="1" max="6" className="eco-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-forest mb-1.5">How often do you eat outside?</label>
                <select value={eatingOutFrequency} onChange={(e) => setEatingOutFrequency(e.target.value)} className="eco-input appearance-none cursor-pointer">
                  <option value="" disabled>Select frequency...</option>
                  <option value="rarely">Rarely (1-2 times/month)</option><option value="sometimes">Sometimes (1-2 times/week)</option>
                  <option value="often">Often (3-5 times/week)</option><option value="daily">Daily</option>
                </select>
              </div>
            </div>
          </div>

          {/* Home Energy Usage */}
          <div className="eco-card p-6 scroll-reveal">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center"><Zap className="w-5 h-5 text-yellow-600" /></div>
              <div><h3 className="font-heading font-bold text-eco-forest">Home Energy Usage</h3><p className="text-xs text-eco-sage">Understanding your utility footprint.</p></div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-eco-forest mb-1.5">Monthly Electricity (kWh)</label>
                <div className="relative">
                  <input type="number" value={monthlyElectricity} onChange={(e) => setMonthlyElectricity(e.target.value)} placeholder="e.g. 200" className="eco-input pr-14" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-eco-sage">kWh</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-eco-bg rounded-xl">
                <div className="flex-1 mr-4">
                  <p className="text-sm font-medium text-eco-forest">Renewable Energy Source</p>
                  <p className="text-xs text-eco-sage mt-0.5">Do you use solar panels or a green energy provider?</p>
                </div>
                <button onClick={() => setRenewableEnergy(!renewableEnergy)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${renewableEnergy ? 'bg-eco-green' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${renewableEnergy ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 scroll-reveal">
            <button onClick={() => onNavigate('dashboard')} className="eco-button-outline px-6 py-2.5 text-sm">Cancel</button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="eco-button flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-70">
              {isSubmitting ? 'Submitting...' : 'Calculate Footprint'}
              {!isSubmitting && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
