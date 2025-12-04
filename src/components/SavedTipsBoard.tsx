import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedTips } from '../contexts/SavedTipsContext';
import { type Tip } from '../services/aiService';

interface StoredProfile {
  age: number;
  gender: string;
  goals: string[];
}

const GOAL_LABELS: Record<string, string> = {
  'weight-loss': 'weight loss',
  'muscle-gain': 'muscle gain',
  'better-sleep': 'better sleep',
  'stress-relief': 'stress relief',
  'energy-boost': 'better daily energy',
  'mental-health': 'mental wellbeing',
  flexibility: 'flexibility and mobility',
  'heart-health': 'heart health',
};

function safeIcon(icon: string | undefined): string {
  const trimmed = (icon ?? '').trim();
  if (!trimmed) return '💡';
  return Array.from(trimmed)[0] ?? '💡';
}

export default function SavedTipsBoard() {
  const navigate = useNavigate();
  const { savedTips } = useSavedTips();
  const [tipsData, setTipsData] = useState<Record<string, Tip>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load tips from localStorage for each saved tip
    const loadSavedTips = () => {
      try {
        const stored = window.localStorage.getItem('wellnessProfile');
        if (!stored) {
          setLoading(false);
          return;
        }
        const profile = JSON.parse(stored) as StoredProfile;
        const goalId = profile.goals?.[0];
        if (!goalId) {
          setLoading(false);
          return;
        }
        const label = GOAL_LABELS[goalId] ?? goalId;
        const age = profile.age ?? 30;

        // Try to load tips from localStorage cache
        const cacheKey = `tips:${label}:${age}`;
        const cached = window.localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as Tip[];
            const tipsMap: Record<string, Tip> = {};
            parsed.forEach((tip) => {
              tipsMap[tip.id] = tip;
            });
            setTipsData(tipsMap);
          } catch {
            // ignore parse errors
          }
        }
      } catch {
        // ignore errors
      } finally {
        setLoading(false);
      }
    };

    loadSavedTips();
  }, [savedTips]);

  const handleTipClick = (tipId: string) => {
    navigate(`/board/${tipId}`);
  };

  // Filter saved tips to only show those that have tip data available
  const availableSavedTips = savedTips.filter((saved) => tipsData[saved.tipId]);

  return (
    <div className="min-h-screen w-full bg-[#F1F0EC] px-4 py-6 flex justify-center">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center">
            <div className="flex-1 flex items-center">
              <button
                type="button"
                onClick={() => navigate('/board')}
                className="cursor-pointer text-xs sm:text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
              >
                ← Back
              </button>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Your saved tips
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827]">
                Saved Wellness Tips
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
                Access your favorite wellness tips anytime. Click a card to view details.
              </p>
            </div>
            <div className="flex-1" />
          </div>
        </header>

        {/* Saved Tips Grid */}
        <section className="mt-4">
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-8">Loading saved tips…</div>
          ) : availableSavedTips.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm sm:text-base text-gray-600 mb-2">No saved tips yet.</p>
              <p className="text-xs sm:text-sm text-gray-500">
                Save tips from the main board to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {availableSavedTips.map((saved) => {
                const tip = tipsData[saved.tipId];
                if (!tip) return null;

                return (
                  <article
                    key={saved.tipId}
                    className="bg-white rounded-2xl border border-[#DFEAF2] shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => handleTipClick(tip.id)}
                      className="w-full h-full text-left px-4 sm:px-5 py-4 sm:py-5 flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F2937] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F3F4F6] text-2xl">
                          <span aria-hidden>{safeIcon(tip.icon)}</span>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-[#F9FAFB] border border-[#E5E7EB] px-2 py-0.5 text-[10px] sm:text-xs font-medium text-gray-600">
                          {tip.category}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-[#111827] line-clamp-2">
                          {tip.title}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">Tap to view full guidance</p>
                      </div>

                      <div className="mt-auto flex items-center justify-between text-[11px] sm:text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                          Easy to start
                        </span>
                        <span>{tip.duration}</span>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

