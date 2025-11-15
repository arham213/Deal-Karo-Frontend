import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

const toastConfig = {
  success: ({ text1, text2, hide }: any) => (
    <View style={styles.successContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
      </View>
      <View style={styles.textContainer}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => {
          if (hide) {
            hide()
          } else {
            Toast.hide()
          }
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  ),
  error: ({ text1, text2, hide }: any) => (
    <View style={styles.errorContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={24} color={Colors.white} />
      </View>
      <View style={styles.textContainer}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => {
          if (hide) {
            hide()
          } else {
            Toast.hide()
          }
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  ),
  info: ({ text1, text2, hide }: any) => (
    <View style={styles.infoContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="information-circle" size={24} color={Colors.white} />
      </View>
      <View style={styles.textContainer}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => {
          if (hide) {
            hide()
          } else {
            Toast.hide()
          }
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  ),
};

export function ToastProvider() {
  return (
    <Toast
      config={toastConfig}
      topOffset={60}
      visibilityTime={4000}
      autoHide={true}
      position="top"
    />
  );
}

const styles = StyleSheet.create({
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.success2 || '#10B981',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    minHeight: 60,
    maxWidth: '95%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.error || '#EF4444',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    minHeight: 60,
    maxWidth: '95%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary || '#3B82F6',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    minHeight: 60,
    maxWidth: '95%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.white,
    lineHeight: 20,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  closeButton: {
    marginLeft: 12,
    marginTop: 2,
    padding: 4,
    flexShrink: 0,
  },
});

