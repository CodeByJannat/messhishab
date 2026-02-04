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

// Skeleton for 3 column cards
export function ThreeColumnCardsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="glass-card">
          <CardContent className="p-4 text-center">
            <Skeleton className="w-6 h-6 mx-auto mb-2 rounded-full" />
            <Skeleton className="h-4 w-24 mx-auto mb-2" />
            <Skeleton className="h-8 w-20 mx-auto" />
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

// Skeleton for table without header card (inline table)
export function InlineTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex gap-4 pb-3 border-b border-border">
            <Skeleton className="h-4 flex-1 max-w-24" />
            <Skeleton className="h-4 flex-1 max-w-20" />
            <Skeleton className="h-4 flex-1 max-w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          {/* Rows */}
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex gap-4 py-2 items-center">
              <Skeleton className="h-5 flex-1 max-w-24" />
              <Skeleton className="h-5 flex-1 max-w-20" />
              <Skeleton className="h-5 flex-1 max-w-32" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-8 rounded-lg" />
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

// Page header skeleton
export function PageHeaderSkeleton({ hasActions = false }: { hasActions?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      {hasActions && (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-[180px] rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      )}
    </div>
  );
}

// Messaging page skeleton
export function MessagingPageSkeleton() {
  return (
    <div className="space-y-6 h-[calc(100vh-120px)]">
      {/* Header */}
      <PageHeaderSkeleton hasActions />
      
      {/* Tabs */}
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100%-180px)]">
        {/* Conversation List */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Chat Area */}
        <Card className="glass-card lg:col-span-2 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-40'} rounded-2xl`} />
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Skeleton className="h-12 flex-1 rounded-xl" />
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Manager meals page skeleton with tabs
export function ManagerMealsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton hasActions />
      
      {/* Tabs */}
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      
      {/* Date picker */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
      
      {/* Table */}
      <InlineTableSkeleton rows={6} />
    </div>
  );
}

// Manager members page skeleton
export function ManagerMembersPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton hasActions />
      
      {/* Search */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 max-w-sm rounded-xl" />
      </div>
      
      {/* Table */}
      <InlineTableSkeleton rows={8} />
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Manager balance page skeleton
export function ManagerBalancePageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton hasActions />
      
      {/* Summary cards */}
      <StatCardsSkeleton />
      
      {/* Table */}
      <InlineTableSkeleton rows={6} />
    </div>
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

// Member bazar page skeleton
export function MemberBazarPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton hasActions />
      <InlineTableSkeleton rows={6} />
    </div>
  );
}
