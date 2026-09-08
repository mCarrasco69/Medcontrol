import { StyleSheet, View } from 'react-native';

interface PillIconProps {
  size?: number;
  backgroundColor?: string;
}

export default function PillIcon({ size = 40, backgroundColor = '#e6fbf7' }: PillIconProps) {
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
      ]}
    >
      <View style={styles.pillShape} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillShape: {
    width: '60%',
    height: '30%',
    borderRadius: 999,
    backgroundColor: '#10b981',
    transform: [{ rotate: '-45deg' }],
  },
});
