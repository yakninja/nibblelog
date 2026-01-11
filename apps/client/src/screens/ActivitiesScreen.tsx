import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { getActivities, deleteActivity } from '../db/queries';
import { getDeviceId, sync } from '../services/sync';
import { Activity } from '../types';
import ActivityList from '../components/ActivityList';

export default function ActivitiesScreen({ navigation }: any) {
  const { userId } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [userId])
  );

  const loadActivities = async () => {
    if (!userId) return;
    try {
      const data = await getActivities(userId, 100);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleEdit = (activityId: string) => {
    navigation.navigate('EditActivity', { activityId });
  };

  const handleDelete = async (activityId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this activity?')) {
        await performDelete(activityId);
      }
    } else {
      Alert.alert('Delete Activity', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(activityId),
        },
      ]);
    }
  };

  const performDelete = async (activityId: string) => {
    if (!userId) return;
    try {
      const deviceId = await getDeviceId();
      await deleteActivity(activityId, userId, deviceId);
      await loadActivities();
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('Failed to delete activity');
      } else {
        Alert.alert('Error', 'Failed to delete activity');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Activities</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.list}>
        <ActivityList
          activities={activities}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyText="No activities yet. Log one to get started!"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 20,
  },
});
