const cuteDogConfig = {
    assets: {
        character: {
            D01: 'frames/1. dog_idle_01.svg',
            D02: 'frames/2. dog_idle_02.svg',
            D03: 'frames/3. dog_idle_03.svg',
            D04: 'frames/4. dog_hop_01.svg',
            D05: 'frames/5. dog_hop_02.svg',
            D06: 'frames/6. dog_run_01.svg',
            D07: 'frames/7. dog_run_02.svg',
            D08: 'frames/8. dog_run_03.svg',
            D09: 'frames/9. dog_run_04.svg',
            D10: 'frames/10. dog_fetch_01-withball.svg',
            D11: 'frames/11. dog_fetch_02-withball.svg',
            D12: 'frames/12. dog_fetch_03-withball.svg',
            D13: 'frames/13. dog_fetch_04-with-ball.svg',
            D10_NB: 'frames/10. dog_fetch_01.svg',
            D11_NB: 'frames/11. dog_fetch_02.svg',
            D12_NB: 'frames/12. dog_fetch_03.svg',
            D13_NB: 'frames/13. dog_fetch_04.svg',
            D14: 'frames/14. dog_jump_01.svg',
            D15: 'frames/15. dog_jump_02.svg',
            D16: 'frames/16. dog_sit_01.svg',
            D16_5: 'frames/16.5. dog_sit_01.5.svg',
            D17: 'frames/17. dog_sit_02.svg',
            D22: 'frames/22. put_back_with_ball.svg',
            D23: 'frames/23. put_back_no_ball.svg'
        },
        prop: {
            B01: 'frames/18. ball_01.svg',
            B02: 'frames/19. ball_02.svg',
            B03: 'frames/20. ball_03.svg',
            B04: 'frames/21. ball_04.svg'
        }
    },
    animations: {
        character: {
            idle: ['D01', 'D02', 'D03'],
            run: ['D06', 'D07', 'D08', 'D09'],
            fetch: ['D10', 'D11', 'D12', 'D13'],
            fetchNoBall: ['D10_NB', 'D11_NB', 'D12_NB', 'D13_NB'],
            hop: ['D04', 'D05'],
            jump: ['D14', 'D15', 'D16', 'D16_5', 'D17'],
            putBack: ['D22', 'D23']
        },
        prop: {
            idle: 'B01',
            bounce: 'B02',
            fast: 'B03',
            jumpBall: 'B04'
        }
    },
    character: {
        initialState: {
            frame: 'D01',
            frameIndex: 0,
            lastFrameTime: 0,
            facingRight: true,
            scale: 0.4
        }
    },
    prop: {
        initialState: {
            frame: 'B01',
            scale: 0.2
        },
        initialOffsetX: 160,
        initialOffsetY: 20
    },
    physics: {
        rollLerp: 0.1,
        idleInterval: 500,
        autoBounceInterval: 15000,
        bounceHeight: 120
    },
    ui: {
        indicatorText: "Click and move me"
    }
};

new InteractiveAnimation('game-canvas', cuteDogConfig);
