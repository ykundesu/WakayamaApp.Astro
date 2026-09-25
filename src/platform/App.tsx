import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import { TAB_DEFINITIONS } from '@/constants/Tabs';
import { Colors } from '@/constants/Colors';
import Icon from '@/components/ui/AppIcon';
import { RouteContext, routeAtLocation, followLink } from './router';
import { FocusContext } from './navigation';
const Setup = lazy(() => import('@/components/InitialSetupModal').then(m => ({ default: m.InitialSetupModal })));
const loaders: Record<string, () => Promise<{default: React.ComponentType}>> = {
  index: () => import('@/components/home/HomeScreenContent').then(m => ({default:m.HomeScreenContent})),
  classes: () => import('@/screens/classes'), events: () => import('@/screens/events'),
  meals: () => import('@/screens/meals'), settings: () => import('@/screens/settings'),
  'school-rules/index': () => import('@/screens/school-rules'), rule: () => import('@/screens/rule'),
  changelog: () => import('@/screens/changelog'),
};
type Route = {page: string; params: Record<string, any>; Screen: React.ComponentType};
function Frame({ Screen, page: initialPage, params }: Route) {
  const [route, setRoute] = useState<Route>({Screen,page:initialPage,params});
  const [pages, setPages] = useState<Record<string, Route>>({[initialPage]:route});
  const navigationId = useRef(0);
  const page = route.page;
  useEffect(() => {
    const change = async () => {
      const next = routeAtLocation();
      const id = ++navigationId.current;
      if (!loaders[next.page]) { location.reload(); return; }
      try {
        const {default: Component} = await loaders[next.page]();
        if (id !== navigationId.current) return;
        const nextRoute = {...next, Screen: Component};
        setPages(previous => ({...previous,[next.page]:nextRoute}));
        setRoute(nextRoute);
        setBack(true);
      } catch { location.reload(); }
    };
    window.addEventListener('wakosen:navigate',change);
    window.addEventListener('popstate',change);
    return () => {window.removeEventListener('wakosen:navigate',change);window.removeEventListener('popstate',change);};
  }, []);
  useEffect(() => {
    const title = page === 'rule' ? '学則' : page === 'changelog' ? '変更履歴' : TAB_DEFINITIONS.find(tab=>tab.id===page)?.title || 'ホーム';
    document.title = `${title}｜和歌山高専 非公式アプリ`;
  }, [page]);
  const settings = useSettings();
  const [back,setBack]=useState(false);
  useEffect(()=>setBack(!!document.referrer&&new URL(document.referrer).origin===location.origin),[]);
  const palette = Colors[settings.actualColorScheme];
  useEffect(() => {
    document.documentElement.dataset.theme = settings.actualColorScheme;
    document.documentElement.style.background = palette.background;
    document.body.style.background = palette.background;
    performance.mark('app-interactive');
  }, [settings.actualColorScheme]);
  return <View style={{flex:1,minHeight:0,backgroundColor:palette.background}}>
    {page==='changelog' && <header style={{height:64,flexShrink:0,display:'flex',alignItems:'center',padding:'0 16px',borderBottom:`1px solid ${palette.border}`,color:settings.actualColorScheme==='dark'?'white':'black',fontSize:18,fontWeight:500}}>{back&&<a href="/settings" onClick={followLink} aria-label="戻る" style={{marginRight:24,color:'inherit'}}><Icon name="arrow-left" size={24}/></a>}変更履歴</header>}
    {Object.values(pages).map(saved => <View key={saved.page} style={{flex:1,minHeight:0,display:saved.page===page?'flex':'none'}}>
      <FocusContext.Provider value={saved.page===page}><RouteContext.Provider value={saved.params}>
        <saved.Screen key={saved.page==='rule'?saved.params.ruleId:saved.page} />
      </RouteContext.Provider></FocusContext.Provider>
    </View>)}
    {page!=='changelog' && <nav className="tabbar" aria-label="メインナビゲーション" style={{background:palette.background,borderColor:palette.border}}>
      {settings.tabLayout.filter(item=>item.visible).map(item=> {
        const tab = TAB_DEFINITIONS.find(tab=>tab.id===item.id)!;
        const selected = tab.id === page || (page === 'rule' && tab.id === 'school-rules/index');
        const color = selected ? palette.accent : palette.tabIconDefault;
        const href = tab.id === 'index' ? '/' : '/' + tab.id.replace('/index','');
        return <a key={tab.id} href={href} onClick={followLink} role="tab" aria-label={tab.title} aria-selected={selected} className="tab" style={{color}}>
          <span className="tab-icon" style={{transform:`scale(${selected?1:0.85})`}}><Icon name={selected?tab.activeIcon:tab.icon} size={26} color={color} /></span>
          <span className="tab-label">{tab.title}</span>
        </a>;
      })}
    </nav>}
    {!settings.isLoading && !settings.hasCompletedInitialSetup && <Suspense fallback={null}><Setup visible onSave={(year,cls)=>{settings.setAdmissionYear(year);settings.setStudentClass(cls);}} /></Suspense>}
  </View>;
}
export function App({ Screen, page, params = {} }: { Screen: React.ComponentType; page: string; params?: Record<string, any> }) {
  return <RouteContext.Provider value={params}><SettingsProvider><ScheduleProvider><Frame Screen={Screen} page={page} params={params} /></ScheduleProvider></SettingsProvider></RouteContext.Provider>;
}
