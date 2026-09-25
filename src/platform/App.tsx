import React, { Suspense, lazy, useEffect } from 'react';
import { View } from 'react-native';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import { TAB_DEFINITIONS } from '@/constants/Tabs';
import { Colors } from '@/constants/Colors';
import Icon from '@/components/ui/AppIcon';
import { RouteContext } from './router';
const Setup = lazy(() => import('@/components/InitialSetupModal').then(m => ({ default: m.InitialSetupModal })));
function Frame({ Screen, page }: { Screen: React.ComponentType; page: string }) {
  const settings = useSettings();
  const palette = Colors[settings.actualColorScheme];
  useEffect(() => {
    document.documentElement.dataset.theme = settings.actualColorScheme;
    document.documentElement.style.background = palette.background;
    document.body.style.background = palette.background;
    performance.mark('app-interactive');
  }, [settings.actualColorScheme]);
  return <View style={{flex:1,minHeight:0,backgroundColor:palette.background}}>
    <View style={{flex:1,minHeight:0}}><Screen /></View>
    <nav className="tabbar" aria-label="メインナビゲーション" style={{background:palette.background,borderColor:palette.border}}>
      {settings.tabLayout.filter(item=>item.visible).map(item=> {
        const tab = TAB_DEFINITIONS.find(tab=>tab.id===item.id)!;
        const selected = tab.id === page || (page === 'rule' && tab.id === 'school-rules/index');
        const color = selected ? palette.accent : palette.tabIconDefault;
        const href = tab.id === 'index' ? '/' : '/' + tab.id.replace('/index','');
        return <a key={tab.id} href={href} role="tab" aria-selected={selected} className="tab" style={{color}}>
          <span className="tab-icon" style={{transform:`scale(${selected?1:0.85})`}}><Icon name={selected?tab.activeIcon:tab.icon} size={26} color={color} /></span>
          <span className="tab-label">{tab.title}</span>
        </a>;
      })}
    </nav>
    {!settings.isLoading && !settings.hasCompletedInitialSetup && <Suspense fallback={null}><Setup visible onSave={(year,cls)=>{settings.setAdmissionYear(year);settings.setStudentClass(cls);}} /></Suspense>}
  </View>;
}
export function App({ Screen, page, params = {} }: { Screen: React.ComponentType; page: string; params?: Record<string, any> }) {
  return <RouteContext.Provider value={params}><SettingsProvider><ScheduleProvider><Frame Screen={Screen} page={page} /></ScheduleProvider></SettingsProvider></RouteContext.Provider>;
}
