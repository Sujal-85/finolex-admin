import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/client";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { name, email, password, role: 'admin' };

      const response = await api.post(endpoint, payload);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(isLogin ? "Login successful!" : "Registration successful!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || (isLogin ? "Invalid credentials" : "Registration failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center relative overflow-hidden px-4"
      style={{
        backgroundImage: `url('/college.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Glassmorphic Card */}
      <Card className="w-full max-w-md relative z-10 shadow-2xl bg-white/30 backdrop-blur-xl border-white/20 
                       transform transition-all duration-700 hover:scale-[1.02] hover:shadow-3xl rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 rounded-3xl" />

        <CardHeader className="relative z-10 space-y-6 text-center pb-8 pt-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center">
            {/* <UtensilsCrossed className="h-10 w-10 text-gray-900 drop-shadow-lg" />
             */}
            <img src="logo.png" alt="Logo" className="h-22 w-22 text-gray-900 drop-shadow-lg rounded-2xl" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold text-gray-900 tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-gray-800 text-lg font-medium drop-shadow-sm">
              {isLogin ? "Sign in to manage your college canteen" : "Register as a new admin"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pb-10 px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-3">
                <Label htmlFor="name" className="text-gray-900 text-sm font-bold tracking-wide">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 bg-white/50 border-white/40 text-gray-900 placeholder:text-gray-600 
                             focus:bg-white/70 focus:border-white/60 focus:ring-4 focus:ring-white/30 
                             backdrop-blur-md transition-all duration-300 text-base font-medium"
                />
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="email" className="text-gray-900 text-sm font-bold tracking-wide">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white/50 border-white/40 text-gray-900 placeholder:text-gray-600 
                           focus:bg-white/70 focus:border-white/60 focus:ring-4 focus:ring-white/30 
                           backdrop-blur-md transition-all duration-300 text-base font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-gray-900 text-sm font-bold tracking-wide">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white/50 border-white/40 text-gray-900 placeholder:text-gray-600 
                           focus:bg-white/70 focus:border-white/60 focus:ring-4 focus:ring-white/30 
                           backdrop-blur-md transition-all duration-300 text-base font-medium"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 mt-8 bg-gray-900 text-white 
                         hover:bg-gray-800 font-bold text-lg tracking-wide
                         shadow-xl hover:shadow-2xl transform hover:-translate-y-1 
                         transition-all duration-300 disabled:opacity-80 rounded-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                isLogin ? "Sign In to Dashboard" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-900 font-semibold hover:underline focus:outline-none"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>

          {isLogin && (
            <p className="text-center text-gray-700 text-sm mt-4 font-medium">
              Hint: Try <span className="font-mono bg-white/40 px-3 py-1 rounded-lg text-gray-900 border border-white/20">admin@college.edu</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}