# LifePulse BMS — REST API Reference

All API routes return JSON responses with standard HTTP status codes:
- `200 OK` / `201 Created`: Request succeeded.
- `400 Bad Request`: Validation failure (Zod error payload).
- `401 Unauthorized`: Authentication missing or expired.
- `403 Forbidden`: User role lacks permission for target resource.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Business logic violation or illegal state transition.
- `500 Internal Server Error`: Unhandled server exception.

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Register a new user account (Donor or Patient).
- **Public**: Yes
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password@123",
    "phone": "5551234567",
    "role": "DONOR",
    "city": "Central City",
    "bloodGroup": "O_POS"
  }
  ```
- **Response**: `201 Created` with created user summary.

### `POST /api/auth/[...nextauth]`
NextAuth.js authentication router handling login, session inspection, and logout.

---

## 2. Public Blood Stock & Center Endpoints

### `GET /api/blood-stock`
Returns system-wide aggregated inventory across all active blood centers for each of the 8 blood groups.
- **Public**: Yes
- **Response**:
  ```json
  {
    "data": [
      {
        "bloodGroup": "O_POS",
        "displayGroup": "O+",
        "units": 97,
        "status": "AVAILABLE",
        "statusLabel": "Available"
      }
    ]
  }
  ```

### `GET /api/centers`
Lists all active blood centers (blood banks and hospitals) along with their current 8-group inventory.
- **Public**: Yes

### `GET /api/centers/cities`
Returns sorted, distinct list of cities with active blood centers.
- **Public**: Yes

### `GET /api/centers/search?bloodGroup={group}&city={city}&emergency={boolean}`
Search blood centers filtered by blood group, optional city, and emergency priority.
- **Public**: Yes
- **Query Params**:
  - `bloodGroup` (required): `A_POS`, `O_POS`, etc.
  - `city` (optional): City name
  - `emergency` (optional): `true` / `false`

### `GET /api/centers/[id]`
Detailed information for a single blood center including all 8 blood stock categories.
- **Public**: Yes

### `GET /api/centers/[id]/stock`
Returns stock summary for a specific center.
- **Public**: Yes

---

## 3. Donor Portal Endpoints

### `GET /api/donor/profile`
Retrieve the authenticated donor's profile, including blood group and current availability status.
- **Access**: Donor only

### `PATCH /api/donor/profile`
Update donor contact details (name, phone, city, address).
- **Access**: Donor only

### `GET /api/donor/availability`
Get donor's availability status (`AVAILABLE` / `UNAVAILABLE`).
- **Access**: Donor only

### `PATCH /api/donor/availability`
Update donor's availability status.
- **Access**: Donor only

### `GET /api/donor/donations`
Retrieve all donation records for the authenticated donor with verification status and dates.
- **Access**: Donor only

### `POST /api/donor/donations`
Submit a new donation record. Initial status will be `PENDING`.
- **Access**: Donor only
- **Body**:
  ```json
  {
    "bloodGroup": "O_POS",
    "units": 1,
    "donationDate": "2026-09-15T10:00:00.000Z"
  }
  ```

---

## 4. Patient / Hospital Endpoints

### `GET /api/patient/profile`
Retrieve patient / organization profile details.
- **Access**: Patient only

### `PATCH /api/patient/profile`
Update patient profile information.
- **Access**: Patient only

### `GET /api/patient/requests`
List all blood requests submitted by the authenticated patient.
- **Access**: Patient only

### `POST /api/patient/requests`
Submit a new blood request.
- **Access**: Patient only
- **Body**:
  ```json
  {
    "patientName": "John Doe",
    "bloodGroup": "O_POS",
    "unitsRequired": 2,
    "hospitalName": "St. Jude Hospital",
    "city": "Central City",
    "contactNumber": "5559876543",
    "requiredDate": "2026-09-20",
    "urgency": "NORMAL",
    "additionalInfo": "Pre-scheduled procedure"
  }
  ```

### `GET /api/patient/requests/[id]`
Get specific request details.
- **Access**: Patient only

### `PATCH /api/patient/requests/[id]/cancel`
Cancel a pending request. Cannot cancel approved or fulfilled requests.
- **Access**: Patient only

---

## 5. Admin Management Endpoints

### `GET /api/admin/stats`
Returns system dashboard metrics: total donors, active patients, pending requests, pending donations, critical stock alerts.
- **Access**: Admin only

### `GET /api/admin/blood-stock`
Returns complete stock breakdown across centers and blood groups.
- **Access**: Admin only

### `PATCH /api/admin/blood-stock/[bloodGroup]`
Adjust inventory for a specific blood group.
- **Access**: Admin only
- **Body**: `{ "units": 5, "mode": "DELTA" }` or `{ "units": 50, "mode": "SET" }`

### `GET /api/admin/donations`
List all donation records with filtering by status (`PENDING`, `VERIFIED`, `REJECTED`).
- **Access**: Admin only

### `POST /api/admin/donations/[id]/verify`
Verifies a pending donation. Atomically increments stock and writes audit log.
- **Access**: Admin only

### `POST /api/admin/donations/[id]/reject`
Rejects a pending donation with a mandatory or optional reason.
- **Access**: Admin only

### `GET /api/admin/requests`
List all blood requests with status and urgency filters.
- **Access**: Admin only

### `POST /api/admin/requests/[id]/approve`
Marks request as `APPROVED`. Stock remains unchanged until fulfillment.
- **Access**: Admin only

### `POST /api/admin/requests/[id]/fulfill`
Fulfills request and atomically deducts required units from stock.
- **Access**: Admin only

### `POST /api/admin/requests/[id]/reject`
Rejects a request with an explanation.
- **Access**: Admin only

### `GET /api/admin/donors`
List all registered donors with search, city, and blood group filters.
- **Access**: Admin only

### `GET /api/admin/donors/[id]`
Detailed donor record with donation history.
- **Access**: Admin only

### `GET /api/admin/patients`
List all registered patients and hospitals.
- **Access**: Admin only

### `GET /api/admin/reports`
Retrieve audit trail and system activity logs with admin attribution.
- **Access**: Admin only

---

## 6. Notification Endpoints

### `GET /api/notifications`
Retrieve recent notifications for the logged-in user.
- **Access**: Authenticated users

### `PATCH /api/notifications/[id]/read`
Mark a specific notification as read.
- **Access**: Authenticated users
