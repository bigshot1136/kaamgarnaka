import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Camera, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SobrietyCheck() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<"passed" | "failed" | null>(null);
  const [analysisDetails, setAnalysisDetails] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageDataUrl);
        
        // Stop camera stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        // Simulate AI analysis
        analyzeImage(imageDataUrl);
      }
    }
  }, [stream]);

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    
    try {
      if (!user) {
        throw new Error("User not found");
      }

      const checkResult: any = await apiRequest("POST", "/api/sobriety-check", {
        laborerId: user.id,
        imageDataUrl: imageData,
        status: "pending_review",
      });

      setResult(checkResult.status);
      
      // Parse the structured analysis result
      let analysisText = "Analysis complete";
      try {
        const analysisData = JSON.parse(checkResult.analysisResult);
        if (analysisData.analysis) {
          analysisText = analysisData.analysis;
        } else if (analysisData.detectedIssues && analysisData.detectedIssues.length > 0) {
          analysisText = analysisData.detectedIssues.join(", ");
        }
      } catch {
        // Fallback to raw string if not JSON
        analysisText = checkResult.analysisResult || "Analysis complete";
      }
      
      setAnalysisDetails(analysisText);
    } catch (error: any) {
      console.error("Sobriety check error:", error);
      
      // Parse error message to check for cooldown
      let errorData: any = {};
      try {
        // Error message format: "403: {json}" - extract the JSON part
        const jsonMatch = error.message?.match(/\{.*\}/);
        if (jsonMatch) {
          errorData = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
      }
      
      // Check if this is a cooldown error
      if (errorData.error?.includes("Cooldown") || errorData.cooldownUntil) {
        setResult("failed");
        setAnalysisDetails(t("cooldownMessage"));
        toast({
          title: t("cooldownActive"),
          description: t("cooldownMessage"),
          variant: "destructive",
        });
      } else {
        setResult("failed");
        setAnalysisDetails(errorData.error || error.message || t("sobrietyCheckFailed"));
        toast({
          title: t("error"),
          description: errorData.error || error.message || t("sobrietyCheckFailed"),
          variant: "destructive",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setResult(null);
    setAnalysisDetails("");
    startCamera();
  };

  const proceedToJob = () => {
    if (result === "passed") {
      setLocation("/dashboard/laborer");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-display font-bold text-3xl">{t("aiSafetyVerification")}</h1>
            <p className="text-muted-foreground">
              {t("completeSobrietyCheck")}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("cameraCheck")}</CardTitle>
              <CardDescription>
                {t("lookDirectlyAtCamera")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructions */}
              {!capturedImage && !result && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>{t("faceCameraDirectly")}</li>
                      <li>{t("ensureGoodLighting")}</li>
                      <li>{t("removeHeadwear")}</li>
                      <li>{t("lookSteadily")}</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Camera View / Captured Image */}
              <div className="relative aspect-video bg-muted rounded-xl overflow-hidden">
                {!capturedImage ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      data-testid="video-camera"
                    />
                    {/* Camera guide overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-80 border-2 border-dashed border-primary/50 rounded-2xl"></div>
                    </div>
                  </>
                ) : (
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                    data-testid="img-captured"
                  />
                )}

                {/* Analysis Loader */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                      <p className="font-medium">{t("analyzingFacialCues")}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Result Display */}
              {result && (
                <Alert className={result === "passed" ? "border-chart-3" : "border-destructive"}>
                  {result === "passed" ? (
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">
                        {result === "passed" ? t("verificationPassed") : t("verificationFailed")}
                      </p>
                      <p className="text-sm">{analysisDetails}</p>
                      {result === "failed" && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {t("retryAfter5Hours")}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!capturedImage && !result && (
                  <>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={startCamera}
                      data-testid="button-start-camera"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {t("startCamera")}
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={captureImage}
                      disabled={!stream}
                      data-testid="button-capture"
                    >
                      {t("capturePhoto")}
                    </Button>
                  </>
                )}

                {result === "passed" && (
                  <Button 
                    className="flex-1"
                    onClick={proceedToJob}
                    data-testid="button-proceed"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {t("proceedToJob")}
                  </Button>
                )}

                {result === "failed" && (
                  <>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          await apiRequest("POST", "/api/sobriety-check/request-review", { 
                            laborerId: user?.id 
                          });
                          
                          toast({
                            title: t("success"),
                            description: t("manualReviewRequested"),
                          });
                          setLocation("/dashboard/laborer");
                        } catch (error) {
                          console.error("Failed to request review:", error);
                          toast({
                            title: t("error"),
                            description: t("sobrietyCheckFailed"),
                            variant: "destructive",
                          });
                        }
                      }}
                      data-testid="button-request-review"
                    >
                      {t("requestManualReview")}
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation("/dashboard/laborer")}
                      data-testid="button-back-dashboard"
                    >
                      {t("backToDashboard")}
                    </Button>
                  </>
                )}

                {capturedImage && !result && (
                  <Button 
                    variant="outline"
                    onClick={retakePhoto}
                    disabled={isAnalyzing}
                    data-testid="button-retake"
                  >
                    {t("retakePhoto")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
