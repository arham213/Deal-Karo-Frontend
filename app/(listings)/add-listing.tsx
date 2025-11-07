"use client"

import { Button } from "@/components/Button"
import { Dropdown } from "@/components/Dropdown"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { BLOCK_OPTIONS, PHASE_OPTIONS } from "@/constants/listingOptions"
import { User } from "@/types/auth"
import { AreaSize, ListingType, PropertyType } from "@/types/listings"
import { getToken, getUser } from "@/utils/secureStore"
import axios from "axios"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

import { SafeAreaView } from "react-native-safe-area-context"

interface AddListingState {
  propertyType: PropertyType
  listingType: ListingType
  plotNo: string
  houseNo: string
  block: string
  phase: string
  area: AreaSize
  additionalArea: string
  price: string
  totalPrice: string
  pricePerMarla: string
  rentPerMonth: string
  installmentPerMonth: string
  installmentQuarterly: string
  description: string
  contact: string
  hasPole: boolean
  hasWire: boolean
}

export default function AddListingScreen() {
  const router = useRouter()

  const [loading, setLoading] = useState<Boolean>(false);
  const [formData, setFormData] = useState<AddListingState>({
    propertyType: "plot",
    listingType: "cash",
    plotNo: "",
    houseNo: "",
    block: "",
    phase: "",
    area: "5 Marla",
    additionalArea: "",
    price: "",
    totalPrice: "",
    pricePerMarla: "",
    rentPerMonth: "",
    installmentPerMonth: "",
    installmentQuarterly: "",
    description: "",
    contact: "+92 ",
    hasPole: false,
    hasWire: false,
  })

  const handleInputChange = (key: keyof AddListingState, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const BASE_URL = 'http://10.224.131.91:8080/api';

  const handleAddListing = async () => {
    setLoading(true)
    try {
      const user: User = await getUser();
      const token = await getToken();

      if (!token) throw new Error("Token missing. Please log in again.");
      if (!user) throw new Error("User not found in storage.");

      const userData = {
        userId: user?._id,
        ...((formData.propertyType === "plot" || formData.propertyType === "commercial plot") ? { plotNo: formData.plotNo } : { houseNo: formData.houseNo }),
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        block: formData.block,
        phase: formData.phase,
        area: formData.area,
        additionalArea: formData.additionalArea,
        ...((formData.propertyType === "plot" || formData.propertyType === "commercial plot") && formData.listingType === "cash" && {
          pricePerMarla: formData.pricePerMarla,
          totalPrice: formData.totalPrice
        }),
        ...(formData.propertyType === "house" && formData.listingType === "cash" && {
          price: formData.price
        }),
        // ...(formData.propertyType === "house" && formData.listingType === "rent" && {
        //   rentPerMonth: formData.rentPerMonth
        // }),
        ...(formData.listingType === "installments" && {
          price: formData.price,
          installment: {
            perMonth: formData.installmentPerMonth,
            quarterly: formData.installmentQuarterly
          }
        }),
        description: formData.description,
        forContact: formData.contact,
        features: JSON.stringify({
          hasPole: formData.hasPole,
          hasWire: formData.hasWire
        })
      }

      console.log('userData:', userData);

      const response = await axios.post(`${BASE_URL}/properties`, userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      //console.log('response:', response?.data);

      setLoading(false);
      if (response?.data.success) {
        router.back()
      } else {
        alert("Property creation failed");
      }
    } catch (error) {
      setLoading(false)
      
      if (axios.isAxiosError(error)) {
        alert(error?.response?.data?.error?.message);
      } else {
        alert("Something went wrong. Please try again later")
      }
    }
  }

  const areaSizes: AreaSize[] = ["3 Marla", "5 Marla", "10 Marla", "15 Marla", "1 Kanal", "custom"]

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Listing</Text>
          </View>

          {/* Property Type Tabs */}
          <View style={styles.section}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.propertyTab, formData.propertyType === "plot" && styles.activePropertyTab]}
                onPress={() => {
                  handleInputChange("propertyType", "plot")
                  handleInputChange("listingType", "cash")
                }}
              >
                <Text
                  style={[styles.propertyTabText, formData.propertyType === "plot" && styles.activePropertyTabText]}
                >
                  Plot
                </Text>
              </TouchableOpacity>
              <View style={styles.tabDivider} />
              <TouchableOpacity
                style={[styles.propertyTab, formData.propertyType === "house" && styles.activePropertyTab]}
                onPress={() => {
                  handleInputChange("propertyType", "house")
                  handleInputChange("listingType", "cash")
                }}
              >
                <Text
                  style={[styles.propertyTabText, formData.propertyType === "house" && styles.activePropertyTabText]}
                >
                  House
                </Text>
              </TouchableOpacity><View style={styles.tabDivider} />
              <TouchableOpacity
                style={[styles.propertyTab, formData.propertyType === "commercial plot" && styles.activePropertyTab]}
                onPress={() => {
                  handleInputChange("propertyType", "commercial plot")
                  handleInputChange("listingType", "cash")
                }}
              >
                <Text
                  style={[styles.propertyTabText, formData.propertyType === "commercial plot" && styles.activePropertyTabText]}
                >
                  Commercial plot
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* What is it for? */}
          {formData.propertyType !== "house" && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>What it is for?</Text>
              <View style={styles.listingTypeContainer}>
                <TouchableOpacity
                  style={[styles.listingTypeButton, formData.listingType === "cash" && styles.activeListingType]}
                  onPress={() => handleInputChange("listingType", "cash")}
                >
                  <Text style={[styles.listingTypeText, formData.listingType === "cash" && styles.activeListingTypeText]}>
                    Cash
                  </Text>
                </TouchableOpacity>
                {/* {formData.propertyType === "house" && (
                  <TouchableOpacity
                    style={[styles.listingTypeButton, formData.listingType === "rent" && styles.activeListingType]}
                    onPress={() => handleInputChange("listingType", "rent")}
                  >
                    <Text style={[styles.listingTypeText, formData.listingType === "rent" && styles.activeListingTypeText]}>
                      Rent
                    </Text>
                  </TouchableOpacity>
                )} */}
                <TouchableOpacity
                  style={[styles.listingTypeButton, formData.listingType === "installments" && styles.activeListingType]}
                  onPress={() => handleInputChange("listingType", "installments")}
                >
                  <Text
                    style={[
                      styles.listingTypeText,
                      formData.listingType === "installments" && styles.activeListingTypeText,
                    ]}
                  >
                    Installments
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* PlotNo/House No */}
          {(formData.propertyType === "plot" || formData.propertyType === "commercial plot") && (
            <View style={styles.section}>
              <TextInput
                label="Plot No"
                placeholder="Eg., 101"
                value={formData.plotNo}
                onChangeText={(value) => handleInputChange("plotNo", value)}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {formData.propertyType === "house" && (
            <View style={styles.section}>
              <TextInput
                label="House No"
                placeholder="Eg., 101"
                value={formData.houseNo}
                onChangeText={(value) => handleInputChange("houseNo", value)}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Phase */}
          <View style={styles.section}>
            <Dropdown
              label="Phase"
              placeholder="Select Phase"
              options={PHASE_OPTIONS}
              value={formData.phase}
              onValueChange={(value) => handleInputChange("phase", value)}
            />
          </View>

          {/* Block */}
          <View style={styles.section}>
            <Dropdown
              label="Block"
              placeholder="Select Block"
              options={BLOCK_OPTIONS}
              value={formData.block}
              onValueChange={(value) => handleInputChange("block", value)}
            />
          </View>

          {/* Area */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Area</Text>
            <View style={styles.areaGrid}>
              {areaSizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.areaButton, formData.area === size && styles.activeAreaButton]}
                  onPress={() => handleInputChange("area", size)}
                >
                  <Text style={[styles.areaButtonText, formData.area === size && styles.activeAreaButtonText]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Area */}
          <View style={styles.section}>
            <TextInput
              label="Additional Area (Sq.ft)"
              placeholder="E.g., 500"
              value={formData.additionalArea}
              onChangeText={(value) => handleInputChange("additionalArea", value)}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Price/Rent - Sale Type */}
          {formData.listingType === "cash" && (
            <>
              {(formData.propertyType === "plot" || formData.propertyType === "commercial plot") && (
                <>
                  <View style={styles.section}>
                    <TextInput
                      label="Price Per Marla"
                      placeholder="2,50,000"
                      value={formData.pricePerMarla}
                      onChangeText={(value) => handleInputChange("pricePerMarla", value)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.section}>
                    <TextInput
                      label="Total Price"
                      placeholder="25,000,000"
                      value={formData.totalPrice}
                      onChangeText={(value) => handleInputChange("totalPrice", value)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </>
              )}

              {formData.propertyType === "house" && (
                <View style={styles.section}>
                  <TextInput
                    label="Price"
                    placeholder="25,000,000"
                    value={formData.price}
                    onChangeText={(value) => handleInputChange("price", value)}
                    keyboardType="decimal-pad"
                  />
                </View>
              )}
            </>
          )}

          {/* Rent Type */}
          {/* {formData.listingType === "rent" && (
            <View style={styles.section}>
              <TextInput
                label="Rent per month"
                placeholder="25,000"
                value={formData.rentPerMonth}
                onChangeText={(value) => handleInputChange("rentPerMonth", value)}
                keyboardType="decimal-pad"
              />
            </View>
          )} */}

          {/* Installment Type */}
          {formData.listingType === "installments" && (
            <>
              <View style={styles.section}>
                <TextInput
                  label="Price"
                  placeholder="25,000,000"
                  value={formData.price}
                  onChangeText={(value) => handleInputChange("price", value)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.section}>
                <TextInput
                  label="Installment per month"
                  placeholder="60,000"
                  value={formData.installmentPerMonth}
                  onChangeText={(value) => handleInputChange("installmentPerMonth", value)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.section}>
                <TextInput
                  label="Installment quarterly"
                  placeholder="160,000"
                  value={formData.installmentQuarterly}
                  onChangeText={(value) => handleInputChange("installmentQuarterly", value)}
                  keyboardType="decimal-pad"
                />
              </View>
            </>
          )}

          {/* Description */}
          <View style={styles.section}>
            <TextInput
              label="Description"
              placeholder="Type a short description (Optional)"
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              multiline
            />
          </View>

          {/* More Options */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>More Options</Text>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Don't have a pole</Text>
              <Switch value={formData.hasPole} onValueChange={(value) => handleInputChange("hasPole", value)} />
            </View>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>No wire</Text>
              <Switch value={formData.hasWire} onValueChange={(value) => handleInputChange("hasWire", value)} />
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <TextInput
              label="For Contact"
              placeholder="+92 "
              value={formData.contact}
              onChangeText={(value) => handleInputChange("contact", value)}
              keyboardType="phone-pad"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonGroup}>
            <Button title="Add" onPress={handleAddListing} />
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    overflow: "hidden",
  },
  propertyTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activePropertyTab: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  propertyTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center"
  },
  activePropertyTabText: {
    color: Colors.text,
  },
  tabDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  listingTypeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  listingTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  activeListingType: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  listingTypeText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  activeListingTypeText: {
    color: Colors.white,
  },
  areaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  areaButton: {
    width: "48%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  activeAreaButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  areaButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
  },
  activeAreaButtonText: {
    color: Colors.white,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 40,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
})
