'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  CreditCard,
  Calendar,
  DollarSign,
  Download,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  Ticket,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface BillingItem {
  id: string
  date: string
  description: string
  amount: number
  discount: number
  netAmount: number
  couponCode: string | null
  status: string
  periodStart: string | null
  periodEnd: string | null
  creditsRemaining: number
}

interface BillingSummary {
  totalTransactions: number
  totalSpent: number
  totalDiscounts: number
  activeSubscription: BillingItem | null
}

export default function BillingHistoryPage() {
  const [history, setHistory] = useState<BillingItem[]>([])
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBillingHistory = async () => {
    try {
      const response = await fetch('/api/subscriptions/billing-history')
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setHistory(result.data.history)
      setSummary(result.data.summary)
    } catch (error) {
      toast.error('Failed to load billing history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingHistory()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/subscription" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Subscription
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Billing History</h1>
          <p className="text-muted-foreground mt-1">
            View your payment history and invoices
          </p>
        </div>
        <Button variant="outline" onClick={fetchBillingHistory}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${summary.totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalTransactions} transaction(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${summary.totalDiscounts.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From coupon discounts
              </p>
            </CardContent>
          </Card>

          <Card className={summary.activeSubscription ? 'border-green-300 bg-green-50/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Plan</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summary.activeSubscription ? (
                <>
                  <div className="text-lg font-bold text-foreground">
                    {summary.activeSubscription.description}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.activeSubscription.creditsRemaining} credits remaining
                  </p>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-muted-foreground">No Active Plan</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Link href="/dashboard/subscription" className="text-primary hover:underline">
                      Subscribe now
                    </Link>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            All your payments and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">No transactions yet</p>
              <Link href="/dashboard/subscription">
                <Button className="mt-4">View Plans</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Discount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(item.date), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{item.description}</div>
                        {item.couponCode && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Ticket className="h-3 w-3" />
                            {item.couponCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        ${item.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.discount > 0 ? (
                          <span className="text-green-600">-${item.discount.toFixed(2)}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        ${item.netAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.periodStart && item.periodEnd ? (
                          <span>
                            {format(new Date(item.periodStart), 'MMM d')} - {format(new Date(item.periodEnd), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          'One-time'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
