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
import { Navbar } from "@/components/Navbar";
import { SkillBadge } from "@/components/SkillBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Minus, IndianRupee, Loader2, Briefcase } from "lucide-react";
import { LABOR_RATES, type SkillType, type JobSkillRequirement } from "@shared/schema";

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

type JobForm = z.infer<typeof jobSchema>;

const skills: SkillType[] = ["mason", "carpenter", "plumber", "painter", "helper"];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [skillRequirements, setSkillRequirements] = useState<JobSkillRequirement[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch customer's jobs
  const { data: customerJobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ["/api/jobs/customer", user?.id],
    enabled: !!user?.id,
  });

  // Fetch customer's payments to calculate total spending
  const { data: customerPayments = [] } = useQuery<any[]>({
    queryKey: [`/api/payments/customer/${user?.id}`],
    enabled: !!user?.id,
  });

  // Calculate total spending
  const totalSpending = customerPayments.reduce((sum, payment) => sum + (payment.amount || 0) + (payment.platformFee || 0), 0);

  // Mark job as complete mutation
  const completeJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest(`/api/jobs/${jobId}/complete`, {
        method: "POST",
        body: JSON.stringify({ customerId: user?.id }),
      });
    },
    onSuccess: () => {
      refetchJobs();
      alert("Job marked as complete! Payment has been processed.");
    },
    onError: (error: any) => {
      alert(error.message || "Failed to complete job");
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

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user.id,
          location: data.location,
          skillsNeeded: skillRequirements,
          totalAmount: finalAmount - platformFee,
          platformFee,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Job posting failed");
      }

      // Success - reset form and refetch jobs
      setSkillRequirements([]);
      form.reset();
      refetchJobs();
      alert("Job posted successfully! Notifying nearby workers...");
    } catch (error: any) {
      console.error("Job posting error:", error);
      alert(error.message || "Failed to post job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-display font-bold text-3xl">Customer Dashboard</h1>
            <p className="text-muted-foreground">Post jobs and hire skilled workers</p>
          </div>

          {/* Spending Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Spending</p>
                    <div className="font-display font-bold text-2xl" data-testid="text-total-spending">
                      ₹{totalSpending}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Jobs</p>
                    <div className="font-display font-bold text-2xl" data-testid="text-total-jobs">
                      {customerJobs.length}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completed Jobs</p>
                    <div className="font-display font-bold text-2xl" data-testid="text-completed-jobs">
                      {customerJobs.filter(j => j.status === "completed").length}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-chart-4/20 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Post Job Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Post New Job
                </CardTitle>
                <CardDescription>
                  Select skills needed and get instant matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Location */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Andheri, Mumbai" data-testid="input-job-location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Skill Selection */}
                    <div className="space-y-3">
                      <FormLabel>Skills Needed</FormLabel>
                      <div className="flex gap-2">
                        <Select value={selectedSkill} onValueChange={(value) => setSelectedSkill(value as SkillType)}>
                          <SelectTrigger className="flex-1" data-testid="select-skill">
                            <SelectValue placeholder="Select a skill" />
                          </SelectTrigger>
                          <SelectContent>
                            {skills.map((skill) => (
                              <SelectItem key={skill} value={skill}>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="capitalize">{skill}</span>
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
                          data-testid="button-add-skill"
                        >
                          Add
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
                              <div className="flex items-center gap-3">
                                <SkillBadge skill={req.skill} />
                                <div className="flex items-center gap-2">
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
                                  <span className="w-8 text-center font-medium" data-testid={`quantity-${req.skill}`}>
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
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">₹{req.quantity * req.rate}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeSkill(req.skill)}
                                  data-testid={`button-remove-${req.skill}`}
                                >
                                  Remove
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
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Labor Cost</span>
                            <span className="font-medium">₹{totalAmount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Platform Fee</span>
                            <span className="font-medium">₹{platformFee}</span>
                          </div>
                          <div className="h-px bg-border my-2" />
                          <div className="flex justify-between">
                            <span className="font-semibold">Total Amount</span>
                            <span className="font-bold text-lg" data-testid="text-total-amount">₹{finalAmount}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || skillRequirements.length === 0}
                      data-testid="button-post-job"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post Job
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Active Jobs */}
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-semibold text-xl mb-4">Active Jobs</h2>
                <div className="space-y-3">
                  {customerJobs.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        No active jobs. Post your first job to get started!
                      </CardContent>
                    </Card>
                  ) : (
                    customerJobs.map((job: any) => {
                      const skills = job.skillsNeeded?.map((s: any) => s.skill) || [];
                      const totalWithFee = (job.totalAmount || 0) + (job.platformFee || 0);
                      
                      return (
                        <Card key={job.id} className="hover-elevate transition-all" data-testid={`job-card-${job.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {skills.map((skill: string) => (
                                    <SkillBadge key={skill} skill={skill as SkillType} data-testid={`badge-skill-${skill}`} />
                                  ))}
                                </div>
                                <p className="text-sm text-muted-foreground">{job.location}</p>
                              </div>
                              <StatusBadge status={job.status} />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Total Amount</span>
                              <span className="font-semibold">₹{totalWithFee}</span>
                            </div>
                            {job.status === "assigned" && (
                              <Button 
                                size="sm" 
                                className="w-full mt-3"
                                onClick={() => completeJobMutation.mutate(job.id)}
                                disabled={completeJobMutation.isPending}
                                data-testid={`button-complete-job-${job.id}`}
                              >
                                {completeJobMutation.isPending ? "Processing..." : "Mark as Complete"}
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
    </div>
  );
}
