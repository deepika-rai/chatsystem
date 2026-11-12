# Node.js MVC – MyChat

This project follows the **MVC (Model–View–Controller)** architecture in **Node.js + Express**, supporting both **REST APIs** and **UI views (Pug templates)**.
It is structured for scalability with clear separation of concerns.

---

## Folder Structure

```
mychat/
│
├── public/                        # Static assets
│   └── assets/
│       ├── css/                   # Stylesheets (main, login, pagination, etc.)
│       ├── js/                    # Client-side JS
│       ├── images/                # App images & product images
│       │   ├── categoryImages/
│       │   └── productimages/
│       └── userimages/            # User uploaded profile pictures
│
├── src/
│   ├── config/                    # App configuration
│   │   ├── db.js                  # MySQL / Sequelize connection
│   │   ├── firebase.ts            # Firebase Admin SDK setup
│   │   ├── serviceAccountKey.json # Firebase service account credentials
│   │   └── session.js             # Express session config
│   │
│   ├── middlewares/               # Express middlewares
│   │   ├── auth.middleware.js     # JWT / token auth check
│   │   ├── authMiddleware.js      # Session-based auth check
│   │   ├── roleMiddleware.js      # Role-based access control
│   │   ├── uploadFile.js          # Multer file upload middleware
│   │   └── validate.js            # Joi request validation middleware
│   │
│   ├── models/                    # Sequelize models
│   │   ├── greetings.js
│   │   ├── notification.js
│   │   ├── user.model.js
│   │   └── index.js               # Model loader & associations
│   │
│   ├── modules/                   # Feature modules (MVC)
│   │   ├── index.js               # Route aggregator
│   │   │
│   │   ├── api/                   # REST API modules (JSON responses)
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.routes.js
│   │   │   │   └── auth.validation.js
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.controller.js
│   │   │   │   └── dashboard.routes.js
│   │   │   ├── setting/
│   │   │   │   ├── setting.controller.js
│   │   │   │   └── setting.routes.js
│   │   │   ├── staff/
│   │   │   │   ├── staff.controller.js
│   │   │   │   ├── staff.routes.js
│   │   │   │   └── staff.validation.js
│   │   │   └── user/
│   │   │       ├── user.controller.js
│   │   │       └── user.routes.js
│   │   │
│   │   └── ui/                    # UI modules (server-rendered Pug views)
│   │       ├── apiDocs/
│   │       │   ├── api.controller.js
│   │       │   └── api.routes.js
│   │       ├── driver/
│   │       │   ├── driver.controller.js
│   │       │   └── driver.routes.js
│   │       ├── hsnCode/
│   │       │   ├── hsn.controller.js
│   │       │   └── hsn.routes.js
│   │       ├── service/
│   │       │   ├── service.controller.js
│   │       │   └── service.routes.js
│   │       ├── statusUpload/
│   │       │   ├── status.controller.js
│   │       │   └── status.routes.js
│   │       └── user/
│   │           ├── user.controller.js
│   │           ├── user.routes.js
│   │           └── user.validation.js
│   │
│   ├── uploads/                   # Uploaded files (runtime generated)
│   │   ├── bill/                  # Bill PDFs
│   │   ├── rep/                   # Report files
│   │   ├── req/                   # Request documents
│   │   ├── ser/                   # Service uploads
│   │   └── srv/                   # Server uploads
│   │
│   ├── utils/                     # Helper / utility functions
│   │   ├── encyption.js           # Encryption helpers
│   │   ├── errorHandler.js        # API error handler
│   │   ├── errorHandlerUi.js      # UI error handler
│   │   ├── invoice.js             # Invoice generation
│   │   ├── invoiceFormat.js       # Invoice formatting
│   │   ├── multerUploader.js      # Multer config helper
│   │   └── sendOtp.js             # OTP sender
│   │
│   └── views/                     # Pug templates
│       ├── layouts/
│       │   └── main.pug           # Base layout
│       ├── partials/
│       │   ├── header.pug
│       │   └── sidebar.pug
│       ├── pages/
│       │   └── admin/             # Admin panel pages
│       │       ├── dashboard.pug
│       │       ├── user.pug
│       │       ├── addUser.pug
│       │       ├── editUser.pug
│       │       ├── userProfile.pug
│       │       ├── archived-user.pug
│       │       ├── greeting.pug
│       │       ├── addGreeting.pug
│       │       ├── editGreeting.pug
│       │       ├── notification.pug
│       │       ├── my-profile.pug
│       │       ├── edit-profile.pug
│       │       ├── update-password.pug
│       │       └── comingsoon.pug
│       ├── home.pug
│       ├── login.pug
│       ├── forgot.pug
│       └── error.pug
│
├── .env                           # Environment variables
├── .env.example                   # Sample env file
├── .gitignore
├── AlterQuery                     # Raw SQL / alter queries
├── app.js                         # Express app setup
├── server.js                      # Server entry point
├── tsconfig.json                  # TypeScript config
├── bitbucket-pipelines.yml        # CI/CD pipeline config
├── package.json
├── package-lock.json
└── README.md
```

---

## Tech Stack

* **Node.js** + **Express**
* **MVC Architecture**
* **Sequelize / MySQL** (or Mongoose / MongoDB if required)
* **Pug** (UI templating engine)
* **dotenv** for environment configuration
* **Nodemon** for development

---

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/deepika-rai/mychat.git
   cd mychat
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root:

   ```
   PORT=5000
   DB_HOST=localhost
   DB_NAME=mychat
   DB_USER=root
   DB_PASS=password
   NODE_ENV=development
   ```

4. **Run the application**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

5. **Access in browser:**

   * API: `http://localhost:3000/api/...`
   * UI: `http://localhost:3000/`

---

## Example Routes

**API (JSON responses)**

```
GET    /api/users
POST   /api/users
GET    /api/expenses
```

**UI (Pug views)**

```
GET    /
GET    /dashboard
```

---

## Code Structure Example

### API Controller (`src/modules/api/user/user.controller.js`)

```js
import models from "../../../models/index.js";
const { User } = models;

export const getUsers = async (req, res) => {
  const users = await User.findAll();
  res.json({ status: true, data: users });
};
```

### UI Controller (`src/modules/ui/user/user.controller.js`)

```js
export const userDashboard = (req, res) => {
  res.render("dashboard", { title: "User Dashboard" });
};
```

---

## Scripts

```bash
npm run dev      # Run in development mode with nodemon
npm start        # Run in production mode
```