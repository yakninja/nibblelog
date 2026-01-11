import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import { getCategories, createActivity } from '../db/queries';
import { getDeviceId } from '../services/sync';
import { Category } from '../types';
import Constants from 'expo-constants';

export default function LogActivityScreen({ navigation }: any) {
  const { userId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [score, setScore] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    if (!userId) return;
    try {
      const data = await getCategories(userId);
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedCategoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!userId) return;

    try {
      const deviceId = await getDeviceId();
      const appVersion = Constants.expoConfig?.version || '1.0.0';

      await createActivity(
        userId,
        selectedCategoryId,
        {
          description: description.trim() || null,
          amount: amount ? parseFloat(amount) : null,
          score: score ? parseFloat(score) : null,
        },
        deviceId,
        appVersion
      );

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to log activity');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Activity</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Category</Text>
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>No categories. Create one first!</Text>
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  selectedCategoryId === category.id && styles.categoryOptionSelected,
                ]}
                onPress={() => setSelectedCategoryId(category.id)}
              >
                <View
                  style={[styles.categoryColor, { backgroundColor: category.color || '#ccc' }]}
                />
                <Text style={styles.categoryText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What did you do?"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Amount (optional)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g., 5"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Score (optional)</Text>
        <TextInput
          style={styles.input}
          value={score}
          onChangeText={setScore}
          placeholder="e.g., 8"
          keyboardType="decimal-pad"
        />
      </ScrollView>
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
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  categoryOptionSelected: {
    borderColor: '#007AFF',
  },
  categoryColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 20,
  },
});
