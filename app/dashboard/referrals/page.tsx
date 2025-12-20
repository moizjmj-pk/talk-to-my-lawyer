'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Copy,
  Share2,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle,
  Link as LinkIcon,
  CheckCircle,
  Users,
  Ticket,
  TrendingUp,
  ExternalLink
} from 'lucide-react'

interface ReferralData {
  hasCoupon: boolean
  message?: string
  coupon?: {
    code: string
    discountPercent: number
    usageCount: number
    isActive: boolean
  }
  links?: {
    referral: string
    signup: string
    share: {
      twitter: string
      linkedin: string
      whatsapp: string
      email: string
    }
  }
}

export default function ReferralLinksPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/employee/referral-link')
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Only employees can access referral links')
          return
        }
        throw new Error('Failed to fetch')
      }
      const result = await response.json()
      setData(result.data)
    } catch (error) {
      toast.error('Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReferralData()
  }, [])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success(`${label} copied to clipboard!`)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data?.hasCoupon) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Referral Links</h1>
        <Card className="max-w-xl mx-auto">
          <CardContent className="p-12 text-center">
            <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Coupon Assigned</h3>
            <p className="text-muted-foreground">
              {data?.message || 'Please contact an administrator to get your referral coupon code.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { coupon, links } = data

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Referral Links</h1>
        <p className="text-muted-foreground mt-1">
          Share your referral links to earn commissions on every signup
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Code</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">{coupon?.code}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(coupon?.code || '', 'Code')}
              >
                {copied === 'Code' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {coupon?.discountPercent}% discount for users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupon?.usageCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              People used your code
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={coupon?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {coupon?.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {coupon?.isActive ? 'Ready to share' : 'Contact admin'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Your Referral Links
          </CardTitle>
          <CardDescription>
            Copy and share these links to earn commissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Referral Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">Homepage Referral Link</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={links?.referral || ''}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(links?.referral || '', 'Referral link')}
              >
                {copied === 'Referral link' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Signup Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">Direct Signup Link (Code Pre-filled)</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={links?.signup || ''}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(links?.signup || '', 'Signup link')}
              >
                {copied === 'Signup link' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Share Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Quick Share
          </CardTitle>
          <CardDescription>
            Share directly to your social networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => window.open(links?.share.twitter, '_blank')}
            >
              <Twitter className="h-6 w-6 text-[#1DA1F2]" />
              <span>Twitter / X</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => window.open(links?.share.linkedin, '_blank')}
            >
              <Linkedin className="h-6 w-6 text-[#0077B5]" />
              <span>LinkedIn</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => window.open(links?.share.whatsapp, '_blank')}
            >
              <MessageCircle className="h-6 w-6 text-[#25D366]" />
              <span>WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => window.open(links?.share.email, '_blank')}
            >
              <Mail className="h-6 w-6 text-gray-600" />
              <span>Email</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Tips for More Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              Share your link on professional networks like LinkedIn
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              Include your referral link in your email signature
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              Share success stories from users who've used the platform
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              Highlight the {coupon?.discountPercent}% discount your code provides
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
