export class BasicScene {
    constructor() {
        this.object_list = []
        this.camera = undefined
        this.directional_light = undefined
        this.point_lights = []
        this.spot_lights = []
        this.state_stack = []

        this.previous_time = 0
        this.delta_time = 0
    }

    enterNewState(new_state) {
        if(this.current_state != undefined)
        {
            this.current_state.exit()
        }
        this.state_stack.push(new_state)
        this.init()
    }

    exitCurrentState() {
        this.current_state.exit()
        this.state_stack.pop()
        if(this.current_state != undefined){
            this.init()
        }
    }

    init() {
        this.current_state.init()
        this.start()
    }

    start() {
        this.current_state.start()
    }

    update(time) {

        time *= 0.001
        this.delta_time = time - this.previous_time
        this.previous_time = time

        this.current_state.update(this.delta_time)
    }

    get current_state(){
        return this.state_stack[this.state_stack.length - 1]
    }

    get deltaTime() {
        return this.deltaTime
    }
}