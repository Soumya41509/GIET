import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'

const Login = () => {
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }
        const { session } = await register(email, password)

        if (session) {
          navigate('/')
        } else {
          // Registration successful but no session (e.g. email confirmation required)
          setIsRegistering(false)
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setError('Registration successful! Please login.')
        }
      } else {
        const trimmedEmail = email.trim().toLowerCase()
        await login(trimmedEmail, password)
        navigate('/')
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Auth Error:", err)
      let errorMessage = 'Authentication failed. Please try again.'

      if (err.message) {
        if (err.message.includes("Access Denied")) {
          errorMessage = err.message
        } else if (err.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password."
        } else if (err.message.includes("User not found")) {
          errorMessage = "No account found with this email."
        } else if (err.message.includes("User already registered")) {
          errorMessage = "Email already in use. Please login."
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsRegistering(!isRegistering)
    setError('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-100 via-blue-50 to-teal-100 p-4 font-sans relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/40 blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-teal-500/40 blur-[100px] animate-pulse" />
      <div className="absolute top-[40%] left-[60%] h-[300px] w-[300px] rounded-full bg-purple-500/40 blur-[100px] animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="relative flex min-h-[600px] 3xl:min-h-[800px] w-full max-w-[1000px] 3xl:max-w-[1400px] overflow-hidden rounded-[30px] border border-white/60 bg-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-xl"
      >

        {/* Sign In Form Container */}
        <div className={`absolute top-0 h-full w-full md:w-1/2 transition-all duration-700 ease-in-out ${isRegistering ? 'translate-x-full opacity-0 z-0' : 'translate-x-0 opacity-100 z-20'}`}>
          <form onSubmit={handleSubmit} className="flex h-full flex-col items-center justify-center p-10 3xl:p-16 text-center">
            <h1 className="mb-6 3xl:mb-8 text-4xl 3xl:text-6xl font-bold bg-gradient-to-r from-cyan-700 to-teal-800 bg-clip-text text-transparent">Sign In</h1>

            {error && (
              <div className="mb-4 flex w-full items-center gap-2 rounded-lg bg-red-100 p-3 3xl:p-4 text-sm 3xl:text-base text-red-700 border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 3xl:h-5 3xl:w-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="w-full space-y-4 3xl:space-y-6">
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full rounded-full bg-slate-100/50 px-6 py-3 3xl:px-8 3xl:py-5 text-sm 3xl:text-lg font-medium text-slate-900 placeholder-slate-500 outline-none border border-cyan-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-md shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full rounded-full bg-slate-100/50 px-6 py-3 3xl:px-8 3xl:py-5 text-sm 3xl:text-lg font-medium text-slate-900 placeholder-slate-500 outline-none border border-cyan-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-md shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 3xl:mt-12 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-12 py-3 3xl:px-16 3xl:py-5 text-xs 3xl:text-base font-bold uppercase tracking-wider text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/40 disabled:opacity-70 shadow-md shadow-cyan-500/20"
            >
              {loading ? <Loader2 className="h-4 w-4 3xl:h-6 3xl:w-6 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Sign Up Form Container */}
        <div className={`absolute top-0 h-full w-full md:w-1/2 transition-all duration-700 ease-in-out ${isRegistering ? 'translate-x-full opacity-100 z-0' : 'translate-x-0 opacity-0 z-0'}`}>
          <form onSubmit={handleSubmit} className="flex h-full flex-col items-center justify-center p-10 3xl:p-16 text-center">
            <h1 className="mb-6 3xl:mb-8 text-4xl 3xl:text-6xl font-bold bg-gradient-to-r from-cyan-700 to-teal-800 bg-clip-text text-transparent">Create Account</h1>

            {error && (
              <div className="mb-4 flex w-full items-center gap-2 rounded-lg bg-red-100 p-3 3xl:p-4 text-sm 3xl:text-base text-red-700 border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 3xl:h-5 3xl:w-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="w-full space-y-4 3xl:space-y-6">
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full rounded-full bg-slate-100/50 px-6 py-3 3xl:px-8 3xl:py-5 text-sm 3xl:text-lg font-medium text-slate-900 placeholder-slate-500 outline-none border border-cyan-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-md shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full rounded-full bg-slate-100/50 px-6 py-3 3xl:px-8 3xl:py-5 text-sm 3xl:text-lg font-medium text-slate-900 placeholder-slate-500 outline-none border border-cyan-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-md shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                required={isRegistering}
                className="w-full rounded-full bg-slate-100/50 px-6 py-3 3xl:px-8 3xl:py-5 text-sm 3xl:text-lg font-medium text-slate-900 placeholder-slate-500 outline-none border border-cyan-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-md shadow-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 3xl:mt-12 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-12 py-3 3xl:px-16 3xl:py-5 text-xs 3xl:text-base font-bold uppercase tracking-wider text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/40 disabled:opacity-70 shadow-md shadow-cyan-500/20"
            >
              {loading ? <Loader2 className="h-4 w-4 3xl:h-6 3xl:w-6 animate-spin" /> : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Toggle Overlay Container */}
        <div className={`absolute top-0 h-full w-1/2 overflow-hidden transition-all duration-700 ease-in-out z-50 ${isRegistering ? 'left-0 rounded-r-[100px]' : 'left-1/2 rounded-l-[100px]'}`}>
          <div className={`relative -left-full h-full w-[200%] bg-gradient-to-br from-cyan-500/90 via-teal-500/90 to-cyan-600/90 backdrop-blur-md text-white transition-all duration-700 ease-in-out ${isRegistering ? 'translate-x-1/2' : 'translate-x-0'}`}>

            {/* Left Panel Content (Visible when Registering) */}
            <div className="absolute top-0 flex h-full w-1/2 flex-col items-center justify-center px-10 text-center">
              <h1 className="mb-4 text-4xl font-bold">Welcome Back!</h1>
              <p className="mb-8 text-sm leading-relaxed text-cyan-50">
                To access the admin panel please login with your credentials
              </p>
              <button
                onClick={toggleMode}
                className="rounded-lg border border-white/50 bg-white/20 backdrop-blur-sm px-12 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white hover:text-cyan-700"
              >
                Sign In
              </button>
            </div>

            {/* Right Panel Content (Visible when Signing In) */}
            <div className="absolute right-0 top-0 flex h-full w-1/2 flex-col items-center justify-center px-10 text-center">
              <h1 className="mb-4 text-4xl font-bold">Hello, Admin!</h1>
              <p className="mb-8 text-sm leading-relaxed text-cyan-50">
                Register with your details to access the admin dashboard
              </p>
              <button
                onClick={toggleMode}
                className="rounded-lg border border-white/50 bg-white/20 backdrop-blur-sm px-12 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white hover:text-cyan-700"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  )
}

export default Login
