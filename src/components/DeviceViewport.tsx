import React, { useEffect, useState } from 'react';
import { SafeAreaInsets } from '@apps-in-toss/web-framework';

interface DeviceViewportProps {
  children: React.ReactNode;
}

/**
 * 모바일 기기의 Safe Area(노치, 하단 핸들 등)를 자동으로 계산하여
 * 컨텐츠가 가려지지 않도록 패딩을 적용하는 래퍼 컴포넌트입니다.
 */
export const DeviceViewport: React.FC<DeviceViewportProps> = ({ children }) => {
  // 초기 인셋은 0으로 안전하게 시작합니다.
  const [insets, setInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  useEffect(() => {
    // 1. 초기 값을 안전하게 가져와 업데이트합니다.
    const initializeInsets = async () => {
      try {
        const currentInsets = await SafeAreaInsets.get();
        if (currentInsets) {
          setInsets(currentInsets);
        }
      } catch (error) {
        console.warn('SafeAreaInsets 초기화 실패 (브라우저 환경일 수 있음):', error);
      }
    };

    initializeInsets();

    // 2. 값 변경 구독
    let subscription: any = null;
    try {
      subscription = SafeAreaInsets.subscribe({
        onEvent: (newInsets) => {
          setInsets(newInsets);
        }
      });
    } catch (e) {
      console.warn('SafeAreaInsets 구독 실패 (브라우저 환경일 수 있음):', e);
    }

    return () => {
      // 구독 해제 (함수 호출 형태가 아닐 경우 대비)
      if (typeof subscription === 'function') {
        subscription();
      } else if (subscription && subscription.remove) {
        subscription.remove();
      } else if (subscription && 'unsubscribe' in subscription) {
        // @ts-ignore
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <div
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#FBAF00',
      }}
    >
      {children}
    </div>
  );
};
