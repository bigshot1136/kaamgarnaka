import { useState } from "react";
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
  const [skillRequirements, setSkillRequirements] = useState<JobSkillRequirement[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // Will be connected to backend in Task 3
    console.log(data);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setSkillRequirements([]);
      form.reset();
    }, 1000);
  };

  // Mock active jobs
  const mockJobs = [
    { id: "1", status: "pending", skills: ["mason"], location: "Mumbai", amount: 710 },
    { id: "2", status: "in_progress", skills: ["carpenter"], location: "Pune", amount: 660 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-3xl">Customer Dashboard</h1>
              <p className="text-muted-foreground">Post jobs and hire skilled workers</p>
            </div>
            <div className="flex items-center gap-4">
              <Card className="px-6 py-3">
                <div className="text-sm text-muted-foreground">Total Spent</div>
                <div className="font-display font-bold text-2xl flex items-center">
                  <IndianRupee className="h-5 w-5" />
                  5,280
                </div>
              </Card>
            </div>
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
                  {mockJobs.map((job) => (
                    <Card key={job.id} className="hover-elevate transition-all" data-testid={`job-card-${job.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {job.skills.map((skill) => (
                                <SkillBadge key={skill} skill={skill as SkillType} />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">{job.location}</p>
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Amount</span>
                          <span className="font-semibold">₹{job.amount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
