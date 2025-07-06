"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string, imageUrl: string, price: number) => void
}

export default function AddProductDialog({ open, onOpenChange, onSubmit }: AddProductDialogProps) {
  const [name, setName] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [price, setPrice] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !price) return

    setIsSubmitting(true)
    await onSubmit(name.trim(), imageUrl.trim(), Number.parseFloat(price))
    setIsSubmitting(false)

    // Reset form
    setName("")
    setImageUrl("")
    setPrice("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Add a new product to your wishlist.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Wireless Headphones"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-image">Image URL</Label>
              <Input
                id="product-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-price">Price ($)</Label>
              <Input
                id="product-price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="99.99"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim() || !price}>
              {isSubmitting ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
