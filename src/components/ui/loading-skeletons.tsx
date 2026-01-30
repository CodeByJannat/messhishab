import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Skeleton for stat cards (4 columns)
export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="glass-card">
          <CardContent className="p-4 text-center">
            <Skeleton className="w-6 h-6 mx-auto mb-2 rounded-full" />
            <Skeleton className="h-4 w-16 mx-auto mb-2" />
            <Skeleton className="h-8 w-12 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton for 2 column summary cards
export function SummaryCardsSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {[...Array(2)].map((_, i) => (
        <Card key={i} className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="w-14 h-14 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton for 4 column financial cards
export function FinancialCardsSkeleton() {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="w-12 h-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton for meal breakdown cards
export function MealBreakdownSkeleton() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center p-4 bg-muted/30 rounded-xl">
              <Skeleton className="w-6 h-6 mx-auto mb-2 rounded-full" />
              <Skeleton className="h-4 w-12 mx-auto mb-2" />
              <Skeleton className="h-8 w-8 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for table with header
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex gap-4 pb-3 border-b border-border">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          {/* Rows */}
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for list items (deposits, notifications)
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for notification items
export function NotificationListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="p-3 bg-muted/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Full page skeleton for member portal
export function MemberPortalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {/* Meal Breakdown */}
      <MealBreakdownSkeleton />
      
      {/* Financial Summary */}
      <FinancialCardsSkeleton />
      
      {/* Deposit History */}
      <ListSkeleton rows={3} />
      
      {/* Notifications */}
      <NotificationListSkeleton rows={3} />
    </div>
  );
}

// Full page skeleton for meals page
export function MemberMealsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      {/* Summary Cards */}
      <StatCardsSkeleton />
      
      {/* Table */}
      <TableSkeleton rows={5} />
    </div>
  );
}

// Full page skeleton for deposits page
export function MemberDepositsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      {/* Summary Cards */}
      <SummaryCardsSkeleton />
      
      {/* Table */}
      <TableSkeleton rows={5} />
    </div>
  );
}
