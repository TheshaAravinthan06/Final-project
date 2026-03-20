const suggestions = [
  {
    id: 1,
    name: "logika_ka",
    note: "Suggested for you",
    image: "/images/mirissa.jpg",
  },
  {
    id: 2,
    name: "keth_ees",
    note: "Travel vibes",
    image: "/images/ella.jpg",
  },
  {
    id: 3,
    name: "branavi",
    note: "Popular creator",
    image: "/images/sigiriya.jpg",
  },
  {
    id: 4,
    name: "meenu_si",
    note: "Explore more",
    image: "/images/nuwareliya.jpg",
  },
];

export default function RightPanel() {
  return (
    <aside className="right-panel">
      <div className="profile-mini-card">
        <img src="/images/mirissa.jpg" alt="profile" />
        <div>
          <h4>thesha_6</h4>
          <p>Thesh</p>
        </div>
        <button type="button">Switch</button>
      </div>

      <div className="suggest-box">
        <div className="suggest-box__head">
          <h5>Suggested for you</h5>
          <button type="button">See all</button>
        </div>

        <div className="suggest-list">
          {suggestions.map((user) => (
            <div key={user.id} className="suggest-item">
              <div className="suggest-item__left">
                <img src={user.image} alt={user.name} />
                <div>
                  <h6>{user.name}</h6>
                  <p>{user.note}</p>
                </div>
              </div>
              <button type="button">Follow</button>
            </div>
          ))}
        </div>
      </div>

      <div className="right-footer">
        <p>About · Help · Privacy · Terms</p>
        <p>Trip AI © 2026</p>
      </div>
    </aside>
  );
}