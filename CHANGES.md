# Recent Changes

## Brand Colors - Burnt Orange Gradient

Updated the brand colors to use a burnt orange gradient:
- **Deepest shade (left)**: `hsl(20 100% 50%)` - Deep burnt orange
- **Lighter shade (right)**: `hsl(25 90% 60%)` - Lighter orange
- Buttons now use `bg-gradient-to-r from-primary to-primary-light`

## Button Updates

- Default button variant now uses a gradient from deep burnt orange (left) to lighter orange (right)
- Added shadow effects for better visual depth
- Hover states maintain gradient with opacity change

## Form Data Handling

Created `onboarding-service.tsx` to handle form data locally until API is ready:

### Features:
- **Local Storage**: Saves account creation data to localStorage
- **Mock API**: Simulates API calls with delays
- **Automatic Fallback**: Tries real API first, falls back to mock service if unavailable
- **OTP Validation**: Accepts any 6-digit code except "000000" for testing
- **Data Persistence**: Form data persists across page refreshes

### Usage:
The service automatically handles:
- Account creation with validation
- Email verification with OTP
- OTP resend functionality

### Testing:
- Use any 6-digit OTP code except "000000"
- Form data is saved to localStorage under key `onboarding_form_data`
- Check browser console for mock service logs

## Mobile Layout - Select Account Type

Updated the Select Account Type screen for mobile:

### Mobile Layout:
- **Icon**: Left-aligned, smaller size (h-6 w-6)
- **Title**: Top-right of icon (same line alignment)
- **Description**: Below the title
- All elements are left-aligned

### Desktop Layout:
- Maintains centered, grid layout (3 columns)
- Icon, title, and description are vertically stacked and centered

## Files Modified

1. `src/index.css` - Updated brand colors to burnt orange gradient
2. `src/components/ui/button.tsx` - Added gradient button variant
3. `src/services/onboarding-service.tsx` - New mock service for form handling
4. `src/screens/onboarding/SelectAccountType.tsx` - Updated mobile layout
5. `src/screens/onboarding/CreateAccount.tsx` - Added mock service integration
6. `src/screens/onboarding/VerifyEmail.tsx` - Added mock service integration
7. `src/api/auth.tsx` - Added error handling for API fallback

## Next Steps

1. Test the onboarding flow with mock service
2. Verify gradient buttons display correctly
3. Test mobile layout on various screen sizes
4. Once API is ready, remove mock service or keep as fallback
