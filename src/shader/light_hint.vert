#version 300 es

in vec4 position;

uniform mat4 uniform_MVP;
//uniform vec4 uniform_position;

void main(){
    gl_Position = uniform_MVP * position ;
}