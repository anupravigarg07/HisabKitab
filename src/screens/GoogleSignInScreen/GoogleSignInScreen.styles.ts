import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  titleBlack: {
    color: '#1A1A1A',
  },
  titleOrange: {
    color: '#F59E0B',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 60,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 30,
    position: 'absolute',
    bottom: 60,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
