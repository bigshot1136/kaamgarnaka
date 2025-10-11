import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ShieldCheck, 
  IndianRupee, 
  Zap, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Clock,
  Star
} from "lucide-react";

export default function LandingPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyODI4MjgiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTItMnYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0tNCAwaC0ydjJoMnYtMnptLTQgMGgtMnYyaDJ2LTJ6bS00IDBoLTJ2Mmgydi0yem0tNCAwdi0yaDJ2LTJoLTJ2Mmgtdi0yaC0ydjJoMnYyaDJ6bTQgMGgtMnYyaDJ2LTJ6bTQgMGgtMnYyaDJ2LTJ6bTQgMGgtMnYyaDJ2LTJ6bTQgMGgtMnYyaDJ2LTJ6bTQgMGgtMnYyaDJ2LTJ6bTAgNHYtMmgydi0yaC0ydjJoLTJ2Mmgyem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0tMiAydi0yaC0ydjJoMnptLTQgMGgtMnYyaDJ2LTJ6bS00IDBoLTJ2Mmgydi0yem0tNCAwdi0yaC0ydjJoMnptLTQgMGgtMnYyaDJ2LTJ6bTAgNHYtMmgtMnYyaDJ6bTAgNGgtMnYyaDJ2LTJ6bTAgNGgtMnYyaDJ2LTJ6bTAgNGgtMnYyaDJ2LTJ6bTAgNHYtMmgtMnYyaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Star className="h-4 w-4 fill-current" />
                {t("trusted")}
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
                {t("heroTitle")}{" "}
                <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  {t("heroTitleHighlight")}
                </span>
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                {t("heroSubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link href="/auth/get-started?role=customer">
                  <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow" data-testid="button-hero-hire">
                    {t("hireWorkers")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/get-started?role=laborer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-hero-find-work">
                    {t("findWork")}
                  </Button>
                </Link>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-chart-3" />
                  <span>{t("aiVerified")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-5 w-5 text-chart-3" />
                  <span>{t("instantMatch")}</span>
                </div>
              </div>
            </div>
            
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop" 
                alt="Construction workers" 
                className="relative rounded-2xl md:rounded-3xl shadow-2xl object-cover w-full h-64 sm:h-80 md:h-96 lg:h-[500px]"
              />
              
              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 -left-4 sm:left-4 bg-card border shadow-xl rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-chart-3/20 flex items-center justify-center">
                    <Users className="h-6 w-6 sm:h-8 sm:h-8 text-chart-3" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-display font-bold">1000+</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{t("verifiedWorkers")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl mb-3 md:mb-4">
              {t("whyChoose")}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("whyChooseSubtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="border-2 hover-elevate transition-all group">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-chart-3/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-7 w-7 text-chart-3" />
                </div>
                <h3 className="font-display font-semibold text-lg md:text-xl">{t("aiSafetyTitle")}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {t("aiSafetyDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover-elevate transition-all group">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <IndianRupee className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg md:text-xl">{t("fairPricingTitle")}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {t("fairPricingDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover-elevate transition-all group sm:col-span-2 lg:col-span-1">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="font-display font-semibold text-lg md:text-xl">{t("realTimeTitle")}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {t("realTimeDesc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl mb-3 md:mb-4">
              {t("howItWorksTitle")}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("howItWorksSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center space-y-4 group">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground font-display font-bold text-3xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform">
                  1
                </div>
                <div className="hidden md:block absolute -right-16 top-1/2 -translate-y-1/2 text-primary/30">
                  <ArrowRight className="h-8 w-8" />
                </div>
              </div>
              <h3 className="font-display font-semibold text-lg md:text-xl">{t("step1Title")}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {t("step1Desc")}
              </p>
            </div>

            <div className="text-center space-y-4 group">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-secondary text-secondary-foreground font-display font-bold text-3xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform">
                  2
                </div>
                <div className="hidden md:block absolute -right-16 top-1/2 -translate-y-1/2 text-secondary/30">
                  <ArrowRight className="h-8 w-8" />
                </div>
              </div>
              <h3 className="font-display font-semibold text-lg md:text-xl">{t("step2Title")}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {t("step2Desc")}
              </p>
            </div>

            <div className="text-center space-y-4 group">
              <div className="w-20 h-20 rounded-full bg-chart-3 text-white font-display font-bold text-3xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="font-display font-semibold text-lg md:text-xl">{t("step3Title")}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {t("step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary via-primary to-secondary overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkZGRkYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTItMnYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0tNCAwaC0ydjJoMnYtMnptLTQgMGgtMnYyaDJ2LTJ6bS00IDBoLTJ2Mmgydi0yem0tNCAwdi0yaDJ2LTJoLTJ2Mmgtdi0yaC0ydjJoMnYyaDJ6bTQgMGgtMnYyaDJ2LTJ6bTQgMGgtMnYyaDJ2LTJ6bTQgMGgtMnYyaDJ2LTJ6bTQgMGgtMnYyaDJ2LTJ6bTQgMGgtMnYyaDJ2LTJ6bTAgNHYtMmgydi0yaC0ydjJoLTJ2Mmgyem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0tMiAydi0yaC0ydjJoMnptLTQgMGgtMnYyaDJ2LTJ6bS00IDBoLTJ2Mmgydi0yem0tNCAwdi0yaC0ydjJoMnptLTQgMGgtMnYyaDJ2LTJ6bTAgNHYtMmgtMnYyaDJ6bTAgNGgtMnYyaDJ2LTJ6bTAgNGgtMnYyaDJ2LTJ6bTAgNGgtMnYyaDJ2LTJ6bTAgNHYtMmgtMnYyaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-6 md:space-y-8 relative">
          <h2 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl text-primary-foreground">
            {t("ctaTitle")}
          </h2>
          <p className="text-base md:text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            {t("ctaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
            <Link href="/auth/get-started?role=customer">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto shadow-xl hover:shadow-2xl" data-testid="button-cta-customer">
                {t("iNeedWorkers")}
              </Button>
            </Link>
            <Link href="/auth/get-started?role=laborer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm" data-testid="button-cta-laborer">
                {t("imLookingForWork")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 md:py-16 bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 gap-6 md:gap-8">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary">1000+</div>
              <p className="text-xs md:text-sm lg:text-base text-muted-foreground">{t("verifiedWorkers")}</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary">5000+</div>
              <p className="text-xs md:text-sm lg:text-base text-muted-foreground">{t("jobsCompleted")}</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary">4.8/5</div>
              <p className="text-xs md:text-sm lg:text-base text-muted-foreground">{t("averageRating")}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
