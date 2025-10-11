import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, Target, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="font-display font-bold text-4xl md:text-5xl">
              About Kamgar Naka
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connecting India's skilled workforce with opportunities through technology, safety, and transparency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl">Our Mission</h3>
                <p className="text-muted-foreground">
                  To empower India's skilled laborers by providing fair, safe, and instant job opportunities while ensuring customers get reliable, verified workers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-chart-3" />
                </div>
                <h3 className="font-display font-semibold text-xl">Our Values</h3>
                <p className="text-muted-foreground">
                  Safety first, transparent pricing, fair wages, and dignity for all workers. We believe in building trust through technology and verified quality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-display font-semibold text-xl">Safety First</h3>
                <p className="text-muted-foreground">
                  Our AI-powered sobriety checks ensure every worker is fit for duty, providing peace of mind for both customers and workers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-chart-4/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-chart-4" />
                </div>
                <h3 className="font-display font-semibold text-xl">Community Driven</h3>
                <p className="text-muted-foreground">
                  Built for workers, by people who care. We listen to our community and continuously improve based on real feedback and needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
