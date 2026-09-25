import { useCallback, useEffect, useMemo, useState } from 'react';

import { useClasses } from '@/hooks/useClasses';
import { useDormitoryEvents } from '@/hooks/useDormitoryEvents';
import { useMeals } from '@/hooks/useMeals';
import type { DashboardMeal } from '@/types/home';

export function useHomeDashboardData() {
  const {
    getTodayClasses,
    loading: classesLoading,
    error: classesError,
    refetch: refetchClasses,
  } = useClasses();
  const {
    getNextMeal,
    loading: mealsLoading,
    error: mealsError,
    refetch: refetchMeals,
  } = useMeals();
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    academicYear,
    refetch: refetchEvents,
  } = useDormitoryEvents();

  const [refreshing, setRefreshing] = useState(false);
  const [nextMeal, setNextMeal] = useState<DashboardMeal>(null);

  const todayClasses = useMemo(() => getTodayClasses(), [getTodayClasses]);

  useEffect(() => {
    let mounted = true;

    getNextMeal()
      .then((meal) => {
        if (mounted) {
          setNextMeal(meal);
        }
      })
      .catch(() => {
        if (mounted) {
          setNextMeal(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [getNextMeal]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchClasses(),
        refetchMeals(),
        refetchEvents(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchClasses, refetchEvents, refetchMeals]);

  return {
    todayClasses,
    classesLoading,
    classesError,
    nextMeal,
    mealsLoading,
    mealsError,
    events,
    eventsLoading,
    eventsError,
    academicYear,
    refreshing,
    refresh,
  };
}
