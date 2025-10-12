import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Clock, XCircle, Users, Briefcase, DollarSign, BarChart3, Eye, LogOut, Loader } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SobrietyCheck {
  id: string;
  laborerId: string;
  jobId: string | null;
  status: "passed" | "failed" | "pending_review";
  analysisResult: string | null;
  imageDataUrl: string | null;
  checkedAt: string;
  reviewedAt: string | null;
  cooldownUntil: string | null;
}

interface AnalysisData {
  overallStatus: string;
  confidence: number;
  criteria: {
    eyeMovement: { score: number; status: string };
    facialExpression: { score: number; status: string };
    headPosition: { score: number; status: string };
    skinColor: { score: number; status: string };
  };
  detectedIssues: string[];
  riskLevel: string;
  analysis: string;
  manualReviewReason?: string;
}

interface Laborer {
  id: string;
  userId: string;
  skills: string[];
  upiId: string;
  aadhaarNumber: string;
  isVerified: boolean;
  availabilityStatus: string;
  totalEarnings: number;
  completedJobs: number;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    address: string;
  };
}

interface Payment {
  id: string;
  jobId: string;
  laborerId: string;
  customerId: string;
  amount: number;
  customerConvenienceFee: number;
  workerConvenienceFee: number;
  platformFee: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  transactionNumber: string | null;
  paymentScreenshotUrl: string | null;
  approvedAt: string | null;
}

interface Job {
  id: string;
  customerId: string;
  status: string;
  skillsNeeded: any;
  location: string;
  totalAmount: number;
  customerConvenienceFee: number;
  workerConvenienceFee: number;
  platformFee: number;
  assignedLaborerId: string | null;
  createdAt: string;
  assignedAt: string | null;
  completedAt: string | null;
}

interface Statistics {
  totalLaborers: number;
  verifiedLaborers: number;
  availableLaborers: number;
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  totalPayments: number;
  totalRevenue: number;
  totalTransactions: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [selectedCheck, setSelectedCheck] = useState<SobrietyCheck | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [mainTab, setMainTab] = useState<string>("sobriety");
  const [sobrietyTab, setSobrietyTab] = useState<"pending" | "all">("pending");

  const { data: checks } = useQuery<SobrietyCheck[]>({
    queryKey: ["/api/admin/sobriety-checks"],
  });

  const { data: laborers } = useQuery<Laborer[]>({
    queryKey: ["/api/admin/laborers"],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/admin/jobs"],
  });

  const { data: statistics } = useQuery<Statistics>({
    queryKey: ["/api/admin/statistics"],
  });

  const approveMutation = useMutation({
    mutationFn: (checkId: string) => 
      apiRequest("POST", `/api/admin/sobriety-check/${checkId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sobriety-checks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      setSelectedCheck(null);
      toast({
        title: "Approved",
        description: "Sobriety check approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve check",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ checkId, reason }: { checkId: string; reason: string }) => 
      apiRequest("POST", `/api/admin/sobriety-check/${checkId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sobriety-checks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      setSelectedCheck(null);
      setRejectReason("");
      toast({
        title: "Rejected",
        description: "Sobriety check rejected successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject check",
        variant: "destructive",
      });
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => 
      apiRequest("POST", `/api/payments/${paymentId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      toast({
        title: "Payment Approved",
        description: "Payment has been approved and funds credited to worker wallet",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payment",
        variant: "destructive",
      });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => 
      apiRequest("POST", `/api/payments/${paymentId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      toast({
        title: "Payment Rejected",
        description: "Payment has been rejected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject payment",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Passed</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "pending_review":
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Low Risk</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">Medium Risk</Badge>;
      case "high":
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">High Risk</Badge>;
      default:
        return <Badge>{riskLevel}</Badge>;
    }
  };

  const getJobStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", label: "Pending" },
      assigned: { color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20", label: "Assigned" },
      in_progress: { color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20", label: "In Progress" },
      ready_for_review: { color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20", label: "Ready for Review" },
      completed: { color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", label: "Completed" },
      cancelled: { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", label: "Cancelled" },
    };
    const config = statusConfig[status] || { color: "", label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredSobrietyChecks = checks?.filter(check => {
    if (sobrietyTab === "pending") {
      return check.status === "pending_review";
    }
    return true;
  }) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-admin-dashboard">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform operations and monitor activity</p>
        </div>
        <Button variant="outline" onClick={logout} data-testid="button-admin-logout">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-main">
          <TabsTrigger value="sobriety" data-testid="tab-sobriety">
            <Eye className="w-4 h-4 mr-2" />
            Sobriety Checks
          </TabsTrigger>
          <TabsTrigger value="laborers" data-testid="tab-laborers">
            <Users className="w-4 h-4 mr-2" />
            Laborers
          </TabsTrigger>
          <TabsTrigger value="jobs" data-testid="tab-jobs">
            <Briefcase className="w-4 h-4 mr-2" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            <DollarSign className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="statistics" data-testid="tab-statistics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Sobriety Checks Tab */}
        <TabsContent value="sobriety" className="mt-6">
          <Tabs value={sobrietyTab} onValueChange={(v) => setSobrietyTab(v as "pending" | "all")}>
            <TabsList>
              <TabsTrigger value="pending" data-testid="tab-sobriety-pending">
                Pending Review {checks?.filter(c => c.status === "pending_review").length ? `(${checks.filter(c => c.status === "pending_review").length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-sobriety-all">All Checks</TabsTrigger>
            </TabsList>

            <TabsContent value={sobrietyTab} className="mt-6">
              {filteredSobrietyChecks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {sobrietyTab === "pending" ? "No pending reviews" : "No sobriety checks found"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredSobrietyChecks.map((check) => {
                    let analysisData: AnalysisData | null = null;
                    try {
                      analysisData = check.analysisResult ? JSON.parse(check.analysisResult) : null;
                    } catch (e) {
                      console.error("Failed to parse analysis result:", e);
                    }

                    return (
                      <Card key={check.id} className="hover-elevate" data-testid={`card-check-${check.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">Laborer ID: {check.laborerId}</CardTitle>
                              <CardDescription>
                                Checked: {format(new Date(check.checkedAt), "PPp")}
                              </CardDescription>
                            </div>
                            {getStatusBadge(check.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {check.imageDataUrl && (
                              <div>
                                <p className="text-sm font-medium mb-2">Worker Photo</p>
                                <img 
                                  src={check.imageDataUrl} 
                                  alt="Worker verification photo" 
                                  className="rounded-lg w-full h-48 object-cover border"
                                />
                              </div>
                            )}
                            
                            {analysisData && (
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium">AI Analysis</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-2xl font-bold">{analysisData.confidence}%</span>
                                    <span className="text-sm text-muted-foreground">Confidence</span>
                                  </div>
                                </div>
                                
                                {getRiskBadge(analysisData.riskLevel)}
                                
                                {analysisData.detectedIssues?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-1">Detected Issues:</p>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {analysisData.detectedIssues.map((issue, i) => (
                                        <li key={i}>• {issue}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {check.status === "pending_review" && (
                            <div className="flex gap-2 pt-2">
                              <Button 
                                onClick={() => setSelectedCheck(check)}
                                className="flex-1"
                                data-testid={`button-review-${check.id}`}
                              >
                                Review Check
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Laborers Tab */}
        <TabsContent value="laborers" className="mt-6">
          <div className="grid gap-4">
            {laborers?.map((laborer) => (
              <Card key={laborer.id} className="hover-elevate" data-testid={`card-laborer-${laborer.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{laborer.user.fullName}</CardTitle>
                      <CardDescription>{laborer.user.email} • {laborer.user.phone}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {laborer.isVerified ? (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" />Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20">
                          Unverified
                        </Badge>
                      )}
                      <Badge>{laborer.availabilityStatus}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Skills</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {laborer.skills.map((skill) => (
                          <Badge key={skill} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="text-lg font-semibold">₹{laborer.totalEarnings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Jobs</p>
                      <p className="text-lg font-semibold">{laborer.completedJobs}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                      <p className="text-lg font-semibold">{laborer.rating}/5</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Address: {laborer.user.address}</p>
                    <p className="text-sm text-muted-foreground">UPI ID: {laborer.upiId}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="mt-6">
          <div className="grid gap-4">
            {jobs?.map((job) => (
              <Card key={job.id} className="hover-elevate" data-testid={`card-job-${job.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Job ID: {job.id.substring(0, 8)}...</CardTitle>
                      <CardDescription>{job.location}</CardDescription>
                    </div>
                    {getJobStatusBadge(job.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-semibold">₹{job.totalAmount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Platform Fee</p>
                      <p className="text-lg font-semibold">₹{job.platformFee}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="text-sm">{format(new Date(job.createdAt), "PP")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Skills Needed</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(job.skillsNeeded) && job.skillsNeeded.map((skill: any, i: number) => (
                          <Badge key={i} variant="outline">{skill.skill} x{skill.quantity}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6">
          <div className="grid gap-4">
            {payments?.map((payment) => {
              const getPaymentStatusBadge = (status: string) => {
                const statusConfig: Record<string, { color: string; label: string }> = {
                  pending: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", label: "Pending" },
                  pending_approval: { color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20", label: "Pending Approval" },
                  approved: { color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", label: "Approved" },
                  rejected: { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", label: "Rejected" },
                  completed: { color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", label: "Completed" },
                };
                const config = statusConfig[status] || { color: "", label: status };
                return <Badge className={config.color}>{config.label}</Badge>;
              };

              return (
                <Card key={payment.id} className="hover-elevate" data-testid={`card-payment-${payment.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Payment ID: {payment.id.substring(0, 8)}...</CardTitle>
                        <CardDescription>Job ID: {payment.jobId.substring(0, 8)}...</CardDescription>
                      </div>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Worker Amount</p>
                        <p className="text-lg font-semibold">₹{payment.amount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Platform Fee</p>
                        <p className="text-lg font-semibold">₹{payment.platformFee}</p>
                        <p className="text-xs text-muted-foreground">
                          Customer: ₹{payment.customerConvenienceFee} + Worker: ₹{payment.workerConvenienceFee}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="text-sm">{format(new Date(payment.createdAt), "PP")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Approved</p>
                        <p className="text-sm">{payment.approvedAt ? format(new Date(payment.approvedAt), "PP") : "Not yet"}</p>
                      </div>
                    </div>

                    {/* Transaction Details (if available) */}
                    {(payment.transactionNumber || payment.paymentScreenshotUrl) && (
                      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <p className="text-sm font-medium">Transaction Details</p>
                        {payment.transactionNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Transaction Number:</span>
                            <span className="text-sm font-mono" data-testid={`text-transaction-${payment.id}`}>{payment.transactionNumber}</span>
                          </div>
                        )}
                        {payment.paymentScreenshotUrl && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Payment Screenshot:</p>
                            <a 
                              href={payment.paymentScreenshotUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                              data-testid={`link-screenshot-${payment.id}`}
                            >
                              View Screenshot →
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approval Actions (only for pending_approval status) */}
                    {payment.status === "pending_approval" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => approvePaymentMutation.mutate(payment.id)}
                          disabled={approvePaymentMutation.isPending}
                          className="flex-1"
                          data-testid={`button-approve-payment-${payment.id}`}
                        >
                          {approvePaymentMutation.isPending ? (
                            <><Loader className="w-4 h-4 mr-2 animate-spin" />Approving...</>
                          ) : (
                            <><CheckCircle className="w-4 h-4 mr-2" />Approve Payment</>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => rejectPaymentMutation.mutate(payment.id)}
                          disabled={rejectPaymentMutation.isPending}
                          className="flex-1"
                          data-testid={`button-reject-payment-${payment.id}`}
                        >
                          {rejectPaymentMutation.isPending ? (
                            <><Loader className="w-4 h-4 mr-2 animate-spin" />Rejecting...</>
                          ) : (
                            <><XCircle className="w-4 h-4 mr-2" />Reject Payment</>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Laborers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statistics?.totalLaborers || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {statistics?.verifiedLaborers || 0} verified • {statistics?.availableLaborers || 0} available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statistics?.totalJobs || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {statistics?.pendingJobs || 0} pending • {statistics?.completedJobs || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{statistics?.totalRevenue || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  From {statistics?.totalTransactions || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statistics?.totalPayments || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Payment records in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statistics?.pendingWithdrawals || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Total amount: ₹{statistics?.pendingWithdrawalAmount || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Dialog (same as before) */}
      <Dialog open={!!selectedCheck} onOpenChange={(open) => !open && setSelectedCheck(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-review">Review Sobriety Check</DialogTitle>
            <DialogDescription>
              Carefully review the worker's photo and AI analysis before making a decision
            </DialogDescription>
          </DialogHeader>

          {selectedCheck && (() => {
            let analysisData: AnalysisData | null = null;
            try {
              analysisData = selectedCheck.analysisResult ? JSON.parse(selectedCheck.analysisResult) : null;
            } catch (e) {
              console.error("Failed to parse analysis result:", e);
            }

            return (
              <div className="space-y-6">
                {selectedCheck.imageDataUrl && (
                  <div>
                    <p className="text-sm font-medium mb-2">Worker Photo</p>
                    <img 
                      src={selectedCheck.imageDataUrl} 
                      alt="Worker verification photo" 
                      className="rounded-lg w-full max-h-96 object-contain border"
                      data-testid="img-review-photo"
                    />
                  </div>
                )}

                {analysisData && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Confidence Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{analysisData.confidence}%</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Risk Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {getRiskBadge(analysisData.riskLevel)}
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Assessment Criteria</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Eye Movement</span>
                            <Badge variant={analysisData.criteria.eyeMovement.status === "normal" ? "outline" : "destructive"}>
                              {analysisData.criteria.eyeMovement.score}% - {analysisData.criteria.eyeMovement.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Facial Expression</span>
                            <Badge variant={analysisData.criteria.facialExpression.status === "normal" ? "outline" : "destructive"}>
                              {analysisData.criteria.facialExpression.score}% - {analysisData.criteria.facialExpression.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Head Position</span>
                            <Badge variant={analysisData.criteria.headPosition.status === "stable" ? "outline" : "destructive"}>
                              {analysisData.criteria.headPosition.score}% - {analysisData.criteria.headPosition.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Skin Color</span>
                            <Badge variant={analysisData.criteria.skinColor.status === "normal" ? "outline" : "destructive"}>
                              {analysisData.criteria.skinColor.score}% - {analysisData.criteria.skinColor.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {analysisData.detectedIssues?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Detected Issues</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {analysisData.detectedIssues.map((issue, i) => (
                              <li key={i} className="text-sm">• {issue}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Detailed Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{analysisData.analysis}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium">Rejection Reason (optional)</p>
                  <Textarea
                    placeholder="Provide a reason if rejecting this check..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    data-testid="textarea-reject-reason"
                  />
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCheck(null);
                setRejectReason("");
              }}
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedCheck && rejectMutation.mutate({ 
                checkId: selectedCheck.id, 
                reason: rejectReason 
              })}
              disabled={rejectMutation.isPending}
              data-testid="button-reject-check"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
            <Button
              onClick={() => selectedCheck && approveMutation.mutate(selectedCheck.id)}
              disabled={approveMutation.isPending}
              data-testid="button-approve-check"
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
