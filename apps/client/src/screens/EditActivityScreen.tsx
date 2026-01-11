import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import { getActivity, updateActivity, getCategories } from '../db/queries';
import { getDeviceId } from '../services/sync';
import { Category } from '../types';

const APP_VERSION = '1.0.0';

export default function EditActivityScreen({ navigation, route }: any) {
  const { userId } = useAuth();
  const { activityId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [score, setScore] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [activityId]);

  const loadData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const [activity, cats] = await Promise.all([
        getActivity(activityId),
        getCategories(userId),
      ]);

      if (!activity) {
        setError('Activity not found');
        return;
      }

      setCategories(cats);
      setSelectedCategoryId(activity.category_id);
      setDescription(activity.description || '');
      setAmount(activity.amount?.toString() || '');
      setScore(activity.score?.toString() || '');
    } catch (err) {
      console.error('Failed to load activity:', err);
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    if (!userId) return;

    setSaving(true);
    setError('');
    
    try {
      const deviceId = await getDeviceId();
      
      const updates: any = {
        category_id: selectedCategoryId,
        description: description.trim() || null,
        amount: amount ? parseFloat(amount) : null,
        score: score ? parseFloat(score) : null,
      };

      await updateActivity(activityId, userId, updates, deviceId, APP_VERSION);
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to update activity');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Activity</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.content}>
        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryList}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryOption,
                selectedCategoryId === cat.id && styles.categoryOptionSelected,
              ]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <View style={[styles.colorDot, { backgroundColor: cat.color || '#ccc' }]} />
              <Text
                style={[
                  styles.categoryName,
                  selectedCategoryId === cat.id && styles.categoryNameSelected,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description</Text>
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
          placeholder="e.g., 30 (minutes, reps, etc.)"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Score (optional)</Text>
        <TextInput
          style={styles.input}
          value={score}
          onChangeText={setScore}
          placeholder="e.g., 8 (out of 10)"
          keyboardType="numeric"
        />
      </View>
    </ScrollView>
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
    margin: 15,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryList: {
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryOptionSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  categoryNameSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
});
