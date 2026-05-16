import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BarChart3, Package, ShieldCheck, TrendingUp } from "lucide-react";
import { images } from "@/lib/images";

const features = [
  { icon: Package, text: "Track stock by category" },
  { icon: TrendingUp, text: "Record sales & profit" },
  { icon: BarChart3, text: "Daily & weekly reports" },
  { icon: ShieldCheck, text: "Secure cloud backup" },
];

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const businessName = formData.get("businessName") as string;
    const businessType = formData.get("businessType") as string;

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          business_name: businessName,
          business_type: businessType,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created successfully!");
      navigate("/");
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in successfully!");
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Hero panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src={images.authHero}
          alt="Shop storefront"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="image-overlay" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="" className="h-11 w-11 rounded-xl shadow-lg" />
            <span className="text-xl font-bold">Dukan Manager</span>
          </div>
          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Run your dukan
              <br />
              <span className="text-accent-foreground/90">smarter every day</span>
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/80">
              Inventory, sales, and profit reports — built for local shop owners.
            </p>
            <ul className="mt-8 space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-white/90">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/50">© Dukan Manager</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-soft lg:border lg:shadow-card">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-lg lg:hidden">
              <img src="/logo.svg" alt="" className="h-full w-full rounded-[14px] bg-card p-2" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to manage inventory, sales, and reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="mb-6 grid h-11 w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      required
                    />
                  </div>
                  <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      type="text"
                      placeholder="Ali General Store"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Input
                      id="businessType"
                      name="businessType"
                      type="text"
                      placeholder="Grocery, Rice, Cosmetics..."
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      className="h-11"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
