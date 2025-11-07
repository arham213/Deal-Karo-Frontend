"use client"

import { Colors } from "@/constants/colors"
import { Ionicons } from "@expo/vector-icons"
import { usePathname, useRouter } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export function BottomNavigationBar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (route: string) => {
    router.push(route as any)
  }

  const handleAddListing = () => {
    router.push("/add-listing")
  }

  const isActive = (route: string) => {
    if (route === "/listings") {
      return pathname === "/listings" || pathname.startsWith("/listings")
    }
    return pathname === route || pathname.startsWith(`${route}/`)
  }

  return (
    <SafeAreaView style={styles.bottomNavigationBar} edges={["bottom"]}>
      <View style={styles.navBarContent}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => handleNavigation("/listings")}
        >
          <Ionicons 
            name={isActive("/listings") ? "home" : "home-outline"} 
            size={24} 
            color={isActive("/listings") ? Colors.primary : Colors.text} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => handleNavigation("/my-notes")}
        >
          <Ionicons 
            name={isActive("/my-notes") ? "list" : "list-outline"} 
            size={24} 
            color={isActive("/my-notes") ? Colors.primary : Colors.text} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fabButton} onPress={handleAddListing}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleNavigation("/my-listings")}
        >
          <Ionicons 
            name={isActive("/my-listings") ? "list" : "list-outline"} 
            size={24} 
            color={isActive("/my-listings") ? Colors.primary : Colors.text} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => handleNavigation("/profile")}
        >
          <Ionicons 
            name={isActive("/profile") ? "person" : "person-outline"} 
            size={24} 
            color={isActive("/profile") ? Colors.primary : Colors.text} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  bottomNavigationBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navBarContent: {
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -8,
  },
  fabIcon: {
    fontSize: 32,
    color: Colors.white,
    fontWeight: "300",
  },
})

