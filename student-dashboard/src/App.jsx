import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import DatasetView from "./pages/DatasetView";
import "./App.css";

export default function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from JSON file directly
    const loadData = async () => {
      try {
        const response = await fetch("./dataset.json");
        if (response.ok) {
          const data = await response.json();
          console.log(`Loaded ${data.length} students from dataset.json`);
          setStudents(data);
        } else {
          console.warn("Failed to load dataset.json.");
          setStudents([]);
        }
      } catch (error) {
        console.error("Error loading JSON dataset:", error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div>
        <Navbar />

        <div className="container-fluid">
          <Routes>
            <Route path="/" element={<Dashboard students={students} />} />
            <Route path="/dataset" element={<DatasetView students={students} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
