import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Upload,
  User,
  Activity,
  Heart,
  Droplet,
  Wind,
  TrendingUp,
  LogOut,
  Plus,
  FileText,
  BarChart3,
  Brain,
} from "lucide-react";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [persons, setPersons] = useState([]);
  const [uploadedData, setUploadedData] = useState([]);
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Login attempted with:", username, password);

    if (username === "admin" && password === "admin123") {
      console.log("Login successful");
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      console.log("Login failed");
      setLoginError("Invalid credentials. Use admin/admin123");
    }
  };

  // Add New Person
  const handleAddPerson = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newPerson = {
      id: Date.now(),
      name: formData.get("name"),
      age: formData.get("age"),
      gender: formData.get("gender"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      medicalId: formData.get("medicalId"),
      createdAt: new Date().toISOString(),
    };
    setPersons([...persons, newPerson]);
    e.target.reset();
    setActiveView("dashboard");
  };

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;

      // Parse CSV
      if (file.name.endsWith(".csv")) {
        const lines = text.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim());
        const data = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line, index) => {
            const values = line.split(",").map((v) => v.trim());
            const row = { id: index };
            headers.forEach((header, i) => {
              row[header] = isNaN(values[i])
                ? values[i]
                : parseFloat(values[i]);
            });
            return row;
          });
        setUploadedData(data);
      }
    };
    reader.readAsText(file);
  };

  // AI Analysis
  const analyzeData = async () => {
    if (uploadedData.length === 0) {
      alert("Please upload data first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Analyze this health data and provide insights on trends, anomalies, and recommendations. Focus on HR (heart rate), BP (blood pressure), and SPO2 (oxygen saturation) if present. Data: ${JSON.stringify(
                uploadedData.slice(0, 50)
              )}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const analysisText = data.content
        .map((item) => item.text || "")
        .join("\n");
      setAnalysis(analysisText);
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysis("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate stats
  const calculateStats = () => {
    if (uploadedData.length === 0) return null;

    const hrData = uploadedData
      .filter((d) => d.HR || d.hr || d["Heart Rate"])
      .map((d) => d.HR || d.hr || d["Heart Rate"]);
    const bpSystolicData = uploadedData
      .filter((d) => d.BP_Systolic || d.SBP || d["BP Systolic"])
      .map((d) => d.BP_Systolic || d.SBP || d["BP Systolic"]);
    const spo2Data = uploadedData
      .filter((d) => d.SPO2 || d.spo2 || d["Oxygen Saturation"])
      .map((d) => d.SPO2 || d.spo2 || d["Oxygen Saturation"]);

    return {
      avgHR: hrData.length
        ? (hrData.reduce((a, b) => a + b, 0) / hrData.length).toFixed(1)
        : "N/A",
      avgBP: bpSystolicData.length
        ? (
            bpSystolicData.reduce((a, b) => a + b, 0) / bpSystolicData.length
          ).toFixed(1)
        : "N/A",
      avgSPO2: spo2Data.length
        ? (spo2Data.reduce((a, b) => a + b, 0) / spo2Data.length).toFixed(1)
        : "N/A",
      totalRecords: uploadedData.length,
    };
  };

  const stats = calculateStats();

  if (!isLoggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a4d5c 0%, #1a1a2e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "60px 50px",
            maxWidth: "440px",
            width: "100%",
            boxShadow:
              "0 30px 90px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            animation: "slideUp 0.6s ease-out",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, #00d4aa 0%, #0096c7 100%)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: "0 8px 24px rgba(0, 150, 199, 0.3)",
              }}
            >
              <Activity size={40} color="#fff" strokeWidth={2.5} />
            </div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "700",
                background: "linear-gradient(135deg, #0a4d5c 0%, #00d4aa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "8px",
                letterSpacing: "-0.5px",
              }}
            >
              HealthSync Pro
            </h1>
            <p
              style={{ color: "#64748b", fontSize: "15px", fontWeight: "500" }}
            >
              Advanced Health Data Platform
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {loginError && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {loginError}
              </div>
            )}

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#334155",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "15px",
                  transition: "all 0.3s ease",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00d4aa")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#334155",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "15px",
                  transition: "all 0.3s ease",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00d4aa")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, #00d4aa 0%, #0096c7 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 16px rgba(0, 150, 199, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 24px rgba(0, 150, 199, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 16px rgba(0, 150, 199, 0.3)";
              }}
            >
              Sign In
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              color: "#94a3b8",
              fontSize: "13px",
            }}
          >
            Demo credentials: admin / admin123
          </p>
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8fafc 0%, #e7eef4 100%)",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0a4d5c 0%, #00796b 100%)",
          color: "white",
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              HealthSync Pro
            </h1>
            <p style={{ fontSize: "13px", opacity: 0.9, margin: 0 }}>
              Clinical Data Management
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsLoggedIn(false)}
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            border: "none",
            color: "white",
            padding: "10px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.target.style.background = "rgba(255, 255, 255, 0.25)")
          }
          onMouseLeave={(e) =>
            (e.target.style.background = "rgba(255, 255, 255, 0.15)")
          }
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Navigation */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 40px",
          display: "flex",
          gap: "4px",
        }}
      >
        {[
          {
            id: "dashboard",
            label: "Dashboard",
            icon: <BarChart3 size={18} />,
          },
          { id: "addPerson", label: "Add Person", icon: <Plus size={18} /> },
          { id: "upload", label: "Upload Data", icon: <Upload size={18} /> },
          {
            id: "visualize",
            label: "Visualize",
            icon: <TrendingUp size={18} />,
          },
          { id: "analyze", label: "AI Analysis", icon: <Brain size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              background:
                activeView === tab.id
                  ? "linear-gradient(to bottom, #f0f9ff 0%, #e0f2fe 100%)"
                  : "transparent",
              border: "none",
              borderBottom:
                activeView === tab.id
                  ? "3px solid #0096c7"
                  : "3px solid transparent",
              padding: "16px 24px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              color: activeView === tab.id ? "#0a4d5c" : "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (activeView !== tab.id) e.target.style.background = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              if (activeView !== tab.id)
                e.target.style.background = "transparent";
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Dashboard View */}
        {activeView === "dashboard" && (
          <div>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "24px",
              }}
            >
              Dashboard
            </h2>

            {/* Stats Cards */}
            {stats && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "20px",
                  marginBottom: "32px",
                }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
                    padding: "24px",
                    borderRadius: "16px",
                    color: "white",
                    boxShadow: "0 8px 24px rgba(238, 90, 111, 0.3)",
                  }}
                >
                  <Heart
                    size={32}
                    style={{ marginBottom: "12px", opacity: 0.9 }}
                  />
                  <p
                    style={{
                      fontSize: "13px",
                      opacity: 0.9,
                      margin: "0 0 4px 0",
                      fontWeight: "600",
                    }}
                  >
                    Avg Heart Rate
                  </p>
                  <p style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>
                    {stats.avgHR}
                  </p>
                </div>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)",
                    padding: "24px",
                    borderRadius: "16px",
                    color: "white",
                    boxShadow: "0 8px 24px rgba(78, 205, 196, 0.3)",
                  }}
                >
                  <Droplet
                    size={32}
                    style={{ marginBottom: "12px", opacity: 0.9 }}
                  />
                  <p
                    style={{
                      fontSize: "13px",
                      opacity: 0.9,
                      margin: "0 0 4px 0",
                      fontWeight: "600",
                    }}
                  >
                    Avg Blood Pressure
                  </p>
                  <p style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>
                    {stats.avgBP}
                  </p>
                </div>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    padding: "24px",
                    borderRadius: "16px",
                    color: "white",
                    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                  }}
                >
                  <Wind
                    size={32}
                    style={{ marginBottom: "12px", opacity: 0.9 }}
                  />
                  <p
                    style={{
                      fontSize: "13px",
                      opacity: 0.9,
                      margin: "0 0 4px 0",
                      fontWeight: "600",
                    }}
                  >
                    Avg SPO2
                  </p>
                  <p style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>
                    {stats.avgSPO2}%
                  </p>
                </div>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    padding: "24px",
                    borderRadius: "16px",
                    color: "white",
                    boxShadow: "0 8px 24px rgba(245, 87, 108, 0.3)",
                  }}
                >
                  <FileText
                    size={32}
                    style={{ marginBottom: "12px", opacity: 0.9 }}
                  />
                  <p
                    style={{
                      fontSize: "13px",
                      opacity: 0.9,
                      margin: "0 0 4px 0",
                      fontWeight: "600",
                    }}
                  >
                    Total Records
                  </p>
                  <p style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>
                    {stats.totalRecords}
                  </p>
                </div>
              </div>
            )}

            {/* Persons List */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#0f172a",
                  marginBottom: "20px",
                }}
              >
                Registered Persons
              </h3>
              {persons.length === 0 ? (
                <p
                  style={{
                    color: "#64748b",
                    textAlign: "center",
                    padding: "40px",
                  }}
                >
                  No persons registered yet. Add a new person to get started.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: "0 8px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#64748b",
                            fontSize: "13px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Name
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#64748b",
                            fontSize: "13px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Age
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#64748b",
                            fontSize: "13px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Gender
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#64748b",
                            fontSize: "13px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Medical ID
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px",
                            color: "#64748b",
                            fontSize: "13px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Contact
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {persons.map((person) => (
                        <tr
                          key={person.id}
                          style={{
                            background: "#f8fafc",
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f0f9ff")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#f8fafc")
                          }
                        >
                          <td
                            style={{
                              padding: "16px",
                              borderRadius: "8px 0 0 8px",
                              fontWeight: "600",
                              color: "#0f172a",
                            }}
                          >
                            {person.name}
                          </td>
                          <td style={{ padding: "16px", color: "#475569" }}>
                            {person.age}
                          </td>
                          <td style={{ padding: "16px", color: "#475569" }}>
                            {person.gender}
                          </td>
                          <td
                            style={{
                              padding: "16px",
                              color: "#0096c7",
                              fontWeight: "600",
                            }}
                          >
                            {person.medicalId}
                          </td>
                          <td
                            style={{
                              padding: "16px",
                              borderRadius: "0 8px 8px 0",
                              color: "#475569",
                            }}
                          >
                            {person.email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Person View */}
        {activeView === "addPerson" && (
          <div>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "24px",
              }}
            >
              Add New Person
            </h2>
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "32px",
                maxWidth: "700px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e2e8f0",
              }}
            >
              <form onSubmit={handleAddPerson}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#334155",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Full Name
                    </label>
                    <input
                      name="name"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "15px",
                        outline: "none",
                        transition: "all 0.3s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#00d4aa")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#334155",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Age
                    </label>
                    <input
                      name="age"
                      type="number"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "15px",
                        outline: "none",
                        transition: "all 0.3s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#00d4aa")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#334155",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Gender
                    </label>
                    <select
                      name="gender"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "15px",
                        outline: "none",
                        transition: "all 0.3s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#00d4aa")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#334155",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Medical ID
                    </label>
                    <input
                      name="medicalId"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "15px",
                        outline: "none",
                        transition: "all 0.3s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#00d4aa")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#334155",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "15px",
                        outline: "none",
                        transition: "all 0.3s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#00d4aa")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#334155",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Phone
                    </label>
                    <input
                      name="phone"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "15px",
                        outline: "none",
                        transition: "all 0.3s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#00d4aa")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  style={{
                    background:
                      "linear-gradient(135deg, #00d4aa 0%, #0096c7 100%)",
                    color: "white",
                    border: "none",
                    padding: "14px 32px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 16px rgba(0, 150, 199, 0.3)",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.transform = "translateY(0)")
                  }
                >
                  <User size={18} />
                  Add Person
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Upload Data View */}
        {activeView === "upload" && (
          <div>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "24px",
              }}
            >
              Upload Health Data
            </h2>
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                maxWidth: "700px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  border: "3px dashed #cbd5e1",
                  borderRadius: "12px",
                  padding: "60px 40px",
                  textAlign: "center",
                  background: "#f8fafc",
                  transition: "all 0.3s ease",
                }}
              >
                <Upload
                  size={48}
                  color="#0096c7"
                  style={{ marginBottom: "16px" }}
                />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Upload CSV File
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    marginBottom: "24px",
                    fontSize: "14px",
                  }}
                >
                  Drag and drop your health data file here or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv,.db"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  id="fileInput"
                />
                <label
                  htmlFor="fileInput"
                  style={{
                    background:
                      "linear-gradient(135deg, #00d4aa 0%, #0096c7 100%)",
                    color: "white",
                    padding: "12px 28px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "inline-block",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                  }}
                >
                  Choose File
                </label>
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "12px",
                    marginTop: "16px",
                  }}
                >
                  Expected columns: timestamp, HR, BP_Systolic, BP_Diastolic,
                  SPO2
                </p>
              </div>

              {uploadedData.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <div
                    style={{
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "#0096c7",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileText size={20} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontWeight: "600",
                          color: "#0a4d5c",
                          margin: 0,
                        }}
                      >
                        Data uploaded successfully!
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#64748b",
                          margin: 0,
                        }}
                      >
                        {uploadedData.length} records loaded
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visualize View */}
        {activeView === "visualize" && (
          <div>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "24px",
              }}
            >
              Data Visualization
            </h2>

            {uploadedData.length === 0 ? (
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "60px 40px",
                  textAlign: "center",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                  border: "1px solid #e2e8f0",
                }}
              >
                <TrendingUp
                  size={48}
                  color="#cbd5e1"
                  style={{ marginBottom: "16px" }}
                />
                <p style={{ color: "#64748b" }}>
                  No data to visualize. Please upload health data first.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "24px" }}>
                {/* Data Table */}
                <div
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "28px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginBottom: "20px",
                    }}
                  >
                    Data Table
                  </h3>
                  <div
                    style={{
                      overflowX: "auto",
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                  >
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          background: "#f8fafc",
                          zIndex: 1,
                        }}
                      >
                        <tr>
                          {Object.keys(uploadedData[0] || {}).map((key) => (
                            <th
                              key={key}
                              style={{
                                textAlign: "left",
                                padding: "12px",
                                color: "#64748b",
                                fontSize: "13px",
                                fontWeight: "600",
                                borderBottom: "2px solid #e2e8f0",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedData.slice(0, 50).map((row, i) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              transition: "background 0.2s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#f8fafc")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            {Object.values(row).map((val, j) => (
                              <td
                                key={j}
                                style={{
                                  padding: "12px",
                                  color: "#475569",
                                  fontSize: "14px",
                                }}
                              >
                                {typeof val === "number" ? val.toFixed(2) : val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Charts */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {/* Heart Rate Chart */}
                  {uploadedData.some(
                    (d) => d.HR || d.hr || d["Heart Rate"]
                  ) && (
                    <div
                      style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "28px",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#0f172a",
                          marginBottom: "20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Heart size={20} color="#ff6b6b" />
                        Heart Rate Trends
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={uploadedData.slice(0, 30)}>
                          <defs>
                            <linearGradient
                              id="colorHR"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#ff6b6b"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#ff6b6b"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                          />
                          <XAxis dataKey="id" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              background: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="HR"
                            stroke="#ff6b6b"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorHR)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Blood Pressure Chart */}
                  {uploadedData.some((d) => d.BP_Systolic || d.SBP) && (
                    <div
                      style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "28px",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#0f172a",
                          marginBottom: "20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Droplet size={20} color="#4ecdc4" />
                        Blood Pressure
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={uploadedData.slice(0, 30)}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                          />
                          <XAxis dataKey="id" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              background: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="BP_Systolic"
                            stroke="#4ecdc4"
                            strokeWidth={3}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="BP_Diastolic"
                            stroke="#44a08d"
                            strokeWidth={3}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* SPO2 Chart */}
                  {uploadedData.some((d) => d.SPO2 || d.spo2) && (
                    <div
                      style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "28px",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#0f172a",
                          marginBottom: "20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Wind size={20} color="#667eea" />
                        Oxygen Saturation (SPO2)
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={uploadedData.slice(0, 30)}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                          />
                          <XAxis dataKey="id" stroke="#94a3b8" fontSize={12} />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            domain={[90, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar
                            dataKey="SPO2"
                            fill="#667eea"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis View */}
        {activeView === "analyze" && (
          <div>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "24px",
              }}
            >
              AI-Powered Analysis
            </h2>

            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ marginBottom: "24px" }}>
                <button
                  onClick={analyzeData}
                  disabled={isAnalyzing || uploadedData.length === 0}
                  style={{
                    background: isAnalyzing
                      ? "#cbd5e1"
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    padding: "14px 32px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: isAnalyzing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                    boxShadow: isAnalyzing
                      ? "none"
                      : "0 4px 16px rgba(102, 126, 234, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isAnalyzing && uploadedData.length > 0)
                      e.target.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) =>
                    (e.target.style.transform = "translateY(0)")
                  }
                >
                  <Brain size={18} />
                  {isAnalyzing ? "Analyzing..." : "Analyze Data with AI"}
                </button>
              </div>

              {analysis && (
                <div
                  style={{
                    background:
                      "linear-gradient(to bottom, #f0f9ff 0%, #e0f2fe 100%)",
                    border: "1px solid #bae6fd",
                    borderRadius: "12px",
                    padding: "24px",
                    marginTop: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#0a4d5c",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Brain size={20} />
                    Analysis Results
                  </h3>
                  <div
                    style={{
                      color: "#334155",
                      lineHeight: "1.7",
                      fontSize: "15px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {analysis}
                  </div>
                </div>
              )}

              {!analysis && !isAnalyzing && uploadedData.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#64748b",
                  }}
                >
                  <Brain
                    size={48}
                    color="#cbd5e1"
                    style={{ marginBottom: "16px" }}
                  />
                  <p>Upload health data first to perform AI analysis</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
