import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import jwt from "jsonwebtoken"

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided")
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
  return decoded as any
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const wishlists = db.collection("wishlists")

    // Get wishlists where user is creator or member
    const userWishlists = await wishlists
      .find({
        $or: [{ createdBy: user.userId }, { members: user.userId }],
      })
      .toArray()

    return NextResponse.json(userWishlists)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    const { name, description } = await request.json()

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const wishlists = db.collection("wishlists")

    const newWishlist = {
      name,
      description,
      createdBy: user.userId,
      createdByUsername: user.username,
      members: [user.userId],
      memberUsernames: [user.username],
      products: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await wishlists.insertOne(newWishlist)

    return NextResponse.json({
      message: "Wishlist created successfully",
      wishlist: { ...newWishlist, _id: result.insertedId },
    })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
