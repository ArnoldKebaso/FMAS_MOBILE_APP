// app/register.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';  // if using Expo Router
import { z } from 'zod';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons'; // from @expo/vector-icons
// If using react-native-flash-message for toasts:
import { showMessage } from 'react-native-flash-message';

// Location options from your web version
const locationOptions = [
  { value: "Bumadeya", label: "Bumadeya" },
  { value: "Budalangi Central", label: "Budalangi Central" },
  { value: "Budubusi", label: "Budubusi" },
  { value: "Mundere", label: "Mundere" },
  { value: "Musoma", label: "Musoma" },
  { value: "Sibuka", label: "Sibuka" },
  { value: "Sio Port", label: "Sio Port" },
  { value: "Rukala", label: "Rukala" },
  { value: "Mukhweya", label: "Mukhweya" },
  { value: "Sigulu Island", label: "Sigulu Island" },
  { value: "Siyaya", label: "Siyaya" },
  { value: "Nambuku", label: "Nambuku" },
  { value: "West Bunyala", label: "West Bunyala" },
  { value: "East Bunyala", label: "East Bunyala" },
  { value: "South Bunyala", label: "South Bunyala" },
];

// Define Zod schema (same as your web code)
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+2547\d{8}$/, "Invalid Kenyan mobile number. Format: +2547XXXXXXXX"),
  password: z.string().min(12, "Password must be at least 12 characters")
    .refine(val => /[A-Z]/.test(val), "Password must include at least one uppercase letter")
    .refine(val => /[a-z]/.test(val), "Password must include at least one lowercase letter")
    .refine(val => /[0-9]/.test(val), "Password must include at least one number")
    .refine(val => /[^A-Za-z0-9]/.test(val), "Password must include at least one special character"),
  confirmPassword: z.string(),
  location: z.string().min(1, "Please select your location"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function RegisterScreen() {
  const router = useRouter(); // If using Expo Router for navigation

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    role: 'viewer',
  });
  const [locationSource, setLocationSource] = useState<"manual" | "detected">("manual");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleLocateUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showMessage({
          message: 'Location Error',
          description: 'Permission to access location was denied',
          type: 'danger',
        });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      // Reverse geocode if you want to get the name. Or skip if not needed.
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await resp.json();
      let detected = data.address.city || data.address.town || data.address.village || data.display_name;
      setFormData(prev => ({ ...prev, location: detected }));
      setLocationSource("detected");
      showMessage({
        message: 'Location detected',
        description: detected,
        type: 'success',
      });
    } catch (error) {
      console.error('Location detect error:', error);
      showMessage({
        message: 'Location Error',
        description: 'Failed to retrieve location details.',
        type: 'danger',
      });
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate with Zod
      registerSchema.parse(formData);
      // Post to your Express backend
      await axios.post('http://YOUR_API_BASE_URL/register', formData);
      // show success
      showMessage({
        message: 'Registered successfully!',
        type: 'success',
      });
      // navigate to login screen or wherever
      router.push('/login'); // or router.replace('/login');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          showMessage({
            message: 'Validation Error',
            description: err.message,
            type: 'danger',
          });
        });
      } else {
        // Some other error from axios or server
        showMessage({
          message: 'Registration Failed',
          description: error.response?.data?.error || error.message,
          type: 'danger',
        });
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register</Text>

      {/* Username */}
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        value={formData.username}
        onChangeText={(val) => handleChange('username', val)}
      />

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(val) => handleChange('email', val)}
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Enter password"
          secureTextEntry={!showPassword}
          value={formData.password}
          onChangeText={(val) => handleChange('password', val)}
        />
        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color="gray"
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </View>

      {/* Confirm Password */}
      <Text style={styles.label}>Confirm Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Confirm password"
          secureTextEntry={!showConfirmPassword}
          value={formData.confirmPassword}
          onChangeText={(val) => handleChange('confirmPassword', val)}
        />
        <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons
            name={showConfirmPassword ? 'eye-off' : 'eye'}
            size={24}
            color="gray"
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </View>

      {/* Phone */}
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="+254712345678"
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(val) => handleChange('phone', val)}
      />

      {/* Location select */}
      <Text style={styles.label}>Location</Text>
      {/* 
        For a dropdown, you can use e.g. react-native-picker or react-native-dropdown-picker
        For simplicity, we do a basic <TextInput> to show the chosen location.
      */}
      <View style={styles.locationRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Select your location"
          value={formData.location}
          onChangeText={(val) => {
            handleChange('location', val);
            setLocationSource('manual');
          }}
          editable={locationSource === 'manual'}
        />
        <Pressable onPress={handleLocateUser} style={styles.detectButton}>
          <Text style={{ color: 'white' }}>Detect</Text>
        </Pressable>
      </View>

      {/* Submit button */}
      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Register</Text>
      </Pressable>

      {/* Link to Login */}
      <Text style={{ marginTop: 16, textAlign: 'center' }}>
        Already have an account?{' '}
        <Text
          onPress={() => router.push('/login')}
          style={{ color: 'blue', fontWeight: 'bold' }}
        >
          Login
        </Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detectButton: {
    marginLeft: 8,
    backgroundColor: 'green',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: 'blue',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
