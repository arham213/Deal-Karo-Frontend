export type PropertyType = "plot" | "house" | "commercial plot"
export type ListingType = "cash" | "rent" | "installments"
export type AreaSize = "3 Marla" | "5 Marla" | "10 Marla" | "15 Marla" | "1 Kanal" | "custom"

export interface ListingState {
  _id: string,
  userId: {
    _id: string,
    name: string,
    estateName: string
  }
  propertyType: PropertyType
  listingType: ListingType
  plotNo?: string
  houseNo?: string
  block: string
  phase: string
  area: AreaSize
  additionalArea?: string
  price?: string
  totalPrice?: string
  pricePerMarla?: string
  rentPerMonth?: string
  installment?: {
    perMonth: string
    quarterly: string
  }
  description: string
  contact: string
  hasPole?: boolean
  hasWire?: boolean
  moreOptions?: string
}