import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'nyangnyang', // 콘솔에 등록할/등록한 앱의 영문 고유이름
  brand: {
    displayName: '우당탕탕 냥냥펀치',
    primaryColor: '#FBAF00', // 냥냥펀치의 분위기(노란/주황 계열)에 맞춰 변경 가능
    icon: '', // 추후 썸네일/아이콘 이미지 URL 등록 (빈 문자열 가능)
  },
  web: {
    host: 'localhost', // 실 기기 테스트 시 PC의 로컬 IP(예: 192.168.0.x)로 변경 필요
    port: 5173,
    commands: {
      dev: 'vite --host', // 모바일 접근을 위해 --host 필수
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
});
