import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
interface ProfileData {
  age: number;
  gender: string;
  goals: string[];
}

interface ProfileCaptureProps {
  onComplete: (profile: ProfileData) => void;
}

const wellnessGoals = [
  { id: 'weight-loss', label: 'Weight Loss', icon: '⚖️' },
  { id: 'muscle-gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'better-sleep', label: 'Better Sleep', icon: '😴' },
  { id: 'stress-relief', label: 'Stress Relief', icon: '🧘' },
  { id: 'energy-boost', label: 'Energy Boost', icon: '⚡' },
  { id: 'mental-health', label: 'Mental Health', icon: '🧠' },
  { id: 'flexibility', label: 'Flexibility', icon: '🤸' },
  { id: 'heart-health', label: 'Heart Health', icon: '❤️' },
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export default function ProfileCapture({ onComplete }: ProfileCaptureProps) {
  const navigate = useNavigate();
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ age?: string; gender?: string; goals?: string }>({});

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0 && parseInt(value) <= 120)) {
      setAge(value);
      if (errors.age) {
        setErrors({ ...errors, age: undefined });
      }
    }
  };

  const handleGenderChange = (value: string) => {
    setGender(value);
    if (errors.gender) {
      setErrors({ ...errors, gender: undefined });
    }
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) => {
      const isSelected = prev.includes(goalId);
      // If clicking the same goal, deselect it; otherwise, select only this goal
      const newGoals = isSelected ? [] : [goalId];
      
      if (errors.goals && newGoals.length > 0) {
        setErrors({ ...errors, goals: undefined });
      }
      
      return newGoals;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: { age?: string; gender?: string; goals?: string } = {};

    if (!age || age.trim() === '') {
      newErrors.age = 'Please enter your age';
    } else {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 10 || ageNum > 80) {
        newErrors.age = 'Please enter a valid age (10-80)';
      }
    }

    if (!gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (selectedGoals.length === 0) {
      newErrors.goals = 'Please select a wellness goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const profileData = {
        age: parseInt(age),
        gender,
        goals: selectedGoals,
      };
      onComplete(profileData);
      navigate('/board');
    }
  };

  return (
    <div className="min-h-screen bg-[F9F2D9] w-full px-4 py-6">
      <div className="w-full h-full max-w-4xl mx-auto">
        <div className="bg-white md:rounded-2xl md:shadow-xl relative overflow-hidden p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col">
          {/* Background image layer */}
          <div className="absolute inset-0 opacity-55 pointer-events-none">
            <img src="/ab.avif" alt="Wellness background" className="w-full h-full object-cover object-center" />
          </div>

          {/* Foreground content */}
          <div className="relative z-10">
            <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 pt-2 sm:pt-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800 mb-1 sm:mb-2 md:mb-3 px-2">
              Welcome to Your Wellness Journey
            </h1>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl px-2">
              Let's personalize your health recommendations
            </p>
            </div>

          <form onSubmit={handleSubmit} className="relative z-10 flex-1 flex flex-col space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10 overflow-y-auto">
            {/* Age Input */}
            <div className="px-1 sm:px-0">
              <label htmlFor="age" className="block text-sm sm:text-base md:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="age"
                value={age}
                onChange={handleAgeChange}
                placeholder="Enter your age"
                className={`w-full px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-2 rounded-lg text-base sm:text-lg md:text-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.age
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              {errors.age && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-red-600">{errors.age}</p>
              )}
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm sm:text-base md:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 md:mb-4">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {genderOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleGenderChange(option.value)}
                    className={`px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-medium text-xs sm:text-sm md:text-base border-[1.5px] border-[#DFEAF2] transition-all ${
                      gender === option.value
                        ? 'bg-[#1F2937] text-white shadow-md md:-translate-y-0.5'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.gender && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* Goal Selection */}
            <div className="flex-1 min-h-0">
              <label className="block text-sm sm:text-base md:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 md:mb-4">
                Wellness Goals <span className="text-red-500">*</span>
                <span className="text-gray-500 font-normal text-xs sm:text-sm ml-1 sm:ml-2">
                  (Select one)
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {wellnessGoals.map((goal) => {
                  const isSelected = selectedGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => handleGoalToggle(goal.id)}
                      className={`px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-3.5 rounded-lg font-medium transition-all flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 ${
                        isSelected
                          ? 'text-white shadow-lg md:-translate-y-0.5'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md active:bg-gray-300'
                      }`}
                      style={isSelected ? { backgroundColor: '#1F2937' } : {}}
                    >
                      <span className="text-lg sm:text-xl md:text-2xl">{goal.icon}</span>
                      <span className="text-[10px] sm:text-xs md:text-sm text-center leading-tight">{goal.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.goals && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-red-600">{errors.goals}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-auto pt-3 sm:pt-4 md:pt-6 pb-2 sm:pb-4">
              <button
                type="submit"
                className="w-full bg-[#1F2937] text-white font-bold py-3 sm:py-4 md:py-5 lg:py-6 rounded-lg text-sm sm:text-base md:text-lg lg:text-xl hover:from-blue-600 hover:to-purple-700 md:hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-xl"
              >
                Get My Personalized Recommendations
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}

