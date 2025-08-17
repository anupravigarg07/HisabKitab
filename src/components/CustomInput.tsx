import React from 'react';
import {View, TextInput, StyleSheet, Image, TextInputProps} from 'react-native';

interface CustomInputProps extends TextInputProps {
  icon: any;
}

const CustomInput: React.FC<CustomInputProps> = ({icon, ...textInputProps}) => {
  return (
    <View style={styles.container}>
      <Image source={icon} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholderTextColor="#999"
        {...textInputProps}
      />
    </View>
  );
};

export default CustomInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
});
