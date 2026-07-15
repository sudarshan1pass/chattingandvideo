"use client";

import { useState } from "react";

import { loginUser, signupUser } from "../services/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";


type AuthMode = "login" | "signup";

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  const router = useRouter();

  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await loginUser({
        email,
        password,
      });

      localStorage.setItem("token", res.token);
      localStorage.setItem(
        "user",
        JSON.stringify(res.user)
      );

      console.log("Login Success:", res);
      toast.success(
      "Login Successful"
        );

     

     router.push("/dashboard"); 
    } catch (error: any) {
      console.log(error);

     
      toast.error(
     "Login Failed"
);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
  try {
    setLoading(true);

    console.time("SIGNUP API");

    const res = await signupUser({
      name,
      email,
      password,
    });

    console.timeEnd("SIGNUP API");

    
    
    console.log("Signup Success:", res);
    
    toast.success(
     "Account Created Successfully"
       );
    

    setMode("login");

    setName("");
    setEmail("");
    setPassword("");

  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
};

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (isSignup) {
      await handleSignup();
    } else {
      await handleLogin();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6">
      <section className="w-full max-w-xl rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-500">
            {isSignup
              ? "Create account"
              : "Welcome back"}
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {isSignup
              ? "Start your account"
              : "Login to your account"}
          </h2>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-md py-2 font-semibold ${
              !isSignup
                ? "bg-white shadow"
                : ""
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-md py-2 font-semibold ${
              isSignup
                ? "bg-white shadow"
                : ""
            }`}
          >
            Sign Up
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {isSignup && (
            <div>
              <label className="block mb-2 text-sm font-medium">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Sudarshan Sharma"
                className="w-full rounded-lg border p-3 outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              className="w-full rounded-lg border p-3 outline-none"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="********"
              className="w-full rounded-lg border p-3 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-3 font-semibold text-white"
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          {isSignup
            ? "Already have an account?"
            : "New here?"}

          <button
            type="button"
            onClick={() =>
              setMode(
                isSignup
                  ? "login"
                  : "signup"
              )
            }
            className="ml-2 font-semibold underline"
          >
            {isSignup
              ? "Login"
              : "Create Account"}
          </button>
        </p>
      </section>
    </main>
  );
}