import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Icon from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ThemedText';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Design';

interface DeleteConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  textColor: string;
  colorScheme: 'light' | 'dark';
}

export function DeleteConfirmModal({
  visible,
  onCancel,
  onConfirm,
  textColor,
  colorScheme,
}: DeleteConfirmModalProps) {
  const errorColor = Colors[colorScheme].error;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: Colors[colorScheme].card }]}> 
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${errorColor}20` }]}>
              <Icon name="alert-circle" size={32} color={errorColor} />
            </View>
          </View>
          <ThemedText style={[styles.title, { color: textColor }]}>予定を削除しますか？</ThemedText>
          <ThemedText style={[styles.body, { color: textColor }]}>
            この操作は元に戻せません。
          </ThemedText>
          <View style={styles.actions}>
            <DragSafeTouchableOpacity 
              onPress={onCancel} 
              style={[styles.button, styles.cancelButton, { borderColor: 'rgba(148, 163, 184, 0.3)' }]} 
              activeOpacity={0.8}
            >
              <Icon name="close" size={18} color={textColor} style={{ marginRight: 6 }} />
              <ThemedText style={[styles.buttonText, { color: textColor }]}>キャンセル</ThemedText>
            </DragSafeTouchableOpacity>
            <DragSafeTouchableOpacity
              onPress={onConfirm}
              style={[styles.button, styles.deleteButton, { backgroundColor: errorColor }]}
              activeOpacity={0.8}
            >
              <Icon name="delete" size={18} color="#fff" style={{ marginRight: 6 }} />
              <ThemedText style={[styles.buttonText, { color: '#fff' }]}>削除する</ThemedText>
            </DragSafeTouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.xl,
    padding: Spacing.lg + Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  body: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    opacity: 0.75,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  deleteButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
