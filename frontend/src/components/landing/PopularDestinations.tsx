type PopularDestinationsProps = {
  onOpenLogin: () => void;
};

const destinations = [
  {
    name: "Ella",
    image: "/images/ella.jpg",
    text: "A calm green escape with mountain views, train rides, and peaceful stays.",
  },
  {
    name: "Mirissa",
    image: "/images/mirissa.jpg",
    text: "Perfect for sunny beach moods, ocean views, and relaxed coastal energy.",
  },
  {
    name: "Sigiriya",
    image: "/images/sigiriya.jpg",
    text: "A bold and inspiring destination for culture, adventure, and iconic scenery.",
  },
];

export default function PopularDestinations({
  onOpenLogin,
}: PopularDestinationsProps) {
  return (
    <section className="section section-soft">
      <div className="container">
        <div className="section-heading fade-up">
          <h2>Popular Destinations</h2>
          <p>Beautiful places chosen to match different moods and travel styles.</p>
        </div>

        <div className="destination-grid">
          {destinations.map((place, index) => (
            <div key={place.name} className={`destination-card fade-up delay-${index}`}>
              <div
                className="destination-image"
                style={{ backgroundImage: `url(${place.image})` }}
              />
              <div className="destination-content">
                <h3>{place.name}</h3>
                <p>{place.text}</p>
                <button className="small-btn" onClick={onOpenLogin}>
                  Explore
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}