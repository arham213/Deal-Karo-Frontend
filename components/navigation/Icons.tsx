
import Svg, { Path } from "react-native-svg"

export const HomeIcon = ({ color, size }: { color: string, size: number }) => {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20.83 8.01002L14.28 2.77002C13 1.75002 11 1.74002 9.72999 2.76002L3.17999 8.01002C2.23999 8.76002 1.66999 10.26 1.86999 11.44L3.12999 18.98C3.41999 20.67 4.98999 22 6.69999 22H17.3C18.99 22 20.59 20.64 20.88 18.97L22.14 11.43C22.32 10.26 21.75 8.76002 20.83 8.01002ZM12.75 18C12.75 18.41 12.41 18.75 12 18.75C11.59 18.75 11.25 18.41 11.25 18V15C11.25 14.59 11.59 14.25 12 14.25C12.41 14.25 12.75 14.59 12.75 15V18Z" fill= {color}/>
      </Svg>
    )
  }

  export const DisabledHomeIcon = ({ color, size }: { color: string, size: number }) => {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 18V15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M10.0698 2.81997L3.13978 8.36997C2.35978 8.98997 1.85978 10.3 2.02978 11.28L3.35978 19.24C3.59978 20.66 4.95978 21.81 6.39978 21.81H17.5998C19.0298 21.81 20.3998 20.65 20.6398 19.24L21.9698 11.28C22.1298 10.3 21.6298 8.98997 20.8598 8.36997L13.9298 2.82997C12.8598 1.96997 11.1298 1.96997 10.0698 2.81997Z" stroke="#C2C2C2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </Svg>
    )
  }

  export const NotesIcon = ({ color, size }: { color: string, size: number }) => {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M19.8301 3.18005C20.7539 3.1801 21.5 3.92618 21.5 4.84998V16.7396C21.5 17.4549 20.9005 18.1347 20.1787 18.224H20.1758L19.8662 18.264H19.8633C18.1691 18.4913 15.8164 19.186 13.9277 19.9779C13.6162 20.1071 13.2501 19.8734 13.25 19.5101V5.59998L13.2549 5.53357C13.2767 5.3798 13.3729 5.23364 13.5273 5.1488L13.5283 5.14978C15.3007 4.19102 17.992 3.33766 19.7939 3.18005H19.8301Z" fill={color} stroke="#404040"/>
        <Path d="M4.16016 3.18005H4.20605C6.00739 3.33755 8.69821 4.18941 10.4707 5.14783V5.1488C10.6424 5.24247 10.7402 5.40568 10.7402 5.59998V19.5101C10.7402 19.8734 10.3731 20.1073 10.0615 19.9779C8.17302 19.1862 5.8209 18.4913 4.12695 18.264H4.12402L3.81445 18.224H3.81152C3.08978 18.1347 2.49023 17.4549 2.49023 16.7396V4.84998C2.49028 3.92618 3.23636 3.1801 4.16016 3.18005ZM5 10.2396C4.31411 10.2398 3.75023 10.8038 3.75 11.4896C3.75 12.19 4.31832 12.7395 5 12.7396H8C8.68179 12.7396 9.25 12.1901 9.25 11.4896C9.24976 10.8037 8.686 10.2396 8 10.2396H5ZM5 7.23962C4.31411 7.23975 3.75023 7.80375 3.75 8.48962C3.75 9.19002 4.31832 9.7395 5 9.73962H7.25C7.93179 9.73962 8.5 9.1901 8.5 8.48962C8.49976 7.80368 7.936 7.23962 7.25 7.23962H5Z" fill="#404040" stroke="#404040"/>
      </Svg>
    )
  }

  export const DisabledNotesIcon = ({ color, size }: { color: string, size: number }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M22 16.7399V4.66994C22 3.46994 21.02 2.57994 19.83 2.67994H19.77C17.67 2.85994 14.48 3.92994 12.7 5.04994L12.53 5.15994C12.24 5.33994 11.76 5.33994 11.47 5.15994L11.22 5.00994C9.44 3.89994 6.26 2.83994 4.16 2.66994C2.97 2.56994 2 3.46994 2 4.65994V16.7399C2 17.6999 2.78 18.5999 3.74 18.7199L4.03 18.7599C6.2 19.0499 9.55 20.1499 11.47 21.1999L11.51 21.2199C11.78 21.3699 12.21 21.3699 12.47 21.2199C14.39 20.1599 17.75 19.0499 19.93 18.7599L20.26 18.7199C21.22 18.5999 22 17.6999 22 16.7399Z" stroke="#C2C2C2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <Path d="M12 5.48999V20.49" stroke="#C2C2C2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <Path d="M7.75 8.48999H5.5" stroke="#C2C2C2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <Path d="M8.5 11.49H5.5" stroke="#C2C2C2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </Svg>
    )
  }

  export const MyListingsIcon = ({ color, size }: { color: string, size: number }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M8 2.5H16C17.6546 2.5 18.7545 2.96994 19.4463 3.71484C20.1443 4.46652 20.5 5.57665 20.5 7V17C20.5 18.4234 20.1443 19.5335 19.4463 20.2852C18.7545 21.0301 17.6546 21.5 16 21.5H8C6.34538 21.5 5.24547 21.0301 4.55371 20.2852C3.85572 19.5335 3.5 18.4234 3.5 17V7C3.5 5.57665 3.85572 4.46652 4.55371 3.71484C5.24547 2.96994 6.34538 2.5 8 2.5ZM8 15.75C7.31386 15.75 6.75 16.3139 6.75 17C6.75 17.6861 7.31386 18.25 8 18.25H16C16.6861 18.25 17.25 17.6861 17.25 17C17.25 16.3139 16.6861 15.75 16 15.75H8ZM8 11.75C7.31386 11.75 6.75 12.3139 6.75 13C6.75 13.6861 7.31386 14.25 8 14.25H12C12.6861 14.25 13.25 13.6861 13.25 13C13.25 12.3139 12.6861 11.75 12 11.75H8ZM14.5 3.25C13.8139 3.25 13.25 3.81386 13.25 4.5V6.5C13.25 8.29614 14.7039 9.75 16.5 9.75H18.5C19.1861 9.75 19.75 9.18614 19.75 8.5C19.75 7.81386 19.1861 7.25 18.5 7.25H16.5C16.0861 7.25 15.75 6.91386 15.75 6.5V4.5C15.75 3.81386 15.1861 3.25 14.5 3.25Z" fill={color} stroke={color}/>
        </Svg>
    )
  }

  export const DisabledMyListingsIcon = ({ color, size }: { color: string, size: number }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
<Path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="#C2C2C2" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<Path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="#C2C2C2" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<Path d="M8 13H12" stroke="#C2C2C2" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<Path d="M8 17H16" stroke="#C2C2C2" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
</Svg>
    )
  }