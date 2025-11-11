import Svg, { Path } from "react-native-svg"

export const LocationIcon = ({ color, size }: { color: string, size: number }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
            <Path d="M6.99999 7.83421C8.00515 7.83421 8.81999 7.01937 8.81999 6.01421C8.81999 5.00906 8.00515 4.19421 6.99999 4.19421C5.99483 4.19421 5.17999 5.00906 5.17999 6.01421C5.17999 7.01937 5.99483 7.83421 6.99999 7.83421Z" stroke={color} stroke-width="1.5" />
            <Path d="M2.11167 4.95246C3.26084 -0.099206 10.745 -0.0933725 11.8883 4.95829C12.5592 7.92163 10.7158 10.43 9.1 11.9816C7.9275 13.1133 6.0725 13.1133 4.89417 11.9816C3.28417 10.43 1.44084 7.91579 2.11167 4.95246Z" stroke="#404040" stroke-width="1.5" />
        </Svg>
    )
}

export const DetailsIcon = ({ color, size }: { color: string, size: number }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 14 13" fill="none">
            <Path d="M9.08835 6.49996C9.08835 7.57246 8.15502 8.43912 7.00002 8.43912C5.84502 8.43912 4.91168 7.57246 4.91168 6.49996C4.91168 5.42746 5.84502 4.56079 7.00002 4.56079C8.15502 4.56079 9.08835 5.42746 9.08835 6.49996Z" stroke="#757575" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <Path d="M7 10.9796C9.05917 10.9796 10.9783 9.85293 12.3142 7.90293C12.8392 7.13918 12.8392 5.85543 12.3142 5.09168C10.9783 3.14168 9.05917 2.01501 7 2.01501C4.94083 2.01501 3.02167 3.14168 1.68583 5.09168C1.16083 5.85543 1.16083 7.13918 1.68583 7.90293C3.02167 9.85293 4.94083 10.9796 7 10.9796Z" stroke="#757575" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </Svg>
    )
}