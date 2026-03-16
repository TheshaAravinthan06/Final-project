type PopularDestinationsProps = {
  onOpenLogin: () => void;
};

const destinations = [
  { name: "Ella", image: "./images/ella.jpg" },
  { name: "Mirissa", image: "../public/images/mirissa.jpg" },
  { name: "Sigiriya", image: "../public/images/sigiriya.jpg" },
  { name: "Nuwara Eliya", image: "../public/images/nuwara-eliya.jpg" },
];

export default function PopularDestinations({
  onOpenLogin,
}: PopularDestinationsProps) {
  return (
    <section className="section section-soft">
      <div className="container">
        <div className="section-heading fade-up">
          <h2>Popular Destinations</h2>
          <p>Discover beautiful places that can inspire your next trip.</p>
        </div>

        <div className="destination-grid">
          {destinations.map((place, index) => (
            <div key={place.name} className={`destination-card fade-up delay-${index}`}>
              <div
                className="destination-image"
                style={{ background: place.image }}
              ></div>
              <div className="destination-content">
                <h3>{place.name}</h3>
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