#version 300 es
#define MAX_POINT_LIGHTS 128

precision mediump float;

in vec4 v_position;
in vec3 v_normal;
in vec2 v_texcoord;
//out vec3 tangent;
//out vec3 bitangent;
in vec4 v_shadowcoord;

in vec3 v_lightToEye_cam_dir;
in vec3 v_eye_cam_dir;
in vec3 v_worldPos;

//out vec3 light_tan_dir;
//out vec3 eye_tan_dir;

in float v_light_dist;
in vec3 v_lightToVertex_dir;

uniform sampler2D texture_0;
uniform sampler2D depth_texture;
//uniform samplerCube depth_cube_texture;
//uniform sampler2D normal_map;

uniform bool bump_mode;

uniform vec3 cam_pos;
uniform vec4 light_color;
uniform float light_power;
uniform int num_pointLight;

uniform struct DirectionalLight {
	mediump vec4 color;
	mediump vec3 dir;
	mediump float power;
} directionalLight;

uniform struct PointLight {
	mediump vec4 color;
	mediump vec3 position;
	mediump float power;
    mediump float constant;
    mediump float linear;
    mediump float expFactor;
} pointLight[MAX_POINT_LIGHTS];

uniform vec4 diffuse_color;
uniform vec4 ambient_color;
uniform vec4 specular_color;
uniform float shininess;

out vec4 outColor;

const vec2 poissonDisk[4] = vec2[](
   	vec2( -0.94201624, -0.39906216 ), 
   	vec2( 0.94558609, -0.76890725 ), 
   	vec2( -0.094184101, -0.92938870 ), 
   	vec2( 0.34495938, 0.29387760 )
);

vec4 CalcLightInternal(vec4 color, float power, vec3 direction, vec3 normal){
	vec4 ambient = ambient_color;
	float lambertian = max(dot(direction,normal), 0.0);

	vec4 diffuse = vec4(0, 0, 0, 0);
    vec4 specular = vec4(0, 0, 0, 0);

	if(lambertian > 0.0 ) {
		diffuse = power * diffuse_color * lambertian;
		vec3 r = reflect(-direction, normal);
		vec3 v = normalize(v_eye_cam_dir);
		float specular_angle = max(dot(r, v), 0.0);
		
		if (specular_angle>0.0){
			specular = specular_color * specular *  pow(specular_angle, shininess);
		}
	}

	return (ambient + diffuse + specular);
}

vec4 CalcLDirectionalInternal(vec3 normal){
	return CalcLightInternal(directionalLight.color, directionalLight.power, directionalLight.dir, normal);
}


vec4 CalcPointLight(int index, vec3 normal)
{
    vec3 l_dir = v_worldPos - pointLight[index].position;
    float l_distance = length(l_dir);
    l_dir = normalize(l_dir);

    vec4 color = CalcLightInternal(pointLight[index].color, pointLight[index].power, l_dir, normal);
    float attenuation = pointLight[index].constant +
                        pointLight[index].linear * l_distance +
                        pointLight[index].expFactor * l_distance * l_distance;

    return color / attenuation;
} 
/*
float random(vec3 co, int index){
	vec4 seed4 = vec4(co,index);
	float dot_product = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
	return fract(sin(dot_product) * 43758.5453);
}
*/

//vec4 CalcLightInternal (vec4 l_color, vec)

void main()
{
	vec3 n = normalize(v_normal);
	//vec3 tan_n = normalize(texture2D(normal_map, texcoord).rgb*2.0 - 1.0);
	
	vec3 l = normalize(v_lightToEye_cam_dir);
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
	
	//float visibility = texture( depth_texture, v_shadowcoord.xy ).r;
	float bias = 0.005 * tan(acos(lambertian));
	bias = clamp(bias, 0.0, 0.01);

	float visibility = 1.0;
	for (int i=0;i<4;i++){
		//int index = int(16.0 * random(gl_FragCoord.xyy, i)) % 16;
		if ( texture( depth_texture, (v_shadowcoord.xy + poissonDisk[i]/700.0)/v_shadowcoord.w ).r < (v_shadowcoord.z-bias)/v_shadowcoord.w ){
			visibility-=0.2;
		}
	}
	//visibility = clamp(visibility, 0.0, 1.0);
	//float shadow_place = texture( depth_texture, v_shadowcoord.xy ).r - v_shadowcoord.z;

	outColor =
		ambient_color * diffuse_color *  texColor +
		light_color * light_power * visibility * (
			+ diffuse_color * texColor * lambertian
			+ specular_color * specular
		) / (v_light_dist * v_light_dist);
}