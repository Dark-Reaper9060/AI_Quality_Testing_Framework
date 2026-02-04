// Internationalization configuration
export type Language = 'en' | 'hi' | 'ta' | 'zh' | 'ko' | 'ja';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

// Translation strings
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.workflow': 'Onboarding AI Agent',
    'nav.workflowBuilder': 'Workflow Builder',
    'nav.configuration': 'Configuration',
    'nav.analysis': 'Analysis',
    'nav.alerts': 'Alerts',
    'nav.logout': 'Logout',
    
    // Login
    'login.title': 'Evaluating AI Beyond Accuracy',
    'login.subtitle': 'Standardize AI Agent evaluation across your organization',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.signIn': 'Sign In',
    'login.register': 'Create Account',
    
    // Register
    'register.title': 'Evaluating AI Beyond Accuracy',
    'register.subtitle': 'Create your account to start evaluating AI agents',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.avgAccuracy': 'Avg Accuracy',
    'dashboard.avgBias': 'Avg Bias Score',
    'dashboard.testsThisWeek': 'Tests This Week',
    'dashboard.avgResponseTime': 'Avg Response Time',
    'dashboard.modelComparison': 'Model Comparison',
    'dashboard.biasTrend': 'Bias Scorer Trend',
    'dashboard.recentEvaluations': 'Recent Evaluations',
    
    // Workflow
    'workflow.step1': 'Configure Agent',
    'workflow.step2': 'Test Design',
    'workflow.step3': 'Benchmarks',
    'workflow.step4': 'Run Evaluation',
    'workflow.step5': 'Results',
    'workflow.step6': 'Manual Review',
    'workflow.step7': 'Monitoring',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.next': 'Next',
    'common.back': 'Back',
    'common.continue': 'Continue',
    'common.submit': 'Submit',
    'common.loading': 'Loading...',
  },
  hi: {
    'nav.dashboard': 'डैशबोर्ड',
    'nav.workflow': 'EvalSphere वर्कफ़्लो',
    'nav.configuration': 'कॉन्फ़िगरेशन',
    'nav.analysis': 'विश्लेषण',
    'nav.alerts': 'अलर्ट',
    'nav.logout': 'लॉग आउट',
    'login.title': 'AI टेस्टिंग क्वालिटी फ्रेमवर्क',
    'login.subtitle': 'अपने संगठन में AI एजेंट मूल्यांकन को मानकीकृत करें',
    'login.email': 'ईमेल पता',
    'login.password': 'पासवर्ड',
    'login.signIn': 'साइन इन करें',
    'login.register': 'खाता बनाएं',
    'dashboard.title': 'डैशबोर्ड',
    'dashboard.welcome': 'वापसी पर स्वागत है',
    'dashboard.avgAccuracy': 'औसत सटीकता',
    'dashboard.avgBias': 'औसत पूर्वाग्रह स्कोर',
    'dashboard.testsThisWeek': 'इस सप्ताह के परीक्षण',
    'dashboard.avgResponseTime': 'औसत प्रतिक्रिया समय',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.next': 'अगला',
    'common.back': 'पीछे',
    'common.loading': 'लोड हो रहा है...',
  },
  ta: {
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.workflow': 'EvalSphere பணிப்பாய்வு',
    'login.title': 'AI சோதனை தரமான கட்டமைப்பு',
    'login.signIn': 'உள்நுழைக',
    'common.save': 'சேமி',
    'common.cancel': 'ரத்துசெய்',
  },
  zh: {
    'nav.dashboard': '仪表板',
    'nav.workflow': 'EvalSphere 工作流程',
    'login.title': 'AI测试质量框架',
    'login.signIn': '登录',
    'common.save': '保存',
    'common.cancel': '取消',
  },
  ko: {
    'nav.dashboard': '대시보드',
    'nav.workflow': 'EvalSphere 워크플로',
    'login.title': 'AI 테스팅 품질 프레임워크',
    'login.signIn': '로그인',
    'common.save': '저장',
    'common.cancel': '취소',
  },
  ja: {
    'nav.dashboard': 'ダッシュボード',
    'nav.workflow': 'EvalSphere ワークフロー',
    'login.title': 'AIテスティング品質フレームワーク',
    'login.signIn': 'サインイン',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
  },
};

export function t(key: string, lang: Language = 'en'): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}
