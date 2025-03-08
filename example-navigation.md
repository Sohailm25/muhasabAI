# Navigation Implementation

This file demonstrates how navigation would be implemented in the React Native iOS application.

## App Navigator

The main navigation container for authenticated users.

```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import HistoryScreen from '../screens/dashboard/HistoryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import HelpScreen from '../screens/help/HelpScreen';

// Import feature navigators
import ReflectionsNavigator from './ReflectionsNavigator';
import HalaqaNavigator from './HalaqaNavigator';
import WirdNavigator from './WirdNavigator';
import IdentityNavigator from './IdentityNavigator';
import ChatNavigator from './ChatNavigator';

// Define types for the navigation
type RootTabParamList = {
  Home: undefined;
  Reflections: undefined;
  Chat: undefined;
  Identity: undefined;
  Profile: undefined;
};

// Create navigation stacks
const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator();

// Home stack navigator (Dashboard + related screens)
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="History" 
        component={HistoryScreen} 
      />
      <HomeStack.Screen 
        name="Help" 
        component={HelpScreen} 
      />
    </HomeStack.Navigator>
  );
};

// Main app navigator with bottom tabs
const AppNavigator = () => {
  const { theme } = useTheme();
  
  // Icon configuration
  const getTabBarIcon = (routeName: string, focused: boolean) => {
    let iconName = '';
    
    switch (routeName) {
      case 'Home':
        iconName = 'home';
        break;
      case 'Reflections':
        iconName = 'book-open';
        break;
      case 'Chat':
        iconName = 'message-circle';
        break;
      case 'Identity':
        iconName = 'user';
        break;
      case 'Profile':
        iconName = 'settings';
        break;
      default:
        iconName = 'circle';
    }
    
    return (
      <Icon 
        name={iconName} 
        size={24} 
        color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} 
      />
    );
  };
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => getTabBarIcon(route.name, focused),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Reflections" 
        component={ReflectionsNavigator} 
        options={{ title: 'Reflections' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatNavigator} 
        options={{ title: 'Chat' }}
      />
      <Tab.Screen 
        name="Identity" 
        component={IdentityNavigator} 
        options={{ title: 'Identity' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
```

## Auth Navigator

Navigation for unauthenticated users.

```typescript
// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import LandingScreen from '../screens/onboarding/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Define the auth navigation param list
type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Landing" component={LandingScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;
```

## Feature Navigator Example: Reflections

Example of a feature-specific navigator.

```typescript
// src/navigation/ReflectionsNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import ReflectionListScreen from '../screens/reflections/ReflectionListScreen';
import NewReflectionScreen from '../screens/reflections/NewReflectionScreen';
import ReflectionDetailScreen from '../screens/reflections/ReflectionDetailScreen';

// Define the reflections navigation param list
type ReflectionsStackParamList = {
  ReflectionList: undefined;
  NewReflection: undefined;
  ReflectionDetail: { id: string };
};

const ReflectionsStack = createNativeStackNavigator<ReflectionsStackParamList>();

const ReflectionsNavigator = () => {
  return (
    <ReflectionsStack.Navigator>
      <ReflectionsStack.Screen 
        name="ReflectionList" 
        component={ReflectionListScreen} 
        options={{ title: 'My Reflections' }}
      />
      <ReflectionsStack.Screen 
        name="NewReflection" 
        component={NewReflectionScreen} 
        options={{ title: 'New Reflection' }}
      />
      <ReflectionsStack.Screen 
        name="ReflectionDetail" 
        component={ReflectionDetailScreen} 
        options={({ route }) => ({ 
          title: 'Reflection Details',
        })}
      />
    </ReflectionsStack.Navigator>
  );
};

export default ReflectionsNavigator;
```

## Profile Navigator

Navigation for profile and settings screens.

```typescript
// src/navigation/ProfileNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

// Define the profile navigation param list
type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }}
      />
      <ProfileStack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </ProfileStack.Navigator>
  );
};

export default ProfileNavigator;
```

## Usage Example: Screen Navigation

Example of how to navigate between screens in a component.

```typescript
// src/screens/dashboard/DashboardScreen.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the type for navigation
type DashboardScreenNavigationProp = NativeStackNavigationProp<{
  History: undefined;
  Help: undefined;
  NewReflection: undefined;
}>;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="View History" 
          onPress={() => navigation.navigate('History')}
        />
        
        <Button 
          title="New Reflection" 
          onPress={() => navigation.navigate('NewReflection')}
        />
        
        <Button 
          title="Help & Support" 
          onPress={() => navigation.navigate('Help')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  }
});

export default DashboardScreen;
```

## Deep Linking Configuration

Configuration for supporting deep links in the application.

```typescript
// src/navigation/linking.ts
export const linking = {
  prefixes: ['muhasabai://'],
  config: {
    screens: {
      Home: {
        screens: {
          Dashboard: 'dashboard',
          History: 'history',
          Help: 'help',
        },
      },
      Reflections: {
        screens: {
          ReflectionList: 'reflections',
          NewReflection: 'reflections/new',
          ReflectionDetail: 'reflections/:id',
        },
      },
      Chat: {
        screens: {
          ChatList: 'chat',
          ChatDetail: 'chat/:id',
        },
      },
      Identity: {
        screens: {
          IdentityList: 'identity',
          NewFramework: 'identity/new',
          FrameworkDetail: 'identity/:id',
          HabitTracking: 'identity/tracking',
        },
      },
      Profile: {
        screens: {
          ProfileMain: 'profile',
          Settings: 'settings',
        },
      },
    },
  },
};
```

To use this deep linking configuration, add it to the NavigationContainer in App.tsx:

```typescript
<NavigationContainer 
  theme={appTheme.navigation}
  linking={linking}
>
  {/* ... rest of navigation code ... */}
</NavigationContainer>
``` 