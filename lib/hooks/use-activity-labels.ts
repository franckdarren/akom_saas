// hooks/use-activity-labels.ts
'use client'

import {getLabels, type ActivityLabels} from '@/lib/config/activity-labels'
import {useRestaurant} from '@/lib/hooks/use-restaurant'

export function useActivityLabels(): ActivityLabels {
    const {currentRestaurant} = useRestaurant()
    return getLabels(currentRestaurant?.activityType)
}