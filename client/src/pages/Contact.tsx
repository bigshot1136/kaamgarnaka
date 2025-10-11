import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="font-display font-bold text-4xl md:text-5xl">
              {t("contactUs")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("contactSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-2">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t("email")}</CardTitle>
                <CardDescription>{t("sendEmailAnytime")}</CardDescription>
              </CardHeader>
              <CardContent>
                <a href="mailto:support@kamgarnaka.in" className="text-primary hover:underline">
                  support@kamgarnaka.in
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-2">
                  <Phone className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>{t("phone")}</CardTitle>
                <CardDescription>{t("callUsHours")}</CardDescription>
              </CardHeader>
              <CardContent>
                <a href="tel:+919876543210" className="text-primary hover:underline">
                  +91 98765 43210
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center mb-2">
                  <MapPin className="h-6 w-6 text-chart-3" />
                </div>
                <CardTitle>{t("office")}</CardTitle>
                <CardDescription>{t("visitOffice")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  123 Business Park<br />
                  Andheri East, Mumbai<br />
                  Maharashtra 400069
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
