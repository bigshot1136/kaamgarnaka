import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SkillBadge } from "@/components/SkillBadge";
import { Edit, Save, X, CheckCircle, XCircle, Shield } from "lucide-react";
import type { User, LaborerProfile, SkillType } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
});

const skillUpdateSchema = z.object({
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  upiId: z.string().min(3, "UPI ID is required"),
});

type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;
type SkillUpdateForm = z.infer<typeof skillUpdateSchema>;

const availableSkills: SkillType[] = ["mason", "carpenter", "plumber", "painter", "helper"];

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  // Fetch user data
  const { data: userData } = useQuery<User>({
    queryKey: ["/api/user", user?.id],
    enabled: !!user?.id,
  });

  // Fetch laborer profile if user is a laborer
  const { data: laborerProfile } = useQuery<LaborerProfile>({
    queryKey: ["/api/laborer/profile", user?.id],
    enabled: user?.role === "laborer",
  });

  // Basic profile form
  const basicForm = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: userData?.fullName || "",
      phone: userData?.phone || "",
      address: userData?.address || "",
    },
  });

  // Skills form
  const skillsForm = useForm<SkillUpdateForm>({
    resolver: zodResolver(skillUpdateSchema),
    defaultValues: {
      skills: laborerProfile?.skills || [],
      upiId: laborerProfile?.upiId || "",
    },
  });

  // Update basic info mutation
  const updateBasicMutation = useMutation({
    mutationFn: async (data: ProfileUpdateForm) => {
      return apiRequest("PATCH", `/api/user/${user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id] });
      toast({
        title: t("success"),
        description: "Profile updated successfully",
      });
      setIsEditingBasic(false);
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update skills mutation
  const updateSkillsMutation = useMutation({
    mutationFn: async (data: SkillUpdateForm) => {
      return apiRequest("PATCH", `/api/laborer/profile/${user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/laborer/profile", user?.id] });
      toast({
        title: t("success"),
        description: "Skills updated successfully",
      });
      setIsEditingSkills(false);
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || "Failed to update skills",
        variant: "destructive",
      });
    },
  });

  const onSubmitBasic = (data: ProfileUpdateForm) => {
    updateBasicMutation.mutate(data);
  };

  const onSubmitSkills = (data: SkillUpdateForm) => {
    updateSkillsMutation.mutate(data);
  };

  const selectedSkills = skillsForm.watch("skills");

  if (!user || !userData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="font-display font-bold text-3xl">Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information and settings
            </p>
          </div>

          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Your personal details</CardDescription>
                </div>
                {!isEditingBasic && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      basicForm.reset({
                        fullName: userData.fullName,
                        phone: userData.phone,
                        address: userData.address,
                      });
                      setIsEditingBasic(true);
                    }}
                    data-testid="button-edit-basic"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isEditingBasic ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="text-base font-medium" data-testid="text-fullname">{userData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-base font-medium" data-testid="text-email">{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="text-base font-medium" data-testid="text-phone">{userData.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="text-base font-medium" data-testid="text-address">{userData.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge variant="secondary" data-testid="badge-role">
                      {userData.role}
                    </Badge>
                  </div>
                </div>
              ) : (
                <Form {...basicForm}>
                  <form onSubmit={basicForm.handleSubmit(onSubmitBasic)} className="space-y-4">
                    <FormField
                      control={basicForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-fullname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={basicForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={basicForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={updateBasicMutation.isPending}
                        data-testid="button-save-basic"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateBasicMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingBasic(false)}
                        data-testid="button-cancel-basic"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Laborer-specific cards */}
          {user.role === "laborer" && laborerProfile && (
            <>
              {/* Skills Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Skills & Work Information</CardTitle>
                      <CardDescription>Your skills and UPI details</CardDescription>
                    </div>
                    {!isEditingSkills && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          skillsForm.reset({
                            skills: laborerProfile.skills,
                            upiId: laborerProfile.upiId,
                          });
                          setIsEditingSkills(true);
                        }}
                        data-testid="button-edit-skills"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!isEditingSkills ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2" data-testid="container-skills">
                          {laborerProfile.skills.map((skill) => (
                            <SkillBadge key={skill} skill={skill as SkillType} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">UPI ID</p>
                        <p className="text-base font-medium" data-testid="text-upiid">{laborerProfile.upiId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Availability</p>
                        <Badge
                          variant={laborerProfile.availabilityStatus === "available" ? "default" : "secondary"}
                          data-testid="badge-availability"
                        >
                          {laborerProfile.availabilityStatus}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <Form {...skillsForm}>
                      <form onSubmit={skillsForm.handleSubmit(onSubmitSkills)} className="space-y-4">
                        <FormField
                          control={skillsForm.control}
                          name="skills"
                          render={() => (
                            <FormItem>
                              <FormLabel>Skills</FormLabel>
                              <div className="grid grid-cols-2 gap-4">
                                {availableSkills.map((skill) => (
                                  <FormField
                                    key={skill}
                                    control={skillsForm.control}
                                    name="skills"
                                    render={({ field }) => (
                                      <FormItem
                                        className="flex items-center space-x-2 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(skill)}
                                            onCheckedChange={(checked) => {
                                              const updatedSkills = checked
                                                ? [...(field.value || []), skill]
                                                : field.value?.filter((s) => s !== skill) || [];
                                              field.onChange(updatedSkills);
                                            }}
                                            data-testid={`checkbox-skill-${skill}`}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                          <SkillBadge skill={skill} />
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={skillsForm.control}
                          name="upiId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>UPI ID</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="yourname@upi" data-testid="input-upiid" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={updateSkillsMutation.isPending}
                            data-testid="button-save-skills"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {updateSkillsMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditingSkills(false)}
                            data-testid="button-cancel-skills"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>

              {/* Aadhaar Verification Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Aadhaar Verification</CardTitle>
                      <CardDescription>Your identity verification details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Aadhaar Number</p>
                    <p className="text-base font-medium font-mono" data-testid="text-aadhaar">
                      {laborerProfile.aadhaarNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Verification Status</p>
                    <div className="flex items-center gap-2">
                      {laborerProfile.isVerified ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <Badge variant="default" className="bg-green-600" data-testid="badge-verified">
                            Verified
                          </Badge>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-orange-600" />
                          <Badge variant="secondary" data-testid="badge-not-verified">
                            Pending Verification
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {laborerProfile.addressProofUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Address Proof</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(laborerProfile.addressProofUrl!, "_blank")}
                        data-testid="button-view-proof"
                      >
                        View Document
                      </Button>
                    </div>
                  )}

                  {!laborerProfile.isVerified && (
                    <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        Your profile is pending verification by an administrator. You will be notified once verified.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
