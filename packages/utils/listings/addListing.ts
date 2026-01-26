import axios from "axios"
import type { User } from "../../../types/auth"
import type { AreaSize, ListingType, PropertyType } from "../../../types/listings"
import { Validation, type ValidationErrors } from "../../../utils/validation"

export interface AddListingState {
  propertyType: PropertyType
  listingType: ListingType
  plotNo: string
  houseNo: string
  block: string
  phase: string
  area: AreaSize
  additionalArea: string
  price: string
  pricePerMarla: string
  rentPerMonth: string
  installmentPerMonth: string
  installmentHalfYearly: string
  description: string
  contact: string
  possession: string
  image: string | null
}

export type ListingField =
  | "plotNo"
  | "houseNo"
  | "block"
  | "phase"
  | "area"
  | "additionalArea"
  | "price"
  | "pricePerMarla"
  | "installmentPerMonth"
  | "installmentHalfYearly"
  | "contact"
  | "possession"

export const FORM_FIELDS: ListingField[] = [
  "plotNo",
  "houseNo",
  "block",
  "phase",
  "area",
  "additionalArea",
  "price",
  "pricePerMarla",
  "installmentPerMonth",
  "installmentHalfYearly",
  "contact",
  "possession",
]

export type AddListingTouchedState = Record<ListingField, boolean>

export type AddListingErrors = ValidationErrors<ListingField>

export const createInitialAddListingState = (): AddListingState => ({
  propertyType: "plot",
  listingType: "cash",
  plotNo: "",
  houseNo: "",
  block: "",
  phase: "",
  area: "5 Marla",
  additionalArea: "",
  price: "",
  pricePerMarla: "",
  rentPerMonth: "",
  installmentPerMonth: "",
  installmentHalfYearly: "",
  description: "",
  contact: "",
  possession: "Yes",
  image: null
})

export const createAddListingTouchedState = (value: boolean): AddListingTouchedState =>
  FORM_FIELDS.reduce((acc, field) => {
    acc[field] = value
    return acc
  }, {} as AddListingTouchedState)

export const getTotalPrice = (
  pricePerMarla: string,
  area: string,
  additionalArea: string,
): string => {
  let totalArea: number

  if (area?.includes("Kanal")) {
    totalArea = Number(area.split(" ")[0]) * 20
  } else {
    totalArea = Number(area.split(" ")[0])
  }

  totalArea += Number(additionalArea || 0) / 255

  const totalPrice = Number(pricePerMarla || 0) * (Number.isFinite(totalArea) ? totalArea : 0)
  return Number.isFinite(totalPrice) ? totalPrice.toFixed(2) : "0.00"
}

export const isValidatableListingField = (
  key: keyof AddListingState,
): key is ListingField => (FORM_FIELDS as string[]).includes(key as string)

export const validateListingField = (
  field: ListingField,
  value: string,
  state: AddListingState,
): string | undefined => {
  const trimmed = value.trim()

  switch (field) {
    case "plotNo":
      if (!(state.propertyType === "plot" || state.propertyType === "commercial plot")) return undefined
      if (!Validation.isRequired(trimmed)) return "Plot number is required"
      if (!Validation.isNumeric(trimmed)) return "Plot number must be numeric"
      return undefined
    case "houseNo":
      if (state.propertyType !== "house") return undefined
      if (!Validation.isRequired(trimmed)) return "House number is required"
      if (!Validation.isNumeric(trimmed)) return "House number must be numeric"
      return undefined
    case "block":
      if (!Validation.isRequired(trimmed)) return "Block is required"
      return undefined
    case "phase":
      if (!Validation.isRequired(trimmed)) return "Phase is required"
      return undefined
    case "area":
      if (!Validation.isRequired(value)) return "Area is required"
      if (value === "custom") return "Please specify the custom area"
      return undefined
    case "additionalArea":
      if (!trimmed) return undefined
      if (!Validation.isNumeric(trimmed)) return "Additional area must be numeric"
      return undefined
    case "price": {
      const isPlotOrCommercialPlot =
        state.propertyType === "plot" || state.propertyType === "commercial plot"
      const isCashListing = state.listingType === "cash"

      if (isPlotOrCommercialPlot && isCashListing && state.pricePerMarla && state.area) {
        // Price is auto-calculated, validate the calculated value
        const calculatedPrice = getTotalPrice(
          state.pricePerMarla,
          state.area,
          state.additionalArea || "",
        )
        if (!calculatedPrice || calculatedPrice === "NaN" || calculatedPrice === "0.00") {
          return "Price calculation error. Please check price per marla and area."
        }
        if (Validation.toNumber(calculatedPrice) <= 0) {
          return "Calculated price must be greater than 0"
        }
        return undefined
      }

      // For other cases, validate the manually entered price
      if (!Validation.isRequired(trimmed)) return "Price is required"
      if (!Validation.isNumeric(trimmed)) return "Price must be numeric"
      if (Validation.toNumber(trimmed) <= 0) return "Price must be greater than 0"
      return undefined
    }
    case "pricePerMarla":
      if (
        !(
          (state.propertyType === "plot" || state.propertyType === "commercial plot") &&
          state.listingType === "cash"
        )
      )
        return undefined
      if (!Validation.isRequired(trimmed)) return "Price per marla is required"
      if (!Validation.isNumeric(trimmed)) return "Price per marla must be numeric"
      if (Validation.toNumber(trimmed) <= 0) return "Price per marla must be greater than 0"
      return undefined
    case "installmentPerMonth":
      if (state.listingType !== "installments") return undefined
      if (!Validation.isRequired(trimmed)) return "Monthly installment is required"
      if (!Validation.isNumeric(trimmed)) return "Monthly installment must be numeric"
      return undefined
    case "installmentHalfYearly":
      if (state.listingType !== "installments") return undefined
      if (!Validation.isRequired(trimmed)) return "Half Yearly installment is required"
      if (!Validation.isNumeric(trimmed)) return "Half Yearly installment must be numeric"
      return undefined
    case "possession":
      if (!Validation.isRequired(value)) return "Possession is required"
      return undefined
    case "contact":
      // Contact is derived from user, not from the form in current implementation
      return undefined
    default:
      return undefined
  }
}

export const validateAddListingForm = (
  state: AddListingState,
): {
  isValid: boolean
  errors: AddListingErrors
} => {
  const newErrors: AddListingErrors = {}

  FORM_FIELDS.forEach((field) => {
    const value = (state[field] as unknown as string) || ""
    const errorMessage = validateListingField(field, value, state)
    if (errorMessage) {
      newErrors[field] = errorMessage
    }
  })

  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors,
  }
}

export const hasBlockingListingErrors = (state: AddListingState): boolean =>
  FORM_FIELDS.some((field) => {
    const value = (state[field] as unknown as string) || ""
    return Boolean(validateListingField(field, value, state))
  })

export interface AddListingPayload {
  userId: string
  plotNo?: string
  houseNo?: string
  propertyType: PropertyType
  listingType: ListingType
  block: string
  phase: string
  area: AreaSize
  additionalArea?: string
  price?: string
  pricePerMarla?: string
  installment?: {
    perMonth: string
    halfYearly: string
  }
  description?: string
  forContact: string
  possession: boolean
  image?: string | null
}

export const buildAddListingPayload = (
  state: AddListingState,
  user: User,
): AddListingPayload => {
  const isPlotOrCommercial =
    state.propertyType === "plot" || state.propertyType === "commercial plot"

  const base: AddListingPayload = {
    userId: user._id,
    propertyType: state.propertyType,
    listingType: state.listingType,
    block: state.block,
    phase: state.phase,
    area: state.area,
    additionalArea: state.additionalArea,
    price: state.price,
    description: state.description,
    forContact: Validation.digitsOnly(user.contactNo || ""),
    possession: state.possession === "Yes",
    image: state.image,
  }

  if (isPlotOrCommercial) {
    base.plotNo = state.plotNo
  } else {
    base.houseNo = state.houseNo
  }

  if (isPlotOrCommercial && state.listingType === "cash" && state.pricePerMarla) {
    base.pricePerMarla = state.pricePerMarla
  }

  if (state.listingType === "installments") {
    base.installment = {
      perMonth: state.installmentPerMonth,
      halfYearly: state.installmentHalfYearly,
    }
  }

  return base
}

export interface CreateListingParams {
  token: string
  payload: AddListingPayload
  baseUrl?: string
}

// export const createListing = async ({
//   token,
//   payload,
//   baseUrl = "https://deal-karo-backend.onrender.com/api",
// }: CreateListingParams): Promise<void> => {
//   try {
//     const response = await axios.post(
//       `${baseUrl}/properties`,
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       },
//     )

//     if (!response?.data?.success) {
//       const message =
//         response?.data?.error?.message || response?.data?.message || "Listing creation failed"
//       throw new Error(message)
//     }
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       const message =
//         error?.response?.data?.error?.message ||
//         error?.response?.data?.message ||
//         error.message ||
//         "Listing creation failed"
//       throw new Error(message)
//     }

//     throw new Error("Something went wrong. Please try again later")
//   }
// }

export const createListing = async ({
  token,
  payload,
  baseUrl = "https://deal-karo-backend.onrender.com/api",
}: CreateListingParams): Promise<void> => {
  try {
    let data: any = payload;
    let headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (payload.image) {
      const formData = new FormData();
      // Append all primitive fields
      Object.keys(payload).forEach((key) => {
        const value = payload[key as keyof AddListingPayload];
        if (key === 'image') {
          // Handle image specially
          const uri = payload.image;
          const filename = uri?.split('/').pop();
          const match = /\.(\w+)$/.exec(filename as string);
          const type = match ? `image/${match[1]}` : `image`;
          // @ts-ignore
          formData.append('image', { uri, name: filename, type });
        } else if (key === 'installment' && typeof value === 'object') {
          // Check if backend expects stringified JSON or separate fields for nested objects
          // Assuming handled as JSON string or backend logic. For proper Multipart, usually we send simple keys.
          // However existing logic sent JSON. Let's send it as JSON string if Multipart, or rely on backend handling.
          // Safest for nested objects in FormData is often stringifying or dot notation.
          // Given the existing payload structure, let's assume we can JSON stringify the nested implementation object
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      data = formData;
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await axios.post(
      `${baseUrl}/properties`,
      data,
      {
        headers,
      },
    )

    if (!response?.data?.success) {
      const message =
        response?.data?.error?.message || response?.data?.message || "Listing creation failed"
      throw new Error(message)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error.message ||
        "Listing creation failed"
      throw new Error(message)
    }

    throw new Error("Something went wrong. Please try again later")
  }
}


