
import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getAnimalDistribution,
  getPredictionTrends,
  getTopBreeds,
} from "../services/api";

import {
  Activity,
  Beef,
  ScanSearch,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import "./Analytics.css";

const COLORS = ["#54834a", "#d4a64e"];

function Analytics() {
  const [summary, setSummary] = useState(null);
  const [animalData, setAnimalData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [topBreeds, setTopBreeds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        getDashboardSummary(),
        getAnimalDistribution(),
        getPredictionTrends(),
        getTopBreeds(),
      ]);

      if (!isMounted) return;

      const [summaryResult, animalResult, trendResult, breedsResult] =
        results;

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value.data.data);
      }

      if (animalResult.status === "fulfilled") {
        setAnimalData(animalResult.value.data.data || []);
      }

      if (trendResult.status === "fulfilled") {
        setTrendData(trendResult.value.data.data || []);
      }

      if (breedsResult.status === "fulfilled") {
        setTopBreeds(breedsResult.value.data.data || []);
      }

      const failed = results.every(
        (result) => result.status === "rejected"
      );

      if (failed) {
        setError("Unable to load analytics. Please check your backend.");
      }

      setLoading(false);
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="analytics-page">
      <div className="analytics-header">
        <div>
          <span className="analytics-eyebrow">
            LIVESTOCK INTELLIGENCE
          </span>

          <h1>Analytics Overview</h1>

          <p>
            Explore prediction activity and livestock identification
            insights.
          </p>
        </div>

        <div className="analytics-status">
          <span className="analytics-status-dot"></span>
          Live Data
        </div>
      </div>

      {error && (
        <div className="analytics-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="analytics-stats-grid">
        <AnalyticsStat
          title="Total Predictions"
          value={summary?.total_predictions}
          note="All-time predictions"
          icon={ScanSearch}
          loading={loading}
        />

        <AnalyticsStat
          title="Total Breeds"
          value={summary?.total_breeds}
          note="Available breed classes"
          icon={Beef}
          loading={loading}
        />

        <AnalyticsStat
          title="Cattle Breeds"
          value={summary?.cattle_breeds}
          note="Available cattle classes"
          icon={Activity}
          loading={loading}
        />

        <AnalyticsStat
          title="Buffalo Breeds"
          value={summary?.buffalo_breeds}
          note="Available buffalo classes"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Prediction Trends */}
      <div className="analytics-panel analytics-trend-panel">
        <div className="analytics-panel-heading">
          <div>
            <h2>Prediction Trends</h2>
            <p>Daily livestock identification activity</p>
          </div>

          <Activity size={21} />
        </div>

        <div className="analytics-chart">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e8eee5"
                />

                <XAxis
                  dataKey="prediction_date"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="total_predictions"
                  name="Predictions"
                  stroke="#54834a"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <AnalyticsEmpty
              loading={loading}
              message="No prediction activity available yet."
            />
          )}
        </div>
      </div>

      {/* Distribution and Top Breeds */}
      <div className="analytics-charts-grid">
        <div className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Animal Distribution</h2>
              <p>Cattle vs. buffalo predictions</p>
            </div>

            <Beef size={21} />
          </div>

          <div className="analytics-chart">
            {animalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={animalData}
                    dataKey="total_predictions"
                    nameKey="animal_type"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {animalData.map((entry, index) => (
                      <Cell
                        key={entry.animal_type}
                        fill={
                          entry.animal_type === "Cattle"
                            ? COLORS[0]
                            : COLORS[1]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <AnalyticsEmpty
                loading={loading}
                message="No distribution data available."
              />
            )}
          </div>

          <div className="analytics-legend">
            {animalData.map((item) => (
              <div key={item.animal_type}>
                <span
                  className="analytics-legend-dot"
                  style={{
                    background:
                      item.animal_type === "Cattle"
                        ? COLORS[0]
                        : COLORS[1],
                  }}
                />

                <span>{item.animal_type}</span>

                <strong>{item.total_predictions}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Top Identified Breeds</h2>
              <p>Most frequently identified breeds</p>
            </div>

            <TrendingUp size={21} />
          </div>

          <div className="analytics-chart">
            {topBreeds.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topBreeds}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 20,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e8eee5"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="breed_name"
                    width={85}
                    tick={{ fontSize: 10 }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="total_predictions"
                    name="Predictions"
                    fill="#54834a"
                    radius={[0, 6, 6, 0]}
                    barSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <AnalyticsEmpty
                loading={loading}
                message="No breed prediction data available."
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalyticsStat({ title, value, note, icon: Icon, loading }) {
  return (
    <div className="analytics-stat-card">
      <div className="analytics-stat-top">
        <span>{title}</span>

        <div className="analytics-stat-icon">
          <Icon size={20} />
        </div>
      </div>

      <h2>
        {loading ? "..." : value ?? "—"}
      </h2>

      <p>{note}</p>
    </div>
  );
}

function AnalyticsEmpty({ loading, message }) {
  return (
    <div className="analytics-empty">
      {loading ? (
        <strong>Loading data...</strong>
      ) : (
        <>
          <Activity size={32} />
          <strong>{message}</strong>
        </>
      )}
    </div>
  );
}

export default Analytics;
