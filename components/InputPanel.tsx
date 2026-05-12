'use client';

import React, { useState } from 'react';
import GlassmorphismCard from './GlassmorphismCard';

interface InputPanelProps {
  onSubmit: (appIdea: string) => Promise<void>;
  isLoading?: boolean;
}

export default function InputPanel({ onSubmit, isLoading = false }: InputPanelProps) {
  const [appIdea, setAppIdea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setAppIdea(value);
    setCharCount(value.length);
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!appIdea.trim()) {
      setError('Please enter your app idea');
      return;
    }

    if (appIdea.trim().length < 10) {
      setError('App idea must be at least 10 characters');
      return;
    }

    try {
      setError(null);
      await onSubmit(appIdea.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit app idea');
    }
  };

  return (
    <GlassmorphismCard>
      <h2 className="text-2xl font-bold text-light-text mb-4">
        Describe Your App Idea
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={appIdea}
            onChange={handleTextChange}
            disabled={isLoading}
            placeholder="Enter your app idea here... Be as detailed as possible to get better results."
            className="
              w-full 
              min-h-[300px] 
              p-4 
              rounded-lg 
              bg-white/60 
              backdrop-blur-sm
              border 
              border-light-border
              text-light-text
              placeholder:text-light-textSecondary/60
              focus:outline-none 
              focus:ring-2 
              focus:ring-light-accent
              focus:border-transparent
              disabled:opacity-50
              disabled:cursor-not-allowed
              resize-y
              transition-all
            "
            rows={12}
          />
          
          {/* Character Count */}
          <div className="flex justify-end mt-2">
            <span className="text-sm text-light-textSecondary">
              {charCount} characters
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !appIdea.trim()}
          className="
            w-full 
            py-3 
            px-6 
            rounded-lg 
            bg-light-accent 
            hover:bg-light-accentHover
            text-white 
            font-semibold
            transition-all
            disabled:opacity-50
            disabled:cursor-not-allowed
            disabled:hover:bg-light-accent
            shadow-md
            hover:shadow-lg
            focus:outline-none
            focus:ring-2
            focus:ring-light-accent
            focus:ring-offset-2
            min-h-[44px]
          "
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg 
                className="animate-spin h-5 w-5" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            'Generate Documentation'
          )}
        </button>
      </form>
    </GlassmorphismCard>
  );
}
