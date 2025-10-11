import { useState } from "react";
import { useLocation } from "wouter";
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
    // Will be connected to backend in Task 3
    console.log(data);
    
    setTimeout(() => {
      setLocation("/dashboard/laborer");
    }, 1000);
  };

  const selectedSkills = form.watch("skills");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="font-display font-bold text-3xl">Complete Your Profile</h1>
            <p className="text-muted-foreground">
              Provide your skills and verification details to start receiving job offers
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Worker Information</CardTitle>
              <CardDescription>
                This information helps us match you with the right jobs
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
                        <FormLabel className="text-base">Your Skills</FormLabel>
                        <FormDescription>
                          Select all skills you have (you'll only get matching job requests)
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
                                      ₹{LABOR_RATES[skill]}/day
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
                        <FormLabel>UPI ID</FormLabel>
                        <FormDescription>
                          Your UPI ID for receiving payments (e.g., 9876543210@paytm)
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="yourname@upi" data-testid="input-upi" {...field} />
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
                        <FormLabel>Aadhaar Number</FormLabel>
                        <FormDescription>
                          For identity verification (12 digits)
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="123456789012" data-testid="input-aadhaar" {...field} />
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
                        <FormLabel>Address Proof (Optional)</FormLabel>
                        <FormDescription>
                          Upload Aadhaar card, voter ID, or any government ID
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
                    Complete Profile
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
