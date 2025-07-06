"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Edit, Trash2, Users, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AddProductDialog from "./add-product-dialog"
import EditProductDialog from "./edit-product-dialog"
import type { Wishlist, Product } from "@/lib/models"
import Image from "next/image"
import InviteUsersDialog from "./invite-users-dialog"
import WishlistMembersDialog from "./wishlist-members-dialog"

interface WishlistViewProps {
  wishlist: Wishlist
  user: any
  token: string
  onBack: () => void
  onWishlistUpdate: (wishlist: Wishlist) => void
}

export default function WishlistView({ wishlist, user, token, onBack, onWishlistUpdate }: WishlistViewProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const { toast } = useToast()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)

  const handleAddProduct = async (name: string, imageUrl: string, price: number) => {
    try {
      const response = await fetch(`/api/wishlists/${wishlist._id}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, imageUrl, price }),
      })

      if (response.ok) {
        const data = await response.json()
        const updatedWishlist = {
          ...wishlist,
          products: [...wishlist.products, data.product],
        }
        onWishlistUpdate(updatedWishlist)
        setIsAddDialogOpen(false)
        toast({
          title: "Success",
          description: "Product added successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to add product",
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

  const handleEditProduct = async (productId: string, name: string, imageUrl: string, price: number) => {
    try {
      const response = await fetch(`/api/wishlists/${wishlist._id}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, imageUrl, price }),
      })

      if (response.ok) {
        const updatedProducts = wishlist.products.map((p) =>
          p._id === productId ? { ...p, name, imageUrl, price } : p,
        )
        const updatedWishlist = { ...wishlist, products: updatedProducts }
        onWishlistUpdate(updatedWishlist)
        setEditingProduct(null)
        toast({
          title: "Success",
          description: "Product updated successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update product",
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

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/wishlists/${wishlist._id}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const updatedProducts = wishlist.products.filter((p) => p._id !== productId)
        const updatedWishlist = { ...wishlist, products: updatedProducts }
        onWishlistUpdate(updatedWishlist)
        toast({
          title: "Success",
          description: "Product deleted successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete product",
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

  const handleInviteUsers = async (userIds: string[]) => {
    try {
      const response = await fetch(`/api/wishlists/${wishlist._id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds }),
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh wishlist data to show new members
        const updatedWishlist = {
          ...wishlist,
          members: [...wishlist.members, ...userIds],
          memberUsernames: [...wishlist.memberUsernames, ...data.invitedUsers.map((u) => u.username)],
        }
        onWishlistUpdate(updatedWishlist)
        setIsInviteDialogOpen(false)
        toast({
          title: "Success",
          description: data.message,
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to invite users",
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

  const totalValue = wishlist.products.reduce((sum, product) => sum + product.price, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{wishlist.name}</h1>
                <p className="text-sm text-gray-600">{wishlist.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div
                  className="flex items-center text-sm text-gray-600 cursor-pointer"
                  onClick={() => setIsMembersDialogOpen(true)}
                >
                  <Users className="w-4 h-4 mr-1" />
                  {wishlist.members.length} members
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 mr-1" />${totalValue.toFixed(2)} total
                </div>
              </div>
              {wishlist.createdBy === user.id && (
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Invite Users
                </Button>
              )}
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wishlist.products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.products.map((product) => (
              <Card key={product._id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={product.imageUrl || "/placeholder.svg?height=200&width=200"}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <CardDescription className="text-lg font-semibold text-green-600">
                    ${product.price.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                    <span>Added by {product.addedByUsername}</span>
                    <span>{new Date(product.addedAt).toLocaleDateString()}</span>
                  </div>
                  {product.addedBy === user.id && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingProduct(product)} className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product._id!)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AddProductDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSubmit={handleAddProduct} />

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSubmit={(name, imageUrl, price) => handleEditProduct(editingProduct._id!, name, imageUrl, price)}
        />
      )}

      <InviteUsersDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInvite={handleInviteUsers}
        token={token}
      />

      <WishlistMembersDialog
        open={isMembersDialogOpen}
        onOpenChange={setIsMembersDialogOpen}
        wishlistId={wishlist._id!}
        createdBy={wishlist.createdBy}
        currentUserId={user.id}
        token={token}
      />
    </div>
  )
}
