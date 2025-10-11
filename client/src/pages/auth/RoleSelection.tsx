import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Users, Briefcase, ArrowRight } from "lucide-react";

export default function RoleSelection() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-display font-bold text-3xl md:text-4xl">
              Get Started with Kamgar Naka
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose how you want to use the platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Card */}
            <Card className="border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer group" onClick={() => setLocation("/auth/signup?role=customer")}>
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display">I'm a Customer</CardTitle>
                <CardDescription className="text-base">
                  I need to hire skilled workers for my project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">Post jobs and hire instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">Get AI-verified workers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">Transparent government-approved rates</span>
                  </li>
                </ul>
                <Button className="w-full group-hover:shadow-md transition-shadow" data-testid="button-customer-role">
                  Continue as Customer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Laborer Card */}
            <Card className="border-2 hover:border-secondary hover:shadow-lg transition-all cursor-pointer group" onClick={() => setLocation("/auth/signup?role=laborer")}>
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-secondary/20 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl font-display">I'm a Worker</CardTitle>
                <CardDescription className="text-base">
                  I'm a skilled laborer looking for work opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">Get instant job notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">Earn fair daily wages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">Direct UPI payments</span>
                  </li>
                </ul>
                <Button variant="secondary" className="w-full group-hover:shadow-md transition-shadow" data-testid="button-laborer-role">
                  Continue as Worker
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/signin">
                <a className="text-primary hover:underline font-medium">Sign in here</a>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
