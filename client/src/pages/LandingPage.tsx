import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  ShieldCheck, 
  IndianRupee, 
  Zap, 
  Users, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl leading-tight">
                Connect with Skilled Workers{" "}
                <span className="text-primary">Instantly</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                India's most trusted platform for hiring verified laborers. 
                AI-verified safety checks, transparent pricing, and real-time matching.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/get-started?role=customer">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-hero-hire">
                    Hire Workers
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/get-started?role=laborer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-hero-find-work">
                    Find Work
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=600&fit=crop" 
                alt="Construction workers" 
                className="relative rounded-3xl shadow-2xl object-cover w-full h-[500px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Why Choose Kamgar Naka?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make hiring skilled workers safe, transparent, and hassle-free
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover-elevate transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-chart-3" />
                </div>
                <h3 className="font-display font-semibold text-xl">AI Safety Check</h3>
                <p className="text-muted-foreground">
                  Every worker undergoes AI-powered sobriety verification before starting work, ensuring safety and reliability.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover-elevate transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl">Fair Pricing</h3>
                <p className="text-muted-foreground">
                  Government-approved labor rates with transparent pricing. No hidden charges, just ₹10 platform fee.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover-elevate transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-chart-2/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-chart-2" />
                </div>
                <h3 className="font-display font-semibold text-xl">Real-Time Matching</h3>
                <p className="text-muted-foreground">
                  Post a job and get instant notifications to nearby skilled workers. First to accept gets the job!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground font-display font-bold text-2xl flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-display font-semibold text-xl">Post Your Job</h3>
              <p className="text-muted-foreground">
                Select the skills you need, quantity, and location. View transparent pricing based on government rates.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary text-secondary-foreground font-display font-bold text-2xl flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-display font-semibold text-xl">Workers Respond</h3>
              <p className="text-muted-foreground">
                Verified workers nearby receive instant notifications. First to accept undergoes AI safety check.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-chart-3 text-white font-display font-bold text-2xl flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-display font-semibold text-xl">Work Begins</h3>
              <p className="text-muted-foreground">
                Once verified fit for duty, the worker starts. Pay securely via UPI after completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-8">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-primary-foreground">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-primary-foreground/90">
            Join thousands of customers and workers using Kamgar Naka every day
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/get-started?role=customer">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" data-testid="button-cta-customer">
                I Need Workers
              </Button>
            </Link>
            <Link href="/auth/get-started?role=laborer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30" data-testid="button-cta-laborer">
                I'm Looking for Work
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-display font-bold text-primary">1000+</div>
              <p className="text-muted-foreground">Verified Workers</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-display font-bold text-primary">5000+</div>
              <p className="text-muted-foreground">Jobs Completed</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-display font-bold text-primary">4.8/5</div>
              <p className="text-muted-foreground">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
