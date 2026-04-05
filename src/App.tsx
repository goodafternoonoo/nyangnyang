import { DeviceViewport } from './components/DeviceViewport';
import './index.css';
import PhaserGame from './components/PhaserGame';

// 🍊 대표님, 앱인토스에서는 브릿지가 헤더를 기본 제공하지만
// 리액트 영역에서도 일관된 느낌을 주기 위해 커스텀 헤더를 구현했어요!✨
const CustomHeader = () => (
  <header style={{
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    backgroundColor: '#FBAF00',
    color: '#FFFFFF',
    fontSize: '20px',
    fontWeight: '800',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 100,
    letterSpacing: '-0.5px'
  }}>
    🐾 우당탕탕 냥냥펀치
  </header>
);

function App() {
  return (
    <DeviceViewport>
      <CustomHeader />

      {/* 폰트 프리로드는 숨김 처리해두는 게 깔끔하죠! 😉 */}
      <div id="font-preload" style={{ visibility: 'hidden', height: 0, overflow: 'hidden' }}>
        폰트 로딩용
      </div>

      <main style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        <PhaserGame />
      </main>
    </DeviceViewport>
  );
}

export default App;
