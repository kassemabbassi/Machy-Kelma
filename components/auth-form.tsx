"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Sparkles, UserIcon, UserCheck } from "lucide-react"
import { getOrCreateUser, saveCurrentUser } from "@/lib/local-data"
import type { GameUser } from "@/types/game"
import { ThemeToggle } from "./theme-toggle"

interface AuthFormProps {
  onLogin: (user: GameUser | null) => void
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [username, setUsername] = useState("")
  const handleLogin = (isGuest: boolean) => {
    const user = isGuest
      ? { id: `guest-${Date.now()}`, username: "Guest Player" }
      : getOrCreateUser(username)
    saveCurrentUser(user)
    onLogin(user)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Beautiful gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-100/20 to-indigo-200/30 dark:from-transparent dark:via-blue-900/20 dark:to-indigo-800/30" />

      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/30 dark:bg-blue-800/30 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-indigo-200/30 dark:bg-indigo-800/30 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-purple-200/30 dark:bg-purple-800/30 rounded-full blur-xl animate-pulse delay-500" />

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
            Wordoria
          </h1>
          <p className="text-lg text-muted-foreground">AI-Powered Word Discovery Game</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold">Welcome Back!</CardTitle>
            <CardDescription>Enter your username to continue your journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-blue-200 dark:border-blue-800 focus:border-blue-400 dark:focus:border-blue-600"
                />
              </div>
            </div>

            <Button
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => handleLogin(false)}
              disabled={!username.trim()}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Start Playing
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium bg-transparent"
              onClick={() => handleLogin(true)}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              Continue as Guest
            </Button>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">Challenge your mind with AI-generated word puzzles</p>
        </div>
      </div>
    </div>
  )
}
