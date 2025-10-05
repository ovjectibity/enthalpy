import React, { useState, useEffect, useRef } from "react";

import thumbsUpIcon from "../assets/thumbs-up-icon.svg";
import thumbsDownIcon from "../assets/thumbs-down-icon.svg";
import closeIcon from "../assets/close-icon.svg";
import checkmarkIcon from "../assets/checkmark-icon.svg";

interface FeedbackData {
  rating: "positive" | "negative" | null;
  comment: string;
  assetType: string;
  assetId: string;
}

interface FeedbackComponentProps {
  assetType: string;
  assetId: string;
  onFeedbackSubmit?: (feedback: FeedbackData) => void;
  className?: string;
}

const FeedbackComponent: React.FC<FeedbackComponentProps> = ({
  assetType,
  assetId,
  onFeedbackSubmit,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState<"positive" | "negative" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Handle escape key press and click outside
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        isExpanded &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        const popup = document.querySelector(".feedback-popup");
        if (popup && !popup.contains(event.target as Node)) {
          setIsExpanded(false);
        }
      }
    };

    if (isExpanded) {
      document.addEventListener("keydown", handleEscapeKey);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  const handleToggleExpanded = () => {
    if (isSubmitted) {
      setRating(null);
      setComment("");
      setIsSubmitted(false);
    }
    setIsExpanded(!isExpanded);
  };

  const handleRatingSelect = (selectedRating: "positive" | "negative") => {
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    if (!rating) return;

    setIsSubmitting(true);

    const feedbackData: FeedbackData = {
      rating,
      comment: comment.trim(),
      assetType,
      assetId,
    };

    try {
      if (onFeedbackSubmit) {
        await onFeedbackSubmit(feedbackData);
      }

      console.log("Feedback submitted:", feedbackData);
      setIsSubmitted(true);

      setTimeout(() => {
        setIsExpanded(false);
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRating(null);
    setComment("");
    setIsExpanded(false);
  };

  return (
    <div className={`feedback-component ${className}`}>
      <button
        ref={triggerRef}
        className="feedback-trigger"
        onClick={handleToggleExpanded}
        aria-label="Add feedback"
      >
        Add feedback
      </button>

      {isExpanded && (
        <div className="feedback-popup">
          {!isSubmitted ? (
            <>
              <div className="feedback-header">
                <h4>How would you rate this {assetType}?</h4>
                <button
                  className="feedback-close"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close feedback"
                >
                  <img src={closeIcon} alt="Close" width="16" height="16" />
                </button>
              </div>

              <div className="feedback-rating">
                <button
                  className={`rating-button positive ${rating === "positive" ? "selected" : ""}`}
                  onClick={() => handleRatingSelect("positive")}
                  aria-label="Thumbs up"
                >
                  <img
                    src={thumbsUpIcon}
                    alt="Thumbs up"
                    width="16"
                    height="16"
                  />
                  Helpful
                </button>

                <button
                  className={`rating-button negative ${rating === "negative" ? "selected" : ""}`}
                  onClick={() => handleRatingSelect("negative")}
                  aria-label="Thumbs down"
                >
                  <img
                    src={thumbsDownIcon}
                    alt="Thumbs down"
                    width="16"
                    height="16"
                  />
                  Not helpful
                </button>
              </div>

              <div className="feedback-tooltip-compact">
                <p>
                  Feedback will be added to this {assetType}'s context & can be
                  used to regenerate it.
                </p>
              </div>

              {rating && (
                <div className="feedback-comment">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      rating === "positive"
                        ? "What did you find helpful? (optional)"
                        : "How can we improve this? (optional)"
                    }
                    rows={3}
                    className="feedback-textarea"
                  />
                </div>
              )}

              {rating && (
                <div className="feedback-actions">
                  <button
                    className="feedback-submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit feedback"}
                  </button>
                  <button className="feedback-cancel" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="feedback-success">
              <img
                src={checkmarkIcon}
                alt="Success"
                width="16"
                height="16"
                className="success-icon"
              />
              <p>Thank you for your feedback!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackComponent;
