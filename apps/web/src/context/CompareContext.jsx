import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const CompareContext = createContext();

const STORAGE_KEY = "trexio_compare_trips";
const MAX_COMPARE = 4;

export function CompareProvider({ children }) {
  const [selectedTrips, setSelectedTrips] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedTrips));
    } catch {
      // ignore
    }
  }, [selectedTrips]);

  function isInCompare(id) {
    return selectedTrips.some((t) => String(t.id) === String(id));
  }

  function toggleCompare(trip) {
    if (!trip || !trip.id) return;
    const exists = isInCompare(trip.id);
    if (exists) {
      setSelectedTrips((prev) => prev.filter((t) => String(t.id) !== String(trip.id)));
      toast.info(`Dihapus dari komparasi: ${trip.title}`);
    } else {
      if (selectedTrips.length >= MAX_COMPARE) {
        toast.warning(`Maksimal ${MAX_COMPARE} trip untuk dibandingkan sekaligus.`);
        return;
      }
      setSelectedTrips((prev) => [...prev, trip]);
      toast.success(`Ditambahkan ke komparasi (${selectedTrips.length + 1}/${MAX_COMPARE}): ${trip.title}`);
    }
  }

  function removeFromCompare(id) {
    setSelectedTrips((prev) => prev.filter((t) => String(t.id) !== String(id)));
  }

  function clearCompare() {
    setSelectedTrips([]);
    setIsOpen(false);
  }

  return (
    <CompareContext.Provider
      value={{
        selectedTrips,
        isOpen,
        setIsOpen,
        toggleCompare,
        isInCompare,
        removeFromCompare,
        clearCompare,
        maxCompare: MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    return {
      selectedTrips: [],
      isOpen: false,
      setIsOpen: () => {},
      toggleCompare: () => {},
      isInCompare: () => false,
      removeFromCompare: () => {},
      clearCompare: () => {},
      maxCompare: 4,
    };
  }
  return context;
}
