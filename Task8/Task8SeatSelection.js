import { registerRootComponent } from 'expo';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList, TextInput, Image,
  ActivityIndicator, StatusBar, Dimensions, ScrollView, TouchableOpacity,
  Alert, Animated, ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Navy Blue & Light Blue Color Combination
const COLORS = {
  primary: '#1A2A4F',
  secondary: '#2C3E6B',
  lightBlue: '#6BB5FF',
  pureWhite: '#FFFFFF',
  textGrey: '#B8C5D6',
  available: '#4CAF50',
  booked: '#E74C3C',
  selected: '#FFC107',
  cardBorder: '#3A4D7A',
  success: '#27AE60',
};

const ICON_BACK = 'https://cdn-icons-png.flaticon.com/512/271/271218.png';
const ICON_REFRESH = 'https://cdn-icons-png.flaticon.com/512/61/61413.png';
const ICON_CHECK = 'https://cdn-icons-png.flaticon.com/512/5610/5610944.png';
const ICON_HOME = 'https://cdn-icons-png.flaticon.com/512/25/25694.png';
const ICON_TICKET = 'https://cdn-icons-png.flaticon.com/512/1380/1380338.png';
const ICON_PROFILE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
const ICON_SETTINGS = 'https://cdn-icons-png.flaticon.com/512/126/126472.png';
const BG_PATTERN = 'https://www.transparenttextures.com/patterns/cubes.png';

export default function SeatBookingApp() {
  const [dbData, setDbData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatLayout, setSeatLayout] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [viewType, setViewType] = useState('eventList');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const seatScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchEvents();
    loadSavedSelections();
  }, []);

  useEffect(() => {
    startAnimation();
  }, [activeTab, viewType]);

  const startAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  };

  const animatePress = (callback) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start(() => callback && callback());
  };

  const animateRotate = () => {
    Animated.timing(rotateAnim, { toValue: 1, duration: 500, useNativeDriver: true })
      .start(() => rotateAnim.setValue(0));
  };

  const animateBounce = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: -10, duration: 150, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0, duration: 150, useNativeDriver: true })
    ]).start();
  };

  const animateSeat = () => {
    Animated.sequence([
      Animated.timing(seatScaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(seatScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // UPDATED: Fetch events from NEW table
  const fetchEvents = () => {
    setLoading(true);
    fetch('http://192.168.0.104/leohub_api/get_events_new.php')
      .then(res => res.json())
      .then(json => {
        setDbData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        Alert.alert('Error', 'Failed to fetch events');
      });
  };

  // UPDATED: Fetch seat layout from NEW table
  const fetchSeatLayout = (eventId) => {
    setLoading(true);
    fetch(`http://192.168.0.104/leohub_api/get_seats_new.php?event_id=${eventId}`)
      .then(res => res.json())
      .then(json => {
        if (json && json.length > 0) {
          setSeatLayout(json);
        } else {
          setSeatLayout(generateMockSeats());
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setSeatLayout(generateMockSeats());
        setLoading(false);
      });
  };

  const generateMockSeats = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const seats = [];
    let id = 1;
    for (let i = 0; i < rows.length; i++) {
      for (let j = 1; j <= 8; j++) {
        seats.push({ id: id++, row: rows[i], number: j, status: Math.random() > 0.8 ? 'booked' : 'available' });
      }
    }
    return seats;
  };

  const loadSavedSelections = async () => {
    try {
      const saved = await AsyncStorage.getItem('bookedSeats');
      if (saved) setBookings(JSON.parse(saved));
    } catch (error) { console.error(error); }
  };

  const saveSeatsToStorage = async (eventId, seats) => {
    try {
      const existingBookings = await AsyncStorage.getItem('bookedSeats');
      let bookingsList = existingBookings ? JSON.parse(existingBookings) : [];
      const seatDetails = seats.map(seatId => {
        const seat = seatLayout.find(s => s.id === seatId);
        return `${seat.row}${seat.number}`;
      });
      const newBooking = {
        id: Date.now().toString(),
        eventId: eventId,
        eventTitle: selectedEvent.title,
        eventImage: selectedEvent.image_url,
        seats: seatDetails,
        seatIds: seats,
        totalAmount: (seats.length * 15.99).toFixed(2),
        bookingDate: new Date().toLocaleString(),
        timestamp: Date.now(),
      };
      bookingsList.push(newBooking);
      await AsyncStorage.setItem('bookedSeats', JSON.stringify(bookingsList));
      setBookings(bookingsList);
      return true;
    } catch (error) { return false; }
  };

  const handleSeatSelection = (seatId) => {
    const seat = seatLayout.find(s => s.id === seatId);
    if (!seat) return;
    if (seat.status === 'booked') {
      Alert.alert('Seat Unavailable', 'This seat is already booked!');
      return;
    }
    animateSeat();
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const confirmSelection = async () => {
    if (selectedSeats.length === 0) {
      Alert.alert('No Seats Selected', 'Please select at least one seat to continue.');
      return;
    }
    const success = await saveSeatsToStorage(selectedEvent.id, selectedSeats);
    if (success) {
      const updatedLayout = seatLayout.map(seat => {
        if (selectedSeats.includes(seat.id)) return { ...seat, status: 'booked' };
        return seat;
      });
      setSeatLayout(updatedLayout);
      setViewType('confirmation');
    } else {
      Alert.alert('Error', 'Failed to save your booking.');
    }
  };

  const resetToHome = () => {
    setSelectedSeats([]);
    setSelectedEvent(null);
    setViewType('eventList');
    setActiveTab('Home');
  };

  const AnimatedTouchable = ({ onPress, style, children, ...props }) => (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity onPress={() => animatePress(onPress)} activeOpacity={0.8} {...props}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );

  const MyBookingsScreen = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <ImageBackground source={{ uri: BG_PATTERN }} style={styles.bgPattern} imageStyle={{ opacity: 0.05 }}>
        <View style={styles.tabHeader}><Text style={styles.tabHeaderTitle}>My Bookings</Text></View>
        <ScrollView style={styles.bookingsScroll}>
          {bookings.length === 0 ? (
            <View style={styles.emptyBookings}>
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={styles.emptySubText}>Book your first ticket to see it here!</Text>
            </View>
          ) : (
            bookings.map((booking, index) => (
              <Animated.View key={index} style={[styles.bookingCard, { transform: [{ scale: scaleAnim }] }]}>
                <Image source={{ uri: booking.eventImage }} style={styles.bookingImage} />
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTitle}>{booking.eventTitle}</Text>
                  <Text style={styles.bookingDetail}>Seats: {booking.seats.join(', ')}</Text>
                  <Text style={styles.bookingDetail}>Amount: ${booking.totalAmount}</Text>
                  <Text style={styles.bookingDate}>{booking.bookingDate}</Text>
                </View>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </ImageBackground>
    </Animated.View>
  );

  const ProfileScreen = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <ImageBackground source={{ uri: BG_PATTERN }} style={styles.bgPattern} imageStyle={{ opacity: 0.05 }}>
        <View style={styles.tabHeader}><Text style={styles.tabHeaderTitle}>Profile</Text></View>
        <View style={styles.profileContent}>
          <Animated.View style={[styles.profileAvatar, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.avatarText}>👤</Text>
          </Animated.View>
          <Text style={styles.profileName}>John Doe</Text>
          <Text style={styles.profileEmail}>john.doe@example.com</Text>
          <View style={styles.profileStats}>
            <View style={styles.statItem}><Text style={styles.statNumber}>{bookings.length}</Text><Text style={styles.statLabel}>Bookings</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>4.8</Text><Text style={styles.statLabel}>Rating</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>2026</Text><Text style={styles.statLabel}>Member Since</Text></View>
          </View>
          {['Edit Profile', 'Payment Methods', 'Notification Settings'].map((item, idx) => (
            <AnimatedTouchable key={idx} style={styles.profileOption}><Text style={styles.optionText}>{item}</Text></AnimatedTouchable>
          ))}
        </View>
      </ImageBackground>
    </Animated.View>
  );

  const SettingsScreen = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <ImageBackground source={{ uri: BG_PATTERN }} style={styles.bgPattern} imageStyle={{ opacity: 0.05 }}>
        <View style={styles.tabHeader}><Text style={styles.tabHeaderTitle}>Settings</Text></View>
        <View style={styles.settingsContent}>
          {[{ label: 'Language', value: 'English' }, { label: 'Theme', value: 'Dark Navy' }, { label: 'Notifications', value: 'Enabled' }, { label: 'Clear Cache', value: null }].map((item, idx) => (
            <AnimatedTouchable key={idx} style={styles.settingItem}>
              <Text style={styles.settingText}>{item.label}</Text>
              {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
            </AnimatedTouchable>
          ))}
          <AnimatedTouchable style={[styles.settingItem, styles.logoutItem]}><Text style={styles.logoutText}>Log Out</Text></AnimatedTouchable>
        </View>
      </ImageBackground>
    </Animated.View>
  );

  const EventListScreen = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <ImageBackground source={{ uri: BG_PATTERN }} style={styles.bgPattern} imageStyle={{ opacity: 0.05 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.mainTitle}>🎬 Ticket Booking</Text>
          <Text style={styles.subTitle}>Movies, Events & Travel</Text>
          <View style={styles.searchSection}>
            <TextInput style={styles.searchBar} placeholder="Search Events..." placeholderTextColor={COLORS.textGrey} />
          </View>
        </View>
        <ScrollView style={styles.mainScroll}>
          <Text style={styles.sectionHeader}>Popular Events</Text>
          {loading ? <ActivityIndicator size="large" color={COLORS.lightBlue} /> : (
            <FlatList
              data={dbData}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 15 }}
              renderItem={({ item }) => (
                <AnimatedTouchable style={styles.eventCard} onPress={() => { setSelectedEvent(item); setSelectedSeats([]); fetchSeatLayout(item.id); setViewType('seatSelection'); }}>
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item.image_url }} style={styles.eventPoster} />
                    <View style={styles.overlayBadge}><Text style={styles.badgeText}>HD</Text></View>
                  </View>
                  <View style={styles.eventDetailsContainer}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.eventInfo}>{item.category}</Text>
                    <Text style={styles.eventPrice}>From ${item.price || '15.99'}</Text>
                  </View>
                </AnimatedTouchable>
              )}
            />
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      </ImageBackground>
    </Animated.View>
  );

  const SeatSelectionScreen = () => {
    const getSeatColor = (seat) => {
      if (selectedSeats.includes(seat.id)) return COLORS.selected;
      if (seat.status === 'booked') return COLORS.booked;
      return COLORS.available;
    };
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <ImageBackground source={{ uri: BG_PATTERN }} style={styles.bgPattern} imageStyle={{ opacity: 0.05 }}>
          <View style={styles.selectionHeader}>
            <AnimatedTouchable onPress={resetToHome} style={styles.backButton}>
              <Animated.Image source={{ uri: ICON_BACK }} style={[styles.backIcon, { transform: [{ scale: scaleAnim }] }]} />
            </AnimatedTouchable>
            <Text style={styles.selectionTitle} numberOfLines={1}>{selectedEvent?.title}</Text>
            <AnimatedTouchable onPress={() => { animateRotate(); fetchSeatLayout(selectedEvent?.id); }} style={styles.refreshButton}>
              <Animated.Image source={{ uri: ICON_REFRESH }} style={[styles.refreshIcon, { transform: [{ rotate: rotateInterpolate }] }]} />
            </AnimatedTouchable>
          </View>
          <View style={styles.screenContainer}><View style={styles.screen}><Text style={styles.screenText}>SCREEN</Text></View></View>
          <ScrollView contentContainerStyle={styles.seatGridContainer}>
            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: COLORS.available }]} /><Text style={styles.legendText}>Available</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: COLORS.booked }]} /><Text style={styles.legendText}>Booked</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: COLORS.selected }]} /><Text style={styles.legendText}>Selected</Text></View>
            </View>
            <View style={styles.seatGrid}>
              {seatLayout.map((seat) => (
                <AnimatedTouchable key={seat.id} style={[styles.seat, { backgroundColor: getSeatColor(seat) }]} onPress={() => handleSeatSelection(seat.id)}>
                  <Text style={styles.seatText}>{seat.row}{seat.number}</Text>
                </AnimatedTouchable>
              ))}
            </View>
          </ScrollView>
          <View style={styles.selectionFooter}>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectedCount}>Selected: {selectedSeats.length} seats</Text>
              <Text style={styles.totalPrice}>Total: ${(selectedSeats.length * 15.99).toFixed(2)}</Text>
            </View>
            <AnimatedTouchable style={[styles.confirmButton, selectedSeats.length === 0 && styles.disabledButton]} onPress={confirmSelection}>
              <Text style={styles.confirmButtonText}>Confirm Selection</Text>
            </AnimatedTouchable>
          </View>
        </ImageBackground>
      </Animated.View>
    );
  };

  const ConfirmationScreen = () => (
    <Animated.View style={[styles.container, styles.confirmationContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <ImageBackground source={{ uri: BG_PATTERN }} style={styles.bgPattern} imageStyle={{ opacity: 0.05 }}>
        <Animated.Image source={{ uri: ICON_CHECK }} style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]} />
        <Text style={styles.confirmationTitle}>Booking Confirmed! 🎉</Text>
        <Text style={styles.confirmationSubtitle}>Your seats have been booked successfully</Text>
        <View style={styles.bookingDetails}>
          <Text style={styles.detailLabel}>Event:</Text><Text style={styles.detailValue}>{selectedEvent?.title}</Text>
          <Text style={styles.detailLabel}>Selected Seats:</Text>
          <Text style={styles.detailValue}>{selectedSeats.map(id => { const seat = seatLayout.find(s => s.id === id); return seat ? `${seat.row}${seat.number}` : ''; }).join(', ')}</Text>
          <Text style={styles.detailLabel}>Total Amount:</Text><Text style={styles.detailValue}>${(selectedSeats.length * 15.99).toFixed(2)}</Text>
          <Text style={styles.detailLabel}>Booking ID:</Text><Text style={styles.detailValue}>#{Date.now().toString().slice(-8)}</Text>
          <Text style={styles.detailLabel}>Show Time:</Text><Text style={styles.detailValue}>09:30 PM (Today)</Text>
        </View>
        <AnimatedTouchable style={styles.doneButton} onPress={resetToHome}><Text style={styles.doneButtonText}>Back to Home</Text></AnimatedTouchable>
      </ImageBackground>
    </Animated.View>
  );

  const renderContent = () => {
    if (viewType !== 'eventList') {
      if (viewType === 'seatSelection') return <SeatSelectionScreen />;
      if (viewType === 'confirmation') return <ConfirmationScreen />;
    }
    switch (activeTab) {
      case 'Home': return <EventListScreen />;
      case 'MyBookings': return <MyBookingsScreen />;
      case 'Profile': return <ProfileScreen />;
      case 'Settings': return <SettingsScreen />;
      default: return <EventListScreen />;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      {renderContent()}
      {viewType === 'eventList' && (
        <View style={styles.bottomNavBar}>
          {[{ key: 'Home', icon: ICON_HOME, label: 'Home' }, { key: 'MyBookings', icon: ICON_TICKET, label: 'Bookings' }, { key: 'Profile', icon: ICON_PROFILE, label: 'Profile' }, { key: 'Settings', icon: ICON_SETTINGS, label: 'Settings' }].map((nav) => (
            <AnimatedTouchable key={nav.key} style={[styles.navItem, activeTab === nav.key && styles.activeNavItem]} onPress={() => { animateBounce(); setActiveTab(nav.key); }}>
              <Animated.Image source={{ uri: nav.icon }} style={[styles.navIcon, activeTab === nav.key && styles.activeNavIcon, { transform: [{ translateY: bounceAnim }] }]} />
              <Text style={[styles.navText, activeTab === nav.key && styles.activeNavText]}>{nav.label}</Text>
            </AnimatedTouchable>
          ))}
        </View>
      )}
    </View>
  );
}

registerRootComponent(SeatBookingApp);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.primary },
  container: { flex: 1, backgroundColor: COLORS.primary },
  bgPattern: { flex: 1, width: '100%' },
  headerContainer: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.pureWhite, marginBottom: 5, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  subTitle: { fontSize: 16, color: COLORS.lightBlue, marginBottom: 20 },
  searchSection: { marginTop: 10 },
  searchBar: { backgroundColor: COLORS.secondary, borderRadius: 12, height: 48, color: COLORS.pureWhite, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.cardBorder },
  mainScroll: { flex: 1 },
  sectionHeader: { color: COLORS.pureWhite, fontSize: 20, fontWeight: 'bold', margin: 15 },
  eventCard: { width: width * 0.44, marginBottom: 20 },
  imageContainer: { position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  eventPoster: { width: '100%', height: 200, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.cardBorder },
  overlayBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.lightBlue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold' },
  eventDetailsContainer: { marginTop: 8 },
  eventTitle: { color: COLORS.pureWhite, fontSize: 14, fontWeight: 'bold' },
  eventInfo: { color: COLORS.textGrey, fontSize: 11, marginTop: 2 },
  eventPrice: { color: COLORS.lightBlue, fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: COLORS.primary },
  backButton: { padding: 10, zIndex: 1 },
  backIcon: { width: 24, height: 24, tintColor: COLORS.lightBlue },
  refreshButton: { padding: 10, zIndex: 1 },
  refreshIcon: { width: 24, height: 24, tintColor: COLORS.lightBlue },
  selectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.pureWhite, flex: 1, textAlign: 'center' },
  screenContainer: { alignItems: 'center', marginVertical: 20 },
  screen: { width: '90%', height: 60, backgroundColor: COLORS.secondary, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightBlue, shadowColor: COLORS.lightBlue, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  screenText: { color: COLORS.lightBlue, fontSize: 16, fontWeight: 'bold' },
  seatGridContainer: { paddingHorizontal: 20, paddingBottom: 120 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  legendBox: { width: 20, height: 20, borderRadius: 4, marginRight: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 },
  legendText: { color: COLORS.textGrey, fontSize: 12 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  seat: { width: width * 0.1, height: width * 0.1, margin: 4, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  seatText: { color: COLORS.pureWhite, fontSize: 10, fontWeight: 'bold' },
  selectionFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: COLORS.secondary, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  selectionInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  selectedCount: { color: COLORS.pureWhite, fontSize: 16, fontWeight: 'bold' },
  totalPrice: { color: COLORS.lightBlue, fontSize: 16, fontWeight: 'bold' },
  confirmButton: { backgroundColor: COLORS.lightBlue, padding: 15, borderRadius: 12, alignItems: 'center', shadowColor: COLORS.lightBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  disabledButton: { backgroundColor: COLORS.textGrey, opacity: 0.5, shadowOpacity: 0 },
  confirmButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  confirmationContainer: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  successIcon: { width: 100, height: 100, marginBottom: 20, tintColor: COLORS.success },
  confirmationTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.pureWhite, marginBottom: 10, textAlign: 'center' },
  confirmationSubtitle: { fontSize: 16, color: COLORS.textGrey, marginBottom: 30, textAlign: 'center' },
  bookingDetails: { backgroundColor: COLORS.secondary, width: '100%', padding: 20, borderRadius: 12, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  detailLabel: { color: COLORS.textGrey, fontSize: 14, marginBottom: 5 },
  detailValue: { color: COLORS.pureWhite, fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  doneButton: { backgroundColor: COLORS.lightBlue, padding: 15, borderRadius: 12, alignItems: 'center', width: '100%', shadowColor: COLORS.lightBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  doneButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  bottomNavBar: { flexDirection: 'row', backgroundColor: COLORS.secondary, paddingVertical: 10, paddingBottom: 25, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  activeNavItem: { borderTopWidth: 2, borderTopColor: COLORS.lightBlue },
  navIcon: { width: 24, height: 24, tintColor: COLORS.textGrey, marginBottom: 4 },
  activeNavIcon: { tintColor: COLORS.lightBlue },
  navText: { color: COLORS.textGrey, fontSize: 12 },
  activeNavText: { color: COLORS.lightBlue, fontWeight: 'bold' },
  tabHeader: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: COLORS.primary },
  tabHeaderTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.pureWhite },
  bookingsScroll: { flex: 1, padding: 15 },
  bookingCard: { flexDirection: 'row', backgroundColor: COLORS.secondary, borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  bookingImage: { width: 100, height: 100 },
  bookingInfo: { flex: 1, padding: 12 },
  bookingTitle: { color: COLORS.pureWhite, fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  bookingDetail: { color: COLORS.textGrey, fontSize: 13, marginBottom: 3 },
  bookingDate: { color: COLORS.lightBlue, fontSize: 11, marginTop: 5 },
  emptyBookings: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { color: COLORS.pureWhite, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  emptySubText: { color: COLORS.textGrey, fontSize: 14 },
  profileContent: { flex: 1, alignItems: 'center', padding: 20 },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: COLORS.lightBlue },
  avatarText: { fontSize: 50 },
  profileName: { color: COLORS.pureWhite, fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  profileEmail: { color: COLORS.textGrey, fontSize: 14, marginBottom: 20 },
  profileStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 30 },
  statItem: { alignItems: 'center' },
  statNumber: { color: COLORS.lightBlue, fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: COLORS.textGrey, fontSize: 12, marginTop: 5 },
  profileOption: { backgroundColor: COLORS.secondary, padding: 15, borderRadius: 10, width: '100%', marginBottom: 10, borderWidth: 1, borderColor: COLORS.cardBorder },
  optionText: { color: COLORS.pureWhite, fontSize: 16 },
  settingsContent: { flex: 1, padding: 20 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.secondary, padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.cardBorder },
  settingText: { color: COLORS.pureWhite, fontSize: 16 },
  settingValue: { color: COLORS.lightBlue, fontSize: 14 },
  logoutItem: { marginTop: 20, borderColor: COLORS.booked },
  logoutText: { color: COLORS.booked, fontSize: 16, fontWeight: 'bold' },
});