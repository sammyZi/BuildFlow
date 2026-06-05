'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { SupabaseService } from '@/lib/supabase/service';
import { startSSEStream } from '@/lib/hooks/useSSE';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ResultsViewer from '@/components/ResultsViewer';
import { Artifact, ArtifactType, Project } from '@/types';
import {
  ArrowRight, Loader2, Send, CheckCircle2, FileText, GitBranch, ListChecks, Edit3, Sparkles,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { ShiningText } from '@/components/ui/shining-text';
import ScrollButtons from '@/components/ScrollButtons';
import { useCodeStore } from '@/lib/store/useCodeStore';

type Step = 'questions' | 'requirements' | 'design-questions' | 'design' | 'tasks';

// ─── API Endpoint Map ────────────────────────────────────────────────────────

const API_ENDPOINTS: Record<string, string> = {
  generate_questions: '/api/detailed/questions',
  generate_requirements: '/api/detailed/requirements',
  generate_design_questions: '/api/detailed/design-questions',
  generate_design: '/api/detailed/design',
  generate_tasks: '/api/detailed/tasks',
  refine_content: '/api/detailed/refine',
  save_project: '/api/detailed/save',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** An artifact only counts as "ready" once it has real (non-empty) content. */
function isArtifactReady(a: Artifact): boolean {
  return !!a?.content && a.content.trim().length > 0;
}

/** True only when all three documents exist AND have content. */
function hasAllReadyArtifacts(artifacts: Artifact[]): boolean {
  const types = new Set(artifacts.filter(isArtifactReady).map(a => a.artifact_type));
  return types.has('requirements') && types.has('design') && types.has('tasks');
}

/**
 * Parse a JSON array from a model response, tolerating markdown code fences
 * and surrounding prose. Returns null if no valid array can be extracted.
 */
function safeParseJsonArray(raw: string): any[] | null {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ─── Shared API fetcher ──────────────────────────────────────────────────────

async function fetchDetailedApi(endpoint: string, payload: Record<string, any>) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Authentication error. Please sign in again.');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let msg = 'API error';
    try { const d = await response.json(); msg = d.error || msg; } catch { }
    throw new Error(msg);
  }

  return response.json();
}

// ─── Detailed Pipeline Draft View ────────────────────────────────────────────

function DetailedPipelineDraftView({ project, projectId, onComplete }: { project: any, projectId: string, onComplete: () => void }) {
  const router = useRouter();
  const idea = project.prompt;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState<Step>((project.current_step as Step) || 'questions');

  // Questionnaire state
  const stateData = project.state_data || {};
  const [questions, setQuestions] = useState<any[]>(stateData.questions || []);
  const [answers, setAnswers] = useState<Record<string, string[]>>(stateData.answers || {});

  const [designQuestions, setDesignQuestions] = useState<any[]>(stateData.designQuestions || []);
  const [designAnswers, setDesignAnswers] = useState<Record<string, string[]>>(stateData.designAnswers || {});

  // Document states
  const [requirements, setRequirements] = useState<string>(stateData.requirements || '');
  const [design, setDesign] = useState<string>(stateData.design || '');
  const [tasks, setTasks] = useState<string>(stateData.tasks || '');

  // UI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const initRef = useRef(false);
  // Lets us cancel an in-flight SSE stream (and stop setState) if the user
  // navigates away mid-generation.
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // ─── Autosave ────────────────────────────────────────────────────────────

  const performAutoSave = async (stateOverride: any = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/projects/autosave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId,
          idea,
          status: stateOverride.status || 'draft',
          current_step: stateOverride.currentStep ?? currentStep,
          state_data: {
            questions: stateOverride.questions ?? questions,
            answers: stateOverride.answers ?? answers,
            designQuestions: stateOverride.designQuestions ?? designQuestions,
            designAnswers: stateOverride.designAnswers ?? designAnswers,
            requirements: stateOverride.requirements ?? requirements,
            design: stateOverride.design ?? design,
            tasks: stateOverride.tasks ?? tasks,
          },
        }),
      });
    } catch (err) {
      console.error('AutoSave failed', err);
    }
  };

  // Debounced autosave when user selects answers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(answers).length > 0 || Object.keys(designAnswers).length > 0) {
        performAutoSave();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [answers, designAnswers]);

  // ─── Initialization ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!initRef.current && (!stateData.questions || stateData.questions.length === 0) && currentStep === 'questions') {
      initRef.current = true;
      generateStage('generate_questions').then(qRes => {
        performAutoSave({ questions: qRes ?? [] });
      });
    }
  }, []);

  // ─── Generation ──────────────────────────────────────────────────────────

  const generateStage = async (action: string) => {
    setIsGenerating(true);
    setError(null);
    setGenerationMessage(null);
    setGenerationProgress(0);
    let parsedResult = null;

    try {
      const endpoint = API_ENDPOINTS[action];
      if (!endpoint) throw new Error(`Unknown action: ${action}`);

      const payload: Record<string, any> = { idea };

      if (action === 'generate_requirements' && Object.keys(answers).length > 0) {
        payload.answers = JSON.stringify(answers);
      }
      if (action === 'generate_design_questions') {
        payload.requirements = requirements;
      }
      if (action === 'generate_design') {
        payload.requirements = requirements;
        if (Object.keys(designAnswers).length > 0) {
          payload.answers = JSON.stringify(designAnswers);
        }
      }
      if (action === 'generate_tasks') {
        payload.requirements = requirements;
        payload.design = design;
      }

      // SSE-enabled actions (requirements, design, tasks generation)
      const sseActions = ['generate_requirements', 'generate_design', 'generate_tasks'];
      if (sseActions.includes(action)) {
        // Use SSE streaming
        let resultContent: string | null = null;

        // Cancel any previous stream and start a fresh abortable one.
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        await startSSEStream(endpoint, payload, {
          onEvent: (event, data: any) => {
            if (!mountedRef.current) return;
            if (event === 'progress') {
              setGenerationMessage(data.message || null);
              setGenerationProgress(data.progress || 0);
            } else if (event === 'result') {
              if (data.success) {
                resultContent = data.content;
              } else {
                throw new Error('Generation failed');
              }
            } else if (event === 'error') {
              throw new Error(data.message || 'Generation failed');
            }
          },
          onError: (err) => {
            // Ignore errors caused by us aborting on unmount/navigation.
            if (!mountedRef.current || controller.signal.aborted) return;
            setError(err.message || 'Something went wrong.');
          },
          onDone: () => {
            if (!mountedRef.current) return;
            setGenerationMessage(null);
          },
        }, controller.signal);

        if (resultContent) {
          if (action === 'generate_requirements') {
            setRequirements(resultContent);
            parsedResult = resultContent;
          } else if (action === 'generate_design') {
            setDesign(resultContent);
            parsedResult = resultContent;
          } else if (action === 'generate_tasks') {
            setTasks(resultContent);
            parsedResult = resultContent;
          }
        }
      } else {
        // Non-SSE actions (questions, design-questions) use regular fetch
        const data = await fetchDetailedApi(endpoint, payload);
        if (!data.success) throw new Error('Generation failed');

        if (action === 'generate_questions') {
          const parsed = safeParseJsonArray(data.content);
          if (parsed && parsed.length > 0) {
            setQuestions(parsed);
            parsedResult = parsed;
          } else {
            throw new Error('Could not read the generated questions. Please try again.');
          }
        }
        if (action === 'generate_design_questions') {
          const parsed = safeParseJsonArray(data.content);
          if (parsed && parsed.length > 0) {
            setDesignQuestions(parsed);
            parsedResult = parsed;
          } else {
            throw new Error('Could not read the generated tech-stack questions. Please try again.');
          }
        }
      }
    } catch (err: any) {
      console.error('Error in generateStage:', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsGenerating(false);
      setGenerationMessage(null);
      setGenerationProgress(0);
    }
    return parsedResult;
  };

  // ─── Refine via chat ─────────────────────────────────────────────────────

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    try {
      const currentContent = currentStep === 'requirements' ? requirements : currentStep === 'design' ? design : tasks;

      const data = await fetchDetailedApi(API_ENDPOINTS.refine_content, {
        currentContent,
        prompt: refinePrompt,
      });

      if (!data.success) throw new Error('Refinement failed');

      if (currentStep === 'requirements') {
        setRequirements(data.content);
        performAutoSave({ requirements: data.content });
      }
      if (currentStep === 'design') {
        setDesign(data.content);
        performAutoSave({ design: data.content });
      }
      if (currentStep === 'tasks') {
        setTasks(data.content);
        performAutoSave({ tasks: data.content });
      }

      setRefinePrompt('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong during refinement.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Step progression ────────────────────────────────────────────────────

  const advanceStep = async () => {
    if (currentStep === 'questions') {
      setCurrentStep('requirements');
      const req = await generateStage('generate_requirements');
      performAutoSave({ currentStep: 'requirements', requirements: req });
    } else if (currentStep === 'requirements') {
      setCurrentStep('design-questions');
      const dq = await generateStage('generate_design_questions');
      performAutoSave({ currentStep: 'design-questions', designQuestions: dq });
    } else if (currentStep === 'design-questions') {
      setCurrentStep('design');
      const des = await generateStage('generate_design');
      performAutoSave({ currentStep: 'design', design: des });
    } else if (currentStep === 'design') {
      setCurrentStep('tasks');
      const tsk = await generateStage('generate_tasks');
      performAutoSave({ currentStep: 'tasks', tasks: tsk });
    } else {
      // Finalize and save
      setIsGenerating(true);
      setError(null);
      try {
        const data = await fetchDetailedApi(API_ENDPOINTS.save_project, {
          projectId,
          idea,
          requirements,
          design,
          tasks,
        });

        if (!data.success) throw new Error('Failed to save project');

        await performAutoSave({ status: 'completed' });
        onComplete();
      } catch (err: any) {
        setError(err.message || 'Failed to save project.');
        setIsGenerating(false);
      }
    }
  };

  // ─── Answer selection handlers ───────────────────────────────────────────

  const retryCurrentStep = async () => {
    if (isGenerating) return;
    setError(null);
    const actionMap: Record<Step, string> = {
      questions: 'generate_questions',
      requirements: 'generate_requirements',
      'design-questions': 'generate_design_questions',
      design: 'generate_design',
      tasks: 'generate_tasks',
    };
    const result = await generateStage(actionMap[currentStep]);
    if (result == null) return; // generateStage already set an error
    if (currentStep === 'requirements') performAutoSave({ requirements: result });
    else if (currentStep === 'design') performAutoSave({ design: result });
    else if (currentStep === 'tasks') performAutoSave({ tasks: result });
    else if (currentStep === 'questions') performAutoSave({ questions: result });
    else if (currentStep === 'design-questions') performAutoSave({ designQuestions: result });
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (current.includes(answer)) {
        return { ...prev, [questionId]: current.filter(a => a !== answer) };
      } else {
        return { ...prev, [questionId]: [...current, answer] };
      }
    });
  };

  const handleDesignAnswerSelect = (questionId: string, answer: string) => {
    setDesignAnswers(prev => {
      const current = prev[questionId] || [];
      if (current.includes(answer)) {
        return { ...prev, [questionId]: current.filter(a => a !== answer) };
      } else {
        return { ...prev, [questionId]: [...current, answer] };
      }
    });
  };

  const allQuestionsAnswered = true; // Questions can be skipped
  const currentContent = currentStep === 'requirements' ? requirements : currentStep === 'design' ? design : tasks;

  const stepConfig = {
    questions: { title: 'Discovery Questions', icon: FileText, next: 'Generate Requirements' },
    requirements: { title: 'Review Requirements', icon: FileText, next: 'Commit & Continue to Tech Stack' },
    "design-questions": { title: 'Tech Stack Decisions', icon: GitBranch, next: 'Generate Design' },
    design: { title: 'Review System Design', icon: GitBranch, next: 'Commit & Continue to Tasks' },
    tasks: { title: 'Review Tasks', icon: ListChecks, next: 'Finish & Save Project' },
  };

  const activeConfig = stepConfig[currentStep];
  const StepIcon = activeConfig.icon;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-bg via-bg to-surface">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border/50 bg-surface/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.12em] mb-1">
            Detailed Pipeline
          </p>
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight truncate">
            {idea}
          </h1>

          {/* Progress stepper */}
          <div className="flex items-center gap-2 mt-2">
            {(['questions', 'requirements', 'design-questions', 'design', 'tasks'] as Step[]).map((step, idx) => {
              const order = ['questions', 'requirements', 'design-questions', 'design', 'tasks'];
              const isActive = currentStep === step;
              const isPast = order.indexOf(currentStep) > order.indexOf(step);

              const stepLabels = {
                questions: 'Questions',
                requirements: 'Requirements',
                "design-questions": 'Tech Stack',
                design: 'Design',
                tasks: 'Tasks',
              };

              return (
                <div key={step} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-300 ${isActive
                      ? 'bg-primary/10 border border-primary'
                      : isPast
                        ? 'bg-success/10 border border-success/30'
                        : 'bg-surface-alt border border-border/50 opacity-60'
                    }`}>
                    {isPast ? (
                      <CheckCircle2 size={12} className="text-success" />
                    ) : (
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-text-muted'}`} />
                    )}
                    <span className={`text-[13px] font-semibold ${isActive ? 'text-primary' : isPast ? 'text-success' : 'text-text-muted'}`}>
                      {stepLabels[step]}
                    </span>
                  </div>
                  {idx < 3 && <ArrowRight size={12} className="text-border/60" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 bg-bg" ref={scrollContainerRef}>
        <div className="max-w-5xl mx-auto">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-error text-[17px] font-medium flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <AlertTriangle size={18} className="shrink-0" />
                {error}
              </span>
              {!isGenerating && (
                <button
                  onClick={retryCurrentStep}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 hover:bg-error/20 text-error text-[14px] font-semibold transition-colors shrink-0"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              )}
            </div>
          )}

          {isGenerating && ((currentStep === 'questions' || currentStep === 'design-questions') ? (currentStep === 'questions' ? questions.length === 0 : designQuestions.length === 0) : !currentContent) ? (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              </div>
              <p className="text-[20px] font-bold text-text-primary mb-2">
                Generating {activeConfig.title}
              </p>
              {generationMessage ? (
                <div className="flex flex-col items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles size={14} className="animate-pulse" />
                    <span className="text-[15px] font-semibold">{generationMessage}</span>
                  </div>
                  {generationProgress > 0 && (
                    <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <ShiningText text="BuildFlow is thinking..." />
              )}
            </div>
          ) : (currentStep === 'questions' || currentStep === 'design-questions') ? (
            <div className="animate-fade-in-up space-y-8">
              {/* Questions Display */}
              <div>
                <div className="pb-4 border-b border-border mb-6">
                  <h2 className="text-[20px] font-bold text-text-primary">
                    {currentStep === 'questions' ? 'Discovery Questions' : 'Tech Stack Decisions'}
                  </h2>
                  <p className="text-[17px] text-text-muted mt-1">
                    {currentStep === 'questions' ? 'Help us understand your project better' : 'Decide on the right technologies for your product'}
                  </p>
                </div>

                <div className="space-y-6">
                  {(currentStep === 'questions' ? questions : designQuestions).map((q, idx) => (
                    <div key={q.id} className="space-y-3">
                      <p className="text-[18px] font-semibold text-text-primary">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((option: string) => {
                          const isSelected = (currentStep === 'questions' ? (answers[q.id] || []) : (designAnswers[q.id] || [])).includes(option);
                          return (
                            <button
                              key={option}
                              onClick={() => currentStep === 'questions' ? handleAnswerSelect(q.id, option) : handleDesignAnswerSelect(q.id, option)}
                              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${isSelected
                                  ? 'border-primary bg-primary/5 text-primary font-medium'
                                  : 'border-border hover:border-primary/40 hover:bg-surface/50 text-text-secondary'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-border'
                                  }`}>
                                  {isSelected && (
                                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  )}
                                </div>
                                <span className="text-[17px]">{option}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Panel */}
              <div className="flex justify-end">
                <button
                  onClick={advanceStep}
                  disabled={!allQuestionsAnswered || isGenerating}
                  className="group relative flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[18px] font-bold hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isGenerating ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <CheckCircle2 size={18} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-white drop-shadow-sm tracking-wide">{activeConfig.next}</span>
                  <ArrowRight size={18} strokeWidth={2.5} className="text-white drop-shadow-sm group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up space-y-8">
              {/* Document Display */}
              <div>
                <div className="pb-4 border-b border-border mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <StepIcon size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-[20px] font-bold text-text-primary">{activeConfig.title}</h2>
                      <p className="text-[17px] text-text-muted">Review and refine before proceeding</p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <MarkdownRenderer
                    content={currentContent}
                    className="prose-h1:text-[28px] prose-h2:text-[22px] prose-h3:text-[18px] prose-p:text-[18px] prose-li:text-[18px] prose-strong:text-[18px] prose-code:text-[17px]"
                  />
                </div>
              </div>

              {/* Action Panel — Refine via chat */}
              <div className="border-t border-border pt-6 mt-8">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <Edit3 size={16} className="text-primary" />
                    <h3 className="text-[20px] font-bold text-text-primary">Request Changes</h3>
                  </div>
                  <p className="text-[17px] text-text-muted mt-1">
                    Describe any modifications you'd like, or commit to proceed to the next step.
                  </p>
                </div>

                <div>
                  <form onSubmit={handleRefine} className="space-y-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={refinePrompt}
                        onChange={(e) => setRefinePrompt(e.target.value)}
                        disabled={isGenerating}
                        placeholder="e.g., Add mobile app support, include API rate limiting, use PostgreSQL instead..."
                        className="flex-1 px-4 py-3 rounded-lg border border-border bg-bg text-[17px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!refinePrompt.trim() || isGenerating}
                        className="flex items-center gap-2 px-5 py-3 rounded-lg bg-surface-alt text-text-primary font-semibold text-[17px] border border-border hover:bg-border hover:border-border disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Refining...
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Refine
                          </>
                        )}
                      </button>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-red-50 text-error text-[18px] font-medium border border-red-200">
                        {error}
                      </div>
                    )}
                  </form>

                  <div className="flex justify-end pt-5 mt-5 border-t border-border">
                    <button
                      onClick={advanceStep}
                      disabled={isGenerating}
                      className="group relative flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[18px] font-bold hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isGenerating && refinePrompt.trim() === '' ? (
                        <Loader2 size={18} className="animate-spin text-white" />
                      ) : (
                        <CheckCircle2 size={18} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
                      )}
                      <span className="text-white drop-shadow-sm tracking-wide">{activeConfig.next}</span>
                      <ArrowRight size={18} strokeWidth={2.5} className="text-white drop-shadow-sm group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ScrollButtons containerRef={scrollContainerRef} />
    </div>
  );
}

// ─── Completed Results View ──────────────────────────────────────────────────

function CompletedResultsView({ project, projectId, onProjectUpdate }: { project: any, projectId: string, onProjectUpdate: (updated: any) => void }) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  // Tracks the server-side generation lifecycle for fast-mode projects so we
  // can surface failures/timeouts instead of polling forever.
  const [genStatus, setGenStatus] = useState<string>(project.status || 'completed');
  const [genError, setGenError] = useState<string | null>(project.state_data?.error || null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Fetch artifacts from DB
  const fetchArtifacts = useCallback(async () => {
    try {
      const data = await SupabaseService.getArtifactsByProject(projectId);
      setArtifacts(data);
      return data;
    } catch (err) {
      console.error('Failed to load artifacts:', err);
      return [];
    }
  }, [projectId]);

  // Initial load
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setIsLoading(true);
      const data = await fetchArtifacts();
      // Only stop loading spinner if all 3 artifacts are present
      const types = new Set(data.map((a: Artifact) => a.artifact_type));
      if (types.has('requirements') && types.has('design') && types.has('tasks')) {
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    })();
  }, [projectId, fetchArtifacts]);

  // Poll for missing artifacts until all 3 are present, with a bounded
  // lifetime so a failed/stalled generation surfaces an error instead of
  // spinning forever.
  const pollAttemptsRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 60; // ~3 minutes at 3s intervals

  useEffect(() => {
    if (!projectId) return;
    // Only poll while generation is actively running. Completed/failed states
    // are terminal and handled by the render logic below.
    if (genStatus !== 'generating') return;

    const isComplete = hasAllReadyArtifacts(artifacts);
    if (isComplete) {
      setGenStatus('completed');
      return; // All present with content, stop polling
    }

    const interval = setInterval(async () => {
      pollAttemptsRef.current += 1;

      const data = await fetchArtifacts();
      if (hasAllReadyArtifacts(data)) {
        clearInterval(interval);
        setGenStatus('completed');
        return;
      }

      // Check the server-side project status so we can detect failures fast.
      const { data: proj } = await supabase
        .from('projects')
        .select('status, state_data')
        .eq('id', projectId)
        .single();

      if (proj?.status === 'failed') {
        clearInterval(interval);
        setGenStatus('failed');
        setGenError(proj?.state_data?.error || 'Generation failed before all documents were created.');
        return;
      }

      // Give up after the cap to avoid an endless spinner.
      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        clearInterval(interval);
        setGenStatus('failed');
        setGenError('Generation timed out. Some documents may be missing.');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId, artifacts, fetchArtifacts, genStatus]);

  // Retry generation into the same project (fast pipeline).
  const handleRetryGeneration = useCallback(async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setGenError(null);
    pollAttemptsRef.current = 0;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in again.');

      setGenStatus('generating');
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ appIdea: project.prompt, userId: session.user.id, projectId }),
      });

      // The route streams SSE; we only need it to have started. Polling + the
      // realtime subscription will pick up the regenerated artifacts.
      if (!res.ok && res.status !== 200) {
        let msg = 'Failed to restart generation';
        try { const d = await res.json(); msg = d.error || msg; } catch { /* ignore */ }
        throw new Error(msg);
      }
      setArtifacts([]);
    } catch (err: any) {
      setGenStatus('failed');
      setGenError(err.message || 'Failed to restart generation.');
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, project.prompt, projectId]);

  const handleNewArtifact = useCallback((newArtifact: Artifact) => {
    setArtifacts(prev => {
      // For INSERT: add if not already present
      // For UPDATE: replace the existing artifact
      const existing = prev.find(a => a.id === newArtifact.id);
      let updated;
      if (existing) {
        updated = prev.map(a => a.id === newArtifact.id ? newArtifact : a);
      } else {
        updated = [...prev, newArtifact];
      }
      return updated.sort((a, b) => {
        const order: Record<ArtifactType, number> = { requirements: 0, design: 1, tasks: 2 };
        return order[a.artifact_type] - order[b.artifact_type];
      });
    });
  }, []);

  const handleDisconnect = useCallback(() => {
    setReconnectAttempts(prev => {
      const n = prev + 1;
      if (n >= 5) setShowRefreshPrompt(true);
      return n;
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    // Subscribe to both INSERT and UPDATE events
    const channel = supabase
      .channel(`artifacts:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'artifacts',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => handleNewArtifact(payload.new as Artifact)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'artifacts',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => handleNewArtifact(payload.new as Artifact)
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && handleDisconnect) {
          handleDisconnect();
        }
      });

    setReconnectAttempts(0);
    setShowRefreshPrompt(false);
    return () => { supabase.removeChannel(channel); };
  }, [projectId, handleNewArtifact, handleDisconnect]);

  const handleDownloadBundle = async () => {
    try {
      let codeFiles = useCodeStore.getState().getCode(projectId);

      if (!codeFiles || codeFiles.length === 0) {
        const { data } = await supabase.from('projects').select('state_data').eq('id', projectId).single();
        codeFiles = data?.state_data?.generatedCode;
        if (codeFiles && Array.isArray(codeFiles) && codeFiles.length > 0) {
          useCodeStore.getState().setCode(projectId, codeFiles); // Cache it
        }
      }

      const { downloadBundle } = await import('@/lib/downloadBundle');
      await downloadBundle(artifacts, projectId, codeFiles || undefined);
    } catch (err) {
      console.error('Failed to download bundle:', err);
    }
  };

  const handleArtifactUpdate = useCallback((updated: Artifact) => {
    setArtifacts(prev => prev.map(a => a.id === updated.id ? updated : a));
  }, []);

  const handleTogglePublic = async (isPublic: boolean) => {
    if (isTogglingPublic) return;
    setIsTogglingPublic(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_public: isPublic }),
      });
      const data = await res.json();
      if (data.success) {
        onProjectUpdate({ ...project, is_public: isPublic });
      } else {
        alert(data.error || 'Failed to update sharing');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update sharing');
    } finally {
      setIsTogglingPublic(false);
    }
  };

  // Surface a clear failure state with a retry instead of an endless spinner.
  // A project is "failed" if generation isn't actively running yet the three
  // documents aren't all present with content (covers hard failures, timeouts,
  // and stale projects that were marked complete but saved empty artifacts).
  const hasAllArtifacts = hasAllReadyArtifacts(artifacts);
  const generationFailed = !isLoading && !hasAllArtifacts && genStatus !== 'generating';

  if (generationFailed) {
    return (
      <div className="h-full flex items-center justify-center bg-bg px-6">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={30} className="text-error" />
          </div>
          <h2 className="text-[20px] font-bold text-text-primary mb-2">Generation didn’t finish</h2>
          <p className="text-[14px] text-text-muted mb-8">
            {genError || 'Something interrupted the generation.'} Your idea is saved — you can try again.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRetryGeneration}
              disabled={isRetrying}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-colors shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRetrying ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              {isRetrying ? 'Restarting…' : 'Retry generation'}
            </button>
            <a
              href="/dashboard"
              className="px-6 py-3 rounded-xl border border-border text-text-secondary font-semibold hover:bg-surface-alt transition-colors"
            >
              Start over
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResultsViewer
      artifacts={artifacts}
      isLoading={isLoading || (genStatus === 'generating' && !hasAllArtifacts)}
      onDownloadBundle={handleDownloadBundle}
      projectId={projectId}
      showRefreshPrompt={showRefreshPrompt}
      onArtifactUpdate={handleArtifactUpdate}
      isPublic={project.is_public}
      onTogglePublic={handleTogglePublic}
    />
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/dashboard');
        return;
      }
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success && data.project) {
        setProject(data.project);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Failed to load project', err);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId, fetchProject]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-primary" />
          <p className="text-text-muted font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  if (project.status === 'draft') {
    return (
      <DetailedPipelineDraftView 
        project={project} 
        projectId={projectId} 
        onComplete={() => fetchProject()} 
      />
    );
  }

  return <CompletedResultsView project={project} projectId={projectId} onProjectUpdate={setProject} />;
}
