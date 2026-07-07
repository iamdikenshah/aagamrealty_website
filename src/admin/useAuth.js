import { useEffect, useState } from "react";
import { subscribeToAuthState } from "../firebase/auth";

/**
 * Track the current admin auth state.
 * @returns {{ user: import("firebase/auth").User|null, loading: boolean }}
 *   `loading` is true only until Firebase reports the first known state.
 */
export function useAuth() {
  const [state, setState] = useState({ user: null, loading: true });

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => setState({ user, loading: false }));
    return unsub;
  }, []);

  return state;
}
