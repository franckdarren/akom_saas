// hooks/use-activity-labels.ts
'use client'

import {getLabels, type ActivityLabels} from '@/lib/config/activity-labels'
import {useDashboard} from '@/components/providers/dashboard-provider'

export function useActivityLabels(): ActivityLabels {
    const {activityType} = useDashboard()
    return getLabels(activityType)
}