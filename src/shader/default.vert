#version 300 es

in vec4 position;
in vec3 normal;
in vec2 texcoord;

uniform mat4 M;
uniform mat4 N;
uniform mat4 V;
uniform mat4 P;
uniform vec3 light_pos;
uniform vec3 cam_pos;

uniform mat4 depthBiasMVP;

out vec4 v_position;
out vec3 v_normal;
out vec2 v_texcoord;
out vec4 v_shadowcoord;

out vec3 v_lightToEye_cam_dir;
out vec3 v_eye_cam_dir;

out vec3 v_worldPos;
out vec3 v_worldCamPos;

out float v_light_dist;
out mat4 v_V;
out mat4 v_M;

void main()
{
	mat4 MV = V * M;
	//mat4 N = transpose(inverse(MV));
	gl_Position = P * MV * (position);

	v_position = MV * position;
	v_normal = (N * vec4(normal, 0.0)).xyz;
	v_texcoord = texcoord;
	v_shadowcoord = depthBiasMVP * position;

	v_eye_cam_dir = vec3(0,0,0) - vec3(v_position);
	
	vec3 light_cam_pos = (V * vec4(light_pos, 1.0)).xyz;
	v_lightToEye_cam_dir =  light_cam_pos + v_eye_cam_dir;

	v_worldPos = (M * position).xyz;
	v_worldCamPos = (M * vec4(cam_pos, 1.0)).xyz;
	v_light_dist = distance(light_pos, v_worldPos);

	v_V = V;
	v_M = M;
}