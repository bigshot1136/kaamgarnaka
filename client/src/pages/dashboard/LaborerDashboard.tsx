import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { SkillBadge } from "@/components/SkillBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { 
  IndianRupee, 
  Briefcase, 
  Star, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  Bell
} from "lucide-react";
import type { SkillType } from "@shared/schema";

export default function LaborerDashboard() {
  const [hasNewJobRequest, setHasNewJobRequest] = useState(true);

  // Mock data
  const mockProfile = {
    totalEarnings: 8500,
    completedJobs: 12,
    rating: 5,
    skills: ["mason", "helper"] as SkillType[],
    isVerified: true,
    availabilityStatus: "available",
  };

  const mockJobRequest = {
    id: "req-1",
    customerName: "Rajesh Kumar",
    location: "Andheri, Mumbai",
    skills: ["mason"],
    quantity: 1,
    amount: 710,
    timeLeft: 45, // seconds
  };

  const mockCompletedJobs = [
    { id: "1", skill: "mason", location: "Mumbai", amount: 710, date: "2024-01-10" },
    { id: "2", skill: "helper", location: "Pune", amount: 410, date: "2024-01-09" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-3xl">Worker Dashboard</h1>
              <p className="text-muted-foreground">Manage your jobs and earnings</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={mockProfile.availabilityStatus} />
              {mockProfile.isVerified && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-chart-3/20 text-chart-3 rounded-md text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                    <div className="font-display font-bold text-2xl flex items-center" data-testid="text-total-earnings">
                      <IndianRupee className="h-5 w-5" />
                      {mockProfile.totalEarnings.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Jobs Completed</p>
                    <div className="font-display font-bold text-2xl" data-testid="text-completed-jobs">
                      {mockProfile.completedJobs}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rating</p>
                    <div className="font-display font-bold text-2xl flex items-center gap-1">
                      {mockProfile.rating}.0
                      <Star className="h-5 w-5 text-chart-4 fill-chart-4" />
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-chart-4/20 flex items-center justify-center">
                    <Star className="h-6 w-6 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Job Request Notification */}
            {hasNewJobRequest && (
              <Card className="border-2 border-secondary shadow-lg" data-testid="card-job-request">
                <CardHeader className="bg-secondary/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 animate-pulse text-secondary" />
                      New Job Request!
                    </CardTitle>
                    <div className="flex items-center gap-1 px-3 py-1 bg-chart-4/20 text-chart-4 rounded-md text-sm font-medium">
                      <Clock className="h-3 w-3" />
                      {mockJobRequest.timeLeft}s left
                    </div>
                  </div>
                  <CardDescription>
                    First to accept gets the job
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Customer</span>
                      <span className="font-medium">{mockJobRequest.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Location</span>
                      <span className="font-medium">{mockJobRequest.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Skills Needed</span>
                      <div className="flex gap-2">
                        {mockJobRequest.skills.map((skill) => (
                          <SkillBadge key={skill} skill={skill as SkillType} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Your Earnings</span>
                      <span className="font-bold text-lg">₹{mockJobRequest.amount}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="secondary" 
                      className="flex-1" 
                      onClick={() => setHasNewJobRequest(false)}
                      data-testid="button-accept-job"
                    >
                      Accept Job
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setHasNewJobRequest(false)}
                      data-testid="button-decline-job"
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Earnings & Withdrawal */}
            <Card>
              <CardHeader>
                <CardTitle>Earnings & Withdrawal</CardTitle>
                <CardDescription>
                  Your payment information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-chart-3/10 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Available Balance</span>
                    <span className="font-display font-bold text-xl flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {mockProfile.totalEarnings}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">UPI ID</span>
                    <span className="font-mono text-sm">9876543210@paytm</span>
                  </div>
                </div>

                <Button className="w-full" data-testid="button-withdraw">
                  <IndianRupee className="mr-2 h-4 w-4" />
                  Withdraw to UPI
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Platform fee: ₹10 per job • Instant UPI transfer
                </p>
              </CardContent>
            </Card>

            {/* Skills & Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Your Skills</CardTitle>
                <CardDescription>
                  You'll receive job requests for these skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {mockProfile.skills.map((skill) => (
                    <SkillBadge key={skill} skill={skill} />
                  ))}
                </div>
                <Button variant="outline" className="w-full" data-testid="button-edit-skills">
                  Edit Skills
                </Button>
              </CardContent>
            </Card>

            {/* Job History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>
                  Your completed work history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCompletedJobs.map((job) => (
                    <div 
                      key={job.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`job-history-${job.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <SkillBadge skill={job.skill as SkillType} />
                        <div>
                          <p className="text-sm font-medium">{job.location}</p>
                          <p className="text-xs text-muted-foreground">{job.date}</p>
                        </div>
                      </div>
                      <span className="font-semibold">₹{job.amount}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
