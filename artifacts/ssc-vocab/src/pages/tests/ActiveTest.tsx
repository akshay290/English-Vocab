import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useGetTest, useSubmitTest, TestQuestion } from '@workspace/api-client-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ActiveTest({ params }: { params: { id: string } }) {
  const testId = parseInt(params.id);
  const [, setLocation] = useLocation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const startTimeRef = useRef(Date.now());
  
  const { data: test, isLoading } = useGetTest(testId, {
    query: {
      enabled: !!testId,
      queryKey: ['test', testId],
      refetchOnWindowFocus: false
    }
  });

  const submitTestMutation = useSubmitTest();

  // Initialize timer and answers when test loads
  useEffect(() => {
    if (test && Object.keys(answers).length === 0) {
      if (test.status === 'completed') {
        setLocation(`/tests/${testId}/result`);
        return;
      }
      
      const initialAnswers: Record<number, number | null> = {};
      test.questions.forEach(q => {
        initialAnswers[q.id] = q.userAnswer !== undefined ? q.userAnswer : null;
      });
      setAnswers(initialAnswers);

      if (test.timeDurationMinutes) {
        setTimeLeft(test.timeDurationMinutes * 60);
      }
      startTimeRef.current = Date.now();
    }
  }, [test, testId, setLocation]); // only once when test is loaded

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto-submit when time is up
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerSelect = (questionId: number, optionIdx: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleFinalSubmit = useCallback(() => {
    if (!test) return;
    
    const timeTakenSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const answersArray = Object.entries(answers).map(([qId, selectedOption]) => ({
      questionId: parseInt(qId),
      selectedOption
    }));

    submitTestMutation.mutate(
      {
        id: testId,
        data: {
          answers: answersArray,
          timeTakenSeconds
        }
      },
      {
        onSuccess: () => {
          setLocation(`/tests/${testId}/result`);
        }
      }
    );
  }, [test, testId, answers, submitTestMutation, setLocation]);

  if (isLoading || !test) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Skeleton className="h-4 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = test.questions[currentIdx];
  const answeredCount = Object.values(answers).filter(a => a !== null).length;
  const progress = (answeredCount / test.totalQuestions) * 100;
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header / Progress */}
        <div className="bg-background rounded-xl p-4 shadow-sm border mb-6 sticky top-20 z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground">Question {currentIdx + 1} of {test.totalQuestions}</span>
              <span className={answeredCount === test.totalQuestions ? "text-secondary" : "text-primary"}>
                {answeredCount} Answered
              </span>
            </div>
            <Progress value={progress} className="h-2.5" />
          </div>
          
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold font-mono text-lg border ${timeLeft < 60 ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse' : 'bg-primary/10 text-primary border-primary/20'}`}>
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Question Card */}
        <Card className="border-none shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
          <CardHeader className="pt-8 pb-4 pl-10 pr-6">
            <h2 className="text-2xl font-bold leading-relaxed">{currentQuestion.questionText}</h2>
          </CardHeader>
          <CardContent className="pl-10 pr-6 pb-8">
            <RadioGroup 
              value={answers[currentQuestion.id]?.toString()} 
              onValueChange={(val) => handleAnswerSelect(currentQuestion.id, parseInt(val))}
              className="space-y-3"
            >
              {currentQuestion.options.map((opt, idx) => (
                <div key={idx} className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${answers[currentQuestion.id] === idx ? 'bg-primary/5 border-primary shadow-sm' : 'hover:bg-muted'}`}>
                  <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} className="w-5 h-5" />
                  <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer text-base leading-snug font-normal">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="w-32 bg-background"
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Previous
          </Button>
          
          {currentIdx < test.totalQuestions - 1 ? (
            <Button 
              size="lg" 
              onClick={() => setCurrentIdx(prev => Math.min(test.totalQuestions - 1, prev + 1))}
              className="w-32 shadow-md"
            >
              Next <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setShowSubmitConfirm(true)}
              className="shadow-md min-w-32 font-bold"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" /> Submit Test
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>You are about to submit your test.</p>
              
              {answeredCount < test.totalQuestions && (
                <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3 border border-destructive/20 text-destructive">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="font-medium text-sm">
                    You have left {test.totalQuestions - answeredCount} question(s) unanswered. They will be marked as incorrect.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitTestMutation.isPending}>Continue Testing</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleFinalSubmit();
              }}
              disabled={submitTestMutation.isPending}
              className={answeredCount < test.totalQuestions ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {submitTestMutation.isPending ? 'Submitting...' : 'Yes, Submit Test'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
