import { StyleSheet, Text, View } from 'react-native';

export default function FamiliaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf2f7',
  },
  text: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
});
