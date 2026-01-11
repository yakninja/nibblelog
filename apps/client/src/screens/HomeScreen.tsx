import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { getActivities, deleteActivity } from '../db/queries';
import { getDeviceId } from '../services/sync';
import { sync } from '../services/sync';
import { Activity } from '../types';
import ActivityList from '../components/ActivityList';

export default function HomeScreen({ navigation }: any) {
  const { logout, userId } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [])
  );

  const loadActivities = async () => {
    if (!userId) return;
    try {
      const data = await getActivities(userId, 10);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleSync = async () => {
    setRefreshing(true);
    try {
      await sync();
      await loadActivities();
      Alert.alert('Success', 'Sync completed');
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message);
    } finally {
      setRefreshing(false);
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

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        await logout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nibblelog</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleSync} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <ActivityList
            activities={activities}
            onEdit={handleEdit}
            onDelete={handleDelete}
            limit={10}
            emptyText="No activities yet. Log your first one!"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bigButton}
          onPress={() => navigation.navigate('LogActivity')}
        >
          <Text style={styles.bigButtonText}>+ Log Activity</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => navigation.navigate('Activities')}
          >
            <Text style={styles.smallButtonText}>All Activities</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.smallButtonText}>Categories</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallButton} onPress={handleSync}>
            <Text style={styles.smallButtonText}>Sync</Text>
          </TouchableOpacity>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  bigButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  bigButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  smallButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
