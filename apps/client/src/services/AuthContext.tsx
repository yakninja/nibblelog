import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { initDatabase } from '../db';
import { sync } from './sync';
import * as AuthService from '../services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Sync when app comes to foreground (from background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        console.log('App became active, syncing...');
        sync().catch(err => console.error('Foreground sync failed:', err));
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const uid = await AuthService.getUserId();
        setUserId(uid);
        if (uid) {
          await initDatabase(uid);
          // Sync data from server on startup
          try {
            await sync();
            console.log('Initial sync completed');
          } catch (syncError) {
            console.error('Initial sync failed:', syncError);
            // Don't fail auth if sync fails
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const result = await AuthService.login({ username, password });
    await initDatabase(result.user_id);
    setUserId(result.user_id);
    setIsAuthenticated(true);
    
    // Sync data from server after login
    try {
      await sync();
      console.log('Post-login sync completed');
    } catch (syncError) {
      console.error('Post-login sync failed:', syncError);
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setUserId(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
