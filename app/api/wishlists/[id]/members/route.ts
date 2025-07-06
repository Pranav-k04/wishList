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
    const users = db.collection("users")

    // Check if user has access to this wishlist
    const wishlist = await wishlists.findOne({
      _id: new ObjectId(params.id),
      $or: [{ createdBy: user.userId }, { members: user.userId }],
    })

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found or unauthorized" }, { status: 404 })
    }

    // Get detailed member information
    const members = await users
      .find({
        _id: { $in: wishlist.members.map((id) => new ObjectId(id)) },
      })
      .project({ password: 0, createdAt: 0 })
      .toArray()

    return NextResponse.json({ members })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    const { searchParams } = new URL(request.url)
    const memberIdToRemove = searchParams.get("memberId")

    if (!memberIdToRemove) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const wishlists = db.collection("wishlists")
    const users = db.collection("users")

    // Get the member's username for removal
    const memberToRemove = await users.findOne({ _id: new ObjectId(memberIdToRemove) })
    if (!memberToRemove) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Only wishlist creator can remove members (or members can remove themselves)
    const result = await wishlists.updateOne(
      {
        _id: new ObjectId(params.id),
        $or: [
          { createdBy: user.userId }, // Creator can remove anyone
          { $and: [{ members: user.userId }, { _id: new ObjectId(params.id) }] }, // Member can remove themselves
        ],
      },
      {
        $pull: {
          members: memberIdToRemove,
          memberUsernames: memberToRemove.username,
        },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Unauthorized to remove member" }, { status: 403 })
    }

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
