'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  DollarSign,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  CreditCard,
  Building,
  ArrowUpRight,
  History,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface PayoutSummary {
  totalEarned: number
  totalPaid: number
  pendingAmount: number
  availableForPayout: number
  requestedAmount: number
}

interface Commission {
  id: string
  amount: number
  status: string
  created_at: string
}

interface PayoutRequest {
  id: string
  amount: number
  status: string
  payment_method: string
  created_at: string
  processed_at?: string
}

export default function PayoutsPage() {
  const [summary, setSummary] = useState<PayoutSummary | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    paymentDetails: '',
    notes: ''
  })

  const fetchPayoutData = async () => {
    try {
      const response = await fetch('/api/employee/payouts')
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Only employees can access payouts')
          return
        }
        throw new Error('Failed to fetch')
      }
      const result = await response.json()
      setSummary(result.data.summary)
      setCommissions(result.data.commissions)
      setPayoutRequests(result.data.payoutRequests)
    } catch (error) {
      toast.error('Failed to load payout data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayoutData()
  }, [])

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutForm.amount)
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (summary && amount > summary.availableForPayout) {
      toast.error(`Maximum available: $${summary.availableForPayout.toFixed(2)}`)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/employee/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: payoutForm.paymentMethod,
          paymentDetails: payoutForm.paymentDetails,
          notes: payoutForm.notes
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request payout')
      }

      toast.success(result.message || 'Payout request submitted!')
      setRequestDialogOpen(false)
      setPayoutForm({ amount: '', paymentMethod: 'bank_transfer', paymentDetails: '', notes: '' })
      fetchPayoutData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to request payout')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'paid':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800"><ArrowUpRight className="h-3 w-3 mr-1" />Processing</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your commission payouts and request withdrawals
          </p>
        </div>
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!summary || summary.availableForPayout <= 0}>
              <Plus className="h-4 w-4 mr-2" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Available balance: ${summary?.availableForPayout.toFixed(2) || '0.00'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={summary?.availableForPayout || 0}
                  placeholder="0.00"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select
                  value={payoutForm.paymentMethod}
                  onValueChange={(value) => setPayoutForm({ ...payoutForm, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Payment Details</Label>
                <Textarea
                  id="details"
                  placeholder="Enter your payment details (account number, PayPal email, etc.)"
                  value={payoutForm.paymentDetails}
                  onChange={(e) => setPayoutForm({ ...payoutForm, paymentDetails: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes"
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRequestPayout} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${summary.totalEarned.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Already withdrawn</p>
            </CardContent>
          </Card>

          <Card className={summary.pendingAmount > 0 ? 'border-yellow-300 bg-yellow-50/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ${summary.pendingAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card className={summary.availableForPayout > 0 ? 'border-green-300 bg-green-50/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <Wallet className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${summary.availableForPayout.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payout Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payout Requests
          </CardTitle>
          <CardDescription>Your withdrawal history</CardDescription>
        </CardHeader>
        <CardContent>
          {payoutRequests.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">No payout requests yet</p>
              {summary && summary.availableForPayout > 0 && (
                <Button className="mt-4" onClick={() => setRequestDialogOpen(true)}>
                  Request Your First Payout
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payoutRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        ${Number(request.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {request.payment_method.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(request.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Commissions
          </CardTitle>
          <CardDescription>Your earnings from referrals</CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">No commissions earned yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Share your referral link to start earning!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.slice(0, 10).map((commission) => (
                    <tr key={commission.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(commission.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        +${Number(commission.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(commission.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Payout Information</p>
              <p className="text-blue-700 mt-1">
                Payouts are processed within 5-7 business days. Minimum payout amount is $50. 
                For questions, contact support.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
