import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

type ActivityPayload = {
  type: string;
  details: string;
  metadata?: Record<string, unknown>;
};

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function syncUserToFirestore(user: User) {
  if (!user) return;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userData = {
      uid: user.uid,
      // Ensure email and displayName are strings to satisfy Firestore rules
      email: user.email || '',
      displayName: user.displayName || 'Anonymous User',
      photoURL: user.photoURL || '',
      providerData: user.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName || '',
        email: p.email || '',
        photoURL: p.photoURL || ''
      })),
      lastLoginAt: Date.now(),
      updatedAt: Date.now(),
    };

    console.log(`Syncing user profile for ${user.uid}...`);
    await setDoc(userRef, userData, { merge: true });
    console.log(`User profile synced successfully.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function logUserActivity(user: User, payload: ActivityPayload) {
  if (!user) return;
  const activity = {
    ...payload,
    userId: user.uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await addDoc(collection(db, 'users', user.uid, 'activities'), activity);
  return activity;
}

export async function uploadActivityToGoogleDrive(accessToken: string | null, activity: ActivityPayload) {
  if (!accessToken) return null;
  const metadata = {
    name: `ARVIS-activity-${Date.now()}.json`,
    mimeType: 'application/json',
  };
  const boundary = '-------314159265358979323846';
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(activity)}\r\n--${boundary}--`;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Drive upload failed', err);
    return null;
  }

  return response.json();
}

export { onAuthStateChanged, signInWithPopup, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc };
export type { User };
