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
import { 
  Wallet, 
  IndianRupee, 
  TrendingUp, 
  TrendingDown,
  Building2,
  ArrowUpRight,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function WalletDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountHolderName: "",
    bankName: "",
  });

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading } = useQuery<any>({
    queryKey: [`/api/wallet/${user?.id}`],
    enabled: !!user?.id && user?.role === "laborer",
  });

  // Fetch payments/transaction history
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: [`/api/payments/laborer/${user?.id}`],
    enabled: !!user?.id && user?.role === "laborer",
  });

  // Fetch withdrawals history
  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<any[]>({
    queryKey: [`/api/withdrawals/laborer/${user?.id}`],
    enabled: !!user?.id && user?.role === "laborer",
  });

  // Bank details mutation
  const saveBankDetailsMutation = useMutation({
    mutationFn: async (data: typeof bankDetails) => {
      return apiRequest("POST", `/api/wallet/${user?.id}/bank-details`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/${user?.id}`] });
      toast({
        title: t("success"),
        description: t("bankDetailsSaved"),
      });
      setShowBankForm(false);
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedToSaveBankDetails"),
        variant: "destructive",
      });
    },
  });

  const handleSaveBankDetails = () => {
    if (!bankDetails.bankAccountNumber || !bankDetails.bankIfscCode || !bankDetails.bankAccountHolderName) {
      toast({
        title: t("error"),
        description: t("pleaseFillAllRequiredFields"),
        variant: "destructive",
      });
      return;
    }
    saveBankDetailsMutation.mutate(bankDetails);
  };

  if (!user) {
    setLocation("/auth/signin");
    return null;
  }

  if (user.role !== "laborer") {
    setLocation("/");
    return null;
  }

  const isLoading = walletLoading || paymentsLoading || withdrawalsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("myWallet")}</h1>
          <p className="text-muted-foreground">{t("walletDescription")}</p>
        </div>

        {/* Wallet Overview Card */}
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {t("walletBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("availableBalance")}</p>
                <p className="text-4xl font-bold flex items-center gap-1" data-testid="text-available-balance">
                  <IndianRupee className="h-8 w-8" />
                  {wallet?.availableBalance?.toLocaleString('en-IN') || 0}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalEarnings")}</p>
                  <p className="text-xl font-semibold flex items-center gap-1" data-testid="text-total-earnings">
                    <IndianRupee className="h-4 w-4" />
                    {wallet?.totalEarnings?.toLocaleString('en-IN') || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("platformFees")}</p>
                  <p className="text-xl font-semibold flex items-center gap-1" data-testid="text-platform-fees">
                    <IndianRupee className="h-4 w-4" />
                    {wallet?.totalPlatformFees?.toLocaleString('en-IN') || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalWithdrawn")}</p>
                  <p className="text-xl font-semibold flex items-center gap-1" data-testid="text-total-withdrawn">
                    <IndianRupee className="h-4 w-4" />
                    {wallet?.totalWithdrawn?.toLocaleString('en-IN') || 0}
                  </p>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setLocation("/wallet/withdraw")}
                data-testid="button-withdraw-funds"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                {t("withdrawFunds")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalTransactions")}</p>
                  <p className="text-2xl font-bold" data-testid="text-total-transactions">
                    {payments.length + withdrawals.length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("completedJobs")}</p>
                  <p className="text-2xl font-bold" data-testid="text-completed-jobs">
                    {payments.length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-chart-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("withdrawalsMade")}</p>
                  <p className="text-2xl font-bold" data-testid="text-withdrawals-count">
                    {withdrawals.filter((w: any) => w.status === "completed").length}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-chart-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Account Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("bankAccount")}
            </CardTitle>
            <CardDescription>{t("bankAccountDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {showBankForm ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accountNumber">{t("accountNumber")} *</Label>
                  <Input 
                    id="accountNumber"
                    value={bankDetails.bankAccountNumber}
                    onChange={(e) => setBankDetails({...bankDetails, bankAccountNumber: e.target.value})}
                    placeholder={t("enterAccountNumber")}
                    data-testid="input-account-number"
                  />
                </div>
                <div>
                  <Label htmlFor="ifsc">{t("ifscCode")} *</Label>
                  <Input 
                    id="ifsc"
                    value={bankDetails.bankIfscCode}
                    onChange={(e) => setBankDetails({...bankDetails, bankIfscCode: e.target.value.toUpperCase()})}
                    placeholder={t("enterIfscCode")}
                    data-testid="input-ifsc-code"
                  />
                </div>
                <div>
                  <Label htmlFor="accountHolder">{t("accountHolderName")} *</Label>
                  <Input 
                    id="accountHolder"
                    value={bankDetails.bankAccountHolderName}
                    onChange={(e) => setBankDetails({...bankDetails, bankAccountHolderName: e.target.value})}
                    placeholder={t("enterAccountHolderName")}
                    data-testid="input-account-holder"
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">{t("bankName")}</Label>
                  <Input 
                    id="bankName"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    placeholder={t("enterBankNameOptional")}
                    data-testid="input-bank-name"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveBankDetails}
                    disabled={saveBankDetailsMutation.isPending}
                    data-testid="button-save-bank"
                  >
                    {saveBankDetailsMutation.isPending ? t("saving") : t("saveBankDetails")}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBankForm(false)}
                    data-testid="button-cancel-bank"
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : wallet?.bankAccountNumber ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-chart-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{t("bankAccountLinked")}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("accountNumber")}</p>
                    <p className="font-mono" data-testid="text-bank-account">****{wallet.bankAccountNumber.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("ifscCode")}</p>
                    <p className="font-mono" data-testid="text-bank-ifsc">{wallet.bankIfscCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("accountHolder")}</p>
                    <p data-testid="text-bank-holder">{wallet.bankAccountHolderName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("bankName")}</p>
                    <p data-testid="text-bank-name">{wallet.bankName || "-"}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBankDetails({
                      bankAccountNumber: wallet.bankAccountNumber || "",
                      bankIfscCode: wallet.bankIfscCode || "",
                      bankAccountHolderName: wallet.bankAccountHolderName || "",
                      bankName: wallet.bankName || "",
                    });
                    setShowBankForm(true);
                  }}
                  data-testid="button-edit-bank"
                >
                  {t("editBankDetails")}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{t("noBankAccount")}</p>
                <Button onClick={() => setShowBankForm(true)} data-testid="button-add-bank">
                  {t("addBankAccount")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("recentTransactions")}</CardTitle>
            <CardDescription>{t("transactionHistory")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">{t("loading")}</p>
            ) : payments.length === 0 && withdrawals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8" data-testid="text-no-transactions">
                {t("noTransactions")}
              </p>
            ) : (
              <div className="space-y-3">
                {/* Combine and sort payments and withdrawals */}
                {[...payments.map((p: any) => ({ ...p, type: 'earning' })), 
                  ...withdrawals.map((w: any) => ({ ...w, type: 'withdrawal' }))]
                  .sort((a, b) => new Date(b.createdAt || b.requestedAt).getTime() - new Date(a.createdAt || a.requestedAt).getTime())
                  .slice(0, 10)
                  .map((transaction: any) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {transaction.type === 'earning' ? (
                          <div className="p-2 bg-chart-3/20 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-chart-3" />
                          </div>
                        ) : (
                          <div className="p-2 bg-chart-2/20 rounded-lg">
                            <TrendingDown className="h-5 w-5 text-chart-2" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {transaction.type === 'earning' ? t("jobPayment") : t("withdrawal")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt || transaction.requestedAt).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold flex items-center gap-1 ${transaction.type === 'earning' ? 'text-chart-3' : 'text-chart-2'}`}>
                          {transaction.type === 'earning' ? '+' : '-'}
                          <IndianRupee className="h-4 w-4" />
                          {transaction.amount?.toLocaleString('en-IN')}
                        </p>
                        {transaction.type === 'earning' && transaction.workerConvenienceFee && (
                          <p className="text-xs text-muted-foreground">
                            Fee: ₹{transaction.workerConvenienceFee}
                          </p>
                        )}
                        {transaction.type === 'withdrawal' && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {transaction.status}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
