import React, { useState, useCallback, useEffect } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeContext';
import { scale, moderateScale } from '../utils/responsive';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
};

let setAlertStateRef: React.Dispatch<React.SetStateAction<AlertState>> | null = null;

export const CustomAlertAPI = {
  alert: (title: string, message: string, buttons?: AlertButton[]) => {
    if (setAlertStateRef) {
      setAlertStateRef({
        visible: true,
        title,
        message,
        buttons: buttons || [{ text: 'OK' }],
      });
    }
  },
};

export function CustomAlert() {
  const { colors } = useTheme();
  const [state, setState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  useEffect(() => {
    setAlertStateRef = setState;
    return () => {
      setAlertStateRef = null;
    };
  }, []);

  const hide = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  return (
    <Modal transparent animationType="fade" visible={state.visible} onRequestClose={hide}>
      <TouchableWithoutFeedback onPress={hide}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.alertBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{state.title}</Text>
              {!!state.message && (
                <Text style={[styles.message, { color: colors.textSecondary }]}>{state.message}</Text>
              )}
              
              <View style={styles.buttonContainer}>
                {state.buttons.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      style={[
                        styles.button,
                        isCancel && { backgroundColor: 'transparent' },
                        !isCancel && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => {
                        hide();
                        if (btn.onPress) {
                          setTimeout(btn.onPress, 50);
                        }
                      }}
                    >
                      <Text style={[
                        styles.buttonText,
                        isCancel && { color: colors.textSecondary },
                        !isCancel && { color: colors.background }
                      ]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  alertBox: {
    width: '100%',
    maxWidth: scale(320),
    borderRadius: scale(16),
    padding: scale(24),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: 'Geist-Bold',
    fontSize: moderateScale(18),
    marginBottom: scale(8),
  },
  message: {
    fontFamily: 'Geist-Regular',
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    marginBottom: scale(24),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scale(12),
  },
  button: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    minWidth: scale(70),
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Geist-SemiBold',
    fontSize: moderateScale(14),
  },
});
