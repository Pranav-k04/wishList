"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Crown, UserMinus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Member {
  _id: string
  username: string
  email: string
}

interface WishlistMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wishlistId: string
  createdBy: string
  currentUserId: string
  token: string
}

export default function WishlistMembersDialog({
  open,
  onOpenChange,
  wishlistId,
  createdBy,
  currentUserId,
  token,
}: WishlistMembersDialogProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchMembers()
    }
  }, [open])

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch members",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching members",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this wishlist?`)) {
      return
    }

    try {
      const response = await fetch(`/api/wishlists/${wishlistId}/members?memberId=${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setMembers(members.filter((m) => m._id !== memberId))
        toast({
          title: "Success",
          description: `${memberName} has been removed from the wishlist`,
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to remove member",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while removing member",
        variant: "destructive",
      })
    }
  }

  const isCreator = currentUserId === createdBy

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Wishlist Members ({members.length})
          </DialogTitle>
          <DialogDescription>People who have access to this wishlist</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4 text-sm text-gray-500">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">No members found</div>
          ) : (
            members.map((member) => (
              <div key={member._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{member.username}</p>
                      {member._id === createdBy && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Creator
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                </div>

                {/* Remove button - only show if current user is creator and member is not creator */}
                {isCreator && member._id !== createdBy && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveMember(member._id, member.username)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}

                {/* Leave button - show if current user is the member and not creator */}
                {!isCreator && member._id === currentUserId && member._id !== createdBy && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveMember(member._id, "yourself")}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Leave
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
