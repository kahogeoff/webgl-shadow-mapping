#version 300 es

in vec4 position;
in vec3 normal;
in vec2 texcoord;

uniform mat4 u_world; // MV matrix
uniform mat4 u_viewInverse; // V^-1 matrix
uniform mat4 u_worldInverseTranspose; // N matrix
uniform mat4 u_worldViewProjection; // MVP matrix

uniform vec3 u_lightWorldPos;

out vec4 v_worldPosition;
out vec4 v_position;
out vec3 v_normal;

out vec3 v_camDir;
out vec3 v_lightDir;

out vec2 v_texCoord;

out float v_distance;

void main() {
    gl_Position = u_worldViewProjection * position;

    v_worldPosition = u_world * position;

    vec3 positionInView = (inverse(u_viewInverse) * u_world * position).xyz;
    v_camDir = -positionInView;
    
    vec3 lightPositionInView = (inverse(u_viewInverse) * vec4(u_lightWorldPos, 1.0)).xyz;
    v_lightDir = lightPositionInView + v_camDir;
    
    v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;

    v_texCoord = texcoord;
    
    v_distance = distance(u_lightWorldPos, v_worldPosition.xyz);
}