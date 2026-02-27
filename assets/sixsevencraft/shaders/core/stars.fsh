#version 330

#moj_import <include/dynamictransforms.glsl>

out vec4 fragColor;

void main() {
    fragColor = ColorModulator;
}
