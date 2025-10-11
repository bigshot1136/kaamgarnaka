import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Users, Briefcase, ArrowRight, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RoleSelection() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-muted/20 to-background">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-5xl space-y-10 md:space-y-12">
          <div className="text-center space-y-3 md:space-y-4">
            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t("getStartedWith")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("chooseHowToUse")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Customer Card */}
            <Card className="border-2 hover-elevate hover:border-primary transition-all cursor-pointer group relative overflow-hidden" onClick={() => setLocation("/auth/signup?role=customer")} data-testid="card-customer-role">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Briefcase className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-display">{t("imCustomer")}</CardTitle>
                <CardDescription className="text-base md:text-lg">
                  {t("needHireWorkers")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-chart-3 mt-0.5 shrink-0" />
                    <span className="text-sm md:text-base text-muted-foreground">{t("postJobsHire")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-chart-3 mt-0.5 shrink-0" />
                    <span className="text-sm md:text-base text-muted-foreground">{t("getAIVerified")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-chart-3 mt-0.5 shrink-0" />
                    <span className="text-sm md:text-base text-muted-foreground">{t("transparentRates")}</span>
                  </li>
                </ul>
                <Button className="w-full group-hover:shadow-lg transition-shadow" size="lg" data-testid="button-customer-role">
                  {t("continueAsCustomer")}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* Laborer Card */}
            <Card className="border-2 hover-elevate hover:border-secondary transition-all cursor-pointer group relative overflow-hidden" onClick={() => setLocation("/auth/signup?role=laborer")} data-testid="card-laborer-role">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 rounded-2xl bg-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Users className="h-10 w-10 text-secondary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-display">{t("imWorker")}</CardTitle>
                <CardDescription className="text-base md:text-lg">
                  {t("lookingForWork")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-chart-3 mt-0.5 shrink-0" />
                    <span className="text-sm md:text-base text-muted-foreground">{t("instantJobNotifications")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-chart-3 mt-0.5 shrink-0" />
                    <span className="text-sm md:text-base text-muted-foreground">{t("earnFairWages")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-chart-3 mt-0.5 shrink-0" />
                    <span className="text-sm md:text-base text-muted-foreground">{t("directUPIPayments")}</span>
                  </li>
                </ul>
                <Button variant="secondary" className="w-full group-hover:shadow-lg transition-shadow" size="lg" data-testid="button-laborer-role">
                  {t("continueAsWorker")}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm md:text-base text-muted-foreground">
              {t("alreadyHaveAccount")}{" "}
              <Link href="/auth/signin">
                <a className="text-primary hover:underline font-semibold" data-testid="link-signin">
                  {t("signInHere")}
                </a>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
