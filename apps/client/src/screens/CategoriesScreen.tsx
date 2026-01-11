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
import { getCategories, deleteCategory } from '../db/queries';
import { getDeviceId } from '../services/sync';
import { Category } from '../types';

export default function CategoriesScreen({ navigation }: any) {
  const { userId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [userId])
  );

  const loadCategories = async () => {
    if (!userId) return;
    try {
      const data = await getCategories(userId);
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this category?')) {
        if (!userId) return;
        try {
          const deviceId = await getDeviceId();
          await deleteCategory(categoryId, userId, deviceId);
          await loadCategories();
        } catch (error) {
          alert('Failed to delete category');
        }
      }
    } else {
      Alert.alert('Delete Category', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return;
            try {
              const deviceId = await getDeviceId();
              await deleteCategory(categoryId, userId, deviceId);
              await loadCategories();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddCategory')}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View
                style={[styles.colorBox, { backgroundColor: item.color || '#ccc' }]}
              />
              <Text style={styles.categoryName}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No categories. Add one to get started!</Text>
        }
      />
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
  addButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    marginRight: 15,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40,
  },
});
