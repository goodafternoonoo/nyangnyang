import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'nyangnyang', // 콘솔에 등록할/등록한 앱의 영문 고유이름
  brand: {
    displayName: '냥냥펀치',
    primaryColor: '#FBAF00',
    icon: '',
  },
  web: {
    host: process.env.VITE_AIT_HOST || 'localhost', // .env 파일에서 가져와요! 🤫✨
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  webViewProps: {
    type: 'partner',
  },
});
