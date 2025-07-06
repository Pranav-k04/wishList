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
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    const client = await clientPromise
    const db = client.db("wishlist_app")
    const users = db.collection("users")

    // Search users by email or username (excluding current user)
    const searchResults = await users
      .find({
        $and: [
          { _id: { $ne: user.userId } },
          {
            $or: [{ email: { $regex: query, $options: "i" } }, { username: { $regex: query, $options: "i" } }],
          },
        ],
      })
      .project({ password: 0 }) // Exclude password from results
      .limit(10)
      .toArray()

    return NextResponse.json({ users: searchResults })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
