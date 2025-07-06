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
    const { userIds } = await request.json()

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Invalid user IDs" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const wishlists = db.collection("wishlists")
    const users = db.collection("users")

    // Check if wishlist exists and user has permission to invite
    const wishlist = await wishlists.findOne({
      _id: new ObjectId(params.id),
      createdBy: user.userId,
    })

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found or unauthorized" }, { status: 404 })
    }

    // Get user details for the invited users
    const invitedUsers = await users
      .find({
        _id: { $in: userIds.map((id) => new ObjectId(id)) },
      })
      .project({ password: 0 })
      .toArray()

    if (invitedUsers.length !== userIds.length) {
      return NextResponse.json({ error: "Some users not found" }, { status: 400 })
    }

    // Filter out users who are already members
    const newUserIds = userIds.filter((id) => !wishlist.members.includes(id))
    const newUsers = invitedUsers.filter((user) => !wishlist.members.includes(user._id.toString()))

    if (newUserIds.length === 0) {
      return NextResponse.json({ error: "All selected users are already members" }, { status: 400 })
    }

    // Add users to wishlist
    const result = await wishlists.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $addToSet: {
          members: { $each: newUserIds },
          memberUsernames: { $each: newUsers.map((u) => u.username) },
        },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully invited ${newUserIds.length} user(s)`,
      invitedUsers: newUsers.map((u) => ({ id: u._id, username: u.username, email: u.email })),
    })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
