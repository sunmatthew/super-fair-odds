import React, { useCallback } from 'react';
import {
  DefaultTheme,
  NavigationContainer,
  Theme,
  useNavigation,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { FloatingTabBar } from './FloatingTabBar';
import { RootStackParamList, TabParamList, ActivityRoute } from './types';
import { HomeScreen } from '../features/home/HomeScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { CoinFlipScreen } from '../features/coinFlip/CoinFlipScreen';
import { DiceRollScreen } from '../features/diceRoll/DiceRollScreen';
import { CardDrawScreen } from '../features/cardDraw/CardDrawScreen';
import { WheelScreen } from '../features/wheel/WheelScreen';
import { NumberPickerScreen } from '../features/numberPicker/NumberPickerScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.primaryText,
    border: colors.border,
    primary: colors.primaryText,
  },
};

/**
 * Activity screens stay navigation-agnostic: they take an `onBack` callback
 * rather than reaching for the navigator themselves.
 */
function withBack(Component: React.ComponentType<{ onBack: () => void }>) {
  return function BackAdapter() {
    const navigation = useNavigation();
    const onBack = useCallback(() => navigation.goBack(), [navigation]);
    return <Component onBack={onBack} />;
  };
}

const CoinFlip = withBack(CoinFlipScreen);
const DiceRoll = withBack(DiceRollScreen);
const CardDraw = withBack(CardDrawScreen);
const Wheel = withBack(WheelScreen);
const NumberPicker = withBack(NumberPickerScreen);

function Home() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const onOpenActivity = useCallback(
    (route: ActivityRoute) => navigation.navigate(route),
    [navigation]
  );
  return <HomeScreen onOpenActivity={onOpenActivity} />;
}

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: 'Home' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="CoinFlip" component={CoinFlip} />
        <Stack.Screen name="DiceRoll" component={DiceRoll} />
        <Stack.Screen name="CardDraw" component={CardDraw} />
        <Stack.Screen name="Wheel" component={Wheel} />
        <Stack.Screen name="NumberPicker" component={NumberPicker} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
