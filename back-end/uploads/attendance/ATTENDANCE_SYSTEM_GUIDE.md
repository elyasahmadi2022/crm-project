# 📸 Face Recognition Attendance System Guide

## Overview
This system uses face recognition technology to track employee attendance. Each employee has a dedicated folder where their face photos are stored and used for verification during check-in and check-out.

## Folder Structure
```
uploads/attendance/
├── Admin_User/           # Folder for Admin User
├── Ahmad_Ahmadi/         # Folder for Ahmad Ahmadi
├── Fatima_Karimi/        # Folder for Fatima Karimi
├── Hassan_Rezai/         # Folder for Hassan Rezai
└── Zahra_Mohammadi/      # Folder for Zahra Mohammadi
```

Each folder contains:
- `README.txt` - User information and instructions
- Face photos captured during check-in/check-out (automatically saved)
- Reference photos for face registration (manually added)

## How It Works

### 1. Face Registration (One-time Setup)
Before an employee can use face recognition attendance, they must register their face:

1. **Take a clear photo** of the employee's face:
   - Front-facing, good lighting
   - Neutral expression
   - No glasses or face coverings (if possible)
   - Resolution: At least 640x480 pixels

2. **Upload via API**:
   ```bash
   POST /api/v1/attendance/face/register
   {
     "employeeId": 1,
     "faceImageBase64": "base64_encoded_image_data",
     "faceDescriptor": [array of 128 numbers from face-api.js]
   }
   ```

3. The system stores:
   - Face embedding (128-dimensional vector) in database
   - Reference photo in user's folder

### 2. Daily Attendance Flow

#### Check-In (Morning)
1. Employee opens attendance page
2. System captures face photo using camera
3. Face-api.js extracts face descriptor
4. System verifies face against registered embedding
5. If match (similarity > 60%), attendance is marked as PRESENT
6. Photo is saved to user's folder with timestamp

#### Check-Out (Evening)
1. Same process as check-in
2. System records check-out time
3. Attendance record is completed

### 3. Face Verification Algorithm

The system uses **Euclidean Distance** to compare faces:

```typescript
distance = √(Σ(a[i] - b[i])²)
similarity = 1 - distance
threshold = 0.6  // 60% match required
```

- **Distance < 0.6**: Same person (VERIFIED) ✅
- **Distance ≥ 0.6**: Different person (FAILED) ❌

### 4. Attendance Status

| Status | Description |
|--------|-------------|
| `PRESENT` | Employee checked in with verified face |
| `ABSENT` | No check-in record for the day |
| `HALF_DAY` | Checked in late or left early |
| `LEAVE` | Approved leave (manually marked) |
| `HOLIDAY` | Company holiday (manually marked) |

### 5. Manual Override (Admin Only)

Admins can manually create/edit attendance:

```bash
POST /api/v1/attendance/manual
{
  "employeeId": 1,
  "date": "2024-01-15",
  "checkIn": "2024-01-15T09:00:00Z",
  "checkOut": "2024-01-15T17:00:00Z",
  "status": "PRESENT",
  "notes": "Manual entry due to system issue"
}
```

## API Endpoints

### Face Management
- `POST /api/v1/attendance/face/register` - Register employee face
- `POST /api/v1/attendance/face/verify` - Verify face against registered

### Attendance
- `POST /api/v1/attendance/checkin` - Check in with face
- `POST /api/v1/attendance/checkout` - Check out with face
- `GET /api/v1/attendance/today` - Today's attendance
- `GET /api/v1/attendance/date/:date` - Attendance by date
- `GET /api/v1/attendance/employee/:id` - Employee attendance history
- `GET /api/v1/attendance/employee/:id/monthly/:year/:month` - Monthly summary

### Admin
- `POST /api/v1/attendance/manual` - Create manual attendance
- `PUT /api/v1/attendance/:id` - Update attendance
- `DELETE /api/v1/attendance/:id` - Delete attendance

## Photo Requirements

### For Registration
- **Format**: JPG, PNG
- **Size**: 1-5 MB
- **Resolution**: 640x480 minimum, 1920x1080 recommended
- **Lighting**: Good, even lighting
- **Position**: Face centered, front-facing
- **Distance**: 0.5-1 meter from camera

### Auto-Saved Photos
- Check-in photos: `checkin-{timestamp}.jpg`
- Check-out photos: `checkout-{timestamp}.jpg`
- Profile photos: `employee-{id}-profile.jpg`

## Security & Privacy

1. **Face Embeddings**: Stored as 128-dimensional vectors (not actual images)
2. **Photos**: Stored locally, not accessible via public URL
3. **Access Control**: Only admins and the employee themselves can view attendance
4. **Data Retention**: Photos kept for 90 days, then archived
5. **GDPR Compliance**: Users can request deletion of face data

## Troubleshooting

### Face Not Recognized
1. Check lighting conditions
2. Remove glasses/hat if worn during registration
3. Ensure camera is working properly
4. Re-register face with better quality photo

### System Not Recording Attendance
1. Verify face descriptor is being extracted
2. Check browser console for errors
3. Ensure date/time is correct on device
4. Contact admin if persists

### Manual Attendance Entry
If face recognition fails:
1. Employee notifies supervisor
2. Admin creates manual entry
3. Photo is saved for audit trail
4. Incident is logged

## Monthly Reports

The system generates automatic reports:
- **Present Days**: Total days marked present
- **Absent Days**: Total days not marked
- **Attendance Rate**: (Present / Total Work Days) × 100%
- **Late Check-ins**: Check-ins after 9:30 AM
- **Early Check-outs**: Check-outs before 5:00 PM

Work days exclude:
- Fridays (weekly holiday)
- Company holidays
- Approved leaves

## Support

For issues or questions:
- **Email**: support@luilala.com
- **Phone**: +93 799 000 000
- **Documentation**: https://luilala.com/docs/attendance

---

**Last Updated**: January 2024
**System Version**: 1.0.0
