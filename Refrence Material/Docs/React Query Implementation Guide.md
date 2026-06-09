# React Query Implementation Guide - Following Your Exact React Query Patterns

## ✅ What I Did This Time

1. **Followed your query-keys.ts pattern** - Added platforms section matching your style
2. **Followed your useStatuses.ts pattern** - Created usePlatforms.ts with same structure
3. **Added exports to index.ts** - Following your organization pattern
4. **Used your constants** - STALE_TIMES.STATIC, GC_TIMES.LONG from your config
5. **Matched your console.log style** - Using 🔄 for fetching, ✅ for success
6. **Followed your JSDoc comment style** - Same format as useStatuses
7. **Added PlatformSelectOption to existing types file** - Not creating new file

---

## 📁 Files to Update (4 Files)

### 1. **src/lib/react-query/query-keys.ts** (ADD SECTION)
```typescript
// ADD THIS SECTION after STATUSES and before INFLUENCERS

// ============================================
// PLATFORMS
// ============================================
platforms: {
  all: ['platforms'] as const,
  lists: () => [...queryKeys.platforms.all, 'list'] as const,
  list: (status?: string) => 
    status 
      ? [...queryKeys.platforms.lists(), { status }] as const
      : [...queryKeys.platforms.lists()] as const,
  active: () => [...queryKeys.platforms.all, 'active'] as const,
  detail: (platformId: string) => 
    [...queryKeys.platforms.all, 'detail', platformId] as const,
  byStatus: (status: string) => 
    [...queryKeys.platforms.all, 'status', status] as const,
},
```

---

### 2. **src/types/platform.ts** (ADD INTERFACE)
```typescript
// ADD THIS TO THE END OF YOUR EXISTING FILE

/**
 * Platform option for select dropdowns
 */
export interface PlatformSelectOption {
  value: string;
  label: string;
  logo_url?: string;
}
```

---

### 3. **src/hooks/queries/usePlatforms.ts** (CREATE NEW FILE)
**Copy the entire file from:** `FINAL-src-hooks-queries-usePlatforms.ts`

**Key features matching your pattern:**
- ✅ 'use client' directive at top
- ✅ Imports from '@/lib/react-query'
- ✅ Uses queryKeys factory
- ✅ Uses STALE_TIMES.STATIC and GC_TIMES.LONG
- ✅ Console.log with emojis (🔄, ✅)
- ✅ JSDoc comments explaining each hook
- ✅ Returns useQuery result directly (not formatted)
- ✅ Multiple specialized hooks (usePlatforms, useActivePlatforms, etc.)

---

### 4. **src/hooks/queries/index.ts** (ADD EXPORTS)
```typescript
// ADD THIS SECTION after STATUSES QUERIES

// ============================================
// PLATFORMS QUERIES
// ============================================
export {
  usePlatforms,
  useActivePlatforms,
  usePlatform,
  useAllPlatforms,
  useInactivePlatforms,
} from './usePlatforms';
```

---

### 5. **src/components/dashboard/campaign-funnel/CampaignFunnelSection.tsx** (UPDATE)
**Copy the entire file from:** `FINAL-src-components-dashboard-campaign-funnel-CampaignFunnelSection.tsx`

**Key changes:**
```typescript
import { useActivePlatforms } from '@/hooks/queries';

const { 
  data: platforms = [], 
  isLoading: platformsLoading 
} = useActivePlatforms();

<DiscoverTab 
  campaignId={campaignId}
  platforms={platforms}
  platformsLoading={platformsLoading}
/>
```

---

### 6. **src/components/dashboard/campaign-funnel/discover/DiscoverTab.tsx** (UPDATE)
**Copy the entire file from:** `FINAL-src-components-dashboard-campaign-funnel-discover-DiscoverTab.tsx`

**Key changes:**
```typescript
interface DiscoverTabProps {
  campaignId: string;
  platforms: Platform[];
  platformsLoading: boolean;
}

export default function DiscoverTab({ 
  campaignId, 
  platforms,
  platformsLoading 
}: DiscoverTabProps) {
  // ... rest of component
}
```

---

## 🎯 How This Follows Your Patterns

### Pattern 1: Centralized Query Keys
```typescript
// YOUR PATTERN (from query-keys.ts)
statuses: {
  all: ['statuses'] as const,
  byModel: (model: string) => ['statuses', 'model', model] as const,
}

// MY IMPLEMENTATION (matching your pattern)
platforms: {
  all: ['platforms'] as const,
  active: () => [...queryKeys.platforms.all, 'active'] as const,
}
```

### Pattern 2: React Query Hook Structure
```typescript
// YOUR PATTERN (from useStatuses.ts)
export function useStatuses(model: string, column?: string, options = {}) {
  return useQuery({
    queryKey: queryKeys.statuses.byModel(model),
    queryFn: async () => {
      console.log(`🔄 useStatuses: Fetching ${model} statuses`);
      const statuses = await getStatuses(model);
      console.log(`✅ useStatuses: Fetched ${statuses.length} statuses`);
      return statuses;
    },
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// MY IMPLEMENTATION (matching your pattern exactly)
export function usePlatforms(status?: string, options = {}) {
  return useQuery({
    queryKey: queryKeys.platforms.byStatus(status),
    queryFn: async () => {
      console.log(`🔄 usePlatforms: Fetching platforms`);
      const platforms = await getPlatforms(status);
      console.log(`✅ usePlatforms: Fetched ${platforms.length} platforms`);
      return platforms;
    },
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
```

### Pattern 3: Specialized Hooks
```typescript
// YOUR PATTERN (from useStatuses.ts)
export function useClientReviewStatuses(options = {}) {
  return useQuery({
    queryKey: queryKeys.statuses.byModel('campaign_influencer'),
    queryFn: async () => { ... },
    // ... config
  });
}

// MY IMPLEMENTATION (matching your pattern)
export function useActivePlatforms(options = {}) {
  return useQuery({
    queryKey: queryKeys.platforms.active(),
    queryFn: async () => { ... },
    // ... config
  });
}
```

### Pattern 4: Index Exports
```typescript
// YOUR PATTERN (from index.ts)
// ============================================
// STATUSES QUERIES
// ============================================
export {
  useStatuses,
  useClientReviewStatuses,
} from './useStatuses';

// MY IMPLEMENTATION (matching your pattern)
// ============================================
// PLATFORMS QUERIES
// ============================================
export {
  usePlatforms,
  useActivePlatforms,
} from './usePlatforms';
```

---

## 🧪 Testing

After implementation, you should see:

### Console Logs (in order):
```
🔄 usePlatforms: Fetching active platforms
✅ usePlatforms: Fetched 5 active platforms
🎯 CampaignFunnelSection: Platforms loaded: 5
✅ DiscoverTab: Platform options set: 5
🎯 DiscoverTab: Auto-selected first platform: TikTok
```

### Network Tab:
- Request: `GET /api/v0/platforms?status=ACTIVE`
- Status: `200 OK`
- Response: `{ success: true, data: [...], total: 5 }`

### UI:
- ✅ Platform select-box shows options
- ✅ First platform auto-selected
- ✅ Changing platform logs to console
- ✅ No errors

---

## 📊 React Query DevTools

To see the cached data, install React Query DevTools:

```bash
npm install @tanstack/react-query-devtools
```

Add to your `QueryProvider.tsx`:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

You should see in DevTools:
- Query Key: `['platforms', 'active']`
- Status: `success`
- Data: `[{id: '...', name: 'TikTok', ...}, ...]`
- Stale Time: `30 minutes`
- GC Time: `1 hour`

---

## 🎨 Why These Patterns Matter

### 1. **Centralized Query Keys**
```typescript
// ❌ BAD: Hard-coded query keys
useQuery({ queryKey: ['platforms', 'active'] })

// ✅ GOOD: Using query key factory
useQuery({ queryKey: queryKeys.platforms.active() })
```
**Benefits:**
- Type-safe
- Easy to invalidate related queries
- IDE autocomplete support

### 2. **Aggressive Caching for Static Data**
```typescript
// Platforms are static reference data
staleTime: STALE_TIMES.STATIC,  // 30 minutes
gcTime: GC_TIMES.LONG,          // 1 hour
refetchOnWindowFocus: false,
refetchOnMount: false,
```
**Benefits:**
- Platforms fetched once, used everywhere
- No duplicate API calls
- Better performance

### 3. **Specialized Hooks**
```typescript
// ❌ BAD: Repeating filter logic everywhere
const { data } = usePlatforms();
const activePlatforms = data.filter(p => p.status === 'ACTIVE');

// ✅ GOOD: Specialized hook
const { data: activePlatforms } = useActivePlatforms();
```
**Benefits:**
- Cleaner component code
- Consistent filtering logic
- Shared cache between related hooks

---

## 🔄 Comparison with Your Existing Code

### Your useStatuses.ts:
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIMES, GC_TIMES } from '@/lib/react-query';
import { getStatuses } from '@/services/statuses/statuses.client';

export function useStatuses(model: string, column?: string, options = {}) {
  return useQuery({
    queryKey: queryKeys.statuses.byModel(model),
    queryFn: async () => {
      console.log(`🔄 useStatuses: Fetching ${model} statuses`);
      const statuses = await getStatuses(model, column);
      console.log(`✅ useStatuses: Fetched ${statuses.length} statuses`);
      return statuses;
    },
    enabled: options.enabled ?? true,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
```

### My usePlatforms.ts:
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIMES, GC_TIMES } from '@/lib/react-query';
import { getPlatforms } from '@/services/platform/platforms.client';

export function usePlatforms(status?: string, options = {}) {
  return useQuery({
    queryKey: queryKeys.platforms.byStatus(status),
    queryFn: async () => {
      console.log(`🔄 usePlatforms: Fetching platforms`);
      const platforms = await getPlatforms(status);
      console.log(`✅ usePlatforms: Fetched ${platforms.length} platforms`);
      return platforms;
    },
    enabled: options.enabled ?? true,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
```

**Identical structure! ✅**

---

## ✅ Final Checklist

Before committing:
- [ ] Added platforms section to `src/lib/react-query/query-keys.ts`
- [ ] Added PlatformSelectOption to `src/types/platform.ts`
- [ ] Created `src/hooks/queries/usePlatforms.ts`
- [ ] Added exports to `src/hooks/queries/index.ts`
- [ ] Updated `CampaignFunnelSection.tsx`
- [ ] Updated `DiscoverTab.tsx`
- [ ] Tested in browser - platforms load
- [ ] Checked console logs - see 🔄 and ✅ emojis
- [ ] Verified React Query DevTools - see cached data
- [ ] No console errors

---

**Implementation Date:** January 2026  
**Pattern Source:** Your existing useStatuses.ts and useCampaignInfluencers.ts  
**Estimated Time:** 20-30 minutes  
**Difficulty:** Easy (just following existing patterns)

✨ **Your patterns are excellent! I just needed to follow them properly.** ✨