import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Camera, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SobrietyCheck() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
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

      const response = await fetch("/api/sobriety-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          laborerId: user.id,
          imageDataUrl: imageData,
          status: "pending_review", // Will be updated by AI
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sobriety check failed");
      }

      const checkResult = await response.json();
      setResult(checkResult.status);
      setAnalysisDetails(checkResult.analysisResult || "Analysis complete");
    } catch (error: any) {
      console.error("Sobriety check error:", error);
      setResult("failed");
      setAnalysisDetails(error.message || "Failed to complete sobriety check. Please try again.");
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
            <h1 className="font-display font-bold text-3xl">AI Safety Verification</h1>
            <p className="text-muted-foreground">
              Complete the sobriety check to confirm you're fit for duty
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Camera Check</CardTitle>
              <CardDescription>
                Look directly at the camera and ensure good lighting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructions */}
              {!capturedImage && !result && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Face the camera directly</li>
                      <li>Ensure good lighting on your face</li>
                      <li>Remove any headwear or sunglasses</li>
                      <li>Look at the camera steadily</li>
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
                      <p className="font-medium">Analyzing facial cues...</p>
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
                        {result === "passed" ? "Verification Passed" : "Verification Failed"}
                      </p>
                      <p className="text-sm">{analysisDetails}</p>
                      {result === "failed" && (
                        <p className="text-sm text-muted-foreground mt-2">
                          You can retry after 5-6 hours or request manual review.
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
                      Start Camera
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={captureImage}
                      disabled={!stream}
                      data-testid="button-capture"
                    >
                      Capture Photo
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
                    Proceed to Job
                  </Button>
                )}

                {result === "failed" && (
                  <>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/sobriety-check/request-review", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ laborerId: user?.id }),
                          });
                          
                          if (response.ok) {
                            alert("Manual review requested successfully. You'll be notified of the decision.");
                            setLocation("/dashboard/laborer");
                          }
                        } catch (error) {
                          console.error("Failed to request review:", error);
                        }
                      }}
                      data-testid="button-request-review"
                    >
                      Request Manual Review
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation("/dashboard/laborer")}
                      data-testid="button-back-dashboard"
                    >
                      Back to Dashboard
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
                    Retake Photo
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
