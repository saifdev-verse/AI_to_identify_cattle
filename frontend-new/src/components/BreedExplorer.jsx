
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Beef,
  MapPin,
  ArrowLeft,
  LoaderCircle,
  AlertCircle,
  Leaf,
  Droplets,
  Activity,
  HeartPulse,
  X,
} from "lucide-react";

import { getBreeds, getBreedDetails } from "../services/api";
import "./BreedExplorer.css";

function BreedExplorer() {
  const [breeds, setBreeds] = useState([]);
  const [search, setSearch] = useState("");
  const [animalFilter, setAnimalFilter] = useState("All");
  const [selectedBreed, setSelectedBreed] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getBreeds()
      .then((response) => {
        if (!active) return;

        const list = response.data?.data;

        if (Array.isArray(list)) {
          setBreeds(list);
        } else {
          setError("Invalid breed data received from the server.");
        }
      })
      .catch((err) => {
        console.error("Breed loading error:", err);

        if (active) {
          setError("Unable to load breeds. Please check your backend.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredBreeds = useMemo(() => {
    return breeds.filter((breed) => {
      const matchesSearch = [
        breed.breed_name,
        breed.origin_state,
        breed.breed_category,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(search.toLowerCase())
        );

      const matchesAnimal =
        animalFilter === "All" ||
        breed.animal_type?.toLowerCase() === animalFilter.toLowerCase();

      return matchesSearch && matchesAnimal;
    });
  }, [breeds, search, animalFilter]);

  const openBreed = async (breedId) => {
    setDetailsLoading(true);
    setError("");
    setSelectedBreed(null);

    try {
      const response = await getBreedDetails(breedId);

      if (!response.data?.success || !response.data?.data?.breed) {
        throw new Error("Invalid breed details response.");
      }

      setSelectedBreed(response.data.data);
    } catch (err) {
      console.error("Breed details error:", err);
      setError("Unable to load this breed's details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedBreed(null);
    setError("");
  };

  const DetailGroup = ({ title, icon: Icon, data }) => {
    if (!data || typeof data !== "object") return null;

    const entries = Object.entries(data).filter(
      ([key, value]) =>
        !/(^id$|_id$)/i.test(key) &&
        value !== null &&
        value !== undefined &&
        value !== ""
    );

    if (!entries.length) return null;

    return (
      <div className="be-detail-group">
        <h3>
          <Icon size={18} />
          {title}
        </h3>

        <div className="be-detail-grid">
          {entries.map(([key, value]) => (
            <div className="be-detail-item" key={key}>
              <span>
                {key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (letter) => letter.toUpperCase())}
              </span>

              <strong>{String(value)}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (selectedBreed) {
    const breed = selectedBreed.breed;

    return (
      <section className="be-page">
        <button className="be-back-button" onClick={closeDetails}>
          <ArrowLeft size={17} />
          Back to Breed Explorer
        </button>

        <div className="be-profile-header">
          <div>
            <span className="be-eyebrow">BREED PROFILE</span>
            <h1>{breed.breed_name}</h1>
            <p>{breed.animal_type} · {breed.origin_state}, India</p>
          </div>

          <span className="be-status">
            {breed.conservation_status || "Status unavailable"}
          </span>
        </div>

        <div className="be-profile-card">
          <div className="be-profile-facts">
            <div>
              <MapPin size={19} />
              <span>Origin</span>
              <strong>{breed.origin_region || breed.origin_state || "Not available"}</strong>
            </div>

            <div>
              <Beef size={19} />
              <span>Animal Type</span>
              <strong>{breed.animal_type}</strong>
            </div>

            <div>
              <Leaf size={19} />
              <span>Category</span>
              <strong>{breed.breed_category || "Not available"}</strong>
            </div>
          </div>

          <div className="be-description">
            <h3>About this breed</h3>
            <p>{breed.description || "No description available."}</p>
          </div>
        </div>

        <div className="be-section-heading">
          <div>
            <span className="be-eyebrow">DATABASE INFORMATION</span>
            <h2>Breed Characteristics</h2>
            <p>Detailed information retrieved from the livestock database.</p>
          </div>
        </div>

        <div className="be-details-card">
          <DetailGroup
            title="Economic Usage"
            icon={Activity}
            data={selectedBreed.economic_usage}
          />

          <DetailGroup
            title="Physical Characteristics"
            icon={Beef}
            data={selectedBreed.physical_characteristics}
          />

          <DetailGroup
            title="Production Data"
            icon={Droplets}
            data={selectedBreed.production_data}
          />

          <DetailGroup
            title="Reproduction & Health"
            icon={HeartPulse}
            data={selectedBreed.reproduction_health}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="be-page">
      <div className="be-heading">
        <div>
          <span className="be-eyebrow">INDIAN LIVESTOCK DATABASE</span>
          <h1>Breed Explorer</h1>
          <p>
            Discover and explore Indian cattle and buffalo breeds.
          </p>
        </div>

        <div className="be-count">
          <Beef size={20} />
          <strong>{breeds.length}</strong>
          <span>Breeds</span>
        </div>
      </div>

      <div className="be-filter-panel">
        <div className="be-search">
          <Search size={19} />
          <input
            type="text"
            placeholder="Search breed, origin state or category..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search">
              <X size={17} />
            </button>
          )}
        </div>

        <div className="be-filter-buttons">
          {["All", "Cattle", "Buffalo"].map((filter) => (
            <button
              key={filter}
              className={animalFilter === filter ? "active" : ""}
              onClick={() => setAnimalFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="be-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading || detailsLoading ? (
        <div className="be-loading">
          <LoaderCircle className="be-spin" size={30} />
          <p>{detailsLoading ? "Loading breed details..." : "Loading breeds..."}</p>
        </div>
      ) : filteredBreeds.length === 0 ? (
        <div className="be-empty">
          <Beef size={35} />
          <h3>No breeds found</h3>
          <p>Try another search or change the animal filter.</p>
        </div>
      ) : (
        <>
          <div className="be-results-heading">
            <strong>{filteredBreeds.length} breeds found</strong>
            <span>Explore the breed profiles below</span>
          </div>

          <div className="be-grid">
            {filteredBreeds.map((breed) => (
              <button
                className="be-breed-card"
                key={breed.breed_id}
                onClick={() => openBreed(breed.breed_id)}
              >
                <div className="be-card-top">
                  <div className="be-animal-icon">
                    <Beef size={23} />
                  </div>

                  <span className="be-animal-type">
                    {breed.animal_type}
                  </span>
                </div>

                <h3>{breed.breed_name}</h3>

                <div className="be-card-location">
                  <MapPin size={14} />
                  {breed.origin_state || "Origin not available"}
                </div>

                <div className="be-card-footer">
                  <span>{breed.breed_category || "Category unavailable"}</span>
                  <span className="be-view">View details →</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default BreedExplorer;
