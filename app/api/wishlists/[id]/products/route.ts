import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided")
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
  return decoded as any
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    const { name, imageUrl, price } = await request.json()

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const wishlists = db.collection("wishlists")

    const newProduct = {
      _id: new ObjectId(),
      name,
      imageUrl,
      price: Number.parseFloat(price),
      addedBy: user.userId,
      addedByUsername: user.username,
      addedAt: new Date(),
    }

    const result = await wishlists.updateOne(
      {
        _id: new ObjectId(params.id),
        $or: [{ createdBy: user.userId }, { members: user.userId }],
      },
      {
        $push: { products: newProduct },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Wishlist not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Product added successfully",
      product: newProduct,
    })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
