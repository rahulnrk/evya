import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { h, w } from '../../constants/dimensions';
import { pallette } from '../../utils/pallette';
import { adjust, nav } from '../../helpers/common-functions';
import { regular, semibold } from '../../utils/fonts';
import strings from '../../utils/strings';
import { useSelector } from 'react-redux';
import { getUserDetails } from '../../redux/AuthSlice';
import StationsService from '../../axios/Apis';
import AlertMessage from '../../extra/alertmessage';
import Toast from 'react-native-toast-message';
import Header from '../../components/header-with-skip';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '../../hooks/useAuth';
import { baseApi } from '../../redux/api/baseApi';
import { useAppDispatch } from '../../redux/store';
// Reusable scroll wrapper component
const RootScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
    {children}
  </ScrollView>
);

// Reusable input field component
interface InputProps {
  label: string;
  value: string;
  placeholder?: string;
  hasicon?: boolean;
  onValueChange: (val: string) => void;
  onIconPress?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; // ✅ add this
   keyboardType?: 'default' | 'numeric'; // ✅ add this
}

const InputField: React.FC<InputProps> = ({
  label,
  value,
  placeholder,
  hasicon,
  onValueChange,
  onIconPress,
  autoCapitalize = 'none', // default
 keyboardType,
}) => (
  <View style={styles.inputContainer}>
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {hasicon && (
        <TouchableOpacity onPress={onIconPress}>
          <Image
            source={require('../../assets/images/icons/info.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
      )}
    </View>

    <TextInput
      placeholder={placeholder || label}
      placeholderTextColor={pallette.grey}
      style={styles.input}
      value={value}
      autoCapitalize={autoCapitalize}  // ✅ APPLY HERE
      keyboardType={keyboardType}
      onChangeText={onValueChange}
    />
  </View>
);

const AddVehicleScreen: React.FC<any> = ({ navigation, route }) => {
  // STATE-1: auth from Redux
  const { from } = route?.params || {};
  const { userId } = useAuth();
  const dispatch = useAppDispatch();
  const { vehicles } = useSelector((state: any) => state.auth);

  // State management
  const [active, setActive] = useState(from === 'vehicles' ? 1 : 0);
  const [title, setTitle] = useState('Add Vehicle');

  // Vehicle form data
  const [rc, setRc] = useState('');
  const [vin, setVin] = useState('');
  const [nickname, setNickname] = useState('');
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [variant, setVariant] = useState<any>(null);
  const [year, setYear] = useState<number | null>(null);

  // Data lists
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);
  // Loading states
  const [loadingModels, setLoadingModels] = useState(false);
  const [vinDecoding, setVinDecoding] = useState(false);
  const [loading, setLoading] = useState(false);

  // UI states
  const [vinUsed, setVinUsed] = useState(false);
  const [showBatteryPopup, setShowBatteryPopup] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Fetch brands on component mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Filter brands based on search input
  useEffect(() => {
    if (search) {
      const filtered = brands.filter((item: any) =>
        item.brandName.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredBrands(filtered);
    } else {
      setFilteredBrands(brands);
    }
  }, [search, brands]);

  // Update title based on active step
  useEffect(() => {
    const titles = [
      'Add Vehicle',
      'Add Vehicle',
      'Select Make',
      'Select Model',
      'Select Variant',
    ];
    setTitle(titles[active] || 'Add Vehicle');
  }, [active]);

  /**
   * Fetch all available EV brands from API
   */
  const fetchBrands = async () => {
    try {
      const result = await StationsService.fetchBrands();
      if (result.success) {
        setBrands(result.data);
        setFilteredBrands(result.data);
      } else {
        setAlertMessage(result.message || 'Failed to load vehicle brands');
      }
    } catch (error) {
      setAlertMessage('Failed to load vehicle brands');
    }
  };

  /**
   * Decode VIN number and auto-fill vehicle details
   * @param {string} vinNumber - 17-digit VIN number
   */
  const decodeVin = async (vinNumber: string) => {
    if (vinNumber.length !== 17) return;

    try {
      setVinDecoding(true);
      setLoadingModels(true);

      const result = await StationsService.decodeVin(vinNumber);

      if (result.success && result.data) {
        const { make, model: modelValue, year: yearValue } = result.data;

        // Find matching brand
        if (make) {
          const foundBrand = brands.find((b: any) =>
            b.brandName.toLowerCase().includes(make.toLowerCase())
          );
          if (foundBrand) {
            setBrand(foundBrand);
            setModels(foundBrand.models || []);
          } else {
            setBrand({ brandName: make, models: [] });
          }
        }

        // Set model and year if available
        if (modelValue) setModel({ modelName: modelValue });
        if (yearValue) setYear(yearValue);

        setVinUsed(true);
        setAlertMessage('Vehicle details auto-filled from VIN');
      } else {
        setAlertMessage(result.message || 'Failed to decode VIN');
      }
    } catch (error) {
      setAlertMessage('Failed to decode VIN. Please try manual selection.');
    } finally {
      setVinDecoding(false);
      setLoadingModels(false);
    }
  };

  /**
   * Navigate between form steps
   * @param {number} toIndex - Target step index
   * @param {any} item - Selected item (brand, model, or variant)
   */
  const handleContinue = (toIndex: number, item?: any) => {
    setActive(toIndex);

    // Handle brand selection
    if (toIndex === 3 && item) {
      setBrand(item);
      setModel(null);
      setVariant(null);
      setModels(item.models || []);
      setVariants([]);
      setVinUsed(false);
    }

    // Handle model selection
    if (toIndex === 4 && item) {
      setModel(item);
      setVariant(null);
      setVariants(item.variants || []);
    }

    // Handle variant selection
    if (toIndex === 1 && item) {
      setVariant(item);
    }
  };

  /**
   * Handle back button press based on current step
   */
  const handleBack = () => {
    if (active > 1) {
      // Go back to previous step
      setActive(active - 1);
      
      // Clear relevant data when going back
      if (active === 4) {
        setVariant(null);
        setVariants([]);
      } else if (active === 3) {
        setModel(null);
        setModels([]);
      }
    } else if (from === 'login') {
      // If coming from login and it's a new user, go to home
      navigation.reset({
        index: 0,
        routes: [
          {
            name: strings.app,
            key: `home-${Date.now()}`,
          },
        ],
      });
    } else {
      navigation.goBack();
    }
  };

  /**
   * Submit vehicle data to server
   */
  const addVehicle = async () => {
    // Validation
    if (!brand || !model || !year) {
      setAlertMessage('Please provide Make, Model, and Year before continuing.');
      return;
    }

    if (!userId) {
      setAlertMessage('User not found. Please login again.');
      return;
    }

    try {
      setLoading(true);

      const vehicleData = {
        userId,
        connectorType: 'Type2',
        vehicleType: 'Electric Car',
        description: nickname || '',
        make: brand?.brandName || '',
        model: model?.modelName || model?.model || '',
        variantId: variant?.id || '',
        year: year ? year.toString() : '',
        registrationNo: rc || '',
        vin: vin || '',
      };

     
      const result = await StationsService.addVehicle(vehicleData);

      if (result.success) {
        Toast.show({ type: 'success', text1: 'Vehicle Added Successfully' });

        // Refresh vehicles and navigate
        await getVehicles();
      } else {
        Toast.show({ type: 'error', text1: result.message || 'Failed to add vehicle' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to add vehicle. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh vehicles list and navigate appropriately
   */
  const getVehicles = async () => {
    try {
      if (!userId) return;

      await dispatch(getUserDetails(userId));
      // Invalidate RTK Query vehicles cache so list screens refresh
      dispatch(baseApi.util.invalidateTags(['Vehicles']));

      // Navigate based on origin
      if (from === 'login') {
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: strings.app,
                key: `home-${Date.now()}`,
              },
            ],
          });
        }, 500);
      } else if (from === 'vehicles') {
        navigation.goBack();
      } else {
        nav(navigation, strings.app);
      }
    } catch (error) {
      setAlertMessage('Failed to refresh vehicle list');
    }
  };

  /**
   * Handle skip button press
   */
  const handleSkip = () => {
    if (from === 'login') {
      setShowSkipConfirm(true);
    } else {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: strings.app,
            key: `home-${Date.now()}`,
          },
        ],
      });
    }
  };

  /**
   * Allow manual selection after VIN auto-fill
   */
  const allowManualSelection = () => {
    setVinUsed(false);
    setBrand(null);
    setModel(null);
    setVariant(null);
    setYear(null);
    setAlertMessage('You can now manually select make and model');
  };

  // Helper functions for display text
  const getBrandName = () => brand?.brandName || 'Select Make';
  const getModelName = () => model?.modelName || model?.model || 'Select Model';
  const getVariantName = () => variant?.variantName || 'Select Variant';

  // VIN Information Popup Component
  const BatteryPopup = () => (
    <Modal
      visible={showBatteryPopup}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowBatteryPopup(false)}
    >
      <View style={styles.popupContainer}>
        <View style={styles.popupContent}>
          <Text style={styles.popupTitle}>VIN Information</Text>
          <Image
            source={require('../../assets/images/home/vindetails.png')}
            style={styles.batteryImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.popupButton}
            onPress={() => setShowBatteryPopup(false)}
          >
            <Text style={styles.popupButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
         <Header
      onback={() => navigation.goBack()}
      active={1}
      onSkip={handleSkip}
      skippable={route?.params?.from === 'login'}
      hastitle={true}
      title={title}
      hasback={route?.params?.from !== 'login'}
    />
      </View>

<KeyboardAwareScrollView
  enableOnAndroid={true}
  extraScrollHeight={20}
>
      {/* Scrollable Content */}
      <RootScroll>
        <View style={styles.content}>
          {/* Welcome Screen */}
          {active === 0 && (
            <>
              <Text style={[styles.title, { marginTop: 20 }]}>
                Enhance your experience by adding your vehicles
              </Text>
              <Image
                source={require('../../assets/images/account/addvehicle.png')}
                style={styles.avatar}
              />
            </>
          )}

          {/* Vehicle Form Screen */}
          {active === 1 && (
            <>
              {/* VIN Input Field */}
              <InputField
                label="VIN Number"
                value={vin}
                placeholder="Enter 17-digit VIN (optional)"
                hasicon={true}
                onValueChange={(val) => {
                  setVin(val);
                  if (val.length === 17) decodeVin(val);
                  else if (val.length === 0) setVinUsed(false);
                }}
                onIconPress={() => setShowBatteryPopup(true)}
              />

              {vinDecoding && (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color={pallette.primary} />
                  <Text style={styles.loaderText}>Decoding VIN...</Text>
                </View>
              )}

              <BatteryPopup />

              {/* Manual Selection Option */}
              {vinUsed && (
                <TouchableOpacity
                  onPress={allowManualSelection}
                  style={styles.manualSelectionButton}
                >
                  <Text style={styles.manualSelectionText}>
                    Want to manually select make/model instead?
                  </Text>
                </TouchableOpacity>
              )}

              {/* Make, Model & Variant Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Make & Model</Text>

                {/* Brand Selection */}
                <TouchableOpacity
                  onPress={() => handleContinue(2)}
                  style={styles.selectModelButton}
                  disabled={vinUsed}
                >
                  <Text style={[
                    styles.selectModelButtonText,
                    !brand && { color: pallette.grey }
                  ]}>
                    {getBrandName()}
                  </Text>
                  <Image
                    source={require('../../assets/images/icons/right.png')}
                    style={[styles.icon, vinUsed && { opacity: 0.3 }]}
                  />
                </TouchableOpacity>

                {/* Model Selection */}
                {brand && (
                  <TouchableOpacity
                    onPress={() => handleContinue(3)}
                    style={[styles.selectModelButton, { marginTop: 10 }]}
                    disabled={vinUsed || !brand.models || brand.models.length === 0}
                  >
                    <Text style={[
                      styles.selectModelButtonText,
                      !model && { color: pallette.grey }
                    ]}>
                      {getModelName()}
                    </Text>
                    <Image
                      source={require('../../assets/images/icons/right.png')}
                      style={[
                        styles.icon,
                        (vinUsed || !brand.models || brand.models.length === 0) && { opacity: 0.3 }
                      ]}
                    />
                  </TouchableOpacity>
                )}

                {/* Variant Selection */}
                {model && (
                  <TouchableOpacity
                    onPress={() => handleContinue(4)}
                    style={[styles.selectModelButton, { marginTop: 10 }]}
                    disabled={vinUsed || !model.variants || model.variants.length === 0}
                  >
                    <Text style={[
                      styles.selectModelButtonText,
                      !variant && { color: pallette.grey }
                    ]}>
                      {getVariantName()}
                    </Text>
                    <Image
                      source={require('../../assets/images/icons/right.png')}
                      style={[
                        styles.icon,
                        (vinUsed || !model.variants || model.variants.length === 0) && { opacity: 0.3 }
                      ]}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Additional Vehicle Details */}
              <InputField
                label="Registration Number"
                value={rc}
                autoCapitalize="characters"
                onValueChange={setRc}
              />
              <InputField
                label="Nick Name"
                value={nickname}
                autoCapitalize="characters"
                onValueChange={setNickname}
                placeholder="e.g., My Tesla Model 3"
              />
              <InputField
                label="Year"
                value={year ? year.toString() : ''}
                onValueChange={(val) => setYear(val ? Number(val) : null)}
                placeholder="Enter Year"
                keyboardType="numeric"
                
              />
            </>
          )}

          {/* PERF-5: brand / model / variant as FlatList (longest selection lists) */}
          {active === 2 && (
            <FlatList
              data={filteredBrands}
              keyExtractor={(item: any, index) =>
                String(item?.id || item?.brandName || index)
              }
              style={{ maxHeight: h * 0.55 }}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <TextInput
                  placeholder="Search for make"
                  placeholderTextColor={pallette.grey}
                  style={[styles.input, { marginBottom: 15 }]}
                  value={search}
                  onChangeText={setSearch}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleContinue(3, item)}
                  style={[styles.selectModelButton, { marginBottom: 10 }]}
                >
                  <Text style={styles.selectModelButtonText}>
                    {item?.brandName}
                  </Text>
                  <Image
                    source={require('../../assets/images/icons/right.png')}
                    style={styles.icon}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noModelsText}>No brands found</Text>
              }
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={7}
              removeClippedSubviews
            />
          )}

          {active === 3 && (
            <FlatList
              data={loadingModels ? [] : models}
              keyExtractor={(item: any, index) =>
                String(item?.id || item?.model || item?.modelName || index)
              }
              style={{ maxHeight: h * 0.55 }}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <>
                  <Text style={[styles.label, { marginBottom: 15 }]}>
                    Select a model for {brand?.brandName}
                  </Text>
                  {loadingModels ? (
                    <View style={styles.loaderContainer}>
                      <ActivityIndicator size="small" color={pallette.primary} />
                      <Text style={styles.loaderText}>Loading models...</Text>
                    </View>
                  ) : null}
                </>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleContinue(4, item)}
                  style={[styles.selectModelButton, { marginBottom: 10 }]}
                >
                  <Text style={styles.selectModelButtonText}>
                    {item?.model || item?.modelName}
                  </Text>
                  <Image
                    source={require('../../assets/images/icons/right.png')}
                    style={styles.icon}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !loadingModels ? (
                  <Text style={styles.noModelsText}>
                    No models available for this brand
                  </Text>
                ) : null
              }
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={7}
              removeClippedSubviews
            />
          )}

          {active === 4 && (
            <FlatList
              data={variants}
              keyExtractor={(item: any, index) =>
                String(item?.id || item?.variantName || index)
              }
              style={{ maxHeight: h * 0.55 }}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <Text style={[styles.label, { marginBottom: 15 }]}>
                  Select a variant for {model?.modelName || model?.model}
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleContinue(1, item)}
                  style={[styles.selectModelButton, { marginBottom: 10 }]}
                >
                  <Text style={styles.selectModelButtonText}>
                    {item?.variantName}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noModelsText}>
                  No variants available for this model
                </Text>
              }
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={7}
              removeClippedSubviews
            />
          )}

          {/* Action Button */}
          {active !== 2 && active !== 3 && active !== 4 && (
            <TouchableOpacity
              disabled={(active === 1 && (!brand || !model || !year)) || loading}
              onPress={() => active === 0 ? handleContinue(1) : addVehicle()}
              style={[
                styles.otpButton,
                {
                  backgroundColor: (active === 1 && (!brand || !model || !year)) || loading
                    ? pallette.mediumgrey
                    : pallette.primary
                }
              ]}
            >
              {loading ? (
                <ActivityIndicator color={pallette.white} />
              ) : (
                <Text style={styles.otpButtonText}>
                  {active === 0 ? 'Continue' : 'Add Vehicle'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </RootScroll>
</KeyboardAwareScrollView>
      {/* Skip Confirmation Modal */}
      <Modal
        visible={showSkipConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSkipConfirm(false)}
      >
        <View style={styles.popupContainer}>
          <View style={[styles.popupContent, { padding: 20 }]}>
            <Text style={[styles.popupTitle, { fontSize: adjust(16) }]}>
              Skip Adding Vehicle?
            </Text>
            <Text style={styles.confirmText}>
              You can always add your vehicle later from your profile.
            </Text>
            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowSkipConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.skipButton]}
                onPress={() => {
                  setShowSkipConfirm(false);
                  navigation.reset({
                    index: 0,
                    routes: [
                      {
                        name: strings.app,
                        key: `home-${Date.now()}`,
                      },
                    ],
                  });
                }}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Message */}
      <AlertMessage
        message={alertMessage}
        onClose={() => setAlertMessage('')}
        showConfirm={alertMessage === 'Vehicle details auto-filled from VIN'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white
  },
  scrollView: {
    backgroundColor: pallette.white
  },
  content: {
    padding: 20,
    backgroundColor: pallette.white,
    minHeight: h
  },
  title: {
    fontSize: adjust(30),
    color: pallette.black,
    fontFamily: semibold,
    textAlign: 'center'
  },
  avatar: {
    width: w * 0.5,
    height: h * 0.5,
    alignSelf: 'center',
    resizeMode: 'contain'
  },
  otpButton: {
    height: h * 0.065,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: w * 0.04,
    marginVertical: h * 0.02
  },
  otpButtonText: {
    color: pallette.white,
    fontSize: adjust(12),
    fontFamily: regular
  },
  inputContainer: {
    marginVertical: h * 0.015,
    backgroundColor: pallette.white
  },
  label: {
    color: pallette.black,
    fontSize: adjust(12),
    fontFamily: semibold,
    marginBottom: 5
  },
  input: {
    height: h * 0.06,
    paddingVertical: h * 0.01,
    paddingHorizontal: w * 0.04,
    borderRadius: w * 0.04,
    color: pallette.black,
    fontSize: adjust(14),
    fontFamily: regular,
    borderWidth: 1,
    borderColor: pallette.lightgrey,
    backgroundColor: pallette.lightgrey
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: pallette.white
  },
  icon: {
    height: h * 0.02,
    width: h * 0.02,
    resizeMode: 'contain',
    tintColor: pallette.grey
  },
  selectModelButton: {
    height: h * 0.065,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: w * 0.04,
    backgroundColor: pallette.lightgrey,
    paddingHorizontal: w * 0.04,
    borderWidth: 1,
    borderColor: pallette.lightgrey
  },
  selectModelButtonText: {
    color: pallette.black,
    fontSize: adjust(12),
    fontFamily: regular
  },
  manualSelectionButton: {
    padding: 10,
    backgroundColor: pallette.lightgrey,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: pallette.lightgrey
  },
  manualSelectionText: {
    color: pallette.primary,
    fontSize: adjust(12),
    fontFamily: regular
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: pallette.white
  },
  loaderText: {
    marginLeft: 10,
    color: pallette.grey,
    fontSize: adjust(12),
    fontFamily: regular
  },
  noModelsText: {
    textAlign: 'center',
    marginTop: 20,
    color: pallette.grey,
    fontSize: adjust(14),
    fontFamily: regular
  },
  popupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20
  },
  popupContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400
  },
  popupTitle: {
    fontSize: adjust(18),
    fontFamily: semibold,
    color: pallette.black,
    marginBottom: 15,
    textAlign: 'center'
  },
  batteryImage: {
    width: 320,
    height: 420,
    marginVertical: 10
  },
  popupButton: {
    backgroundColor: pallette.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10
  },
  popupButtonText: {
    color: 'white',
    fontSize: adjust(14),
    fontFamily: semibold
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: pallette.white,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: pallette.lightgrey,
  },
  stickyTitle: {
    fontSize: adjust(20),
    fontFamily: semibold,
    color: pallette.black,
    marginLeft: 10
  },
  confirmText: {
    fontSize: adjust(14),
    fontFamily: regular,
    color: pallette.grey,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: pallette.lightgrey,
  },
  cancelButtonText: {
    color: pallette.black,
    fontFamily: semibold,
    fontSize: adjust(14),
  },
  skipButton: {
    backgroundColor: pallette.primary,
  },
  skipButtonText: {
    color: pallette.white,
    fontFamily: semibold,
    fontSize: adjust(14),
  },
});

export default AddVehicleScreen; 