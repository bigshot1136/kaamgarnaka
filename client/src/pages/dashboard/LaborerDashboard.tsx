import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useWebSocket } from "@/hooks/useWebSocket";
import { SkillBadge } from "@/components/SkillBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [hasNewJobRequest, setHasNewJobRequest] = useState(false);
  const [currentJobRequest, setCurrentJobRequest] = useState<any>(null);

  // Fetch laborer profile from database
  const { data: laborerProfile, isError: profileError, error: profileFetchError } = useQuery<any>({
    queryKey: [`/api/laborer/profile/${user?.id}`],
    enabled: !!user?.id && user?.role === "laborer",
    retry: false, // Don't retry on 404
  });

  // Redirect to profile setup if profile doesn't exist
  useEffect(() => {
    if (profileError && profileFetchError) {
      const error = profileFetchError as any;
      if (error?.message?.includes('Profile not found') || error?.message?.includes('404')) {
        setLocation("/profile/laborer-setup");
      }
    }
  }, [profileError, profileFetchError, setLocation]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribe((data) => {
      if (data.type === "new_job") {
        console.log("Received new job notification:", data.job);
        setCurrentJobRequest(data.job);
        setHasNewJobRequest(true);
        // Auto-dismiss after 60 seconds
        setTimeout(() => {
          setHasNewJobRequest(false);
          setCurrentJobRequest(null);
        }, 60000);
      }
    });

    return unsubscribe;
  }, [subscribe, user]);

  // Accept job mutation
  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", `/api/jobs/${jobId}/accept`, { laborerId: user?.id });
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/available/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/laborer/${user?.id}?status=assigned`] });
      
      toast({
        title: t("success"),
        description: t("jobAcceptedSuccess"),
      });
      setHasNewJobRequest(false);
      setCurrentJobRequest(null);
      setLocation("/sobriety-check");
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("jobAcceptedError"),
        variant: "destructive",
      });
      setHasNewJobRequest(false);
      setCurrentJobRequest(null);
    },
  });

  const handleAcceptJob = async () => {
    if (!currentJobRequest || !user) return;
    acceptJobMutation.mutate(currentJobRequest.id);
  };

  const handleDeclineJob = () => {
    setHasNewJobRequest(false);
    setCurrentJobRequest(null);
  };

  // Mark job as ready for review mutation
  const markReadyMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", `/api/jobs/${jobId}/ready-for-review`, { laborerId: user?.id });
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/laborer/${user?.id}?status=assigned`] });
      
      toast({
        title: t("success"),
        description: t("jobMarkedForReview"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("jobMarkFailed"),
        variant: "destructive",
      });
    },
  });

  // Fetch available jobs (pending jobs matching laborer's skills)
  const { data: availableJobs = [] } = useQuery<any[]>({
    queryKey: [`/api/jobs/available/${user?.id}`],
    enabled: !!user?.id && user?.role === "laborer" && !!laborerProfile,
    refetchInterval: 5000, // Poll every 5 seconds for new jobs
  });

  // Fetch laborer's assigned jobs (active)
  const { data: assignedJobs = [] } = useQuery<any[]>({
    queryKey: [`/api/jobs/laborer/${user?.id}?status=assigned`],
    enabled: !!user?.id && user?.role === "laborer",
  });

  // Fetch laborer's completed jobs
  const { data: completedJobs = [] } = useQuery<any[]>({
    queryKey: [`/api/jobs/laborer/${user?.id}?status=completed`],
    enabled: !!user?.id && user?.role === "laborer",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-3xl" data-testid="heading-worker-dashboard">{t("workerDashboard")}</h1>
              <p className="text-muted-foreground">{t("manageJobsEarnings")}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={laborerProfile?.availabilityStatus || "available"} />
              {laborerProfile?.isVerified && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-chart-3/20 text-chart-3 rounded-md text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("verified")}
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
                    <p className="text-sm text-muted-foreground mb-1">{t("totalEarnings")}</p>
                    <div className="font-display font-bold text-2xl flex items-center" data-testid="text-total-earnings">
                      <IndianRupee className="h-5 w-5" />
                      {(laborerProfile?.totalEarnings || 0).toLocaleString()}
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
                    <p className="text-sm text-muted-foreground mb-1">{t("completedJobs")}</p>
                    <div className="font-display font-bold text-2xl" data-testid="text-completed-jobs">
                      {laborerProfile?.completedJobs || 0}
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
                    <p className="text-sm text-muted-foreground mb-1">{t("rating")}</p>
                    <div className="font-display font-bold text-2xl flex items-center gap-1">
                      {(laborerProfile?.rating || 5).toFixed(1)}
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
            {/* Available Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>{t("availableJobs")}</CardTitle>
                <CardDescription>
                  {t("firstToAccept")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("noJobsAvailable")}
                    </p>
                  ) : (
                    availableJobs.map((job: any) => {
                      const skillsNeeded = job.skillsNeeded || [];
                      const primarySkill = skillsNeeded[0]?.skill || "helper";
                      
                      return (
                        <div 
                          key={job.id} 
                          className="p-4 bg-muted/50 rounded-lg space-y-3"
                          data-testid={`available-job-${job.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <SkillBadge skill={primarySkill as SkillType} />
                              <div>
                                <p className="text-sm font-medium">{job.location}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(job.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg">₹{job.totalAmount}</p>
                            </div>
                          </div>
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => acceptJobMutation.mutate(job.id)}
                            disabled={acceptJobMutation.isPending}
                            data-testid={`button-accept-job-${job.id}`}
                          >
                            {acceptJobMutation.isPending ? t("processing") : t("acceptJob")}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assigned Jobs (Active Work) */}
            {assignedJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("activeJobs")}</CardTitle>
                  <CardDescription>
                    {t("currentlyWorkingOn")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignedJobs.map((job: any) => {
                      const skillsNeeded = job.skillsNeeded || [];
                      const primarySkill = skillsNeeded[0]?.skill || "helper";
                      
                      return (
                        <div 
                          key={job.id} 
                          className="p-3 bg-muted/50 rounded-lg space-y-3"
                          data-testid={`active-job-${job.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <SkillBadge skill={primarySkill as SkillType} />
                              <div>
                                <p className="text-sm font-medium">{job.location}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(job.assignedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                ₹{(job.totalAmount || 0) + (job.platformFee || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">{t("inProgress")}</p>
                            </div>
                          </div>
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => markReadyMutation.mutate(job.id)}
                            disabled={markReadyMutation.isPending}
                            data-testid={`button-mark-complete-${job.id}`}
                          >
                            {markReadyMutation.isPending ? t("processing") : t("markAsComplete")}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Request Notification */}
            {hasNewJobRequest && (
              <Card className="border-2 border-secondary shadow-lg" data-testid="card-job-request">
                <CardHeader className="bg-secondary/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 animate-pulse text-secondary" />
                      {t("newJobRequest")}
                    </CardTitle>
                    <div className="flex items-center gap-1 px-3 py-1 bg-chart-4/20 text-chart-4 rounded-md text-sm font-medium">
                      <Clock className="h-3 w-3" />
                      {t("timeLeft")}
                    </div>
                  </div>
                  <CardDescription>
                    {t("firstToAccept")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("location")}</span>
                      <span className="font-medium">{currentJobRequest?.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("skillsNeeded")}</span>
                      <div className="flex gap-2">
                        {currentJobRequest?.skillsNeeded?.map((req: any, idx: number) => (
                          <SkillBadge key={idx} skill={req.skill as SkillType} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("yourEarnings")}</span>
                      <span className="font-bold text-lg">₹{currentJobRequest?.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="secondary" 
                      className="flex-1" 
                      onClick={handleAcceptJob}
                      disabled={acceptJobMutation.isPending}
                      data-testid="button-accept-job"
                    >
                      {acceptJobMutation.isPending ? t("processing") : t("acceptJob")}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleDeclineJob}
                      data-testid="button-decline-job"
                    >
                      {t("decline")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Earnings & Withdrawal */}
            <Card>
              <CardHeader>
                <CardTitle>{t("earningsWithdrawal")}</CardTitle>
                <CardDescription>
                  {t("paymentInfo")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-chart-3/10 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("availableBalance")}</span>
                    <span className="font-display font-bold text-xl flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {laborerProfile?.totalEarnings || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("upiId")}</span>
                    <span className="font-mono text-sm">{laborerProfile?.upiId || t("notSet")}</span>
                  </div>
                </div>

                <Button className="w-full" data-testid="button-withdraw">
                  <IndianRupee className="mr-2 h-4 w-4" />
                  {t("withdrawToUpi")}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {t("platformFeeInfo")}
                </p>
              </CardContent>
            </Card>

            {/* Skills & Profile */}
            <Card>
              <CardHeader>
                <CardTitle>{t("yourSkills")}</CardTitle>
                <CardDescription>
                  {t("receiveJobsForSkills")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(laborerProfile?.skills || []).map((skill: string) => (
                    <SkillBadge key={skill} skill={skill as SkillType} />
                  ))}
                </div>
                <Button variant="outline" className="w-full" data-testid="button-edit-skills">
                  {t("editSkills")}
                </Button>
              </CardContent>
            </Card>

            {/* Job History */}
            <Card>
              <CardHeader>
                <CardTitle>{t("recentJobs")}</CardTitle>
                <CardDescription>
                  {t("completedWorkHistory")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("noCompletedJobs")}
                    </p>
                  ) : (
                    completedJobs.slice(0, 5).map((job: any) => {
                      const skillsNeeded = job.skillsNeeded || [];
                      const primarySkill = skillsNeeded[0]?.skill || "helper";
                      
                      return (
                        <div 
                          key={job.id} 
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          data-testid={`job-history-${job.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <SkillBadge skill={primarySkill as SkillType} />
                            <div>
                              <p className="text-sm font-medium">{job.location}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold">
                            ₹{(job.totalAmount || 0) + (job.platformFee || 0)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
