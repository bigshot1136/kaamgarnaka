import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, IndianRupee, TrendingDown, AlertCircle } from "lucide-react";

export default function WithdrawalPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");

  // Fetch wallet data
  const { data: wallet } = useQuery<any>({
    queryKey: [`/api/wallet/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch withdrawals
  const { data: withdrawals = [] } = useQuery<any[]>({
    queryKey: [`/api/withdrawals/laborer/${user?.id}`],
    enabled: !!user?.id,
  });

  // Withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (data: { laborerId: string; amount: number }) => {
      return apiRequest("POST", "/api/withdrawals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/withdrawals/laborer/${user?.id}`] });
      toast({
        title: t("success"),
        description: t("withdrawalSubmittedSuccess"),
      });
      setAmount("");
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedToProcessWithdrawal"),
        variant: "destructive",
      });
    },
  });

  const handleWithdraw = () => {
    const withdrawAmount = parseInt(amount);
    
    if (!withdrawAmount || withdrawAmount < 100) {
      toast({
        title: t("error"),
        description: t("minimumWithdrawalAmount"),
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > (wallet?.availableBalance || 0)) {
      toast({
        title: t("error"),
        description: t("insufficientBalance"),
        variant: "destructive",
      });
      return;
    }

    if (!wallet?.bankAccountNumber) {
      toast({
        title: t("error"),
        description: t("pleaseAddBankAccountFirst"),
        variant: "destructive",
      });
      setLocation("/wallet");
      return;
    }

    withdrawalMutation.mutate({
      laborerId: user!.id,
      amount: withdrawAmount,
    });
  };

  if (!user) {
    setLocation("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/wallet")}
          className="mb-4"
          data-testid="button-back-to-wallet"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToWallet")}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("withdrawFunds")}</h1>
          <p className="text-muted-foreground">{t("withdrawDescription")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t("requestWithdrawal")}</CardTitle>
              <CardDescription>{t("enterWithdrawalAmount")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-lg mb-2">{t("availableBalance")}</Label>
                <p className="text-3xl font-bold flex items-center gap-1 mb-4" data-testid="text-balance">
                  <IndianRupee className="h-6 w-6" />
                  {wallet?.availableBalance?.toLocaleString('en-IN') || 0}
                </p>
              </div>

              <div>
                <Label htmlFor="amount">{t("withdrawalAmount")}</Label>
                <div className="relative mt-2">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                    placeholder="Enter amount"
                    min={100}
                    max={wallet?.availableBalance || 0}
                    data-testid="input-withdrawal-amount"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("minimumAmount")}: ₹100 | {t("maximumAmount")}: ₹{wallet?.availableBalance?.toLocaleString('en-IN') || 0}
                </p>
              </div>

              {!wallet?.bankAccountNumber && (
                <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">{t("noBankAccount")}</p>
                    <p className="text-sm text-muted-foreground">{t("addBankAccountFirst")}</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleWithdraw}
                disabled={withdrawalMutation.isPending || !wallet?.bankAccountNumber}
                className="w-full"
                size="lg"
                data-testid="button-submit-withdrawal"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                {withdrawalMutation.isPending ? t("processing") : t("submitWithdrawal")}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                {t("processingTime")}: 24-48 {t("hours")}
              </p>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle>{t("withdrawalHistory")}</CardTitle>
              <CardDescription>{t("recentWithdrawals")}</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8" data-testid="text-no-withdrawals">
                  {t("noWithdrawals")}
                </p>
              ) : (
                <div className="space-y-3">
                  {withdrawals.slice(0, 5).map((withdrawal: any) => (
                    <div 
                      key={withdrawal.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`withdrawal-${withdrawal.id}`}
                    >
                      <div>
                        <p className="font-semibold flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          {withdrawal.amount?.toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(withdrawal.requestedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <StatusBadge status={withdrawal.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
