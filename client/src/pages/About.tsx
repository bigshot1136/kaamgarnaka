import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, Target, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="font-display font-bold text-4xl md:text-5xl">
              {t("aboutKamgarNaka")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("aboutSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl">{t("ourMission")}</h3>
                <p className="text-muted-foreground">
                  {t("ourMissionText")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-chart-3" />
                </div>
                <h3 className="font-display font-semibold text-xl">{t("ourValues")}</h3>
                <p className="text-muted-foreground">
                  {t("ourValuesText")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-display font-semibold text-xl">{t("safetyFirst")}</h3>
                <p className="text-muted-foreground">
                  {t("safetyFirstText")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-chart-4/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-chart-4" />
                </div>
                <h3 className="font-display font-semibold text-xl">{t("communityDriven")}</h3>
                <p className="text-muted-foreground">
                  {t("communityDrivenText")}
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
