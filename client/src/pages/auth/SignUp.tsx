import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Link } from "wouter";
import { Loader2, Mail, Lock, User, Phone, MapPin, Briefcase, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().regex(/^[0-9]{10}$/, "Invalid phone number (10 digits)"),
  address: z.string().min(5, "Address is required"),
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const role = params.get("role") || "customer";
  const { t } = useLanguage();
  const { toast } = useToast();

  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Signup failed");
      }

      const user = await response.json();
      
      // Update auth context (this also stores in localStorage)
      setUser(user);

      if (role === "laborer") {
        setLocation("/profile/laborer-setup");
      } else {
        setLocation("/dashboard/customer");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: t("error"),
        description: error.message || t("signupFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roleIcon = role === "customer" ? <Briefcase className="h-6 w-6 text-primary" /> : <Users className="h-6 w-6 text-secondary" />;
  const roleColor = role === "customer" ? "primary" : "secondary";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-muted/20 to-background">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <Card className="w-full max-w-lg border-2 shadow-xl">
          <CardHeader className="space-y-3 text-center pb-8">
            <div className={`w-16 h-16 rounded-2xl bg-${roleColor}/20 flex items-center justify-center mx-auto shadow-lg`}>
              {roleIcon}
            </div>
            <CardTitle className="text-2xl md:text-3xl font-display">{t("createAccount")}</CardTitle>
            <CardDescription className="text-base">
              {t("signUpAs")} {role === "customer" ? t("customer") : t("laborer")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fullName")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder={t("enterFullName")} className="pl-10" data-testid="input-fullname" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input type="email" placeholder={t("enterEmail")} className="pl-10" data-testid="input-email" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("phoneNumber")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder={t("enterPhone")} className="pl-10" data-testid="input-phone" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("password")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input type="password" placeholder={t("enterPassword")} className="pl-10" data-testid="input-password" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("address")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder={t("enterAddress")} className="pl-10" data-testid="input-address" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading} size="lg" data-testid="button-signup-submit">
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {t("createAccount")}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm md:text-base">
              <p className="text-muted-foreground">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/auth/signin">
                  <a className="text-primary hover:underline font-semibold" data-testid="link-signin">
                    {t("signIn")}
                  </a>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
