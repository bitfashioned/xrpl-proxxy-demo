import { WithChildren } from '../types';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useUtils } from './utils-context';
import { v4 as uuid } from 'uuid';
import useLocalStorage from '../hooks/useLocalStorage';
import { CMIX_INITIALIZATION_KEY } from '../constants';

type AuthenticationContextType = {
  cmixPreviouslyInitialized: boolean;
  getOrInitPassword: (password: string) => Promise<boolean>;
  encryptedPassword?: Uint8Array;
  rawPassword?: string;
  isAuthenticated: boolean;
  setIsAuthenticated: (authenticated: boolean) => void;
  instanceId: string;
};

export const AuthenticationContext = React.createContext<AuthenticationContextType>({
  isAuthenticated: false,
} as AuthenticationContextType);

AuthenticationContext.displayName = 'AuthenticationContext';

export const AuthenticationProvider: FC<WithChildren> = (props) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const instanceId = useMemo(() => uuid(), []);
  const { utils } = useUtils();
  const authChannel = useMemo<BroadcastChannel>(() => new BroadcastChannel('authentication'), []);
  const [rawPassword, setRawPassword] = useState<string>();

  const [
    cmixPreviouslyInitialized,
  ] = useLocalStorage(CMIX_INITIALIZATION_KEY, false);

  const getOrInitPassword = useCallback(async (password: string) => {
    try {
      setRawPassword(password);
      await utils.GetOrInitPassword(password);
      return true;
    } catch (error) {
      console.error('GetOrInitPassword failed', error);
      return false;
    }
  }, [utils]);

  useEffect(() => {
    const onRequest = (ev: MessageEvent) => {
      if (ev.data.type === 'IS_AUTHENTICATED_REQUEST') {
        authChannel.postMessage({
          type: 'IS_AUTHENTICATED_RESPONSE',
          isAuthenticated,
          instanceId
        })
      }
    }

    authChannel.addEventListener('message', onRequest);

    return () => {
      authChannel.removeEventListener('message', onRequest);
    }
  }, [authChannel, isAuthenticated, instanceId]);

  return (
    <AuthenticationContext.Provider
      value={{
        cmixPreviouslyInitialized: !!cmixPreviouslyInitialized,
        getOrInitPassword,
        instanceId,
        rawPassword,
        isAuthenticated,
        setIsAuthenticated
      }}
      {...props}
    />
  );
};

export const useAuthentication = () => {
  const context = React.useContext(AuthenticationContext);

  if (context === undefined) {
    throw new Error(
      'useAuthentication must be used within a AuthenticationProvider'
    );
  }


  return context;
};
