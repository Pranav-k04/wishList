export interface User {
  _id?: string
  email: string
  username: string
  password: string
  createdAt: Date
}

export interface Product {
  _id?: string
  name: string
  imageUrl: string
  price: number
  addedBy: string
  addedByUsername: string
  addedAt: Date
}

export interface Wishlist {
  _id?: string
  name: string
  description: string
  createdBy: string
  createdByUsername: string
  members: string[]
  memberUsernames: string[]
  products: Product[]
  createdAt: Date
  updatedAt: Date
}
