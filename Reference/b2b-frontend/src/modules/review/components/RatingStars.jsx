import { useState } from "react";

const RatingStars = ({ value = 0, rating, onChange }) => {
  const [hover, setHover] = useState(0);
  const displayValue = rating ?? value;
  const isInteractive = typeof onChange === 'function';

  return (
    <div>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            cursor: isInteractive ? "pointer" : "default",
            color: (hover || displayValue) >= star ? "gold" : "gray",
            fontSize: "20px",
          }}
          onClick={() => isInteractive && onChange(star)}
          onMouseEnter={() => isInteractive && setHover(star)}
          onMouseLeave={() => isInteractive && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default RatingStars;