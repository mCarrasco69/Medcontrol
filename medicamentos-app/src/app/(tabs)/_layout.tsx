import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="mis-pastillas"
        options={{
          title: 'Pastillas',
          tabBarIcon: ({ color }) => (
            <View style={[styles.pillIcon, { backgroundColor: color }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <View style={[styles.homeIcon, { borderColor: color }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="familia"
        options={{
          title: 'Familia',
          tabBarIcon: ({ color }) => (
            <View style={[styles.peopleIcon, { borderColor: color }]}>
              <View style={[styles.personDot, { backgroundColor: color }]} />
              <View style={[styles.personDot, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pillIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  homeIcon: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 4,
  },
  peopleIcon: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 1,
  },
});
