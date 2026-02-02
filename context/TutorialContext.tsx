"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

export type TutorialStep = {
  id: string;
  target: string; // CSS selector, ex: "[data-tutorial='search']"
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
};

type TutorialContextType = {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  steps: TutorialStep[];
  hasCompleted: (key?: string) => boolean;
  startTutorial: (steps: TutorialStep[], key?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  resetTutorial: (key?: string) => void;
};

const TutorialContext = createContext<TutorialContextType>({
  isActive: false,
  currentStepIndex: 0,
  currentStep: null,
  steps: [],
  hasCompleted: () => false,
  startTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTutorial: () => {},
  resetTutorial: () => {},
});

const DEFAULT_STORAGE_KEY = "tutorial_completed_v1";
const getStorageKey = (key?: string) => key ? `tutorial_${key}_v1` : DEFAULT_STORAGE_KEY;

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentKey, setCurrentKey] = useState<string | undefined>(undefined);
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());

  // Charger l'état depuis localStorage au mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    // On ne charge pas tous les tutoriels, on vérifie à la demande
  }, []);

  const hasCompleted = useCallback((key?: string) => {
    const storageKey = getStorageKey(key);

    // Vérifier le cache local d'abord
    if (completedKeys.has(storageKey)) return true;

    // Sinon vérifier localStorage
    if (typeof window === "undefined") return false;
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Boolean(parsed.completed)) {
          setCompletedKeys(prev => new Set(prev).add(storageKey));
          return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
  }, [completedKeys]);

  const markCompleted = useCallback((key?: string) => {
    const storageKey = getStorageKey(key);
    setCompletedKeys(prev => new Set(prev).add(storageKey));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ completed: true, completedAt: new Date().toISOString() })
      );
    }
  }, []);

  const startTutorial = useCallback((newSteps: TutorialStep[], key?: string) => {
    if (newSteps.length === 0) return;
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setCurrentKey(key);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Fin du tutoriel
      setIsActive(false);
      markCompleted(currentKey);
    }
  }, [currentStepIndex, steps.length, markCompleted, currentKey]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    markCompleted(currentKey);
  }, [markCompleted, currentKey]);

  const resetTutorial = useCallback((key?: string) => {
    const storageKey = getStorageKey(key);
    setCompletedKeys(prev => {
      const next = new Set(prev);
      next.delete(storageKey);
      return next;
    });
    setIsActive(false);
    setSteps([]);
    setCurrentStepIndex(0);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const currentStep = useMemo(() => {
    return isActive && steps[currentStepIndex] ? steps[currentStepIndex] : null;
  }, [isActive, steps, currentStepIndex]);

  const value = useMemo(
    () => ({
      isActive,
      currentStepIndex,
      currentStep,
      steps,
      hasCompleted,
      startTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      resetTutorial,
    }),
    [isActive, currentStepIndex, currentStep, steps, hasCompleted, startTutorial, nextStep, prevStep, skipTutorial, resetTutorial]
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial() {
  return useContext(TutorialContext);
}
