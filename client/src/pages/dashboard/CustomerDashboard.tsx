import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { SkillBadge } from "@/components/SkillBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Minus, IndianRupee, Loader2, Briefcase, CheckCircle2, CreditCard, Upload, QrCode } from "lucide-react";
import { LABOR_RATES, type SkillType, type JobSkillRequirement, type Job } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { QRCodeSVG } from 'qrcode.react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const jobSchema = z.object({
  location: z.string().min(5, "Location is required"),
  skillRequirements: z.array(
    z.object({
      skill: z.string(),
      quantity: z.number().min(1),
      rate: z.number(),
    })
  ).min(1, "Add at least one skill requirement"),
});

const paymentSubmissionSchema = z.object({
  transactionNumber: z.string().optional(),
  paymentScreenshotUrl: z.string().optional(),
}).refine(
  (data) => data.transactionNumber || data.paymentScreenshotUrl,
  {
    message: "Please provide either a transaction number or upload a payment screenshot",
    path: ["transactionNumber"],
  }
);

type JobForm = z.infer<typeof jobSchema>;
type PaymentSubmissionForm = z.infer<typeof paymentSubmissionSchema>;

const skills: SkillType[] = ["mason", "carpenter", "plumber", "painter", "helper"];

interface Payment {
  id: string;
  amount: number;
  platformFee: number;
}

interface LaborerProfile {
  id: string;
  fullName: string;
  upiId: string;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [skillRequirements, setSkillRequirements] = useState<JobSkillRequirement[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState<Job | null>(null);
  const [paymentTab, setPaymentTab] = useState("qr-code");

  // Fetch customer's jobs
  const { data: customerJobs = [], refetch: refetchJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs/customer", user?.id],
    enabled: !!user?.id,
  });

  // Fetch customer's payments to calculate total spending
  const { data: customerPayments = [] } = useQuery<Payment[]>({
    queryKey: [`/api/payments/customer/${user?.id}`],
    enabled: !!user?.id,
  });

  // Calculate total spending
  const totalSpending = customerPayments.reduce((sum, payment) => sum + (payment.amount || 0) + (payment.platformFee || 0), 0);

  // Fetch laborer profile for payment (when dialog is open and job selected)
  const { data: laborerProfile } = useQuery<LaborerProfile>({
    queryKey: [`/api/laborer/profile/${selectedJobForPayment?.assignedLaborerId}`],
    enabled: !!selectedJobForPayment?.assignedLaborerId && paymentDialogOpen,
  });

  // Payment submission form
  const paymentForm = useForm<PaymentSubmissionForm>({
    resolver: zodResolver(paymentSubmissionSchema),
    defaultValues: {
      transactionNumber: "",
      paymentScreenshotUrl: "",
    },
  });

  // Submit payment mutation
  const submitPaymentMutation = useMutation({
    mutationFn: async (data: PaymentSubmissionForm & { jobId: string }) => {
      return apiRequest("POST", "/api/payments/submit", data);
    },
    onSuccess: () => {
      refetchJobs();
      queryClient.invalidateQueries({ queryKey: [`/api/payments/customer/${user?.id}`] });
      setPaymentDialogOpen(false);
      setSelectedJobForPayment(null);
      paymentForm.reset();
      toast({
        title: t("success"),
        description: "Payment submitted for admin approval",
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || "Payment submission failed",
        variant: "destructive",
      });
    },
  });

  const form = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      location: "",
      skillRequirements: [],
    },
  });

  const addSkillRequirement = () => {
    if (selectedSkill) {
      const exists = skillRequirements.find((req) => req.skill === selectedSkill);
      if (!exists) {
        const newReq: JobSkillRequirement = {
          skill: selectedSkill,
          quantity: 1,
          rate: LABOR_RATES[selectedSkill],
        };
        setSkillRequirements([...skillRequirements, newReq]);
        form.setValue("skillRequirements", [...skillRequirements, newReq]);
      }
      setSelectedSkill("");
    }
  };

  const updateQuantity = (skill: SkillType, delta: number) => {
    const updated = skillRequirements.map((req) => 
      req.skill === skill 
        ? { ...req, quantity: Math.max(1, req.quantity + delta) }
        : req
    );
    setSkillRequirements(updated);
    form.setValue("skillRequirements", updated);
  };

  const removeSkill = (skill: SkillType) => {
    const updated = skillRequirements.filter((req) => req.skill !== skill);
    setSkillRequirements(updated);
    form.setValue("skillRequirements", updated);
  };

  const totalAmount = skillRequirements.reduce(
    (sum, req) => sum + req.quantity * req.rate,
    0
  );
  const platformFee = 10;
  const finalAmount = totalAmount + platformFee;

  const onSubmit = async (data: JobForm) => {
    setIsSubmitting(true);
    
    try {
      if (!user) {
        throw new Error("User not found. Please sign in again.");
      }

      await apiRequest("POST", "/api/jobs", {
        customerId: user.id,
        location: data.location,
        skillsNeeded: skillRequirements,
        totalAmount: finalAmount - platformFee,
        platformFee,
      });

      // Success - reset form and refetch jobs
      setSkillRequirements([]);
      form.reset();
      refetchJobs();
      toast({
        title: t("success"),
        description: t("jobPostedSuccess"),
      });
    } catch (error: any) {
      console.error("Job posting error:", error);
      toast({
        title: t("error"),
        description: error.message || t("jobPostFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl sm:text-3xl">{t("customerDashboard")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t("postJobsHireWorkers")}</p>
          </div>

          {/* Spending Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="hover-elevate transition-all">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{t("totalSpending")}</p>
                    <div className="font-display font-bold text-xl sm:text-2xl" data-testid="text-total-spending">
                      ₹{totalSpending}
                    </div>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{t("totalJobs")}</p>
                    <div className="font-display font-bold text-xl sm:text-2xl" data-testid="text-total-jobs">
                      {customerJobs.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{t("completedJobs")}</p>
                    <div className="font-display font-bold text-xl sm:text-2xl" data-testid="text-completed-jobs">
                      {customerJobs.filter(j => j.status === "completed").length}
                    </div>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-chart-4/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Post Job Form */}
            <Card className="h-fit">
              <CardHeader className="space-y-1 pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                  {t("postNewJob")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t("selectSkillsGetMatches")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                    {/* Location */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">{t("workLocation")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("enterLocation")} className="h-10 sm:h-11 text-sm sm:text-base" data-testid="input-job-location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Skill Selection */}
                    <div className="space-y-3">
                      <FormLabel className="text-sm sm:text-base">{t("skillsNeeded")}</FormLabel>
                      <div className="flex gap-2">
                        <Select value={selectedSkill} onValueChange={(value) => setSelectedSkill(value as SkillType)}>
                          <SelectTrigger className="flex-1 h-10 sm:h-11 text-sm sm:text-base" data-testid="select-skill">
                            <SelectValue placeholder={t("selectSkill")} />
                          </SelectTrigger>
                          <SelectContent>
                            {skills.map((skill) => (
                              <SelectItem key={skill} value={skill}>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="capitalize text-sm sm:text-base">{t(skill)}</span>
                                  <span className="text-xs text-muted-foreground">₹{LABOR_RATES[skill]}/day</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          onClick={addSkillRequirement} 
                          disabled={!selectedSkill}
                          className="h-10 sm:h-11 text-sm sm:text-base"
                          data-testid="button-add-skill"
                        >
                          {t("addSkill")}
                        </Button>
                      </div>

                      {/* Selected Skills */}
                      {skillRequirements.length > 0 && (
                        <div className="space-y-2 mt-4">
                          {skillRequirements.map((req) => (
                            <div 
                              key={req.skill} 
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              data-testid={`skill-requirement-${req.skill}`}
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <SkillBadge skill={req.skill} />
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => updateQuantity(req.skill, -1)}
                                    data-testid={`button-decrease-${req.skill}`}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base" data-testid={`quantity-${req.skill}`}>
                                    {req.quantity}
                                  </span>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => updateQuantity(req.skill, 1)}
                                    data-testid={`button-increase-${req.skill}`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                <span className="text-xs sm:text-sm font-medium">₹{req.quantity * req.rate}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeSkill(req.skill)}
                                  className="text-xs sm:text-sm"
                                  data-testid={`button-remove-${req.skill}`}
                                >
                                  {t("remove")}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    {skillRequirements.length > 0 && (
                      <Card className="bg-muted/30">
                        <CardContent className="p-3 sm:p-4 space-y-2">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">{t("laborCost")}</span>
                            <span className="font-medium">₹{totalAmount}</span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">{t("platformFee")}</span>
                            <span className="font-medium">₹{platformFee}</span>
                          </div>
                          <div className="h-px bg-border my-2" />
                          <div className="flex justify-between">
                            <span className="font-semibold text-sm sm:text-base">{t("totalAmount")}</span>
                            <span className="font-bold text-base sm:text-lg" data-testid="text-total-amount">₹{finalAmount}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-10 sm:h-11 text-sm sm:text-base" 
                      disabled={isSubmitting || skillRequirements.length === 0}
                      data-testid="button-post-job"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("postJob")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Active Jobs */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="font-display font-semibold text-lg sm:text-xl mb-3 sm:mb-4">{t("activeJobs")}</h2>
                <div className="space-y-3">
                  {customerJobs.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 sm:p-8 text-center text-sm sm:text-base text-muted-foreground">
                        {t("noActiveJobs")}
                      </CardContent>
                    </Card>
                  ) : (
                    customerJobs.map((job) => {
                      const skills = (job.skillsNeeded as JobSkillRequirement[] | undefined)?.map((s) => s.skill) || [];
                      const totalWithFee = (job.totalAmount || 0) + (job.platformFee || 0);
                      
                      return (
                        <Card key={job.id} className="hover-elevate transition-all" data-testid={`job-card-${job.id}`}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                              <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {skills.map((skill: string) => (
                                    <SkillBadge key={skill} skill={skill as SkillType} data-testid={`badge-skill-${skill}`} />
                                  ))}
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{job.location}</p>
                              </div>
                              <StatusBadge status={job.status} />
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs sm:text-sm text-muted-foreground">{t("totalAmount")}</span>
                              <span className="font-semibold text-sm sm:text-base">₹{totalWithFee}</span>
                            </div>
                            {(job.status === "assigned" || job.status === "ready_for_review") && (
                              <Button 
                                size="sm" 
                                className="w-full text-xs sm:text-sm h-9 sm:h-10"
                                onClick={() => {
                                  setSelectedJobForPayment(job);
                                  setPaymentDialogOpen(true);
                                }}
                                data-testid={`button-pay-job-${job.id}`}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                {t("payNow")}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pay for Job</DialogTitle>
            <DialogDescription>
              Complete payment to release worker earnings
            </DialogDescription>
          </DialogHeader>
          
          {selectedJobForPayment && laborerProfile && (
            <Tabs value={paymentTab} onValueChange={setPaymentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr-code" data-testid="tab-qr-code">
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="submit-payment" data-testid="tab-submit-payment">
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Payment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qr-code" className="space-y-4 mt-4">
                {/* Job Details */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Job Details</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedJobForPayment.skillsNeeded as JobSkillRequirement[] | undefined)?.map((req) => (
                      <SkillBadge key={req.skill} skill={req.skill as SkillType} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedJobForPayment.location}</p>
                </div>

                {/* Payment Breakdown */}
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Labor Cost</span>
                    <span className="font-medium">₹{selectedJobForPayment.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee</span>
                    <span className="font-medium">₹{selectedJobForPayment.platformFee || 10}</span>
                  </div>
                  <div className="h-px bg-border my-2"></div>
                  <div className="flex justify-between font-semibold">
                    <span>Total to Pay</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {(selectedJobForPayment.totalAmount || 0) + (selectedJobForPayment.platformFee || 10)}
                    </span>
                  </div>
                </div>

                {/* QR Code Display */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Scan to Pay via UPI</h4>
                  <div className="flex flex-col items-center p-6 bg-white rounded-lg border">
                    <QRCodeSVG
                      value={`upi://pay?pa=${laborerProfile.upiId}&pn=${encodeURIComponent(laborerProfile.fullName)}&am=${(selectedJobForPayment.totalAmount || 0) + (selectedJobForPayment.platformFee || 10)}&cu=INR`}
                      size={200}
                      level="H"
                      data-testid="qr-code-payment"
                    />
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                      Pay to: {laborerProfile.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      UPI ID: {laborerProfile.upiId}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    After payment, switch to "Submit Payment" tab to enter transaction details
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="submit-payment" className="space-y-4 mt-4">
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit((data) => {
                    submitPaymentMutation.mutate({
                      ...data,
                      jobId: selectedJobForPayment.id,
                    });
                  })} className="space-y-4">
                    <FormField
                      control={paymentForm.control}
                      name="transactionNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction Number (UTR/UPI Ref)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter UPI transaction number" 
                              data-testid="input-transaction-number"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-center text-sm text-muted-foreground">OR</div>

                    <FormField
                      control={paymentForm.control}
                      name="paymentScreenshotUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Screenshot URL</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Paste screenshot URL or upload to cloud and paste link" 
                              className="min-h-20"
                              data-testid="input-screenshot-url"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPaymentDialogOpen(false);
                          setSelectedJobForPayment(null);
                          paymentForm.reset();
                        }}
                        className="flex-1"
                        data-testid="button-cancel-payment"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitPaymentMutation.isPending}
                        className="flex-1"
                        data-testid="button-submit-payment"
                      >
                        {submitPaymentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Submit for Approval
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          )}

          {selectedJobForPayment && !laborerProfile && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
