import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BookA, BrainCircuit, Target, Trophy } from 'lucide-react';
import { Link } from 'wouter';
import { useBrowseTopics } from '@workspace/api-client-react';

export default function Home() {
  const { data: topics } = useBrowseTopics();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32 pb-16">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
            For SSC CGL, CHSL, CPO, MTS & Banking
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto mb-6">
            Master Vocabulary for <span className="text-primary">Competitive Exams</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Your energetic study companion. Build your word power, track your progress, and crush your exams with our spaced-repetition learning system.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base w-full sm:w-auto" asChild>
              <Link href="/auth/register">
                Start Learning Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base w-full sm:w-auto bg-background" asChild>
              <Link href="/vocabulary">Browse Words</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats / Features */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-md hover-elevate">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <BrainCircuit className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Smart Revision</h3>
                <p className="text-muted-foreground">
                  Our algorithm ensures you review words right when you're about to forget them.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover-elevate">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6">
                  <Target className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Custom Tests</h3>
                <p className="text-muted-foreground">
                  Generate targeted MCQs by category, alphabet, or difficulty to test your knowledge.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover-elevate">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-accent/20 text-accent-foreground flex items-center justify-center mb-6">
                  <Trophy className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Track Progress</h3>
                <p className="text-muted-foreground">
                  Maintain your daily streak, monitor your accuracy, and watch your vocabulary grow.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Coverage</h2>
            <p className="text-muted-foreground">
              We cover all vocabulary types asked in SSC and Banking exams. Focus on what matters most.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {topics?.map((topic) => (
              <Link key={topic.slug} href={`/vocabulary/category/${topic.slug}`}>
                <Card className="group cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <BookA className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div>
                      <h4 className="font-semibold text-sm">{topic.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{topic.count} words</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to boost your score?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
            Join thousands of aspirants who are mastering their vocabulary everyday.
          </p>
          <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-bold" asChild>
            <Link href="/auth/register">Create Free Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
