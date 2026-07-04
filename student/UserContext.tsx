import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
}

interface UserContextType {
  user: User;
  updateUser: (userData: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
  greeting: string;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const defaultUser: User = {
  id: '',
  name: 'Student Name',
  email: 'student@giet.edu',
  role: 'Student',
  department: 'Computer Science',
  avatar: 'SN'
};

const UserContext = createContext<UserContextType>({
  user: defaultUser,
  updateUser: () => { },
  refreshProfile: async () => { },
  greeting: 'Good Morning',
  logout: async () => { },
  deleteAccount: async () => { }
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(defaultUser);
  const [greeting, setGreeting] = useState('Good Morning');

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, email, role, department')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
      }
      return profile;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = useCallback(async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authUser) {
        // Set initial ID immediately so actions like Feedback don't block
        setUser(prev => ({ ...prev, id: authUser.id, email: authUser.email || prev.email }));

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profile) {
          const mergedUser = {
            ...profile,
            id: authUser.id, // Ensure ID is preserved
            avatar: profile.name?.[0]?.toUpperCase() || 'U'
          };
          setUser(mergedUser);
          await AsyncStorage.setItem('userProfile', JSON.stringify(mergedUser));
        } else {
          // Fallback: If no profile found, at least keep the auth ID
          setUser(prev => ({ ...prev, id: authUser.id }));
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        const storedUser = await AsyncStorage.getItem('userProfile');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const completeUser = {
            ...parsedUser,
            id: authUser?.id || parsedUser.id || ''
          };
          setUser(completeUser);

          // Background refresh if we have a session
          if (authUser) {
            refreshProfile();
          }
        } else if (authUser) {
          await refreshProfile();
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
    updateGreeting();
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, [refreshProfile]);

  const updateUser = useCallback((userData: Partial<User>): void => {
    setUser(prev => {
      const newUser = { ...prev, ...userData };
      AsyncStorage.setItem('userProfile', JSON.stringify(newUser)).catch(err => {
        console.error('Error persisting update:', err);
      });
      return newUser;
    });
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.multiRemove(['userProfile', 'isLoggedIn']);
      setUser(defaultUser);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const deleteAccount = useCallback(async (): Promise<void> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // 1. Manually delete profile first to ensure Roll No is freed up (in case cascade is missing)
      if (authUser) {
        await supabase.from('profiles').delete().eq('id', authUser.id);
      }

      // 2. Call the RPC to delete the auth account
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      await AsyncStorage.multiRemove(['userProfile', 'isLoggedIn', 'grievances_summary_v2', 'grievance_stats_v2']);
      setUser(defaultUser);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }, []);

  const updateGreeting = useCallback((): void => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const getInitials = (name: string | undefined | null): string => {
    if (!name || name.trim() === '' || name === 'Student Name') return '??';
    return name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userWithInitials = {
    ...user,
    avatar: getInitials(user.name)
  };

  return (
    <UserContext.Provider value={{
      user: userWithInitials,
      updateUser,
      refreshProfile,
      greeting,
      logout,
      deleteAccount
    }}>
      {children}
    </UserContext.Provider>
  );
};

