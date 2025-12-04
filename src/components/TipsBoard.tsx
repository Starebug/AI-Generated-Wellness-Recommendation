import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSavedTips } from '../contexts/SavedTipsContext';
import { fetchGeminiTips, fetchGeminiDetail, type Tip, type TipDetail } from '../services/aiService';

interface StoredProfile {
  age: number;
  gender: string;
  goals: string[];
}


interface TipDetailViewProps {
  tip: Tip;
  detail: TipDetail | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  onRetry?: () => void;
}

function safeIcon(icon: string | undefined): string {
  const trimmed = (icon ?? '').trim();
  if (!trimmed) return '💡';
  // Use the first visible character as a fallback
  return Array.from(trimmed)[0] ?? '💡';
}

function TipDetailView({ tip, detail, loading, error, onBack, onSave, isSaved, onRetry }: TipDetailViewProps) {
  return (
    <div className="mt-4 sm:mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button
          type="button"
          className="cursor-pointer text-xs sm:text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 self-start"
          onClick={onBack}
        >
          ← Back
        </button>
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-[#111827] flex items-center gap-2 flex-1 sm:flex-none sm:justify-center min-w-0">
          <span className="text-xl sm:text-2xl flex-shrink-0" aria-hidden>
            {safeIcon(tip.icon)}
          </span>
          <span className="truncate">{tip.title}</span>
        </h2>
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            className={`cursor-pointer px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto ${
              isSaved
                ? 'bg-[#1F2937] text-white hover:bg-[#374151]'
                : 'bg-white text-[#1F2937] border border-[#DFEAF2] hover:bg-gray-50'
            }`}
          >
            {isSaved ? '✓ Unsave' : 'Save Tip'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 sm:p-5 md:p-6 lg:p-7">
        {loading && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-[#1F2937] rounded-full animate-spin flex-shrink-0" />
            <span>Loading detailed guidance…</span>
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                <span className="text-red-600 text-xs">⚠</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-red-800 mb-1">Unable to Load Details</h3>
                <p className="text-xs sm:text-sm text-red-700 break-words">{error}</p>
              </div>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="cursor-pointer self-start px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        )}
        {!loading && !error && detail && (
          <>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4 break-words">{detail.description}</p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm md:text-base text-gray-700 break-words">
              {detail.steps.map((step, index) => (
                <li key={index} className="ml-2">{step}</li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
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

export default function TipsBoard() {
  const { tipId } = useParams<{ tipId?: string }>();
  const navigate = useNavigate();
  const { saveTip, removeTip, isTipSaved } = useSavedTips();
  const [goalLabel, setGoalLabel] = useState<string | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [detail, setDetail] = useState<TipDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadTips = useCallback(async (useCache = true) => {
    try {
      const stored = window.localStorage.getItem('wellnessProfile');
      if (!stored) return;
      const profile = JSON.parse(stored) as StoredProfile;
      const goalId = profile.goals?.[0];
      if (!goalId) return;
      const label = GOAL_LABELS[goalId] ?? goalId;
      const age = profile.age ?? 30; // Default to 30 if age is missing
      setGoalLabel(label);

      // Include age in cache key so different ages get different tips
      const cacheKey = `tips:${label}:${age}`;

      // If useCache is false (regenerate), clear the cache first
      if (!useCache) {
        try {
          window.localStorage.removeItem(cacheKey);
        } catch {
          // ignore storage errors
        }
      } else {
        // First try to hydrate from localStorage to avoid repeated API calls
        const cached = window.localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as Tip[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTips(parsed);
              return;
            }
          } catch {
            // ignore cache parse errors and fall through to network call
          }
        }
      }

      setLoading(true);
      setError(null);

      fetchGeminiTips(label, age)
        .then((generated) => {
          if (Array.isArray(generated) && generated.length > 0) {
            setTips(generated);
            setError(null);
            try {
              window.localStorage.setItem(cacheKey, JSON.stringify(generated));
            } catch {
              // ignore quota / storage errors
            }
          } else {
            setError('No tips were generated. Please try regenerating.');
          }
        })
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : 'Unable to load AI tips right now. Please try again later.';
          setError(errorMessage);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    loadTips(true);
  }, [loadTips]);

  const loadTipDetail = useCallback(async (tip: Tip) => {
    if (!goalLabel) return;

    // Get age from profile for age-appropriate detail generation
    let age = 30; // Default fallback
    try {
      const stored = window.localStorage.getItem('wellnessProfile');
      if (stored) {
        const profile = JSON.parse(stored) as StoredProfile;
        age = profile.age ?? 30;
      }
    } catch {
      // ignore parse errors, use default
    }

    setSelectedTip(tip);
    setDetail(null);
    setDetailError(null);

    // Include age in cache key so different ages get different details
    const cacheKey = `tipDetail:${goalLabel}:${tip.id}:${age}`;
    const cached = window.localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as TipDetail;
        setDetail(parsed);
        return;
      } catch {
        // ignore cache parse errors and fall through to network call
      }
    }

    setDetailLoading(true);

    try {
      const result = await fetchGeminiDetail(goalLabel, tip.title, age);
      setDetail(result);
      setDetailError(null);
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {
        // ignore storage errors
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to load details for this tip. Please try again.';
      setDetailError(errorMessage);
    } finally {
      setDetailLoading(false);
    }
  }, [goalLabel]);

  // If the route is /board/:tipId and we already have tips + goalLabel,
  // auto-select that tip and load its details without navigating again.
  useEffect(() => {
    if (!tipId || !goalLabel || !tips.length) return;
    const tip = tips.find((t) => t.id === tipId);
    if (!tip) return;
    // fire and forget; loader manages its own async state
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadTipDetail(tip);
  }, [tipId, goalLabel, tips, loadTipDetail]);

  const handleTipClick = useCallback((tip: Tip) => {
    if (!goalLabel) return;
    navigate(`/board/${tip.id}`);
  }, [goalLabel, navigate]);

  const handleBackFromDetail = useCallback(() => {
    setSelectedTip(null);
    setDetail(null);
    setDetailError(null);
    navigate('/board');
  }, [navigate]);

  const handleSaveTip = useCallback(() => {
    if (!selectedTip || !goalLabel) return;
    
    // Toggle save/unsave: if already saved, unsave it; otherwise save it
    if (isTipSaved(selectedTip.id)) {
      removeTip(selectedTip.id);
    } else {
      // Get age from profile
      let age = 30;
      try {
        const stored = window.localStorage.getItem('wellnessProfile');
        if (stored) {
          const profile = JSON.parse(stored) as StoredProfile;
          age = profile.age ?? 30;
        }
      } catch {
        // ignore parse errors
      }
      saveTip(selectedTip.id, goalLabel, age);
    }
  }, [selectedTip, goalLabel, isTipSaved, removeTip, saveTip]);

  const handleLogout = useCallback(() => {
    try {
      // Clear all localStorage items
      window.localStorage.removeItem('wellnessProfile');
      window.localStorage.removeItem('wellnessSavedTips');
      
      // Clear all cached tips and tip details
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('tips:') || key.startsWith('tipDetail:'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // ignore errors
        }
      });

      // Clear sessionStorage as well (just in case)
      try {
        window.sessionStorage.clear();
      } catch {
        // ignore errors
      }

      // Redirect to home
      navigate('/');
    } catch {
      // If anything fails, still redirect
      navigate('/');
    }
  }, [navigate]);

  const handleRetryDetail = useCallback(() => {
    if (selectedTip) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      loadTipDetail(selectedTip);
    }
  }, [selectedTip, loadTipDetail]);

  const isDetailView = Boolean(selectedTip);

  return (
    <div className="min-h-screen w-full bg-[#F1F0EC] px-3 sm:px-4 py-4 sm:py-6 flex justify-center overflow-x-hidden">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <header className="mb-4 sm:mb-6 md:mb-8">
          {/* Mobile: Stack buttons above, then centered content */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Mobile: Buttons row */}
            {!isDetailView && (
              <div className="flex items-center justify-between gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => loadTips(false)}
                  disabled={loading}
                  className="cursor-pointer px-2 py-2 text-xs font-medium text-[#1F2937] bg-white border border-[#DFEAF2] rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-1"
                >
                  {loading ? 'Regenerating...' : 'Regenerate'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/board/saved')}
                  className="cursor-pointer px-2 py-2 text-xs font-medium text-[#1F2937] bg-white border border-[#DFEAF2] rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap flex-1"
                >
                  Saved
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="cursor-pointer px-2 py-2 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors whitespace-nowrap flex-1"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Desktop: Left button */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center">
              {!isDetailView && (
                <button
                  type="button"
                  onClick={() => loadTips(false)}
                  disabled={loading}
                  className="cursor-pointer px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#1F2937] bg-white border border-[#DFEAF2] rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? 'Regenerating...' : 'Regenerate Tips'}
                </button>
              )}
            </div>

            {/* Center: Heading, centered */}
            <div className="flex-1 text-center min-w-0">
              <p className="text-[10px] xs:text-xs sm:text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Your daily wellness board
              </p>
              <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#111827] px-2">
                Personalized Health Tips
              </h1>
              <p className="mt-2 text-xs sm:text-sm md:text-base text-gray-600 max-w-xl mx-auto px-2">
                Explore a curated set of quick, science‑backed actions you can take today.
                Tap a card to see more details in the next screen.
              </p>
            </div>

            {/* Desktop: Right buttons */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-end sm:gap-2">
              {!isDetailView && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/board/saved')}
                    className="cursor-pointer px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#1F2937] bg-white border border-[#DFEAF2] rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap"
                  >
                    Saved
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="cursor-pointer px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors whitespace-nowrap"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable tips row – only on /board (list view), not on /board/{tipId} */}
        {!isDetailView && (
          <section className="mt-4">
            <div className="flex items-stretch gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-2 sm:pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {loading && (
                <div className="text-xs sm:text-sm text-gray-500 py-8">Generating AI tips for your goal…</div>
              )}
              {!loading &&
                !error &&
                tips.map((tip) => (
                  <article
                    key={tip.id}
                    className="cursor-pointer min-w-[200px] xs:min-w-[220px] sm:min-w-[240px] md:min-w-[260px] max-w-xs bg-white rounded-2xl border border-[#DFEAF2] shadow-sm hover:shadow-md transition-shadow flex flex-col flex-shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => handleTipClick(tip)}
                      className="cursor-pointer w-full h-full text-left px-4 sm:px-5 py-4 sm:py-5 flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F2937] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
                ))}
              {error && !loading && (
                <div className="min-w-[280px] max-w-full bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6 flex flex-col gap-3 flex-shrink-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <span className="text-red-600 text-xs">⚠</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-red-800 mb-1">Unable to Load Tips</h3>
                      <p className="text-xs sm:text-sm text-red-700 break-words">{error}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadTips(false)}
                    className="cursor-pointer self-start px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </section>
        )
        }

        {/* Detail screen (Screen 3) – used on /board/{tipId} */}
        {isDetailView && selectedTip && (
          <TipDetailView
            tip={selectedTip}
            detail={detail}
            loading={detailLoading}
            error={detailError}
            onBack={handleBackFromDetail}
            onSave={handleSaveTip}
            isSaved={isTipSaved(selectedTip.id)}
            onRetry={handleRetryDetail}
          />
        )}
      </div>
    </div>
  );
}


