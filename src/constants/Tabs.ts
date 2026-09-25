import Icon from '@/components/ui/AppIcon';

export type TabId = 'index' | 'classes' | 'events' | 'meals' | 'school-rules/index' | 'settings';

export type TabLayoutItem = {
  id: TabId;
  visible: boolean;
};

export type TabDefinition = {
  id: TabId;
  title: string;
  icon: keyof typeof Icon.glyphMap;
  activeIcon: keyof typeof Icon.glyphMap;
  canHide: boolean;
  isPinned?: boolean;
};

export const TAB_DEFINITIONS: TabDefinition[] = [
  {
    id: 'index',
    title: 'ホーム',
    icon: 'home-outline',
    activeIcon: 'home',
    canHide: true,
  },
  {
    id: 'classes',
    title: '予定',
    icon: 'calendar-month-outline',
    activeIcon: 'calendar-month',
    canHide: true,
  },
  {
    id: 'events',
    title: '行事',
    icon: 'calendar-star',
    activeIcon: 'calendar-star',
    canHide: true,
  },
  {
    id: 'meals',
    title: '寮食',
    icon: 'food-outline',
    activeIcon: 'food',
    canHide: true,
  },
  {
    id: 'school-rules/index',
    title: '学則',
    icon: 'book-open-page-variant-outline',
    activeIcon: 'book-open-variant',
    canHide: true,
  },
  {
    id: 'settings',
    title: '設定',
    icon: 'cog-outline',
    activeIcon: 'cog',
    canHide: false,
    isPinned: true,
  },
];

export const DEFAULT_TAB_LAYOUT: TabLayoutItem[] = TAB_DEFINITIONS.map((tab) => ({
  id: tab.id,
  visible: true,
}));
