# React Redux App with Tailwind, Ant Design, Remix Icon, Formik, Yup, and Express Proxy

A modern full-stack project featuring a React frontend and an Express proxy server. Includes robust state management, form handling, and modern styling solutions.

> 📌 **Note:** All required dependencies are pre-configured. **No additional libraries needed.**

## ⚙️ Features

- ⚛️ **React + Redux Toolkit** for state management  
- 🎨 **Tailwind CSS** for utility-first styling  
- 💎 **Ant Design** for prebuilt UI components  
- 🖼️ **Remix Icon** for scalable icon sets  
- ✅ **Formik + Yup** for form handling and validation  
- 🌐 **Express proxy server** for API requests and CORS handling  

## 📁 Project Structure

```
omtTeam/
├── react-servicenow/       # Frontend application
│   ├── src/                # React source code
│   ├── package.json        # Frontend dependencies
│   └── ...                 # Other React config files
│
└── proxy-servicenow/       # Express proxy server
    ├── app.js              # Server configuration
    ├── package.json        # Backend dependencies
    └── ...                 # Other server files
```

## 🚀 Getting Started

### Requirements

- Node.js (v16+ recommended)  
- npm (v8+ recommended)

### Installation & Running

```bash
# 1. Clone the repository
git clone [[your-repository-url]](https://github.com/rabie02/omtTeam.git)
cd omtTeam

# 2. Set up and run the React frontend
cd react-servicenow
npm install
npm run dev

# 3. Set up and run the Express proxy server
cd ../proxy-servicenow
npm install
npx nodemon app.js
```



