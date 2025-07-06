"use client"

import { useState, useEffect } from "react"
import AuthForm from "@/components/auth-form"
import WishlistDashboard from "@/components/wishlist-dashboard"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState("")

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
    }
  }, [])

  const handleLogin = (userData: any, authToken: string) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("token", authToken)
  }

  const handleLogout = () => {
    setUser(null)
    setToken("")
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  return (
    <>
      {user ? (
        <WishlistDashboard user={user} token={token} onLogout={handleLogout} />
      ) : (
        <AuthForm onLogin={handleLogin} />
      )}
      <Toaster />
    </>
  )
}
