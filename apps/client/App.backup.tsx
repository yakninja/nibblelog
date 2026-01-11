import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/services/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import AddCategoryScreen from './src/screens/AddCategoryScreen';
import LogActivityScreen from './src/screens/LogActivityScreen';
import ActivitiesScreen from './src/screens/ActivitiesScreen';
import EditActivityScreen from './src/screens/EditActivityScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading === true) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E94560" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated === true ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
          <Stack.Screen name="LogActivity" component={LogActivityScreen} />
          <Stack.Screen name="Activities" component={ActivitiesScreen} />
          <Stack.Screen name="EditActivity" component={EditActivityScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
