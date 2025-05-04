// import React from 'react';
// import { motion, MotionValue } from 'framer-motion';

// interface Face3Props {
//   isClicked: boolean;
//   lookX: MotionValue<number>;
//   lookY: MotionValue<number>;
//   mouthPath: MotionValue<string>;
//   isFocused: boolean;
//   className?: string;
//   width: number;
//   height: number;
// }

// const Face3: React.FC<Face3Props> = ({ isClicked, lookX, lookY, mouthPath, isFocused, className }) => {
//   return (
//     <motion.div
//       initial={{ y: -500 }}
//       animate={{ y: -100 }}
//       transition={{ type: "spring", stiffness: 100, damping: 10 }}
//       className={`relative flex items-center justify-center ${className}`}
//     >
//       <svg
//         width="450"
//         height="400"
//         viewBox="0 0 250 200"
//         fill="none"
//         xmlns="http://www.w3.org/2000/svg"
//       >
//         {/* Left Eye */}
//         <ellipse cx="90" cy="80" rx="30" ry="35" fill="white" />
//         <motion.circle
//           cx="90"
//           cy="80"
//           r="10"
//           fill="black"
//           style={{ x: isClicked ? 0 : lookX, y: isClicked ? 0 : lookY }}
//           transition={{ type: "spring", stiffness: 100 }}
//         />
//         {/* Right Eye */}
//         <ellipse cx="160" cy="80" rx="30" ry="35" fill="white" />
//         <motion.circle
//           cx="160"
//           cy="80"
//           r="10"
//           fill="black"
//           style={{ x: isClicked ? 0 : lookX, y: isClicked ? 0 : lookY }}
//           transition={{ type: "spring", stiffness: 100 }}
//         />
//         {/* Mouth */}
//         <motion.path
//           d={mouthPath}
//           stroke="black"
//           strokeWidth="5"
//           fill="transparent"
//           transition={{ type: "spring", stiffness: 80 }}
//         />
//         {/* Eyebrows */}
//         <motion.path
//           d="M70,55 Q90,45 110,55" // Curved path for left eyebrow
//           stroke="black"
//           strokeWidth="5"
//           fill="transparent"
//           style={{ rotate: isFocused ? -10 : 0 }}
//           transition={{ type: "spring", stiffness: 100 }}
//         />
//         <motion.path
//           d="M140,55 Q160,45 180,55" // Curved path for right eyebrow
//           stroke="black"
//           strokeWidth="5"
//           fill="transparent"
//           style={{ rotate: isFocused ? 10 : 0 }}
//           transition={{ type: "spring", stiffness: 100 }}
//         />
//       </svg>
//     </motion.div>
//   );
// };

// export default Face3;



// import React from 'react';
// import { motion, MotionValue } from 'framer-motion';

// interface Face3Props {
//   isClicked: boolean;
//   lookX: MotionValue<number>;
//   lookY: MotionValue<number>;
//   mouthPath: MotionValue<string>;
//   isFocused: boolean;
//   className?: string;
//   width: number;
//   height: number;
// }

// const Face3: React.FC<Face3Props> = ({ isClicked, lookX, lookY, mouthPath, isFocused, className }) => {
//   return (
//     <motion.div
//       initial={{ y: -500 }}
//       animate={{ y: -100 }}
//       transition={{ type: 'spring', stiffness: 100, damping: 10 }}
//       className={`relative flex items-center justify-center ${className}`}
//     >
//       <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
//         {/* Face Circle */}
//         <circle cx="150" cy="150" r="120" fill="#EFB036" stroke="black" strokeWidth="5" />

//         {/* Left Eye */}
//         <ellipse cx="110" cy="130" rx="25" ry="30" fill="white" />
//         <motion.circle
//           cx="110"
//           cy="130"
//           r="10"
//           fill="black"
//           style={{ x: isClicked ? 0 : lookX, y: isClicked ? 0 : lookY }}
//           transition={{ type: 'spring', stiffness: 100 }}
//         />

//         {/* Right Eye */}
//         <ellipse cx="190" cy="130" rx="25" ry="30" fill="white" />
//         <motion.circle
//           cx="190"
//           cy="130"
//           r="10"
//           fill="black"
//           style={{ x: isClicked ? 0 : lookX, y: isClicked ? 0 : lookY }}
//           transition={{ type: 'spring', stiffness: 100 }}
//         />

//         {/* Mouth */}
//         <motion.path
//           d={mouthPath}
//           stroke="black"
//           strokeWidth="5"
//           fill="transparent"
//           transform="translate(26, 40)"
//           transition={{ type: 'spring', stiffness: 80 }}
//         />

//         {/* Eyebrows */}
//         <motion.path
//           d="M90,100 Q110,90 130,100" // Curved path for left eyebrow
//           stroke="black"
//           strokeWidth="5"
//           fill="transparent"
//           style={{ rotate: isFocused ? -10 : 0 }}
//           transition={{ type: 'spring', stiffness: 100 }}
//         />
//         <motion.path
//           d="M170,100 Q190,90 210,100" // Curved path for right eyebrow
//           stroke="black"
//           strokeWidth="5"
//           fill="transparent"
//           style={{ rotate: isFocused ? 10 : 0 }}
//           transition={{ type: 'spring', stiffness: 100 }}
//         />
//       </svg>
//     </motion.div>
//   );
// };

// export default Face3;





import React from 'react';
import { motion, MotionValue } from 'framer-motion';

interface Face3Props {
  isClicked: boolean;
  lookX: MotionValue<number>;
  lookY: MotionValue<number>;
  mouthPath: MotionValue<string>;
  isFocused: boolean;
  className?: string;
  width: number;
  height: number;
}

const Face3: React.FC<Face3Props> = ({ isClicked, lookX, lookY, mouthPath, isFocused, className }) => {
  return (
    <motion.div
      initial={{ y: -500 }}
      animate={{ y: -100 }}
      transition={{ type: 'spring', stiffness: 100, damping: 10 }}
      className={`relative flex items-center justify-center ${className}`}
    >
      <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Face Circle */}
        <circle cx="150" cy="150" r="120" fill="#F8E7F6" stroke="black" strokeWidth="5" />

        {/* Left Eye */}
        <ellipse cx="110" cy="130" rx="25" ry="30" fill="white" />
        <motion.circle
          cx="110"
          cy="130"
          r="10"
          fill="black"
          style={{ x: isClicked ? 0 : lookX, y: isClicked ? 0 : lookY }}
          transition={{ type: 'spring', stiffness: 100 }}
        />

        {/* Right Eye */}
        <ellipse cx="190" cy="130" rx="25" ry="30" fill="white" />
        <motion.circle
          cx="190"
          cy="130"
          r="10"
          fill="black"
          style={{ x: isClicked ? 0 : lookX, y: isClicked ? 0 : lookY }}
          transition={{ type: 'spring', stiffness: 100 }}
        />

        {/* Mouth */}
        <motion.path
          d="M100,180 Q150,220 200,180" // Adjusted for neutral smile
          stroke="black"
          strokeWidth="5"
          fill="transparent"
          transition={{ type: 'spring', stiffness: 80 }}
        />

        {/* Eyebrows */}
        <motion.path
          d="M90,100 Q110,90 130,100" // Curved path for left eyebrow
          stroke="black"
          strokeWidth="5"
          fill="transparent"
          style={{ rotate: isFocused ? -10 : 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        />
        <motion.path
          d="M170,100 Q190,90 210,100" // Curved path for right eyebrow
          stroke="black"
          strokeWidth="5"
          fill="transparent"
          style={{ rotate: isFocused ? 10 : 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        />
      </svg>
    </motion.div>
  );
};

export default Face3;





