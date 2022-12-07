const vertexShaderSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying vec2 vUv;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vUv = aVertexPosition.xy;
    }
`;

const fragmentShaderSource = `
    precision mediump float;

    varying vec2 vUv;

    void main() {
        gl_FragColor = vec4(vUv.x, vUv.y, 1, 1);
    }
`;

let canvas = document.querySelector("canvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

new WebGLCanvas(canvas, vertexShaderSource, fragmentShaderSource);
