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

export async function PUT(request: NextRequest, { params }: { params: { id: string; productId: string } }) {
  try {
    const user = await verifyToken(request)
    const { name, imageUrl, price } = await request.json()

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const wishlists = db.collection("wishlists")

    const result = await wishlists.updateOne(
      {
        _id: new ObjectId(params.id),
        "products._id": new ObjectId(params.productId),
        "products.addedBy": user.userId,
      },
      {
        $set: {
          "products.$.name": name,
          "products.$.imageUrl": imageUrl,
          "products.$.price": Number.parseFloat(price),
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; productId: string } }) {
  try {
    const user = await verifyToken(request)

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const wishlists = db.collection("wishlists")

    const result = await wishlists.updateOne(
      {
        _id: new ObjectId(params.id),
        $or: [{ createdBy: user.userId }, { "products.addedBy": user.userId }],
      },
      {
        $pull: { products: { _id: new ObjectId(params.productId) } },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
