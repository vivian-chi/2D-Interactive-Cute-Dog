# 🐕 Cute Dog: Interactive 2D Animation State Machine

A high-fidelity, interactive 2D animation project featuring a responsive "Cute Dog" character. Built with **Vanilla JavaScript** and **Canvas API**, this project demonstrates a complex state machine for character behavior, including click-and-drag interactions, dynamic chasing logic, and smooth animation transitions.

![Cute Dog Animation](https://img.shields.io/badge/Animation-State%20Machine-orange?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-blue?style=for-the-badge&logo=html5)

## ✨ Key Features

- **Interactive Drag-and-Drop:** Control the dog's favorite ball with precise click-and-drag physics.
- **Dynamic State Machine:** Seamlessly transitions between `IDLE`, `RUN`, `JUMP`, and `FETCH` states based on user interaction.
- **Intelligent Chasing Logic:** The dog dynamically follows the ball with a calculated lead distance, ensuring the ball always stays ahead during the chase.
- **Polished Transitions:** Features custom "put-back" animations and "stop-to-fetch" pauses for a natural, organic feel.
- **Responsive Canvas:** Automatically scales to fit any viewport while maintaining perfect pixel density for high-DPI displays.
- **Smart Idle Behavior:** Automatically triggers playful "hop and bounce" animations after 15 seconds of inactivity.

## 🕹️ How to Interact

1. **Wake the Dog:** Click and move the ball to start the interaction.
2. **Chase & Run:** Drag the ball around the screen. The dog will switch between high-speed running and jumping depending on the ball's distance from the center.
3. **Fetch:** Release the mouse button while the dog is chasing. The dog will "pick up" the ball (switching to frames with the ball in its mouth) and trot back home.
4. **Auto-Idle:** If left alone, the dog will eventually settle back into its idle breathing animation.

## 🛠️ Technical Details

### State Management
The core logic resides in a robust state machine within `js/engine.js`:
- `JUMP_CHASE`: Playful jumps when the ball is nearby.
- `RUN_CHASE`: Energetic sprint cycles when the ball is further away.
- `FETCH_CATCH`: Transitional state where the dog moves to the dropped ball.
- `FETCH_RETURN`: Constant-speed return trot carrying the ball home.
- `PUT_BACK`: Final 600ms transition for placing the ball and resetting to idle.

### Performance
- Uses `requestAnimationFrame` for buttery-smooth 60fps rendering.
- Adaptive frame rates based on character velocity for more realistic movement.
- Efficient SVG asset preloading for zero-lag interaction.

## 🚀 Getting Started

Simply open `index.html` in any modern web browser.

```bash
# Clone the repository
git clone [https://github.com/vivian-chi/2D-Interactive-Cute-Dog.git]

# Navigate to the directory
cd cute-dog

# Open in browser
open index.html
```

---
*Created with love for high-quality 2D web animation.*
