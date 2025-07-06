"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, LogOut, Users, ShoppingBag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import CreateWishlistDialog from "./create-wishlist-dialog"
import WishlistView from "./wishlist-view"
import type { Wishlist } from "@/lib/models"

interface WishlistDashboardProps {
  user: any
  token: string
  onLogout: () => void
}

export default function WishlistDashboard({ user, token, onLogout }: WishlistDashboardProps) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchWishlists()
  }, [])

  const fetchWishlists = async () => {
    try {
      const response = await fetch("/api/wishlists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWishlists(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch wishlists",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWishlist = async (name: string, description: string) => {
    try {
      const response = await fetch("/api/wishlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      })

      if (response.ok) {
        const data = await response.json()
        setWishlists([...wishlists, data.wishlist])
        setIsCreateDialogOpen(false)
        toast({
          title: "Success",
          description: "Wishlist created successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to create wishlist",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (selectedWishlist) {
    return (
      <WishlistView
        wishlist={selectedWishlist}
        user={user}
        token={token}
        onBack={() => setSelectedWishlist(null)}
        onWishlistUpdate={(updatedWishlist) => {
          setSelectedWishlist(updatedWishlist)
          setWishlists(wishlists.map((w) => (w._id === updatedWishlist._id ? updatedWishlist : w)))
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Wishlists</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.username}!</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Wishlist
              </Button>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading wishlists...</div>
          </div>
        ) : wishlists.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No wishlists yet</h3>
            <p className="text-gray-600 mb-6">Create your first wishlist to get started!</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Wishlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((wishlist) => (
              <Card
                key={wishlist._id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedWishlist(wishlist)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{wishlist.name}</span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      {wishlist.members.length}
                    </div>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{wishlist.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{wishlist.products.length} items</span>
                    <span>by {wishlist.createdByUsername}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Created {new Date(wishlist.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <CreateWishlistDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateWishlist}
      />
    </div>
  )
}
