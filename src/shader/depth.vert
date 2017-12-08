#version 300 es

in vec4 position;

// Values that stay constant for the whole mesh.
uniform mat4 depthMVP;
//uniform mat4 depthM;
//uniform vec3 lightPos;

//out float distanceToLight;

void main(){
	gl_Position =  depthMVP * position;

	//vec4 world_position = depthM * position;
	//distanceToLight = distance(world_position.xyz, lightPos);
}