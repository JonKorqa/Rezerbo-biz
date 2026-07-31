import type { Persistence } from 'firebase/auth';

// `firebase/auth`'s published typings don't include the React Native entry point
// (only `@firebase/auth`'s "react-native" export condition does), even though
// Metro correctly bundles the RN build at runtime. This augments the module so
// `getReactNativePersistence` type-checks without `@ts-ignore`.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
