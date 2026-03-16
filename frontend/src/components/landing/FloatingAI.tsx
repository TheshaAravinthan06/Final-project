type FloatingAIProps = {
  onOpenLogin: () => void;
};

export default function FloatingAI({ onOpenLogin }: FloatingAIProps) {
  return (
    <div className="floating-ai-wrapper">
      <div className="floating-ai-chatbox">
        <div className="floating-ai-message">
          Welcome to Trip AI! Planning a trip? How can I assist you today?
        </div>

        <div className="floating-ai-suggestions">
          <button onClick={onOpenLogin}>Can you help me plan a trip?</button>
          <button onClick={onOpenLogin}>Show me travel packages</button>
          <button onClick={onOpenLogin}>Tell me about Sri Lanka tours</button>
        </div>
      </div>

      <button className="floating-ai-btn" onClick={onOpenLogin}>
        AI
        <span className="floating-ai-notification">1</span>
      </button>
    </div>
  );
}