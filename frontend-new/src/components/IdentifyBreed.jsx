
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  ScanSearch,
  LoaderCircle,
  MapPin,
  Award,
  Leaf,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { getBreeds, predictBreed } from "../services/api";
import "./IdentifyBreed.css";

function formatLabel(value) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function DetailSection({ title, data }) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const entries = Object.entries(data).filter(
  ([key, value]) =>
    !/(^id$|_id$)/i.test(key) &&
    value !== null &&
    value !== undefined &&
    value !== ""
    );

  if (entries.length === 0) return null;

  return (
    <div className="ib-detail-section">
      <h3>{title}</h3>

      <div className="ib-detail-grid">
        {entries.map(([key, value]) => (
          <div className="ib-detail-item" key={key}>
            <span>{formatLabel(key)}</span>
            <strong>{formatValue(value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function IdentifyBreed() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [breeds, setBreeds] = useState([]);
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [breedsLoading, setBreedsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getBreeds()
      .then((response) => {
        if (!active) return;

        const breedList = response.data?.data;

        if (Array.isArray(breedList)) {
          setBreeds(breedList);
        } else {
          setError("Unable to read the breed list from the server.");
        }
      })
      .catch((err) => {
        console.error("Breed list error:", err);

        if (active) {
          setError("Unable to load breed names. Please check the backend.");
        }
      })
      .finally(() => {
        if (active) setBreedsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setResult(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSelectedFile(null);
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleIdentify = async () => {
    if (!selectedFile) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

        const response = await predictBreed(formData);
        const predictionData = response.data;

        if (!predictionData?.success || !predictionData?.data?.breed) {
        throw new Error("The server returned an invalid prediction response.");
        }

        setResult(predictionData);
    } catch (err) {
      console.error("Prediction error:", err);

      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Unable to identify the breed. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const breed = result?.data?.breed;

  const topPredictions = result
  ? [...(result.top5_predictions || [])].sort(
      (a, b) => b.confidence - a.confidence
    )
  : [];

  const getBreedName = (breedId) => {
    const match = breeds.find(
      (item) => Number(item.breed_id) === Number(breedId)
    );

    return match?.breed_name || `Breed ID ${breedId}`;
  };

  return (
    <section className="ib-page">
      <div className="ib-heading">
        <div>
          <span className="ib-eyebrow">AI-POWERED IDENTIFICATION</span>
          <h1>Identify Breed</h1>
          <p>
            Upload a cattle or buffalo image to discover its breed and
            characteristics.
          </p>
        </div>

        <div className="ib-model-status">
          <span />
          ResNet50 Model
        </div>
      </div>

      <div className="ib-workspace">
        <div className="ib-upload-card">
          <div className="ib-card-heading">
            <div>
              <h2>Upload Animal Image</h2>
              <p>Select a clear image for better identification.</p>
            </div>

            <ImageIcon size={22} />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />

          {!preview ? (
            <button
              type="button"
              className="ib-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="ib-upload-icon">
                <Upload size={27} />
              </div>

              <strong>Click to upload an image</strong>
              <span>Choose a cattle or buffalo photograph</span>
              <small>Supported formats: JPG, PNG, WEBP</small>
            </button>
          ) : (
            <div className="ib-preview-container">
              <img
                src={preview}
                alt="Selected animal preview"
                className="ib-preview-image"
              />

              <button
                type="button"
                className="ib-change-image"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={15} />
                Change image
              </button>
            </div>
          )}

          {error && (
            <div className="ib-error">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <div className="ib-upload-actions">
            <button
              type="button"
              className="ib-identify-button"
              onClick={handleIdentify}
              disabled={!selectedFile || loading || breedsLoading}
            >
              {loading ? (
                <>
                  <LoaderCircle className="ib-spin" size={18} />
                  Identifying...
                </>
              ) : (
                <>
                  <ScanSearch size={18} />
                  Identify Breed
                </>
              )}
            </button>

            <button
              type="button"
              className="ib-reset-button"
              onClick={handleReset}
              disabled={loading}
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>

          <div className="ib-upload-note">
            <Leaf size={16} />
            <span>
              Use a clear image showing the animal's body and distinctive
              features.
            </span>
          </div>
        </div>

        {!result ? (
          <div className="ib-placeholder-card">
            <div className="ib-placeholder-icon">
              <ScanSearch size={34} />
            </div>

            <h2>Prediction Results</h2>
            <p>
              Your identified breed and detailed livestock information will
              appear here after image analysis.
            </p>

            <div className="ib-placeholder-steps">
              <span>01</span>
              Upload an image
              <span>02</span>
              Identify the breed
              <span>03</span>
              Explore the results
            </div>
          </div>
        ) : (
          <div className="ib-result-card">
            <div className="ib-result-heading">
              <div>
                <span className="ib-result-label">
                  <CheckCircle2 size={15} />
                  IDENTIFICATION COMPLETE
                </span>

                <h2>{breed.breed_name}</h2>
                <p>{breed.animal_type}</p>
              </div>

              <div className="ib-confidence">
                <strong>
                  {(Number(result.confidence) * 100).toFixed(2)}%
                </strong>
                <span>Confidence</span>
              </div>
            </div>

            <div className="ib-result-info">
              <div>
                <MapPin size={17} />
                <span>
                  {breed.origin_state || "Origin not available"}
                </span>
              </div>

              <div>
                <Award size={17} />
                <span>
                  {breed.breed_category || "Category not available"}
                </span>
              </div>

              <div>
                <Leaf size={17} />
                <span>
                  {breed.conservation_status || "Status not available"}
                </span>
              </div>
            </div>

            <div className="ib-description">
              <h3>About this breed</h3>
              <p>
                {breed.description || "No description available."}
              </p>
            </div>
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="ib-section">
            <div className="ib-section-heading">
              <div>
                <span className="ib-eyebrow">MODEL ANALYSIS</span>
                <h2>Top 5 Predictions</h2>
                <p>Other possible breed matches ranked by confidence.</p>
              </div>
            </div>

            <div className="ib-top-list">
              {topPredictions.map((item, index) => {
                const percentage = Number(item.confidence) * 100;

                return (
                  <div className="ib-top-item" key={`${item.breed_id}-${index}`}>
                    <div className="ib-rank">{index + 1}</div>

                    <div className="ib-top-name">
                      <strong>{getBreedName(item.breed_id)}</strong>
                      <div className="ib-progress-track">
                        <div
                          className="ib-progress-fill"
                          style={{
                            width: `${Math.min(100, Math.max(0, percentage))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <strong className="ib-top-confidence">
                      {percentage.toFixed(2)}%
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ib-section">
            <div className="ib-section-heading">
              <div>
                <span className="ib-eyebrow">BREED INFORMATION</span>
                <h2>Detailed Characteristics</h2>
                <p>Additional information retrieved from the breed database.</p>
              </div>
            </div>

            <div className="ib-details-card">
             <DetailSection
                title="Economic Usage"
                data={result.data.economic_usage}
                />

                <DetailSection
                title="Physical Characteristics"
                data={result.data.physical_characteristics}
                />

                <DetailSection
                title="Production Data"
                data={result.data.production_data}
                />

                <DetailSection
                title="Reproduction & Health"
                data={result.data.reproduction_health}
                />

              {!result.economic_usage &&
                !result.physical_characteristics &&
                !result.production_data &&
                !result.reproduction_health && (
                  <p className="ib-no-details">
                    Additional breed information is not available.
                  </p>
                )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default IdentifyBreed;
