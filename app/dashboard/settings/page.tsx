'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Save, Loader2, Settings, CheckCircle2, Sparkles } from 'lucide-react';
import { ShiningText } from '@/components/ui/shining-text';

type Preferences = {
  role: string;
  frontend: string;
  backend: string;
  database: string;
  deployment: string;
};

const QUESTIONS = [
  {
    id: 'role',
    question: 'What kind of developer are you?',
    options: ['Frontend Heavy', 'Backend Heavy', 'Fullstack', 'Mobile First', 'I just want things to work']
  },
  {
    id: 'frontend',
    question: 'Preferred Frontend Stack?',
    options: ['Next.js + Tailwind', 'React (Vite) + Tailwind', 'Vue / Nuxt', 'SvelteKit', 'Vanilla / No Preference']
  },
  {
    id: 'backend',
    question: 'Preferred Backend Stack?',
    options: ['Node.js (Express/Nest)', 'Python (FastAPI/Django)', 'Go', 'Supabase / Firebase (BaaS)', 'No Preference']
  },
  {
    id: 'database',
    question: 'Preferred Database?',
    options: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'No Preference']
  },
  {
    id: 'deployment',
    question: 'Preferred Deployment Platform?',
    options: ['Vercel', 'AWS', 'Google Cloud', 'Heroku / Render', 'No Preference']
  }
];

export default function SettingsPage() {
  const [selections, setSelections] = useState<Preferences>({
    role: '',
    frontend: '',
    backend: '',
    database: '',
    deployment: ''
  });
  const [initialSelections, setInitialSelections] = useState<Preferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch('/api/profile/preferences', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();

        if (data.success && data.tech_preferences) {
          try {
            const parsed = JSON.parse(data.tech_preferences);
            setSelections(parsed);
            setInitialSelections(parsed);
          } catch (e) {
            // It might have been saved as raw text previously
            console.log('Legacy preferences format, resetting.');
            setInitialSelections({
              role: '', frontend: '', backend: '', database: '', deployment: ''
            });
          }
        } else {
          setInitialSelections({
            role: '', frontend: '', backend: '', database: '', deployment: ''
          });
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const handleSelect = (key: keyof Preferences, option: string) => {
    setSelections(prev => ({
      ...prev,
      [key]: prev[key] === option ? '' : option // Toggle off if clicked again
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/profile/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tech_preferences: JSON.stringify(selections) })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save');

      setMessage({ text: 'Preferences saved successfully!', type: 'success' });
      setInitialSelections(selections);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.message || 'Something went wrong', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = initialSelections !== null && JSON.stringify(selections) !== JSON.stringify(initialSelections);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-full bg-bg">
        <Loader2 size={32} className="animate-spin text-primary mb-4" />
        <p className="text-text-muted font-medium animate-pulse">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-bg overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-8 md:p-12 pb-24">

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings size={22} className="text-primary" />
            </div>
            <h1 className="text-[28px] font-bold text-text-primary tracking-tight">Global Preferences</h1>
          </div>
          <p className="text-[17px] text-text-muted ml-13">
            Tell BuildFlow your preferred technologies. When you generate a new project, the AI will prioritize these choices.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-10">
          <div className="space-y-8">
            {QUESTIONS.map((q) => (
              <div key={q.id}>
                <h2 className="text-[18px] font-bold text-text-primary mb-4">{q.question}</h2>
                <div className="flex flex-wrap gap-3">
                  {q.options.map((option) => {
                    const isSelected = selections[q.id as keyof Preferences] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelect(q.id as keyof Preferences, option)}
                        className={`px-5 py-3 rounded-xl border-2 transition-all font-medium text-[15px] flex items-center gap-2 ${isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:bg-surface-alt'
                          }`}
                      >
                        {isSelected && <CheckCircle2 size={16} />}
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-6 mt-12 pt-8 border-t border-border">
            {message && (
              <div className={`px-4 py-2 rounded-lg text-[15px] font-medium animate-fade-in ${
                message.type === 'success' ? 'bg-success/10 text-success' : 'bg-red-50 text-error border border-red-100'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || isDirty === false}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-[16px] transition-all active:scale-[0.98] ${!isDirty && !isSaving && !message
                  ? 'bg-surface-alt text-text-muted border border-border cursor-not-allowed'
                  : isSaving
                    ? 'bg-primary/80 text-white cursor-wait shadow-sm'
                    : 'bg-gradient-to-r from-primary to-blue-500 hover:from-primary-hover hover:to-blue-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                }`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : !isDirty && !message ? (
                <>
                  <CheckCircle2 size={18} />
                  Up to date
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
