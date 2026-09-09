# Face Recognition Attendance System

## Overview
The CRM system includes an automated face recognition attendance system that uses Sharp for image processing and automatic face detection.

## Features

### ✅ Implemented Features
1. **Automatic Face Detection** - No button click required
2. **Auto-verification Countdown** - 3-second countdown when face is in perfect position
3. **Image Processing with Sharp** - Optimizes and normalizes images for better recognition
4. **Real-time Face Position Guidance** - Guides users to position their face correctly
5. **Automatic Check-in/Check-out** - Verifies identity and records attendance automatically

## How It Works

### For Employees (Taking Attendance)
1. Admin clicks "Check In" or "Check Out" button
2. Webcam activates and starts detecting faces
3. System provides real-time guidance ("Move slightly left", "Perfect! Hold still", etc.)
4. When face is in perfect position, 3-second countdown begins
5. System automatically captures photo and verifies identity
6. Attendance is recorded with employee name displayed

### Backend Processing (Sharp Integration)
1. **Image Optimization**: Resizes images to 800x800, converts to JPEG with 90% quality
2. **Face Comparison Processing**: Normalizes images to 224x224 for consistent comparison
3. **Feature Extraction**: Creates 128-dimension feature vector from processed images
4. **Similarity Matching**: Compares captured face against all registered employees
5. **Best Match Selection**: Finds best matching employee with threshold verification

## Technical Implementation

### Backend (Node.js + Sharp)
```typescript
// Image processing for attendance
sharp(buffer)
  .resize(800, 800, { fit: 'inside' })
  .jpeg({ quality: 90 })
  .toBuffer()

// Face comparison normalization
sharp(buffer)
  .resize(224, 224, { fit: 'cover' })
  .normalize()
  .toFormat('jpeg')
  .toBuffer()
```

### Frontend (React + Webcam)
- Real-time face detection simulation
- Auto-verify countdown (3 seconds)
- Position guidance feedback
- Toast notifications for success/error

### Database (Prisma)
- Stores face embeddings as JSON strings
- Tracks check-in/check-out times
- Records face verification images
- Links to employee profiles

## API Endpoints

### Public Face Verification (No Auth)
```
POST /api/attendance/public/verify-face
Body: { faceImageBase64, faceDescriptor }
Response: { verified, employeeId, employeeName, similarity }
```

### Public Check-in
```
POST /api/attendance/public/checkin
Body: { employeeId, faceImageBase64, faceDescriptor }
Response: { success, message, data: attendance }
```

### Public Check-out
```
POST /api/attendance/public/checkout
Body: { employeeId, faceImageBase64, faceDescriptor }
Response: { success, message, data: attendance }
```

## Configuration

### Environment Variables
```env
UPLOAD_DIR=uploads/faces  # Directory for storing face images
```

### Face Recognition Settings
- **Similarity Threshold**: 0.6 (lower distance = same person)
- **Image Size**: 224x224 for comparison, 800x800 for storage
- **Auto-verify Delay**: 3 seconds after "Perfect" position
- **Feature Vector Dimensions**: 128

## NPM Commands (Backend)

### Database Management
```bash
npm run db:generate        # Generate Prisma Client
npm run db:migrate         # Create and apply migration
npm run db:push            # Push schema without migration
npm run db:reset           # Reset database completely
npm run prisma:reset       # Reset + auto-seed data
npm run db:studio          # Open Prisma Studio (visual editor)
```

### Development
```bash
npm run dev               # Start development server
npm run build             # Build for production
npm run start             # Start production server
npm run seed              # Run seed script
```

## User Flow

### 1. Employee Registration
- Admin navigates to Employees page
- Clicks "Register Face" button for employee
- Employee positions face in camera
- System captures and stores face embedding

### 2. Daily Check-in
- Employee/Admin clicks "Check In" button
- Webcam activates
- System guides face positioning
- Auto-verifies when face is stable (3s countdown)
- Displays welcome message with employee name
- Records check-in time

### 3. Daily Check-out
- Employee/Admin clicks "Check Out" button
- Same verification process
- Displays goodbye message
- Records check-out time

## Security Features

1. **Face Verification Required** - Cannot check-in/out without registered face
2. **Similarity Threshold** - Only accepts high-confidence matches (>60%)
3. **Image Storage** - All attendance photos stored for audit trail
4. **Active Status Check** - Only verifies against active employees
5. **Date Validation** - Cannot check-in twice or check-out before check-in

## Future Enhancements (Recommended)

1. **Face-API.js Integration** - Replace simple feature extraction with actual face recognition
2. **Live Liveness Detection** - Prevent photo/video spoofing
3. **Multiple Face Detection** - Handle multiple people in frame
4. **Offline Mode** - Cache face data for offline verification
5. **Mobile App** - Native mobile app for attendance
6. **GPS Verification** - Ensure employees are at work location
7. **Biometric Fallback** - Fingerprint/PIN as backup method

## Troubleshooting

### Face Not Detected
- Ensure good lighting
- Remove glasses if possible
- Face camera directly
- Keep face within dashed rectangle

### Verification Failed
- Ensure face was registered correctly
- Check if employee is active
- Verify face descriptor stored in database
- Check similarity threshold settings

### Auto-verify Not Working
- Ensure "Perfect! Hold still" message appears
- Wait for 3-second countdown
- Keep still during countdown
- Check browser console for errors

## File Structure

```
back-end/
├── src/
│   ├── services/
│   │   └── attendance.service.ts    # Face processing with Sharp
│   ├── controllers/
│   │   └── attendance.controller.ts # API endpoints
│   └── dtos/
│       └── attendance.dto.ts        # Type definitions
├── uploads/
│   └── faces/                       # Stored face images
└── prisma/
    └── schema.prisma                # Database schema

front-end/
└── app/
    └── (admin)/
        └── admin/
            └── attendance/
                └── page.tsx         # Attendance UI with auto-detect
```

## Dependencies

### Backend
- `sharp` - Image processing and optimization
- `@prisma/client` - Database ORM
- `express` - Web framework

### Frontend
- `react-webcam` - Webcam integration
- `sonner` - Toast notifications
- `lucide-react` - Icons

## Notes

- Current implementation uses **simulated face detection** for demo purposes
- For production, integrate **face-api.js** or similar library for real face recognition
- Face embeddings are stored as JSON strings in PostgreSQL
- Images are optimized with Sharp before storage to save space
- Auto-verification countdown can be adjusted in the frontend code
