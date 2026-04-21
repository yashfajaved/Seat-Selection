# Task 8: Premium Seat Selection System

A sophisticated React Native application for movie and event ticket booking, featuring a premium Navy Blue & Light Blue aesthetic, dynamic animations, and seamless seat selection.

## 🚀 Overview

This module provides a complete user journey for booking tickets:
1.  **Event Discovery**: Browse popular movies and events with a modern grid layout.
2.  **Seat Selection**: Interactive seat map with real-time availability updates and multi-seat selection.
3.  **Booking Management**: Local persistence of bookings using AsyncStorage.
4.  **Profile & Settings**: Dedicated screens for user preferences and booking history.

## ✨ Key Features

*   **Premium Aesthetics**: Curated color palette (Navy & Light Blue) with glassmorphism effects and dynamic background patterns.
*   **Interactive UI**: Smooth animations using React Native `Animated` API for transitions, seat scaling, and navigation bounces.
*   **Smart Seat Grid**: Visual indicators for Available (Green), Booked (Red), and Selected (Yellow) seats.
*   **Data Persistence**: Integrated with `AsyncStorage` to save booking history and maintain state across sessions.
*   **API Integration**: Dynamic fetching of events and seat layouts from a remote PHP/MySQL backend.
*   **Responsive Design**: Fully optimized for both mobile and web platforms.

## 🛠️ Technology Stack

*   **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 54](https://expo.dev/)
*   **Styling**: Vanilla StyleSheet with HSL-tailored color tokens.
*   **Storage**: `@react-native-async-storage/async-storage`
*   **Icons**: `@expo/vector-icons` & Flaticon assets.

## 📦 Installation & Setup

1.  **Navigate to the Task 8 directory**:
    ```bash
    cd screens/Task8
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npx expo start
    ```

4.  **Running on different platforms**:
    *   **Web**: Press `w` in the terminal.
    *   **Android**: Press `a` (requires emulator or device).
    *   **iOS**: Press `i` (requires macOS and Xcode).

## 📡 API Configuration

The application fetches data from:
*   **Events**: `http://192.168.0.104/leohub_api/get_events_new.php`
*   **Seats**: `http://192.168.0.104/leohub_api/get_seats_new.php`

> [!NOTE]
> Ensure your backend server is running and accessible at the IP address specified in `Task8SeatSelection.js`.

---

*Developed as part of the MyAssignment3 project.*
