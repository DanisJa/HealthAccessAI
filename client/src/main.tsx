import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title
document.title = "Medi - IoT Health Dashboard";

// Add metadata for SEO
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content =
  "Medi - Secure healthcare dashboard with IoT integration for patients and healthcare professionals. Track health parameters, appointments and medications.";
document.head.appendChild(metaDescription);

// Add Open Graph tags
const ogTitle = document.createElement("meta");
ogTitle.property = "og:title";
ogTitle.content = "Medi - IoT Health Dashboard";
document.head.appendChild(ogTitle);

const ogDescription = document.createElement("meta");
ogDescription.property = "og:description";
ogDescription.content =
  "Secure healthcare dashboard with IoT integration for patients and healthcare professionals. Track health parameters, appointments and medications.";
document.head.appendChild(ogDescription);

const ogType = document.createElement("meta");
ogType.property = "og:type";
ogType.content = "website";
document.head.appendChild(ogType);

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
