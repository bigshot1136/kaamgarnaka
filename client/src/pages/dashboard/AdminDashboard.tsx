import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedCheck, setSelectedCheck] = useState<SobrietyCheck | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  const { data: checks, isLoading } = useQuery<SobrietyCheck[]>({
    queryKey: ["/api/admin/sobriety-checks"],
  });

  const approveMutation = useMutation({
    mutationFn: (checkId: string) => 
      apiRequest("POST", `/api/admin/sobriety-check/${checkId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sobriety-checks"] });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" data-testid={`badge-status-passed`}><CheckCircle className="w-3 h-3 mr-1" />Passed</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" data-testid={`badge-status-failed`}><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "pending_review":
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" data-testid={`badge-status-pending`}><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      default:
        return <Badge data-testid={`badge-status-unknown`}>{status}</Badge>;
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

  const filteredChecks = checks?.filter(check => {
    if (activeTab === "pending") {
      return check.status === "pending_review";
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" data-testid="loading-spinner"></div>
          <p className="mt-4 text-muted-foreground">Loading sobriety checks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-admin-dashboard">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage and review sobriety checks</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "all")}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Review {checks?.filter(c => c.status === "pending_review").length ? `(${checks.filter(c => c.status === "pending_review").length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All Checks</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredChecks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-checks">
                  {activeTab === "pending" ? "No pending reviews" : "No sobriety checks found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredChecks.map((check) => {
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
                              data-testid={`img-check-${check.id}`}
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

                      {analysisData?.analysis && (
                        <div>
                          <p className="text-sm font-medium mb-1">Detailed Analysis</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-analysis-${check.id}`}>{analysisData.analysis}</p>
                        </div>
                      )}

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

                      {check.reviewedAt && (
                        <p className="text-sm text-muted-foreground">
                          Reviewed: {format(new Date(check.reviewedAt), "PPp")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
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
