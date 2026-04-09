import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { globalState } from './state';

declare global {
  var __firebase_config: string | undefined;
  var __app_id: string | undefined;
}

const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config ? JSON.parse(__firebase_config) : {};
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export const useFirebase = Object.keys(firebaseConfig).length > 0;

export const app = useFirebase ? initializeApp(firebaseConfig) : null;
export const auth = useFirebase && app ? getAuth(app) : null;
export const db = useFirebase && app ? getFirestore(app) : null;

export async function loginAnonymously() {
  if (!useFirebase || !auth) return null;
  try {
    const cred = await signInAnonymously(auth);
    globalState.uid = cred.user.uid;
    return cred.user;
  } catch (e) {
    console.error("Firebase Login Failed", e);
    return null;
  }
}

export async function loadGameData(uid?: string) {
  const targetUid = uid || globalState.uid;
  if (!useFirebase || !db || !targetUid) return;
  const docRef = doc(db, 'artifacts', appId, 'users', targetUid, 'savedata', 'progress');
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.coins !== undefined) globalState.coins = data.coins;
      if (data.upgrades !== undefined) globalState.upgrades = { ...globalState.upgrades, ...data.upgrades };
      return true;
    }
  } catch (e) { console.error("Data Load Failed:", e); }
  return false;
}

export async function saveGameData(uid?: string) {
  const targetUid = uid || globalState.uid;
  if (!useFirebase || !db || !targetUid) return;
  const docRef = doc(db, 'artifacts', appId, 'users', targetUid, 'savedata', 'progress');
  try {
    await setDoc(docRef, { coins: globalState.coins, upgrades: globalState.upgrades }, { merge: true });
  } catch (e) { console.error("Data Save Failed:", e); }
}
