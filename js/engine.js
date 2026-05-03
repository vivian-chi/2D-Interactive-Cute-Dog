class InteractiveAnimation {
    constructor(canvasId, config) {
        this.config = config;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.assets = { character: {}, prop: {} };
        this.loadedCount = 0;
        this.totalAssets = Object.keys(config.assets.character).length + Object.keys(config.assets.prop).length;

        this.STATES = {
            IDLE: 'IDLE',
            HOP_AND_BOUNCE: 'HOP_AND_BOUNCE',
            WAKE_TRANSITION: 'WAKE_TRANSITION',
            JUMP_CHASE: 'JUMP_CHASE',
            JUMP_STOP: 'JUMP_STOP',
            RUN_CHASE: 'RUN_CHASE',
            FETCH_CATCH: 'FETCH_CATCH',
            FETCH_RETURN: 'FETCH_RETURN',
            DROP: 'DROP',
            PUT_BACK: 'PUT_BACK'
        };

        this.state = this.STATES.IDLE;

        this.character = { ...config.character.initialState };
        this.prop = { ...config.prop.initialState };

        this.originalCharX = 0;
        this.originalCharY = 0;
        this.originalPropX = 0;
        this.originalPropY = 0;

        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseOverProp = false;

        this.lastTime = 0;
        this.lastCharX = this.character.x || 0;
        this.lastCharY = this.character.y || 0;
        this.idleTimer = null;
        this.propBounceOffset = 0;
        this.charBounceOffset = 0;
        this.lastMouseMoveTime = 0;
        this.isDragging = false;
        this.showIndicator = true;

        this.resizeCanvas = this.resizeCanvas.bind(this);
        this.updateMouse = this.updateMouse.bind(this);
        this.loop = this.loop.bind(this);
        this.resetIdleTimer = this.resetIdleTimer.bind(this);

        window.addEventListener('resize', this.resizeCanvas);

        // Click on ball to start dragging
        this.canvas.addEventListener('mousedown', (e) => {
            this.updateMouse(e);
            if (this.mouseOverProp && (this.state === this.STATES.IDLE || this.state === this.STATES.JUMP_STOP || this.state === this.STATES.DROP)) {
                this.isDragging = true;
                this.showIndicator = false;
                this.state = this.STATES.WAKE_TRANSITION;
                this.triggerWakeTransition();
            }
        });

        // Move ball while dragging
        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMouse(e);
            if (this.isDragging) {
                this.lastMouseMoveTime = Date.now();
                this.resetIdleTimer();
            }
        });

        // Release button to stop interaction
        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                if (this.state === this.STATES.RUN_CHASE) {
                    this.state = this.STATES.FETCH_CATCH;
                } else if (this.state === this.STATES.JUMP_CHASE) {
                    // Jump will finish its loop naturally
                }
            }
        });

        this.canvas.addEventListener('mouseenter', this.resetIdleTimer);
        this.canvas.addEventListener('mouseleave', () => {
            this.mouseOverProp = false;
            if (this.isDragging && this.state === this.STATES.RUN_CHASE) {
                // Dog keeps running toward the edge, then fetches back
                setTimeout(() => {
                    if (this.state === this.STATES.RUN_CHASE) {
                        this.isDragging = false;
                        this.state = this.STATES.FETCH_CATCH;
                    }
                }, 500);
            }
        });

        this.preloadAssets(() => {
            this.resizeCanvas();
            this.resetIdleTimer();
            requestAnimationFrame(this.loop);
        });
    }

    preloadAssets(onComplete) {
        for (const [key, path] of Object.entries(this.config.assets.character)) {
            const img = new Image();
            img.src = path;
            img.onload = () => { this.loadedCount++; if (this.loadedCount === this.totalAssets) onComplete(); };
            this.assets.character[key] = img;
        }
        for (const [key, path] of Object.entries(this.config.assets.prop)) {
            const img = new Image();
            img.src = path;
            img.onload = () => { this.loadedCount++; if (this.loadedCount === this.totalAssets) onComplete(); };
            this.assets.prop[key] = img;
        }
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.originalCharX = window.innerWidth / 2;
        this.originalCharY = window.innerHeight * 0.7;
        this.originalPropX = this.originalCharX + (this.config.prop.initialOffsetX || 160);
        this.originalPropY = this.originalCharY + (this.config.prop.initialOffsetY || 20);

        if (this.state === this.STATES.IDLE || this.state === this.STATES.HOP_AND_BOUNCE) {
            this.character.x = this.originalCharX;
            this.character.y = this.originalCharY;
            this.prop.x = this.originalPropX;
            this.prop.y = this.originalPropY;
        }
    }

    updateMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.lastMouseMoveTime = Date.now();
        const distToProp = Math.hypot(this.mouseX - this.prop.x, this.mouseY - this.prop.y);
        this.mouseOverProp = distToProp < 80;
    }

    resetIdleTimer() {
        clearTimeout(this.idleTimer);
        if (this.state === this.STATES.IDLE) {
            this.idleTimer = setTimeout(() => {
                this.triggerHopAndBounce();
            }, this.config.physics.autoBounceInterval || 5000);
        }
    }

    triggerHopAndBounce() {
        if (this.state !== this.STATES.IDLE) return;
        this.state = this.STATES.HOP_AND_BOUNCE;
        this.showIndicator = true;
        const bounceHeight = this.config.physics.bounceHeight || 120;
        const bounceDuration = 1000;
        const startTime = Date.now();

        const animateBounce = () => {
            if (this.state !== this.STATES.HOP_AND_BOUNCE) {
                this.propBounceOffset = 0;
                this.charBounceOffset = 0;
                return;
            }
            const elapsed = Date.now() - startTime;
            if (elapsed < bounceDuration) {
                const t = elapsed / bounceDuration;
                this.propBounceOffset = -4 * bounceHeight * t * (1 - t);
                if (t > 0 && t < 1) this.prop.frame = this.config.animations.prop.jumpBall || this.config.animations.prop.bounce;
                else this.prop.frame = this.config.animations.prop.idle;

                if (t < 0.1) {
                    this.character.frame = this.config.animations.character.hop[0];
                    this.charBounceOffset = 0;
                } else if (t < 0.4) {
                    this.character.frame = this.config.animations.character.hop[1];
                    const dogT = (t - 0.1) / 0.3;
                    this.charBounceOffset = -4 * 40 * dogT * (1 - dogT);
                } else if (t < 0.5) {
                    this.character.frame = this.config.animations.character.hop[0];
                    this.charBounceOffset = 0;
                } else {
                    this.character.frame = this.config.animations.character.idle[0];
                    this.charBounceOffset = 0;
                }
                requestAnimationFrame(animateBounce);
            } else {
                this.propBounceOffset = 0;
                this.charBounceOffset = 0;
                this.prop.frame = this.config.animations.prop.idle;
                this.character.frame = this.config.animations.character.idle[0];
                this.state = this.STATES.IDLE;
                this.resetIdleTimer();
            }
        };
        requestAnimationFrame(animateBounce);
    }

    triggerWakeTransition() {
        this.character.frame = this.config.animations.character.hop[0];
        setTimeout(() => {
            if (this.state !== this.STATES.WAKE_TRANSITION) return;
            this.character.frame = this.config.animations.character.hop[1];
        }, 250);
        setTimeout(() => {
            if (this.state !== this.STATES.WAKE_TRANSITION) return;
            const distToCenter = Math.hypot(this.mouseX - this.originalCharX, this.mouseY - this.originalCharY);
            const jumpRadius = window.innerWidth / 6;
            if (distToCenter < jumpRadius) {
                this.state = this.STATES.JUMP_CHASE;
            } else {
                this.state = this.STATES.RUN_CHASE;
            }
        }, 500);
    }

    triggerJumpStop() {
        this.character.rotation = 0; // Reset rotation for the transition
        this.character.frame = this.config.animations.character.hop[1]; // D05
        setTimeout(() => {
            if (this.state !== this.STATES.JUMP_STOP) return;
            this.character.frame = this.config.animations.character.hop[0]; // D04
        }, 250);
        setTimeout(() => {
            if (this.state !== this.STATES.JUMP_STOP) return;
            this.state = this.STATES.DROP;
        }, 500);
    }



    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    getFrameInterval() {
        if (this.state === this.STATES.IDLE || this.state === this.STATES.DROP) return this.config.physics.idleInterval || 300;
        const speed = Math.hypot(this.character.x - this.lastCharX, this.character.y - this.lastCharY);
        if (speed > 8) return 50;
        if (speed > 4) return 100;
        return 150;
    }

    update(time) {
        const userStopped = !this.isDragging;

        // Ball follows cursor only while dragging
        if (this.isDragging) {
            this.prop.x = this.clamp(this.mouseX, 50, window.innerWidth - 50);
            this.prop.y = this.clamp(this.mouseY, 50, window.innerHeight - 50);
        }

        if (this.state === this.STATES.JUMP_CHASE && !this.jumpChaseStartTime) {
            this.jumpChaseStartTime = time;
        } else if (this.state !== this.STATES.JUMP_CHASE) {
            this.jumpChaseStartTime = 0;
        }

        if (this.state === this.STATES.JUMP_CHASE) {
            this.prop.frame = this.config.animations.prop.jumpBall || this.config.animations.prop.idle;

            // Dog stays fixed at its initial position
            this.character.x = this.originalCharX;
            this.character.y = this.originalCharY;
            this.character.rotation = 0;

            // Face left or right based on which half of the screen the ball is on
            const screenCenter = window.innerWidth / 2;
            this.character.facingRight = this.prop.x > screenCenter;

            // Double jump sequence: 14 -> 15 -> 14 -> 15 -> 16 -> 16.5 -> 17
            // 840ms total (~120ms per frame)
            const timeInJump = time - this.jumpChaseStartTime;

            if (timeInJump < 120) {
                this.character.frame = this.config.animations.character.jump[0]; // D14 (leap)
            } else if (timeInJump < 240) {
                this.character.frame = this.config.animations.character.jump[1]; // D15 (airborne)
            } else if (timeInJump < 360) {
                this.character.frame = this.config.animations.character.jump[0]; // D14 (leap again)
            } else if (timeInJump < 480) {
                this.character.frame = this.config.animations.character.jump[1]; // D15 (airborne again)
            } else if (timeInJump < 600) {
                this.character.frame = this.config.animations.character.jump[2]; // D16 (rear legs land)
            } else if (timeInJump < 720) {
                this.character.frame = this.config.animations.character.jump[3]; // D16_5 (front legs crouch)
            } else if (timeInJump < 840) {
                this.character.frame = this.config.animations.character.jump[4]; // D17 (sit/ready)
            } else {
                // Sequence finished once
                this.character.rotation = 0;
                const distToCenter = Math.hypot(this.prop.x - this.originalCharX, this.prop.y - this.originalCharY);
                const jumpRadius = window.innerWidth / 6;

                if (!userStopped && distToCenter >= jumpRadius) {
                    this.state = this.STATES.RUN_CHASE;
                } else if (userStopped) {
                    this.state = this.STATES.JUMP_STOP;
                    this.triggerJumpStop();
                } else {
                    // Still dragging within jump area — replay loop
                    this.jumpChaseStartTime = time;
                }
            }
        } else if (this.state === this.STATES.RUN_CHASE) {
            this.prop.frame = this.config.animations.prop.bounce; // B02 = frame 19

            // Dog chases ball with slower lerp so ball always leads
            this.character.x += (this.prop.x - this.character.x) * 0.03;
            this.character.y += (this.prop.y - this.character.y) * 0.03;

            // Enforce minimum gap so ball is always in front of the dog
            const minGap = 200;
            const dx = this.prop.x - this.character.x;
            const dy = this.prop.y - this.character.y;
            const dist = Math.hypot(dx, dy);
            if (dist < minGap && dist > 0) {
                this.character.x = this.prop.x - (dx / dist) * minGap;
                this.character.y = this.prop.y - (dy / dist) * minGap;
            }

            this.character.facingRight = this.prop.x > this.character.x;

            // Run animation cycle (frames 6,7,8,9 only)
            if (time - this.character.lastFrameTime > this.getFrameInterval()) {
                this.character.frameIndex = ((this.character.frameIndex || 0) + 1) % this.config.animations.character.run.length;
                this.character.frame = this.config.animations.character.run[this.character.frameIndex];
                this.character.lastFrameTime = time;
            }

            // Check if ball is back in jump area
            const distToCenter = Math.hypot(this.prop.x - this.originalCharX, this.prop.y - this.originalCharY);
            const jumpRadius = window.innerWidth / 6;
            if (distToCenter < jumpRadius && this.isDragging) {
                this.jumpChaseStartTime = 0;
                this.state = this.STATES.JUMP_CHASE;
            } else if (userStopped) {
                // User released: dog runs to ball then fetches home
                this.state = this.STATES.FETCH_CATCH;
            }
        } else if (this.state === this.STATES.FETCH_CATCH) {
            // "Stop to Fetch" status: dog runs toward ball, ball shows frame 18
            this.prop.frame = this.config.animations.prop.idle; // B01 = frame 18

            // Dog runs toward ball position
            const dxToBall = this.prop.x - this.character.x;
            const dyToBall = this.prop.y - this.character.y;
            this.character.x += dxToBall * 0.05;
            this.character.y += dyToBall * 0.05;
            this.character.facingRight = dxToBall > 0;

            // Fetch animation WITHOUT ball (frames 10,11,12,13 original)
            const fetchNoBall = this.config.animations.character.fetchNoBall || this.config.animations.character.fetch;
            if (time - this.character.lastFrameTime > 150) {
                this.character.frameIndex = ((this.character.frameIndex || 0) + 1) % fetchNoBall.length;
                this.character.frame = fetchNoBall[this.character.frameIndex];
                this.character.lastFrameTime = time;
            }

            // When dog reaches ball, transition to Fetch status
            if (Math.hypot(dxToBall, dyToBall) < 30) {
                this.state = this.STATES.FETCH_RETURN;
                // Record start position and time for constant-speed return
                this.fetchStartX = this.character.x;
                this.fetchStartY = this.character.y;
                this.fetchStartTime = time;
                // 3 loops × 4 frames × 180ms = 2160ms total
                this.fetchDuration = 3 * 4 * 180;
            }

            // If user clicks and drags again, go back to run
            if (!userStopped) {
                this.state = this.STATES.RUN_CHASE;
            }
        } else if (this.state === this.STATES.FETCH_RETURN) {
            // "Fetch" status: dog carries ball home, cursor control disabled
            this.prop.frame = null; // Ball hidden — built into dog frames

            // Constant speed: linear interpolation over fetchDuration
            const elapsed = time - this.fetchStartTime;
            const t = Math.min(elapsed / this.fetchDuration, 1);

            this.character.x = this.fetchStartX + (this.originalCharX - this.fetchStartX) * t;
            this.character.y = this.fetchStartY + (this.originalCharY - this.fetchStartY) * t;

            const dx = this.originalCharX - this.character.x;
            this.character.facingRight = dx > 0;

            // Fetch animation WITH ball (frames 10-13 withball) — 3 loops
            if (time - this.character.lastFrameTime > 180) {
                this.character.frameIndex = ((this.character.frameIndex || 0) + 1) % this.config.animations.character.fetch.length;
                this.character.frame = this.config.animations.character.fetch[this.character.frameIndex];
                this.character.lastFrameTime = time;
            }

            // When 3 loops complete, transition to put-back
            if (t >= 1) {
                this.character.x = this.originalCharX;
                this.character.y = this.originalCharY;
                this.state = this.STATES.PUT_BACK;
                this.putBackStartTime = time;
            }
        } else if (this.state === this.STATES.PUT_BACK) {
            // Transition: frame 22 (with ball) → frame 23 (no ball) → idle
            const elapsed = time - this.putBackStartTime;
            this.character.x = this.originalCharX;
            this.character.y = this.originalCharY;

            // Face toward the ball's initial position
            this.character.facingRight = this.originalPropX > this.originalCharX;

            if (elapsed < 300) {
                // Frame 22: putting ball down (ball still hidden, built into frame)
                this.character.frame = this.config.animations.character.putBack[0]; // D22
                this.prop.frame = null;
            } else if (elapsed < 600) {
                // Frame 23: ball placed, dog stepping back (ball now visible at initial pos)
                this.character.frame = this.config.animations.character.putBack[1]; // D23
                this.prop.x = this.originalPropX;
                this.prop.y = this.originalPropY;
                this.prop.frame = this.config.animations.prop.idle;
            } else {
                // Done — go to idle
                this.state = this.STATES.IDLE;
                this.resetIdleTimer();
            }
        } else if (this.state === this.STATES.DROP) {
            // Ball stays where user left it
            this.prop.frame = this.config.animations.prop.idle;

            // Dog slides back to initial position
            this.character.x += (this.originalCharX - this.character.x) * this.config.physics.rollLerp;
            this.character.y += (this.originalCharY - this.character.y) * this.config.physics.rollLerp;

            if (time - this.character.lastFrameTime > this.config.physics.idleInterval) {
                this.character.frameIndex = ((this.character.frameIndex || 0) + 1) % this.config.animations.character.idle.length;
                this.character.frame = this.config.animations.character.idle[this.character.frameIndex];
                this.character.lastFrameTime = time;
            }
            this.character.facingRight = this.prop.x > this.character.x;

            const charArrived = Math.hypot(this.character.x - this.originalCharX, this.character.y - this.originalCharY) < 5;

            if (charArrived) {
                this.character.x = this.originalCharX;
                this.character.y = this.originalCharY;
                this.state = this.STATES.IDLE;
                this.resetIdleTimer();
            }
        } else if (this.state === this.STATES.IDLE) {
            if (time - this.character.lastFrameTime > this.getFrameInterval()) {
                this.character.frameIndex = ((this.character.frameIndex || 0) + 1) % this.config.animations.character.idle.length;
                this.character.frame = this.config.animations.character.idle[this.character.frameIndex];
                this.character.lastFrameTime = time;
            }
            this.character.facingRight = this.prop.x > this.character.x;
        }

        this.lastCharX = this.character.x;
        this.lastCharY = this.character.y;
        this.lastTime = time;
    }

    draw() {
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const charImg = this.assets.character[this.character.frame];
        if (charImg) {
            const dw = charImg.width * this.character.scale;
            const dh = charImg.height * this.character.scale;
            const charOffsetY = this.charBounceOffset || 0;

            this.ctx.save();
            const rotation = this.character.rotation || 0;
            if (!this.character.facingRight) {
                this.ctx.translate(this.character.x, this.character.y + charOffsetY);
                this.ctx.scale(-1, 1);
                this.ctx.rotate(rotation);
                this.ctx.drawImage(charImg, -dw / 2, -dh / 2, dw, dh);
            } else {
                this.ctx.translate(this.character.x, this.character.y + charOffsetY);
                this.ctx.rotate(rotation);
                this.ctx.drawImage(charImg, -dw / 2, -dh / 2, dw, dh);
            }
            this.ctx.restore();
        }

        const propImg = this.assets.prop[this.prop.frame];
        if (propImg) {
            const bw = propImg.width * this.prop.scale;
            const bh = propImg.height * this.prop.scale;
            const offsetY = this.propBounceOffset || 0;
            this.ctx.drawImage(propImg, this.prop.x - bw / 2, this.prop.y - bh / 2 + offsetY, bw, bh);
        }

        if (this.showIndicator && this.state === this.STATES.IDLE && this.config.ui && this.config.ui.indicatorText) {
            const bounceY = Math.sin(this.lastTime / 200) * 5;
            this.ctx.fillStyle = '#B0B0B0';
            this.ctx.font = '14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.config.ui.indicatorText, this.prop.x, this.prop.y - 50 + bounceY);

            this.ctx.beginPath();
            this.ctx.moveTo(this.prop.x - 5, this.prop.y - 40 + bounceY);
            this.ctx.lineTo(this.prop.x + 5, this.prop.y - 40 + bounceY);
            this.ctx.lineTo(this.prop.x, this.prop.y - 35 + bounceY);
            this.ctx.fill();
        }
    }

    loop(time) {
        this.update(time);
        this.draw();
        requestAnimationFrame(this.loop);
    }
}
