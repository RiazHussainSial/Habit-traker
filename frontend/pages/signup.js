import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import Footer from "@/components/Footer";
import api from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/signup", { email, password });
      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      toast.success("Account created");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="layout-shell min-h-screen grid place-items-center py-10">
      <form className="surface p-8 w-full max-w-md space-y-3" onSubmit={onSubmit}>
        <h1 className="text-2xl font-semibold">Create Account</h1>
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Creating..." : "Sign Up"}</button>
        <p className="text-sm text-stone-600">Already have an account? <Link href="/login" className="underline">Login</Link></p>
      </form>
    </div>

    <Footer />
    </>
  );
}
