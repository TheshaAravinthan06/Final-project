"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import api from "@/lib/axios";
import "@/styles/floating-ai.scss";
import SendItineraryModal from "@/components/ai/SendItineraryModal";

type ChatStep =
  | "askMood"
  | "askTravelPreference"
  | "chooseSuggestedPreference"
  | "askDays"
  | "askDate"
  | "askPeople"
  | "askNeedCompanion"
  | "askCompanionCount"
  | "askCompanionType"
  | "askCompanionMatchBasis"
  | "askPlacePreference"
  | "selectPlaces"
  | "selectActivities"
  | "askExtraNotes"
  | "showItinerary"
  | "askItineraryChanges"
  | "done";

type Place = {
  name: string;
  district: string;
  reason: string;
};

type ActivityGroup = {
  place: string;
  activities: string[];
};

type SelectedActivitiesGroup = {
  place: string;
  activities: string[];
};

type Message = {
  id: number;
  sender: "ai" | "user";
  text: string;
};

type FloatingAIChatProps = {
  isOpen: boolean;
  onClose: () => void;
  fullPage?: boolean;
};

const moodOptions = [
  "Happy",
  "Tired",
  "Stressed",
  "Sad",
  "Burned out",
  "Lonely",
  "Excited",
  "Peaceful",
  "Romantic",
  "Curious",
  "Need a break",
  "Overwhelmed",
];

const travelPreferenceOptions = [
  "Adventure",
  "Relaxing",
  "Nature",
  "Beach",
  "Cultural",
  "Luxury",
  "Romantic",
  "Spiritual",
  "Food trip",
  "Road trip",
  "Wellness",
  "Fun / social",
  "Suggest for me",
];

const dayOptions = [
  "1 day",
  "2 days",
  "3 days",
  "4 days",
  "5 days",
  "1 week",
  "Custom",
];

const dateOptions = [
  "This weekend",
  "Next weekend",
  "Next month",
  "Specific date",
  "Flexible / not decided",
];

const peopleOptions = ["1 (Solo)", "2", "3 - 5", "5+", "Custom"];

const needCompanionOptions = [
  "No, I have my own people",
  "No, I want to travel solo",
  "Yes, I'd like to find companions",
];

const companionCountOptions = ["1", "2", "3+", "Flexible"];

const companionTypeOptions = [
  "Female",
  "Male",
  "Mixed",
  "Fun / social people",
  "Calm / peaceful people",
  "Adventure lovers",
  "Food lovers",
  "No specific preference",
];

const companionMatchBasisOptions = [
  "Shared expenses",
  "Same gender",
  "Similar age",
  "Same travel interests",
  "Same mood",
  "Same budget",
  "Similar travel pace",
  "No specific matching preference",
];

const placePreferenceOptions = [
  "Beach",
  "Hill country",
  "Nature",
  "Cultural places",
  "Hidden gems",
  "City",
  "No specific preference",
];

const getSuggestedPreferencesByMood = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (
    ["stressed", "tired", "burned out", "overwhelmed", "need a break"].includes(
      normalized
    )
  ) {
    return ["Relaxing", "Nature", "Wellness", "Beach"];
  }

  if (["excited", "happy", "curious"].includes(normalized)) {
    return ["Adventure", "Road trip", "Fun / social", "Nature"];
  }

  if (["peaceful", "romantic"].includes(normalized)) {
    return ["Romantic", "Relaxing", "Beach", "Luxury"];
  }

  if (["sad", "lonely"].includes(normalized)) {
    return ["Nature", "Relaxing", "Wellness", "Fun / social"];
  }

  return ["Nature", "Relaxing", "Cultural", "Beach"];
};

const normalizeDaysValue = (value: string) => {
  const lower = value.trim().toLowerCase();

  if (lower === "1 day") return "1";
  if (lower === "2 days") return "2";
  if (lower === "3 days") return "3";
  if (lower === "4 days") return "4";
  if (lower === "5 days") return "5";
  if (lower === "1 week") return "7";

  return value;
};

const normalizePeopleValue = (value: string) => {
  const lower = value.trim().toLowerCase();

  if (lower.includes("solo")) return "1";
  if (lower === "2") return "2";
  if (lower === "3 - 5") return "4";
  if (lower === "5+") return "5";

  return value;
};

const parsePlacesInput = (value: string) =>
  value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

export default function FloatingAIChat({
  isOpen,
  onClose,
  fullPage = false,
}: FloatingAIChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "ai",
      text:
        "Hiii! 👋 I’m PackPalz — welcome to the PackPalz community 💛\n\nReady to escape your daily routine, or looking for a fresh experience to recharge yourself?\n\nI can help you plan a trip based on how you’re feeling 😊\nSo first, tell me… how are you feeling right now?",
    },
  ]);
  const [step, setStep] = useState<ChatStep>("askMood");
  const [loading, setLoading] = useState(false);

  const [mood, setMood] = useState("");
  const [travelPreference, setTravelPreference] = useState("");
  const [suggestedPreferences, setSuggestedPreferences] = useState<string[]>([]);

  const [days, setDays] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [specificDate, setSpecificDate] = useState("");
  const [peopleCount, setPeopleCount] = useState("");

  const [needsCompanion, setNeedsCompanion] = useState(false);
  const [travelCompanions, setTravelCompanions] = useState<string[]>([]);
  const [companionCount, setCompanionCount] = useState("");
  const [companionTypes, setCompanionTypes] = useState<string[]>([]);
  const [companionMatchBases, setCompanionMatchBases] = useState<string[]>([]);

  const [placePreference, setPlacePreference] = useState("");
  const [userPlaces, setUserPlaces] = useState<string[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);

  const [activitiesByPlace, setActivitiesByPlace] = useState<ActivityGroup[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<
    SelectedActivitiesGroup[]
  >([]);

  const [extraNotes, setExtraNotes] = useState("");

  const [itineraryText, setItineraryText] = useState("");
  const [showSendToAdminModal, setShowSendToAdminModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const addMessage = (sender: "ai" | "user", text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender,
        text,
      },
    ]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, places, activitiesByPlace, step, itineraryText]);

  const selectedActivitiesCount = useMemo(() => {
    return selectedActivities.reduce((sum, item) => sum + item.activities.length, 0);
  }, [selectedActivities]);

  const handleGetPlaces = async (customPlaces: string[] = []) => {
    try {
      setLoading(true);

      const res = await api.post("/ai/places-by-mood", {
        mood,
        travelPreference,
        travelDate: specificDate || travelDate,
        placePreference,
        userPlaces: customPlaces,
      });

      const aiMessage =
        res.data.message ||
        "Here are some places based on your preferences and travel timing. You can select more or remove any.";

      const returnedPlaces: Place[] = res.data.places || [];

      setPlaces(returnedPlaces);

      if (customPlaces.length > 0) {
        const mergedSelected = [
          ...customPlaces,
          ...returnedPlaces
            .filter((place) =>
              customPlaces.some(
                (customPlace) =>
                  customPlace.trim().toLowerCase() === place.name.trim().toLowerCase()
              )
            )
            .map((place) => place.name),
        ];

        const normalizedUnique = Array.from(
          new Set(
            mergedSelected
              .map((place) => {
                const exactReturned = returnedPlaces.find(
                  (item) =>
                    item.name.trim().toLowerCase() === place.trim().toLowerCase()
                );

                return exactReturned?.name || place;
              })
              .filter(Boolean)
          )
        );

        setSelectedPlaces(normalizedUnique);
      } else {
        setSelectedPlaces([]);
      }

      addMessage("ai", aiMessage);
      setStep("selectPlaces");
    } catch (error) {
      console.error("handleGetPlaces error:", error);
      addMessage("ai", "Sorry, I couldn't generate places right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetActivities = async () => {
    try {
      setLoading(true);

      const res = await api.post("/ai/activities-by-places", {
        places: selectedPlaces,
        mood,
        travelPreference,
        travelDate: specificDate || travelDate,
      });

      const groups: ActivityGroup[] = res.data.activitiesByPlace || [];

      setActivitiesByPlace(groups);
      setSelectedActivities(
        groups.map((group) => ({
          place: group.place,
          activities: [],
        }))
      );

      addMessage(
        "ai",
        res.data.message ||
          "Nice choices. Now select the activities you would like to do."
      );
      setStep("selectActivities");
    } catch (error) {
      console.error("handleGetActivities error:", error);
      addMessage("ai", "Sorry, I couldn't generate activities right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItinerary = async (changeRequest?: string) => {
    try {
      setLoading(true);

      const mergedExtraNotes = [extraNotes, changeRequest].filter(Boolean).join(" | ");

      const res = await api.post("/ai/create-itinerary", {
        mood,
        travelPreference,
        days: Number(days),
        travelDate,
        specificDate,
        peopleCount: Number(peopleCount),
        needsCompanion,
        companionCount,
        companionType: companionTypes.join(", "),
        companionMatchBasis: companionMatchBases.join(", "),
        travelCompanions,
        placePreference,
        userPlaces,
        selectedPlaces,
        selectedActivities,
        extraRequests: mergedExtraNotes,
      });

      setItineraryText(res.data.itineraryText || res.data.itinerary || "");
      addMessage(
        "ai",
        res.data.message || "Great! I created your itinerary. Please review it below."
      );
      setStep("showItinerary");
    } catch (error) {
      console.error("handleCreateItinerary error:", error);
      addMessage("ai", "Sorry, I couldn't create the itinerary right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await api.post("/ai/save-itinerary", {
        mood,
        travelPreference,
        selectedPlaces,
        selectedActivities,
        days: Number(days),
        travelDate,
        specificDate,
        peopleCount: Number(peopleCount),
        needsCompanion,
        companionCount,
        companionType: companionTypes.join(", "),
        companionMatchBasis: companionMatchBases.join(", "),
        travelCompanions,
        placePreference,
        userPlaces,
        extraNotes,
        itineraryText,
      });

      window.dispatchEvent(new Event("itinerarySaved"));
      addMessage("ai", "Your itinerary has been saved successfully.");
      setStep("done");
    } catch (error) {
      console.error("handleSave error:", error);
      addMessage("ai", "Sorry, I couldn't save the itinerary.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceToggle = (placeName: string) => {
    setSelectedPlaces((prev) =>
      prev.includes(placeName)
        ? prev.filter((item) => item !== placeName)
        : [...prev, placeName]
    );
  };

  const handleActivityToggle = (place: string, activity: string) => {
    setSelectedActivities((prev) =>
      prev.map((item) => {
        if (item.place !== place) return item;

        const exists = item.activities.includes(activity);

        return {
          ...item,
          activities: exists
            ? item.activities.filter((a) => a !== activity)
            : [...item.activities, activity],
        };
      })
    );
  };

  const handleCompanionTypeToggle = (value: string) => {
    setCompanionTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleCompanionMatchToggle = (value: string) => {
    setCompanionMatchBases((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleSpecificDateConfirm = () => {
    if (!specificDate) {
      addMessage("ai", "Please choose a date from the calendar.");
      return;
    }

    addMessage("user", specificDate);
    addMessage("ai", "How many people are travelling including you?");
    setStep("askPeople");
  };

  const handleConfirmCompanionTypes = () => {
    if (companionTypes.length === 0) {
      addMessage("ai", "Please select at least one companion type.");
      return;
    }

    addMessage("user", companionTypes.join(", "));
    addMessage(
      "ai",
      "How would you like your companions to be matched? You can select multiple options."
    );
    setStep("askCompanionMatchBasis");
  };

  const handleConfirmCompanionMatchBasis = () => {
    if (companionMatchBases.length === 0) {
      addMessage("ai", "Please select at least one matching preference.");
      return;
    }

    addMessage("user", companionMatchBases.join(", "));
    addMessage(
      "ai",
      "Do you already have any places in mind? You can type place names like Kandy, Ella, Nuwara Eliya, or type 'no' and I’ll suggest places for you."
    );
    setStep("askPlacePreference");
  };

  const handleMoodSelect = (moodItem: string) => {
    if (loading) return;

    addMessage("user", moodItem);
    setMood(moodItem);

    addMessage(
      "ai",
      "What type of trip would you prefer? You can choose one below, or tap “Suggest for me” and I’ll recommend a travel style based on your mood."
    );
    setStep("askTravelPreference");
  };

  const handleTravelPreferenceSelect = (value: string) => {
    if (loading) return;

    addMessage("user", value);

    if (value === "Suggest for me") {
      const suggestions = getSuggestedPreferencesByMood(mood);
      setSuggestedPreferences(suggestions);
      addMessage(
        "ai",
        `Based on your mood, these travel styles might suit you best: ${suggestions.join(
          ", "
        )}. Choose one you like.`
      );
      setStep("chooseSuggestedPreference");
      return;
    }

    setTravelPreference(value);
    addMessage("ai", "How many days do you want to travel?");
    setStep("askDays");
  };

  const handleSuggestedPreferenceSelect = (value: string) => {
    if (loading) return;

    addMessage("user", value);
    setTravelPreference(value);
    addMessage("ai", "How many days do you want to travel?");
    setStep("askDays");
  };

  const handleDaySelect = (value: string) => {
    if (loading) return;

    addMessage("user", value);
    setDays(normalizeDaysValue(value));
    addMessage("ai", "When are you planning to start your trip?");
    setStep("askDate");
  };

  const handleDateSelect = (value: string) => {
    if (loading) return;

    addMessage("user", value);

    if (value === "Specific date") {
      setTravelDate("Specific date");
      setSpecificDate("");
      return;
    }

    setTravelDate(value);
    setSpecificDate("");
    addMessage("ai", "How many people are travelling including you?");
    setStep("askPeople");
  };

  const handlePeopleSelect = (value: string) => {
    if (loading) return;

    addMessage("user", value);
    setPeopleCount(normalizePeopleValue(value));
    addMessage("ai", "Do you need travel companions?");
    setStep("askNeedCompanion");
  };

  const handleNeedCompanionSelect = (value: string) => {
    if (loading) return;

    addMessage("user", value);

    const wantsCompanions = value === "Yes, I'd like to find companions";
    setNeedsCompanion(wantsCompanions);
    setTravelCompanions(wantsCompanions ? ["companions"] : []);
    setCompanionTypes([]);
    setCompanionMatchBases([]);

    if (wantsCompanions) {
      addMessage("ai", "How many companions would you like?");
      setStep("askCompanionCount");
      return;
    }

    addMessage(
      "ai",
      "Do you already have any places in mind? You can type place names like Kandy, Ella, Nuwara Eliya, or type 'no' and I’ll suggest places for you."
    );
    setStep("askPlacePreference");
  };

  const handleCompanionCountSelect = (value: string) => {
    if (loading) return;

    addMessage("user", value);
    setCompanionCount(value);
    addMessage(
      "ai",
      "What type of companions would you prefer? You can select multiple options."
    );
    setStep("askCompanionType");
  };

  const handlePlacePreferenceSelect = async (value: string) => {
    if (loading) return;

    addMessage("user", value);

    const lower = value.trim().toLowerCase();

    if (lower === "no" || lower === "no specific preference") {
      setPlacePreference("No specific preference");
      setUserPlaces([]);
      await handleGetPlaces([]);
      return;
    }

    setPlacePreference(value);
    const parsedPlaces = parsePlacesInput(value);

    if (parsedPlaces.length > 0) {
      setUserPlaces(parsedPlaces);
      addMessage(
        "ai",
        "Great choices! I’ll include your places and suggest a few more based on your travel details."
      );
      await handleGetPlaces(parsedPlaces);
      return;
    }

    setUserPlaces([]);
    await handleGetPlaces([]);
  };

  const handleConfirmPlaces = async () => {
    if (selectedPlaces.length === 0) {
      addMessage("ai", "Please select at least one place.");
      return;
    }

    addMessage("user", `Selected places: ${selectedPlaces.join(", ")}`);
    await handleGetActivities();
  };

  const handleConfirmActivities = () => {
    if (selectedActivitiesCount === 0) {
      addMessage("ai", "Please select at least one activity.");
      return;
    }

    addMessage("user", "I selected my activities.");
    addMessage(
      "ai",
      "Do you have any special requests or things you want me to consider? For example budget-friendly, peaceful places, less crowded spots, luxury stay, food preference, or anything else. If not, type 'no'."
    );
    setStep("askExtraNotes");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const value = input.trim();
    addMessage("user", value);
    setInput("");

    if (step === "askMood") {
      setMood(value);
      addMessage(
        "ai",
        "What type of trip would you prefer? You can choose one below, or tap “Suggest for me” and I’ll recommend a travel style based on your mood."
      );
      setStep("askTravelPreference");
      return;
    }

    if (step === "askTravelPreference") {
      if (value.toLowerCase() === "suggest for me") {
        const suggestions = getSuggestedPreferencesByMood(mood);
        setSuggestedPreferences(suggestions);
        addMessage(
          "ai",
          `Based on your mood, these travel styles might suit you best: ${suggestions.join(
            ", "
          )}. Choose one you like.`
        );
        setStep("chooseSuggestedPreference");
        return;
      }

      setTravelPreference(value);
      addMessage("ai", "How many days do you want to travel?");
      setStep("askDays");
      return;
    }

    if (step === "chooseSuggestedPreference") {
      setTravelPreference(value);
      addMessage("ai", "How many days do you want to travel?");
      setStep("askDays");
      return;
    }

    if (step === "askDays") {
      setDays(normalizeDaysValue(value));
      addMessage("ai", "When are you planning to start your trip?");
      setStep("askDate");
      return;
    }

    if (step === "askDate") {
      if (travelDate === "Specific date" && !specificDate) {
        setSpecificDate(value);
        addMessage("ai", "How many people are travelling including you?");
        setStep("askPeople");
        return;
      }

      setTravelDate(value);
      addMessage("ai", "How many people are travelling including you?");
      setStep("askPeople");
      return;
    }

    if (step === "askPeople") {
      setPeopleCount(normalizePeopleValue(value));
      addMessage("ai", "Do you need travel companions?");
      setStep("askNeedCompanion");
      return;
    }

    if (step === "askNeedCompanion") {
      const wantsCompanions =
        value.trim().toLowerCase() === "yes" ||
        value.trim().toLowerCase().includes("find companions");

      setNeedsCompanion(wantsCompanions);
      setTravelCompanions(wantsCompanions ? ["companions"] : []);

      if (wantsCompanions) {
        addMessage("ai", "How many companions would you like?");
        setStep("askCompanionCount");
        return;
      }

      addMessage(
        "ai",
        "Do you already have any places in mind? You can type place names like Kandy, Ella, Nuwara Eliya, or type 'no' and I’ll suggest places for you."
      );
      setStep("askPlacePreference");
      return;
    }

    if (step === "askCompanionCount") {
      setCompanionCount(value);
      addMessage(
        "ai",
        "What type of companions would you prefer? You can select multiple options."
      );
      setStep("askCompanionType");
      return;
    }

    if (step === "askCompanionType") {
      const typedValues = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      setCompanionTypes(typedValues);
      addMessage(
        "ai",
        "How would you like your companions to be matched? You can select multiple options."
      );
      setStep("askCompanionMatchBasis");
      return;
    }

    if (step === "askCompanionMatchBasis") {
      const typedValues = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      setCompanionMatchBases(typedValues);
      addMessage(
        "ai",
        "Do you already have any places in mind? You can type place names like Kandy, Ella, Nuwara Eliya, or type 'no' and I’ll suggest places for you."
      );
      setStep("askPlacePreference");
      return;
    }

    if (step === "askPlacePreference") {
      const lower = value.trim().toLowerCase();

      if (lower === "no" || lower === "no specific preference") {
        setPlacePreference("No specific preference");
        setUserPlaces([]);
        await handleGetPlaces([]);
        return;
      }

      setPlacePreference(value);
      const parsedPlaces = parsePlacesInput(value);

      if (parsedPlaces.length > 0) {
        setUserPlaces(parsedPlaces);
        addMessage(
          "ai",
          "Great choices! I’ll include your places and suggest a few more based on your travel details."
        );
        await handleGetPlaces(parsedPlaces);
        return;
      }

      setUserPlaces([]);
      await handleGetPlaces([]);
      return;
    }

    if (step === "askExtraNotes") {
      const note = value.toLowerCase() === "no" ? "" : value;
      setExtraNotes(note);
      await handleCreateItinerary(note);
      return;
    }

    if (step === "askItineraryChanges") {
      if (
        ["no", "no changes", "okay", "ok", "looks good", "it is okay"].includes(
          value.toLowerCase()
        )
      ) {
        addMessage("ai", "Perfect. You can now save it or send it to admin.");
        setStep("showItinerary");
        return;
      }

      await handleCreateItinerary(value);
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`floating-ai-chat ${
        fullPage ? "floating-ai-chat--page" : "floating-ai-chat--widget"
      }`}
    >
      <div className="floating-ai-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`floating-ai-message-row ${
              message.sender === "user" ? "user" : "ai"
            }`}
          >
            <div className={`floating-ai-message-bubble ${message.sender}`}>
              <p style={{ whiteSpace: "pre-line" }}>{message.text}</p>
            </div>
          </div>
        ))}

        {step === "askMood" && (
          <div className="floating-ai-option-card">
            <h4>How are you feeling right now?</h4>

            <div className="floating-ai-mood-grid">
              {moodOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="floating-ai-mood-chip"
                  onClick={() => handleMoodSelect(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="floating-ai-helper-text">
              Or type your own feeling in the chat box below.
            </p>
          </div>
        )}

        {step === "askTravelPreference" && (
          <div className="floating-ai-option-card">
            <h4>What type of trip would you prefer?</h4>

            <div className="floating-ai-options-grid">
              {travelPreferenceOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="floating-ai-action-btn secondary"
                  onClick={() => handleTravelPreferenceSelect(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "chooseSuggestedPreference" && suggestedPreferences.length > 0 && (
          <div className="floating-ai-option-card">
            <h4>Suggested travel preferences</h4>

            <div className="floating-ai-options-grid">
              {suggestedPreferences.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="floating-ai-action-btn secondary"
                  onClick={() => handleSuggestedPreferenceSelect(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "askDays" && (
          <div className="floating-ai-option-card">
            <h4>How many days do you want to travel?</h4>

            <div className="floating-ai-options-grid">
              {dayOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="floating-ai-action-btn secondary"
                  onClick={() => handleDaySelect(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="floating-ai-helper-text">
              Or type your own number of days below.
            </p>
          </div>
        )}

        {step === "askDate" && (
          <div className="floating-ai-option-card">
            <h4>When are you planning to start your trip?</h4>

            <div className="floating-ai-options-grid">
              {dateOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="floating-ai-action-btn secondary"
                  onClick={() => handleDateSelect(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>

            {travelDate === "Specific date" && (
              <div style={{ marginTop: 14 }}>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="send-itinerary-modal__input"
                  min={new Date().toISOString().split("T")[0]}
                />
                <button
                  type="button"
                  className="floating-ai-action-btn"
                  style={{ marginTop: 12 }}
                  onClick={handleSpecificDateConfirm}
                  disabled={!specificDate || loading}
                >
                  Continue
                </button>
              </div>
            )}

            <p className="floating-ai-helper-text">
              You can also type a month or a specific date below.
            </p>
          </div>
        )}

        {step === "askPeople" && (
          <div className="floating-ai-option-card">
            <h4>How many people are travelling including you?</h4>

            <div className="floating-ai-options-grid">
              {peopleOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="floating-ai-action-btn secondary"
                  onClick={() => handlePeopleSelect(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="floating-ai-helper-text">
              Or type your own number below.
            </p>
          </div>
        )}

        {step === "askNeedCompanion" && (
          <div className="floating-ai-option-card">
            <h4>Do you need travel companions?</h4>

            <div className="floating-ai-options-grid">
              {needCompanionOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="floating-ai-action-btn secondary"
                  onClick={() => handleNeedCompanionSelect(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "askCompanionCount" && (
          <div className="floating-ai-option-card">
            <h4>How many companions would you like?</h4>

            <div className="floating-ai-options-grid">
              {companionCountOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="floating-ai-action-btn secondary"
                  onClick={() => handleCompanionCountSelect(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "askCompanionType" && (
          <div className="floating-ai-option-card">
            <h4>What type of companions would you prefer?</h4>

            <div className="floating-ai-options-grid">
              {companionTypeOptions.map((item) => (
                <label key={item} className="floating-ai-check-card">
                  <input
                    type="checkbox"
                    checked={companionTypes.includes(item)}
                    onChange={() => handleCompanionTypeToggle(item)}
                  />
                  <div>
                    <strong>{item}</strong>
                  </div>
                </label>
              ))}
            </div>

            <button
              type="button"
              className="floating-ai-action-btn"
              style={{ marginTop: 12 }}
              onClick={handleConfirmCompanionTypes}
              disabled={loading}
            >
              Continue
            </button>

            <p className="floating-ai-helper-text">
              You can select multiple options.
            </p>
          </div>
        )}

        {step === "askCompanionMatchBasis" && (
          <div className="floating-ai-option-card">
            <h4>How would you like your companions to be matched?</h4>

            <div className="floating-ai-options-grid">
              {companionMatchBasisOptions.map((item) => (
                <label key={item} className="floating-ai-check-card">
                  <input
                    type="checkbox"
                    checked={companionMatchBases.includes(item)}
                    onChange={() => handleCompanionMatchToggle(item)}
                  />
                  <div>
                    <strong>{item}</strong>
                  </div>
                </label>
              ))}
            </div>

            <button
              type="button"
              className="floating-ai-action-btn"
              style={{ marginTop: 12 }}
              onClick={handleConfirmCompanionMatchBasis}
              disabled={loading}
            >
              Continue
            </button>

            <p className="floating-ai-helper-text">
              You can select multiple options.
            </p>
          </div>
        )}

        {step === "askPlacePreference" && (
          <div className="floating-ai-option-card">
            <h4>Do you already have any places in mind?</h4>

            <div className="floating-ai-options-grid">
              {placePreferenceOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="floating-ai-action-btn secondary"
                  onClick={() => handlePlacePreferenceSelect(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="floating-ai-helper-text">
              You can type place names like Kandy, Ella, Nuwara Eliya, or type
              &nbsp;'no' and I’ll suggest places for you.
            </p>
          </div>
        )}

        {step === "selectPlaces" && places.length > 0 && (
          <div className="floating-ai-option-card">
            <h4>Select one or more places</h4>

            <div className="floating-ai-options-grid">
              {places.map((place) => (
                <label key={place.name} className="floating-ai-check-card">
                  <input
                    type="checkbox"
                    checked={selectedPlaces.includes(place.name)}
                    onChange={() => handlePlaceToggle(place.name)}
                  />
                  <div>
                    <strong>{place.name}</strong>
                    <span>{place.district}</span>
                    <p>{place.reason}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              type="button"
              className="floating-ai-action-btn"
              onClick={handleConfirmPlaces}
              disabled={loading}
            >
              {loading ? "Loading..." : "Continue"}
            </button>
          </div>
        )}

        {step === "selectActivities" && activitiesByPlace.length > 0 && (
          <div className="floating-ai-option-card">
            <h4>Select activities</h4>

            {activitiesByPlace.map((group) => (
              <div key={group.place} className="floating-ai-activity-group">
                <h5>{group.place}</h5>

                <div className="floating-ai-options-grid">
                  {group.activities.map((activity) => {
                    const placeState = selectedActivities.find(
                      (item) => item.place === group.place
                    );

                    const checked = placeState?.activities.includes(activity) || false;

                    return (
                      <label
                        key={`${group.place}-${activity}`}
                        className="floating-ai-check-card"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleActivityToggle(group.place, activity)}
                        />
                        <div>
                          <strong>{activity}</strong>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              type="button"
              className="floating-ai-action-btn"
              onClick={handleConfirmActivities}
              disabled={loading}
            >
              Continue
            </button>
          </div>
        )}

        {step === "showItinerary" && itineraryText && (
          <div className="floating-ai-option-card">
            <h4>Your itinerary</h4>

            <div className="floating-ai-itinerary-box">{itineraryText}</div>

            <p className="floating-ai-confirm-text">
              Is this itinerary okay for you, or would you like any changes?
            </p>

            <div className="floating-ai-final-actions">
              <button
                type="button"
                className="floating-ai-action-btn"
                onClick={handleSave}
                disabled={loading}
              >
                Save It
              </button>

              <button
                type="button"
                className="floating-ai-action-btn secondary"
                onClick={() => setShowSendToAdminModal(true)}
                disabled={loading}
              >
                Send to Admin
              </button>
            </div>

            <button
              type="button"
              className="floating-ai-action-btn secondary"
              style={{ marginTop: 12 }}
              onClick={() => {
                addMessage(
                  "ai",
                  "Tell me what changes you need. For example: change day 2 to day 1, remove one place, add more relaxing activities, or make it more budget-friendly."
                );
                setStep("askItineraryChanges");
              }}
              disabled={loading}
            >
              Need Changes
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {step !== "selectPlaces" &&
        step !== "selectActivities" &&
        step !== "done" && (
          <form className="floating-ai-inputbar" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? "Please wait..." : "Type your reply here..."}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              <FiSend />
            </button>
          </form>
        )}

      <SendItineraryModal
        isOpen={showSendToAdminModal}
        onClose={() => setShowSendToAdminModal(false)}
        onSuccess={() => {
          addMessage("ai", "Your itinerary has been sent to admin successfully.");
          setStep("done");
        }}
        itineraryText={itineraryText}
        mood={mood}
        selectedPlaces={selectedPlaces}
        selectedActivities={selectedActivities}
        days={Number(days)}
        specificDate={specificDate || travelDate}
        peopleCount={Number(peopleCount)}
        travelCompanions={needsCompanion ? ["companions"] : travelCompanions}
        customCompanionNote={[
          companionCount ? `Companion count: ${companionCount}` : "",
          companionTypes.length > 0
            ? `Companion types: ${companionTypes.join(", ")}`
            : "",
          companionMatchBases.length > 0
            ? `Matching: ${companionMatchBases.join(", ")}`
            : "",
          placePreference ? `Place preference: ${placePreference}` : "",
          travelPreference ? `Travel preference: ${travelPreference}` : "",
          userPlaces.length > 0 ? `User places: ${userPlaces.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(" | ")}
        extraNotes={extraNotes}
      />
    </div>
  );
}