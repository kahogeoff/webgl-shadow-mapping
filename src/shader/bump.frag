#version 300 es

precision mediump float;

in vec4 v_position;
in vec3 v_normal;
in vec2 v_texcoord;
//out vec3 tangent;
//out vec3 bitangent;
in vec4 v_shadowcoord;

in vec3 v_light_cam_dir;
in vec3 v_eye_cam_dir;

//out vec3 light_tan_dir;
//out vec3 eye_tan_dir;

in float v_light_dist;

uniform sampler2D texture_0;
uniform sampler2D depth_texture;
//uniform sampler2D normal_map;

uniform bool bump_mode;

uniform vec4 light_color;
uniform float light_power;

uniform vec4 diffuse_color;
uniform vec4 ambient_color;
uniform vec4 specular_color;
uniform float shininess;

out vec4 outColor;

void main()
{
	vec3 n = normalize(v_normal);
	//vec3 tan_n = normalize(texture2D(normal_map, texcoord).rgb*2.0 - 1.0);
	
	vec3 l = normalize(v_light_cam_dir);
	//vec3 tan_l = normalize(light_tan_dir);

	float lambertian = max(dot(l,n), 0.0);
	//float tan_lambertian = max(dot(tan_l, tan_n), 0.0);

	float specular = 0.0;
	//float tan_specular = 0.0;

	if(lambertian > 0.0 ) {
		vec3 r = reflect(-l, n);
		vec3 v = normalize(v_eye_cam_dir);

		float specular_angle = max(dot(r, v), 0.0);

		specular = pow(specular_angle, shininess);
	}
	/*
	if(tan_lambertian > 0.0 ) {
		vec3 tan_r = reflect(-tan_l, tan_n);
		vec3 tan_v = normalize(eye_tan_dir);

		float tan_specular_angle = max(dot(tan_r, tan_v), 0.0);

		tan_specular = pow(tan_specular_angle, shininess);
	}
	*/

	vec4 texColor = texture(texture_0, v_texcoord);

	/*
	if(!bump_mode)
	{
		outColor = 
			ambient_color * diffuse_color *  texColor
			+ diffuse_color * texColor * lambertian / (light_dist * light_dist)
			+ specular_color * specular / (light_dist * light_dist);
	
	}else{
		outColor = 
			ambient_color * diffuse_color *  texColor
			+ diffuse_color * texColor * tan_lambertian / (light_dist * light_dist)
			+ specular_color * tan_specular / (light_dist * light_dist);
	}
	*/
	//outColor.xyz = light_tan_dir;
	
	float visibility = texture( depth_texture, v_shadowcoord.xy ).r;
	/*
	if ( texture( depth_texture, v_shadowcoord.xy ).r - v_shadowcoord.z <= 0.2){
		visibility = 0.5;
	}
	*/
	

	outColor =
		ambient_color * diffuse_color *  texColor +
		light_color * light_power * visibility * (
			+ diffuse_color * texColor * lambertian
			+ specular_color * specular
		) / (v_light_dist * v_light_dist);
}