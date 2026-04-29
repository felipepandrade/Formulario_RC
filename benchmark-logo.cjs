const { performance } = require('perf_hooks');

function renderWithInnerConstants() {
  const githubUrl = "https://raw.githubusercontent.com/felipepandrade/Formulario_RC/main/Logo-Principal-Azul-Fundo-Transparente.png";
  const wikimediaUrl = "https://upload.wikimedia.org/wikipedia/commons/9/9b/Engie_logo.svg";
  return githubUrl + wikimediaUrl; // Simulate use
}

const GITHUB_LOGO_URL = "https://raw.githubusercontent.com/felipepandrade/Formulario_RC/main/Logo-Principal-Azul-Fundo-Transparente.png";
const WIKIMEDIA_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/9/9b/Engie_logo.svg";

function renderWithOuterConstants() {
  return GITHUB_LOGO_URL + WIKIMEDIA_LOGO_URL; // Simulate use
}

const ITERATIONS = 10000000;

let start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  renderWithInnerConstants();
}
let end = performance.now();
console.log(`Inner constants: ${end - start} ms`);

start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  renderWithOuterConstants();
}
end = performance.now();
console.log(`Outer constants: ${end - start} ms`);
