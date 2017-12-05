#version 300 es

uniform mat4 u_worldViewProjection; // MVP matrix
uniform vec3 u_lightWorldPos;
uniform mat4 u_world; // MV matrix
uniform mat4 u_viewInverse; // V^-1 Matrix
uniform mat4 u_worldInverseTranspose; // N Matrix

uniform mat4 u_depth_worldViewProjection;

in vec4 position;
in vec3 normal;
in vec2 texcoord;

out vec4 v_position;
out vec2 v_texCoord;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;
out float v_distanceToLight;

void main() {
  v_texCoord = texcoord;
  v_position = u_depth_worldViewProjection * position;
  v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * position)).xyz;
  v_distanceToLight = distance((u_world * position).xyz, u_lightWorldPos);
  gl_Position = v_position;
}