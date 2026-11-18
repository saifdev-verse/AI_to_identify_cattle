
import { useEffect, useState } from "react";
import IdentifyBreed from "./components/IdentifyBreed";
import BreedExplorer from "./components/BreedExplorer";
import Analytics from "./components/Analytics";

import {
  getDashboardSummary,
  getAnimalDistribution,
  getPredictionTrends,
  getTopBreeds,
  getRecentPredictions,
} from "./services/api";

import {
  LayoutDashboard,
  ScanSearch,
  Beef,
  BarChart3,
  Settings,
  Bell,
  Search,
  Activity,
  Leaf,
  Clock3,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import "./App.css";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Identify Breed", icon: ScanSearch },
  { name: "Breed Explorer", icon: Beef },
  { name: "Analytics", icon: BarChart3 },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [animalData, setAnimalData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [topBreeds, setTopBreeds] = useState([]);
  const [recentPredictions, setRecentPredictions] = useState([]);

  // Load dashboard data whenever Dashboard becomes active
  useEffect(() => {
    if (activePage !== "Dashboard") return;

    let isMounted = true;

    Promise.all([
      getDashboardSummary(),
      getRecentPredictions(),
      getAnimalDistribution(),
      getPredictionTrends(),
      getTopBreeds(),
    ])
      .then(([summaryRes, recentRes, animalRes, trendRes, breedsRes]) => {
        if (!isMounted) return;

        setSummary(summaryRes.data.data);
        setRecentPredictions(recentRes.data.data || []);
        setAnimalData(animalRes.data.data || []);
        setTrendData(trendRes.data.data || []);
        setTopBreeds(breedsRes.data.data || []);

        setError("");
      })
      .catch((err) => {
        console.error("Dashboard API error:", err);

        if (isMounted) {
          setError("Unable to load dashboard statistics.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePage]);

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <Leaf size={24} />
          </div>

          <div>
            <h2>AGRI BREED</h2>
            <span>INTELLIGENCE PLATFORM</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                key={item.name}
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">

          <button className="nav-item">
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="project-tag">
            <Leaf size={18} />

            <div>
              <strong>Built for farmers</strong>
              <span>AI-powered livestock insights</span>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Content */}
      <main className="main">

        {/* Top Header */}
        <header className="topbar">

          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="top-actions">
            <button className="icon-button">
              <Search size={19} />
            </button>

            <button className="icon-button">
              <Bell size={19} />
            </button>

            <div className="avatar">A</div>
          </div>

        </header>

        {/* Dashboard Page */}
        {activePage === "Dashboard" && (
          <section className="content">

            <div className="welcome">
              <div>
                <span className="eyebrow">
                  LIVESTOCK INTELLIGENCE
                </span>

                <h1>Dashboard Overview</h1>

                <p>
                  Identify breeds. Explore insights. Empower farmers.
                </p>
              </div>

              <div className="status">
                <span className="status-dot"></span>
                AI Platform
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">

              <StatCard
                title="Total Predictions"
                value={
                  loading
                    ? "..."
                    : summary?.total_predictions ?? "—"
                }
                note="All-time predictions"
                icon={ScanSearch}
              />

              <StatCard
                title="Total Breeds"
                value={
                  loading
                    ? "..."
                    : summary?.total_breeds ?? "—"
                }
                note="Available breed classes"
                icon={Beef}
              />

              <StatCard
                title="Cattle Breeds"
                value={
                  loading
                    ? "..."
                    : summary?.cattle_breeds ?? "—"
                }
                note="Available cattle classes"
                icon={Activity}
              />

              <StatCard
                title="Buffalo Breeds"
                value={
                  loading
                    ? "..."
                    : summary?.buffalo_breeds ?? "—"
                }
                note="Available buffalo classes"
                icon={BarChart3}
              />

              <StatCard
                title="Average Confidence"
                value={
                  loading
                    ? "..."
                    : summary
                      ? `${summary.average_confidence}%`
                      : "—"
                }
                note="Average prediction confidence"
                icon={Activity}
              />

            </div>

            {error && (
              <p className="error-message">{error}</p>
            )}

            {/* Analytics Heading */}
            <div className="section-heading">
              <div>
                <h2>Prediction Insights</h2>
                <p>Explore livestock identification activity</p>
              </div>

              <button className="outline-button">
                Last 30 days
              </button>
            </div>

            {/* Analytics Charts */}
            <div className="analytics-grid">

              {/* Prediction Trends */}
              <div className="panel trend-panel">

                <div className="panel-heading">
                  <div>
                    <h3>Prediction Trends</h3>
                    <p>Daily identification activity</p>
                  </div>

                  <Activity size={20} />
                </div>

                <div className="chart-container">

                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={trendData}>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#cbd8e0"
                        />

                        <XAxis
                          dataKey="prediction_date"
                          tick={{ fontSize: 10 }}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10 }}
                        />

                        <Tooltip />

                        <Line
                          type="monotone"
                          dataKey="total_predictions"
                          name="Predictions"
                          stroke="#247c78"
                          strokeWidth={3}
                          dot={{ r: 5 }}
                          activeDot={{ r: 7 }}
                        />

                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart">
                      <Activity size={36} />

                      <strong>
                        No prediction activity available
                      </strong>

                      <span>
                        New prediction records will appear here.
                      </span>
                    </div>
                  )}

                </div>
              </div>

              {/* Animal Distribution */}
              <div className="panel distribution-panel">

                <div className="panel-heading">
                  <div>
                    <h3>Animal Distribution</h3>
                    <p>Cattle vs buffalo</p>
                  </div>

                  <Beef size={20} />
                </div>

                <div className="chart-container">

                  {animalData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>

                        <Pie
                          data={animalData}
                          dataKey="total_predictions"
                          nameKey="animal_type"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                        >
                          {animalData.map((entry) => (
                            <Cell
                              key={entry.animal_type}
                              fill={
                                entry.animal_type === "Cattle"
                                  ? "#247c78"
                                  : "#d9a441"
                              }
                            />
                          ))}
                        </Pie>

                        <Tooltip />

                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p>No distribution data available.</p>
                  )}

                  <div className="chart-legend">
                    {animalData.map((item) => (
                      <div key={item.animal_type}>
                        <span
                          className="legend-dot"
                          style={{
                            background:
                              item.animal_type === "Cattle"
                                ? "#247c78"
                                : "#d9a441",
                          }}
                        />

                        {item.animal_type}: {item.total_predictions}
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>

            {/* Top Identified Breeds */}
            <div className="panel top-breeds-panel">

              <div className="panel-heading">
                <div>
                  <h3>Top Identified Breeds</h3>
                  <p>
                    Most frequently identified livestock breeds
                  </p>
                </div>

                <Beef size={20} />
              </div>

              <div className="chart-container">

                {topBreeds.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={topBreeds}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 25,
                        left: 15,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#cbd8e0"
                      />

                      <XAxis
                        type="number"
                        allowDecimals={false}
                      />

                      <YAxis
                        type="category"
                        dataKey="breed_name"
                        width={90}
                        tick={{ fontSize: 11 }}
                      />

                      <Tooltip
                        formatter={(value) => [
                          value,
                          "Predictions",
                        ]}
                        labelFormatter={(label) => {
                          const breed = topBreeds.find(
                            (item) => item.breed_name === label
                          );

                          return `${label} (${
                            breed?.animal_type ?? ""
                          })`;
                        }}
                      />

                      <Bar
                        dataKey="total_predictions"
                        name="Predictions"
                        fill="#247c78"
                        radius={[0, 6, 6, 0]}
                        barSize={25}
                      />

                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No breed prediction data available.</p>
                )}

              </div>
            </div>

            {/* Recent Predictions */}
            <div className="panel recent-panel">

              <div className="panel-heading">
                <div>
                  <h3>Recent Predictions</h3>
                  <p>Latest livestock identification records</p>
                </div>

                <span className="text-button">
                  Last 10 predictions
                </span>
              </div>

              {recentPredictions.length > 0 ? (
                <div className="table-wrapper">
                  <table className="prediction-table">

                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Breed</th>
                        <th>Animal Type</th>
                        <th>Confidence</th>
                        <th>Date & Time</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentPredictions.map((item) => (
                        <tr key={item.prediction_id}>
                          <td>#{item.prediction_id}</td>

                          <td>
                            <strong>{item.breed_name}</strong>
                          </td>

                          <td>
                            <span
                              className={`animal-badge ${
                                item.animal_type === "Cattle"
                                  ? "cattle"
                                  : "buffalo"
                              }`}
                            >
                              {item.animal_type}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {Number(
                                item.confidence_percentage
                              ).toFixed(2)}%
                            </strong>
                          </td>

                          <td>
                            {new Date(
                              item.created_at
                            ).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              ) : (
                <div className="empty-table">
                  <Clock3 size={28} />
                  <strong>No recent predictions found</strong>
                  <span>
                    New prediction records will appear here.
                  </span>
                </div>
              )}

            </div>

            {/* Footer */}
            <footer>
              <span>AGRI BREED AI</span>

              <span>
                Identify the Breed. Empower the Farmer.
              </span>
            </footer>

          </section>
        )}

        {/* Identify Breed Page */}
        {activePage === "Identify Breed" && (
          <IdentifyBreed />
        )}

        {/* Breed Explorer Page */}
        {activePage === "Breed Explorer" && (
          <BreedExplorer />
        )}

        {/* Analytics Page */}
        {activePage === "Analytics" && (
          <Analytics />
        )}

      </main>
    </div>
  );
}

// Reusable Statistics Card
function StatCard({ title, value, note, icon: Icon }) {
  return (
    <div className="stat-card">

      <div className="stat-top">
        <span>{title}</span>

        <div className="stat-icon">
          <Icon size={20} />
        </div>
      </div>

      <h2>{value}</h2>

      <p>{note}</p>

    </div>
  );
}

export default App;
