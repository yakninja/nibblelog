import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export default function ActivityCard({ 
  activity, 
  onPress, 
  onEdit, 
  onDelete, 
  compact = false 
}: ActivityCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.content}>
        <Text style={styles.description}>
          {activity.description || 'No description'}
        </Text>
        <Text style={styles.date}>{formatDate(activity.created_at)}</Text>
        
        {!compact && (activity.amount !== null || activity.score !== null) && (
          <View style={styles.meta}>
            {activity.amount !== null && (
              <Text style={styles.metaText}>Amount: {activity.amount}</Text>
            )}
            {activity.score !== null && (
              <Text style={styles.metaText}>Score: {activity.score}</Text>
            )}
          </View>
        )}
        
        {compact && onPress && (
          <Text style={styles.tapToEdit}>Tap to edit</Text>
        )}
      </View>

      {!compact && (onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  meta: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  tapToEdit: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    minWidth: 60,
  },
  actionButton: {
    marginBottom: 8,
  },
  editText: {
    color: '#007AFF',
    fontSize: 14,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 14,
  },
});
