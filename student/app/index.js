import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      const userProfile = await AsyncStorage.getItem('userProfile');

      if (isLoggedIn === 'true' && userProfile) {
        setRoute('/(tabs)');
      } else {
        setRoute('/welcome');
      }
    } catch (error) {
      setRoute('/welcome');
    }
  };

  // Show loading state while checking
  if (route === null) {
    return null;
  }

  return <Redirect href={route} />;
}
