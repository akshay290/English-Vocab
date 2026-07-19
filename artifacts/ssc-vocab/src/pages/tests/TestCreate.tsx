import { useState } from 'react';
import { useLocation } from 'wouter';
import { useCreateTest, useBrowseTopics } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Tests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: topics } = useBrowseTopics();
  const createTestMutation = useCreateTest();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState([20]);
  const [timeDuration, setTimeDuration] = useState<string>('0'); // 0 means no timer

  const handleCategoryToggle = (slug: string) => {
    setSelectedCategories(prev => 
      prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug]
    );
  };

  const handleStartTest = () => {
    createTestMutation.mutate(
      {
        data: {
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          difficulty: difficulty !== 'all' ? difficulty : undefined,
          totalQuestions: questionCount[0],
          timeDurationMinutes: timeDuration !== '0' ? parseInt(timeDuration) : undefined,
          questionMode: 'random',
        }
      },
      {
        onSuccess: (response) => {
          setLocation(`/tests/${response.id}`);
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Could not create test',
            description: 'Not enough words match your criteria, or something went wrong.',
          });
        }
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <Target className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Generator</h1>
          <p className="text-muted-foreground mt-1">Create a custom quiz to check your knowledge</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg">Test Settings</CardTitle>
              <CardDescription>Configure your custom practice test</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-base">Number of Questions</Label>
                  <span className="font-bold text-primary">{questionCount[0]}</span>
                </div>
                <Slider
                  defaultValue={[20]}
                  max={100}
                  min={5}
                  step={5}
                  onValueChange={setQuestionCount}
                  className="py-4"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mixed Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Mixed Difficulty</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label>Timer (Optional)</Label>
                  <Select value={timeDuration} onValueChange={setTimeDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="No timer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No timer</SelectItem>
                      <SelectItem value="5">5 Minutes</SelectItem>
                      <SelectItem value="10">10 Minutes</SelectItem>
                      <SelectItem value="15">15 Minutes</SelectItem>
                      <SelectItem value="30">30 Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories to Include</CardTitle>
              <CardDescription>Leave all unchecked to include everything</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {topics?.map(topic => (
                  <div key={topic.slug} className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg border border-border/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => handleCategoryToggle(topic.slug)}>
                    <Checkbox 
                      id={`cat-${topic.slug}`} 
                      checked={selectedCategories.includes(topic.slug)}
                      onCheckedChange={() => handleCategoryToggle(topic.slug)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`cat-${topic.slug}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {topic.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24 border-primary shadow-lg overflow-hidden">
            <div className="h-2 w-full bg-primary" />
            <CardHeader className="bg-primary/5">
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Questions</span>
                <span className="font-bold">{questionCount[0]}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Difficulty</span>
                <span className="font-bold capitalize">{difficulty === 'all' ? 'Mixed' : difficulty}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Categories</span>
                <span className="font-bold">{selectedCategories.length === 0 ? 'All' : selectedCategories.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Time Limit</span>
                <span className="font-bold">{timeDuration === '0' ? 'None' : `${timeDuration} mins`}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 p-6 pt-4">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold gap-2" 
                onClick={handleStartTest}
                disabled={createTestMutation.isPending}
              >
                {createTestMutation.isPending ? 'Generating...' : (
                  <>Start Test <Play className="h-5 w-5 fill-current" /></>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
