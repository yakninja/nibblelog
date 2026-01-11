import React from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';
import { Activity } from '../types';
import ActivityCard from './ActivityCard';

interface ActivityListProps {
  activities: Activity[];
  onEdit?: (activityId: string) => void;
  onDelete?: (activityId: string) => void;
  compact?: boolean;
  limit?: number;
  emptyText?: string;
}

export default function ActivityList({ 
  activities, 
  onEdit, 
  onDelete, 
  compact = false,
  limit,
  emptyText = 'No activities yet.'
}: ActivityListProps) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  if (activities.length === 0) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }

  return (
    <>
      {displayActivities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onPress={compact && onEdit ? () => onEdit(activity.id) : undefined}
          onEdit={!compact && onEdit ? () => onEdit(activity.id) : undefined}
          onDelete={!compact && onDelete ? () => onDelete(activity.id) : undefined}
          compact={compact}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    padding: 20,
  },
});
