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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const wishlists = db.collection("wishlists")

    const wishlist = await wishlists.findOne({
      _id: new ObjectId(params.id),
      $or: [{ createdBy: user.userId }, { members: user.userId }],
    })

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
    }

    return NextResponse.json(wishlist)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    const { name, description } = await request.json()

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const wishlists = db.collection("wishlists")

    const result = await wishlists.updateOne(
      {
        _id: new ObjectId(params.id),
        createdBy: user.userId,
      },
      {
        $set: {
          name,
          description,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Wishlist not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "Wishlist updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const wishlists = db.collection("wishlists")

    const result = await wishlists.deleteOne({
      _id: new ObjectId(params.id),
      createdBy: user.userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Wishlist not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "Wishlist deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
