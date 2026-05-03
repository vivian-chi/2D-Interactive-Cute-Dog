PROJECT PRD: Cute Dog + Orange Ball (Mouse Hover Chase)
Separate Assets + Mouth-Open Fetch
1. Project Overview
A 2D web interactive experience with black line art + orange ball as the only color element.

A cute, energetic dog sits in the middle of the screen. An orange ball sits beside him.

User interaction: Hover mouse over ball → ball follows cursor → dog chases with mouth open when close.
Stop hovering: Dog catches ball (mouth closes on it), fetches it back, sits down.
Idle timeout (15s): Dog hops, ball auto-bounces once.

2. Visual Specifications
Element	Specification
Background	White (#FFFFFF)
Dog	Black strokes only, 2px weight, no fill, transparent background
Ball	Only colored element — bright orange (#FF6600), black outline, solid fill
Canvas size	1000×600 (responsive)
Dog initial position	Center X: 400px, Bottom Y: 500px
Ball initial position	150px right of dog (X: 550px, Y: 520px)
Z-order (drawing order):

Background (white)

Dog (full body)

Ball (on top, overlaps dog's mouth area when close)

3. Assets (PNG Sequences)
Dog Frames (17 total)
ID	Filename	Description	Mouth
D01	dog_idle_01.png	Sitting, tail up, calm	Closed
D02	dog_idle_02.png	Sitting, slight bounce	Closed
D03	dog_idle_03.png	Sitting, panting, excited	Slight open
D04	dog_hop_01.png	Pushing up from sit	Closed
D05	dog_hop_02.png	Mid-hop, all paws off ground	Slight open
D06	dog_run_01.png	Running, right leg forward	Closed
D07	dog_run_02.png	Running, left leg forward	Closed
D08	dog_run_03.png	Running, legs gathered	Closed
D09	dog_run_04.png	Running, legs extended	Closed
D10	dog_fetch_01.png	Running, mouth WIDE open	Wide
D11	dog_fetch_02.png	Running, mouth open (stride 2)	Wide
D12	dog_fetch_03.png	Running, mouth open (gathered)	Wide
D13	dog_fetch_04.png	Running, mouth WIDEST	Widest
D14	dog_jump_01.png	Leaping up, mouth open	Wide
D15	dog_jump_02.png	Peak of jump, mouth closing	Closing
D16	dog_sit_01.png	Landing, back paws down	Closed
D17	dog_sit_02.png	Sitting, happy, tail wag	Closed
Ball Frames (3 total)
ID	Filename	Description
B01	ball_01.png	Normal circle
B02	ball_02.png	Squashed vertically (bounce)
B03	ball_03.png	Stretched horizontally (fast)
4. State Machine
text
                    ┌─────────────────┐
                    │      IDLE       │
                    │  (sit + cycle   │
                    │   D01→D02→D03)  │
                    └────────┬────────┘
                             │
             15s timeout     │ mouse hovers ball
                             ▼
                    ┌─────────────────┐
                    │  HOP_AND_BOUNCE  │
                    │  (D04→D05→IDLE) │
                    │  + ball B02     │
                    └─────────────────┘
                             │
                             │ (returns to IDLE)
                             
                    ┌─────────────────┐
                    │      CHASE      │◄───┐
                    │  (dog follows   │    │
                    │   ball cursor)  │    │
                    └────────┬────────┘    │
                             │             │
              distance < 40px│             │ mouse re-hovers
                             ▼             │ during RETURN
                    ┌─────────────────┐    │
                    │      FETCH      │    │
                    │  (switch to     │    │
                    │   D10→D13)      │    │
                    └────────┬────────┘    │
                             │             │
              distance < 20px│             │
                             ▼             │
                    ┌─────────────────┐    │
                    │    CATCH_MOMENT  │    │
                    │  (D14→D15)      │    │
                    │  ball attaches  │    │
                    └────────┬────────┘    │
                             │             │
                             ▼             │
                    ┌─────────────────┐    │
                    │     RETURN      │────┘
                    │  (D10→D13 cycle │
                    │   ball follows  │
                    │   dog offset)   │
                    └────────┬────────┘
                             │
              at destination │
                             ▼
                    ┌─────────────────┐
                    │      DROP       │
                    │  (D16→D17)      │
                    │  ball rolls to  │
                    │  original spot  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │      IDLE       │
                    └─────────────────┘
5. Chase Mechanics
Ball Follows Cursor (on hover)
javascript
if (state === 'CHASE' && mouseOverBall) {
  // Clamp to canvas edges with padding
  ball.x = clamp(mouseX, 50, canvas.width - 50)
  ball.y = clamp(mouseY, 100, canvas.height - 100)
  
  // Ball squash/stretch based on speed
  const speed = Math.hypot(mouseDeltaX, mouseDeltaY)
  if (speed > 5) ball.currentFrame = B03  // stretched
  else if (speed > 0) ball.currentFrame = B02  // squashed
  else ball.currentFrame = B01  // normal
}
Dog Follows Ball (with easing)
javascript
// Dog position
dog.x += (ball.x - dog.x) * 0.1
dog.y += (ball.y - dog.y) * 0.08

// Direction facing
if (ball.x > dog.x) use right-facing frames
else use left-facing frames (ctx.scale(-1,1))

// Frame selection based on distance to ball
const dist = Math.hypot(dog.x - ball.x, dog.y - ball.y)

if (dist < 40) {
  dog.frameSet = FETCH_FRAMES (D10–D13)  // MOUTH OPEN
} else {
  dog.frameSet = RUN_FRAMES (D06–D09)    // MOUTH CLOSED
}
Dog Speed Influence on Frame Rate
Dog Speed (pixels/frame)	Frame Swap Interval
> 8 px	50ms (very fast run)
4–8 px	100ms (normal run)
< 4 px	200ms (slow trot)
0 px (idle)	300ms (idle cycle)
6. Catch & Fetch Logic
Collision Detection
javascript
const distToMouth = {
  x: dog.x + (ball.x > dog.x ? 25 : -25),  // mouth offset (front)
  y: dog.y - 10  // mouth height
}
const actualDist = Math.hypot(ball.x - distToMouth.x, ball.y - distToMouth.y)

if (actualDist < 30 && state === 'FETCH') {
  state = 'CATCH_MOMENT'
  dog.frame = D14  // jump up
  setTimeout(() => {
    dog.frame = D15  // mouth closing on ball
    attachBallToDog()
    state = 'RETURN'
  }, 100)
}
Ball Attachment During Return
javascript
// Ball offset relative to dog's mouth
const ballOffset = { x: 20, y: -12 }  // adjust based on your art

function attachBallToDog() {
  ball.attached = true
  ball.offsetX = ballOffset.x
  ball.offsetY = ballOffset.y
}

function updateReturn() {
  if (ball.attached) {
    ball.x = dog.x + (facingRight ? ball.offsetX : -ball.offsetX)
    ball.y = dog.y + ball.offsetY
  }
  
  // Move dog back to origin
  const dx = originalDogX - dog.x
  const dy = originalDogY - dog.y
  dog.x += dx * 0.05
  dog.y += dy * 0.05
  
  // Check if arrived (within 5px)
  if (Math.hypot(dog.x - originalDogX, dog.y - originalDogY) < 5) {
    detachBallAndDrop()
  }
}
Drop Animation
javascript
function detachBallAndDrop() {
  ball.attached = false
  state = 'DROP'
  
  // Animate ball rolling to original spot
  animateBallRoll(originalBallX, originalBallY, () => {
    dog.frame = D17  // final sit
    state = 'IDLE'
    resetIdleTimer()
  })
}
7. Idle Timer (15 seconds)
javascript
let idleTimer

function resetIdleTimer() {
  clearTimeout(idleTimer)
  if (state === 'IDLE') {
    idleTimer = setTimeout(() => {
      triggerHopAndBounce()
    }, 15000)
  }
}

function triggerHopAndBounce() {
  if (state !== 'IDLE') return
  
  state = 'HOP_AND_BOUNCE'
  
  // Dog hop animation
  dog.frame = D04
  setTimeout(() => { dog.frame = D05 }, 100)
  setTimeout(() => { dog.frame = D01; state = 'IDLE' }, 200)
  
  // Ball bounce
  ball.currentFrame = B02
  setTimeout(() => { ball.currentFrame = B01 }, 150)
}
Reset timer on:

Page load

Mouse enter canvas

Mouse leave ball (end of RETURN)

Any user scroll/click (optional)

8. Drawing Order & Overlap
javascript
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Save context for mirroring
  ctx.save()
  
  // Draw dog (may flip horizontally based on direction)
  if (ball.x < dog.x) {
    ctx.scale(-1, 1)
    ctx.drawImage(dogImage, -dog.x - dogWidth, dog.y)
  } else {
    ctx.drawImage(dogImage, dog.x, dog.y)
  }
  
  ctx.restore()
  
  // Draw ball ON TOP of dog
  // This creates natural overlap at dog's mouth
  ctx.drawImage(ballImage, ball.x, ball.y)
}
9. Edge Cases & Polish
Case	Behavior
Mouse leaves ball during FETCH	Continue to CATCH then RETURN
Mouse re-enters ball during RETURN	Cancel RETURN, re-enter CHASE
Ball attached during RETURN	Dog faces original spot, ball stays attached
User hovers ball off canvas	Clamp to edge, dog stops at edge
Fast mouse movement	Ball uses B03 (stretched), dog runs faster
Catch at canvas edge	Complete catch, then return to center
15s timer while fetching	Cancel timer, reset after IDLE
10. Emotional/UX Notes
Chase phase: Dog is excited, tongue out, ears flopping.
Fetch phase (mouth open): Dog is DESPERATE to catch — eyes wide, mouth wide.
Return phase: Dog is proud, tail wagging, ball visibly in front of mouth.
Idle: Dog looks at ball, then at user, then at ball — subtle anticipation.

11. AI Coding Prompt (Ready to Copy)
text
Build a single HTML/CSS/JS file with canvas (1000x600, responsive).

Load 17 dog PNGs (D01–D17) and 3 ball PNGs (B01–B03) from /images/ folder.

Implement state machine: IDLE → HOP_AND_BOUNCE → CHASE → FETCH → CATCH → RETURN → DROP → IDLE.

On mouse hover over ball: 
- Ball follows cursor (clamped to edges)
- Dog chases ball with easing (lerp 0.1, 0.08)
- When distance < 40px, switch to FETCH frames (D10–D13) with MOUTH OPEN
- On collision (distance < 20px), play CATCH (D14→D15), attach ball to dog with offset (x=20, y=-12 relative to dog's mouth)

On mouse leave ball during CHASE/FETCH: 
- Complete catch if in progress, then RETURN to original position
- During RETURN, ball stays attached, dog uses FETCH frames (mouth open)

At original position: 
- Play DROP animation (D16→D17)
- Ball detaches and rolls to original spot (easing)
- Return to IDLE state

Idle timer (15s): 
- If no interaction, play HOP_AND_BOUNCE (D04→D05, ball B02)

Draw order: 
- Background white
- Dog (mirror based on ball X direction)
- Ball ON TOP (creates overlap at mouth)

Only ball has color (#FF6600 fill + black stroke). Dog is black lines only.

Smooth 60fps with requestAnimationFrame.
12. File Checklist for Developer
text
project/
├── index.html
├── style.css
├── script.js
└── images/
    ├── dog/
    │   ├── dog_idle_01.png
    │   ├── dog_idle_02.png
    │   ├── dog_idle_03.png
    │   ├── dog_hop_01.png
    │   ├── dog_hop_02.png
    │   ├── dog_run_01.png
    │   ├── dog_run_02.png
    │   ├── dog_run_03.png
    │   ├── dog_run_04.png
    │   ├── dog_fetch_01.png
    │   ├── dog_fetch_02.png
    │   ├── dog_fetch_03.png
    │   ├── dog_fetch_04.png
    │   ├── dog_jump_01.png
    │   ├── dog_jump_02.png
    │   ├── dog_sit_01.png
    │   └── dog_sit_02.png
    └── ball/
        ├── ball_01.png
        ├── ball_02.png
        └── ball_03.png
