import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Navbar } from "@/components/Navbar";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { SkillBadge } from "@/components/SkillBadge";
import { LABOR_RATES, type SkillType } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const laborerSetupSchema = z.object({
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  upiId: z.string().min(5, "UPI ID is required (e.g., yourname@upi)"),
  aadhaarNumber: z.string().regex(/^[0-9]{12}$/, "Aadhaar must be 12 digits"),
  addressProof: z.instanceof(FileList).optional(),
});

type LaborerSetupForm = z.infer<typeof laborerSetupSchema>;

const skills: SkillType[] = ["mason", "carpenter", "plumber", "painter", "helper"];

export default function LaborerSetup() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const form = useForm<LaborerSetupForm>({
    resolver: zodResolver(laborerSetupSchema),
    defaultValues: {
      skills: [],
      upiId: "",
      aadhaarNumber: "",
    },
  });

  const onSubmit = async (data: LaborerSetupForm) => {
    setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error(t("userNotFound"));
      }

      // Upload address proof to object storage if provided
      let addressProofUrl = undefined;
      if (uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        
        try {
          const uploadResult: any = await apiRequest("POST", "/api/upload/address-proof", formData);
          addressProofUrl = uploadResult.url;
        } catch (uploadError) {
          throw new Error(t("uploadFailed"));
        }
      }

      await apiRequest("POST", "/api/laborer/profile", {
        userId: user.id,
        skills: data.skills,
        upiId: data.upiId,
        aadhaarNumber: data.aadhaarNumber,
        addressProofUrl,
      });

      toast({
        title: t("success"),
        description: t("profileCreatedSuccess"),
      });
      
      setLocation("/dashboard/laborer");
    } catch (error: any) {
      console.error("Profile setup error:", error);
      toast({
        title: t("error"),
        description: error.message || t("profileSetupFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSkills = form.watch("skills");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="font-display font-bold text-3xl">{t("completeYourProfile")}</h1>
            <p className="text-muted-foreground">
              {t("provideSkillsVerification")}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("workerInformation")}</CardTitle>
              <CardDescription>
                {t("helpsMatchJobs")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Skills Selection */}
                  <FormField
                    control={form.control}
                    name="skills"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-base">{t("yourSkills")}</FormLabel>
                        <FormDescription>
                          {t("selectAllSkills")}
                        </FormDescription>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          {skills.map((skill) => (
                            <FormField
                              key={skill}
                              control={form.control}
                              name="skills"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(skill)}
                                      onCheckedChange={(checked) => {
                                        const value = checked
                                          ? [...field.value, skill]
                                          : field.value?.filter((s) => s !== skill);
                                        field.onChange(value);
                                      }}
                                      data-testid={`checkbox-skill-${skill}`}
                                    />
                                  </FormControl>
                                  <div className="flex flex-col gap-1">
                                    <SkillBadge skill={skill} />
                                    <span className="text-xs text-muted-foreground">
                                      ₹{LABOR_RATES[skill]}{t("perDay")}
                                    </span>
                                  </div>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* UPI ID */}
                  <FormField
                    control={form.control}
                    name="upiId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("upiIdLabel")}</FormLabel>
                        <FormDescription>
                          {t("upiIdDescription")}
                        </FormDescription>
                        <FormControl>
                          <Input placeholder={t("upiIdPlaceholder")} data-testid="input-upi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Aadhaar Number */}
                  <FormField
                    control={form.control}
                    name="aadhaarNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("aadhaarNumberLabel")}</FormLabel>
                        <FormDescription>
                          {t("aadhaarDescription")}
                        </FormDescription>
                        <FormControl>
                          <Input placeholder={t("aadhaarPlaceholder")} data-testid="input-aadhaar" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address Proof Upload */}
                  <FormField
                    control={form.control}
                    name="addressProof"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>{t("addressProofLabel")}</FormLabel>
                        <FormDescription>
                          {t("addressProofDescription")}
                        </FormDescription>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                onChange(e.target.files);
                                setUploadedFile(e.target.files?.[0] || null);
                              }}
                              data-testid="input-address-proof"
                              {...field}
                            />
                            {uploadedFile && (
                              <div className="flex items-center gap-2 text-sm text-chart-3">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>{uploadedFile.name}</span>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-complete-profile">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("completeProfile")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
