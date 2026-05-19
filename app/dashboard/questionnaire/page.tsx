'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowRight, Loader2, Send, CheckCircle2, FileText, GitBranch, ListChecks, Edit3
} from 'lucide-react';
import { ShiningText } from '@/components/ui/shining-text';
import MermaidDiagram from '@/components/MermaidDiagram';

import { motion, AnimatePresence } from 'framer-motion';

type Step = 'questions' | 'requirements' | 'design-questions' | 'design' | 'tasks';

function DetailedPipelineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idea = searchParams.get('idea') || '';
  const initialProjectId = searchParams.get('projectId');

  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [currentStep, setCurrentStep] = useState<Step>('questions');

  // Questionnaire state
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const [designQuestions, setDesignQuestions] = useState<any[]>([]);
  const [designAnswers, setDesignAnswers] = useState<Record<string, string[]>>({});

  // Document states
  const [requirements, setRequirements] = useState<string>('');
  const [design, setDesign] = useState<string>('');
  const [tasks, setTasks] = useState<string>('');

  // UI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const initRef = useRef(false);

  const performAutoSave = async (stateOverride: any = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/projects/autosave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          projectId: stateOverride.projectId ?? projectId,
          idea,
          status: 'draft',
          current_step: stateOverride.currentStep ?? currentStep,
          state_data: {
            questions: stateOverride.questions ?? questions,
            answers: stateOverride.answers ?? answers,
            designQuestions: stateOverride.designQuestions ?? designQuestions,
            designAnswers: stateOverride.designAnswers ?? designAnswers,
            requirements: stateOverride.requirements ?? requirements,
            design: stateOverride.design ?? design,
            tasks: stateOverride.tasks ?? tasks
          }
        })
      });
      const data = await res.json();
      if (data.success && data.projectId && !projectId) {
        setProjectId(data.projectId);
        // Replace URL to include projectId without reloading
        const url = new URL(window.location.href);
        url.searchParams.set('projectId', data.projectId);
        window.history.replaceState({}, '', url.toString());
        return data.projectId;
      }
    } catch (err) {
      console.error('AutoSave failed', err);
    }
  };

  useEffect(() => {
    // If user typed some answer, let's debounce autosave it
    const timer = setTimeout(() => {
      if (projectId && (Object.keys(answers).length > 0 || Object.keys(designAnswers).length > 0)) {
        performAutoSave();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [answers, designAnswers]);

  // Load existing project or Auto-start generating questions on load
  useEffect(() => {
    const loadProject = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`/api/projects/${initialProjectId}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        if (data.success && data.project) {
          const state = data.project.state_data || {};
          if (state.questions) setQuestions(state.questions);
          if (state.answers) setAnswers(state.answers);
          if (state.designQuestions) setDesignQuestions(state.designQuestions);
          if (state.designAnswers) setDesignAnswers(state.designAnswers);
          if (state.requirements) setRequirements(state.requirements);
          if (state.design) setDesign(state.design);
          if (state.tasks) setTasks(state.tasks);
          if (data.project.current_step) setCurrentStep(data.project.current_step as Step);
        }
      } catch (err) {
        console.error('Failed to load project state', err);
      }
    };

    if (!idea && !initialProjectId) {
      router.push('/dashboard');
      return;
    }

    if (!initRef.current) {
      initRef.current = true;
      if (initialProjectId) {
        loadProject();
      } else {
        generateStage('generate_questions').then(qRes => {
          // Trigger first autosave creation once questions are created
          performAutoSave({ questions: qRes ?? [] });
        });
      }
    }
  }, [idea, router, initialProjectId]);

  const fetchApi = async (payload: any) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error('Authentication error. Please sign in again.');

    const response = await fetch('/api/detailed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let msg = 'API error';
      try { const d = await response.json(); msg = d.error || msg; } catch { }
      throw new Error(msg);
    }

    return response.json();
  };

  const generateStage = async (action: string) => {
    setIsGenerating(true);
    setError(null);
    let parsedResult = null;
    try {
      const payload: any = {
        action,
        idea,
        requirements,
        design
      };

      if (action === 'generate_requirements' && Object.keys(answers).length > 0) {
        payload.answers = JSON.stringify(answers);
      }

      if (action === 'generate_design' && Object.keys(designAnswers).length > 0) {
        payload.answers = JSON.stringify(designAnswers);
      }

      console.log('Calling API with action:', action);
      const data = await fetchApi(payload);
      console.log('API response:', data);

      if (!data.success) throw new Error('Generation failed');

      if (action === 'generate_questions') {
        try {
          console.log('Raw questions content:', data.content);
          const parsed = JSON.parse(data.content);
          console.log('Parsed questions:', parsed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuestions(parsed);
            parsedResult = parsed;
            console.log('Questions set successfully:', parsed);
          } else {
            throw new Error('Invalid questions format - not an array or empty');
          }
        } catch (parseError) {
          console.error('Failed to parse questions:', parseError);
          console.error('Content was:', data.content);
          setError('Failed to generate questions. Please try again.');
        }
      }
      if (action === 'generate_design_questions') {
        try {
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDesignQuestions(parsed);
            parsedResult = parsed;
          } else {
            throw new Error('Invalid design questions format');
          }
        } catch (parseError) {
          console.error('Failed to parse design questions:', parseError);
          setError('Failed to generate design questions. Please try again.');
        }
      }
      if (action === 'generate_requirements') {
        setRequirements(data.content);
        parsedResult = data.content;
      }
      if (action === 'generate_design') {
        setDesign(data.content);
        parsedResult = data.content;
      }
      if (action === 'generate_tasks') {
        setTasks(data.content);
        parsedResult = data.content;
      }

    } catch (err: any) {
      console.error('Error in generateStage:', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsGenerating(false);
    }
    return parsedResult;
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    try {
      const currentContent = currentStep === 'requirements' ? requirements : currentStep === 'design' ? design : tasks;

      const data = await fetchApi({
        action: 'refine_content',
        currentContent,
        prompt: refinePrompt
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

  const advanceStep = async () => {
    if (currentStep === 'questions') {
      // User answered questions, now generate requirements
      setCurrentStep('requirements');
      const req = await generateStage('generate_requirements');
      performAutoSave({ currentStep: 'requirements', requirements: req });
    } else if (currentStep === 'requirements') {
      // User commits to requirements, now generate design questions
      setCurrentStep('design-questions');
      const dq = await generateStage('generate_design_questions');
      performAutoSave({ currentStep: 'design-questions', designQuestions: dq });
    } else if (currentStep === 'design-questions') {
      // User answered design questions, now generate design
      setCurrentStep('design');
      const des = await generateStage('generate_design');
      performAutoSave({ currentStep: 'design', design: des });
    } else if (currentStep === 'design') {
      // User commits to design, now generate tasks
      setCurrentStep('tasks');
      const tsk = await generateStage('generate_tasks');
      performAutoSave({ currentStep: 'tasks', tasks: tsk });
    } else {
      // Finalize and save
      setIsGenerating(true);
      setError(null);
      try {
        const data = await fetchApi({
          action: 'save_project',
          idea,
          projectId, // Pass projectId to map to existing project
          requirements,
          design,
          tasks
        });

        if (!data.success) throw new Error('Failed to save project');

        await performAutoSave({ status: 'completed' });
        router.push(`/dashboard/results/${data.projectId}`);
      } catch (err: any) {
        setError(err.message || 'Failed to save project.');
        setIsGenerating(false);
      }
    }
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

  if (!idea) return null;

  // Questions can now be skipped or partially answered per user request
  const allQuestionsAnswered = true;

  const currentContent = currentStep === 'requirements' ? requirements : currentStep === 'design' ? design : tasks;

  const stepConfig = {
    questions: { title: 'Discovery Questions', icon: FileText, next: 'Generate Requirements' },
    requirements: { title: 'Review Requirements', icon: FileText, next: 'Commit & Continue to Tech Stack' },
    "design-questions": { title: 'Tech Stack Decisions', icon: GitBranch, next: 'Generate Design' },
    design: { title: 'Review System Design', icon: GitBranch, next: 'Commit & Continue to Tasks' },
    tasks: { title: 'Review Tasks', icon: ListChecks, next: 'Finish & Save Project' }
  };

  const activeConfig = stepConfig[currentStep];
  const StepIcon = activeConfig.icon;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-bg via-bg to-surface">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border/50 bg-surface/80 backdrop-blur-sm">
        <div className="max-w-[900px] mx-auto">
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
                tasks: 'Tasks'
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
      <div className="flex-1 overflow-y-auto px-6 py-8 bg-bg">
        <div className="max-w-[900px] mx-auto">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-error text-[17px] font-medium">
              {error}
            </div>
          )}

          {isGenerating && ((currentStep === 'questions' || currentStep === 'design-questions') ? (currentStep === 'questions' ? questions.length === 0 : designQuestions.length === 0) : !currentContent) ? (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              </div>
              <p className="text-[20px] font-bold text-text-primary mb-2">
                {currentStep === 'questions' || currentStep === 'design-questions' ? `Generating ${activeConfig.title}` : `Generating ${activeConfig.title}`}
              </p>
              <ShiningText text="BuildFlow is thinking..." />
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
                  <div className="prose prose-base max-w-none
                    prose-headings:text-text-primary prose-headings:font-bold
                    prose-h1:text-[28px] prose-h1:border-b prose-h1:border-border prose-h1:pb-3 prose-h1:mb-4
                    prose-h2:text-[22px] prose-h2:mt-6 prose-h2:mb-3
                    prose-h3:text-[18px] prose-h3:mt-4 prose-h3:mb-2
                    prose-p:text-[18px] prose-p:text-text-secondary prose-p:leading-[1.75] prose-p:mb-4
                    prose-li:text-[18px] prose-li:text-text-secondary prose-li:leading-[1.7] prose-li:my-1
                    prose-ul:my-3 prose-ol:my-3
                    prose-strong:text-[18px] prose-strong:text-text-primary prose-strong:font-semibold
                    prose-code:text-primary prose-code:bg-primary/5 prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:text-[17px] prose-code:font-mono
                    prose-table:w-full prose-table:my-6 prose-table:text-left
                    prose-th:bg-surface-alt prose-th:px-4 prose-th:py-2 prose-th:border-b-2 prose-th:border-border
                    prose-td:px-4 prose-td:py-2 prose-td:border-b prose-td:border-border">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          const codeString = String(children).replace(/\n$/, '');

                          if (language === 'mermaid') {
                            return (
                              <div className="my-6 p-4 bg-white rounded-lg border border-border overflow-x-auto hide-scrollbar">
                                <div className="min-w-fit flex justify-center">
                                  <MermaidDiagram chart={codeString} />
                                </div>
                              </div>
                            );
                          }

                          if (match) {
                            return (
                              <pre className={className}>
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            );
                          }

                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {currentContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Action Panel */}
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
    </div>
  );
}

export default function DetailedPipelinePage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-primary" />
          <p className="text-text-muted font-medium">Loading pipeline...</p>
        </div>
      </div>
    }>
      <DetailedPipelineContent />
    </Suspense>
  );
}
