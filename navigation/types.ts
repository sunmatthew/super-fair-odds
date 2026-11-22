/** Activity screens are pushed above the tabs so they get the full screen. */
export type RootStackParamList = {
  Tabs: undefined;
  CoinFlip: undefined;
  DiceRoll: undefined;
  CardDraw: undefined;
  Wheel: undefined;
  NumberPicker: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
};

export type ActivityRoute = Exclude<keyof RootStackParamList, 'Tabs'>;
