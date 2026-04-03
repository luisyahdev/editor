const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const paths = {
    // Definimos los archivos de origen en orden de dependencia
    srcScripts: [
        './src/js/cloudConfig.js', // Primero la configuración (Manager)
        './src/js/app.js'          // Luego la lógica de negocio que usa el Manager
    ],
    distJs: './dist/js/app.min.js',
    srcHtml: './src/index.html',
    distHtml: './dist/index.html'
};

if (!fs.existsSync('./dist/js')) {
    fs.mkdirSync('./dist/js', { recursive: true });
}

console.log('🚀 Iniciando Build unificado para Planetario...');

// --- 2. CONCATENACIÓN Y OFUSCACIÓN ---
try {
    console.log('📚 Combinando archivos de script...');

    // Leemos ambos archivos y los unimos en una sola cadena de texto
    const combinedCode = paths.srcScripts
        .map(filePath => {
            console.log(`   + Cargando: ${filePath}`);
            return fs.readFileSync(filePath, 'utf8');
        })
        .join('\n\n'); // Espacio de seguridad entre archivos

    const obfuscationOptions = {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        numbersToExpressions: true,
        simplify: true,
        stringArray: true,
        stringArrayThreshold: 0.75,
        splitStrings: true,
        identifierNamesGenerator: 'hexadecimal'
    };

    console.log('📦 Ofuscando paquete completo (Cloud + App)...');
    const result = JavaScriptObfuscator.obfuscate(combinedCode, obfuscationOptions);

    fs.writeFileSync(paths.distJs, result.getObfuscatedCode());
    console.log('✅ JS unificado y ofuscado en app.min.js');

} catch (err) {
    console.error('❌ Error en el proceso de JS:', err);
}

// --- 3. PROCESAMIENTO DE HTML ---
try {
    let htmlContent = fs.readFileSync(paths.srcHtml, 'utf8');
    console.log('🔗 Limpiando referencias en el HTML...');

    // Eliminamos la etiqueta de cloudConfig.js (si existe) y actualizamos app.js a app.min.js
    // Esta Regex es más agresiva para limpiar las dos etiquetas y dejar solo la minificada
    const cloudScriptRegex = /<script.*src=["'].*cloudConfig\.js["'].*><\/script>/g;
    const appScriptRegex = /src=["']\.\/js\/app\.js["']|src=["']js\/app\.js["']/g;

    htmlContent = htmlContent.replace(cloudScriptRegex, ''); // Quitamos la carga de cloudConfig
    htmlContent = htmlContent.replace(appScriptRegex, 'src="./js/app.min.js"');

    fs.writeFileSync(paths.distHtml, htmlContent);
    console.log('✅ /dist/index.html actualizado con script único.');

} catch (err) {
    console.error('❌ Error procesando el HTML:', err);
}

console.log('✨ Build finalizado con éxito.');

// const JavaScriptObfuscator = require('javascript-obfuscator');
// const fs = require('fs');
// const path = require('path');

// // 1. Configuración de Rutas
// const paths = {
//     srcJs: './src/js/app.js',
//     distJs: './dist/js/app.min.js',
//     srcHtml: './src/index.html',
//     distHtml: './dist/index.html'
// };

// // Asegurar que la carpeta de destino existe
// if (!fs.existsSync('./dist/js')) {
//     fs.mkdirSync('./dist/js', { recursive: true });
// }

// console.log('🚀 Iniciando proceso de Build para Planetario...');

// // --- 2. OFUSCACIÓN DE JAVASCRIPT ---
// try {
//     const sourceCode = fs.readFileSync(paths.srcJs, 'utf8');

//     const obfuscationOptions = {
//         compact: true,
//         controlFlowFlattening: true, // Dificulta seguir la lógica de los if/loops
//         controlFlowFlatteningThreshold: 0.75,
//         numbersToExpressions: true,
//         simplify: true,
//         stringArray: true,
//         stringArrayThreshold: 0.75,
//         splitStrings: true,
//         identifierNamesGenerator: 'hexadecimal' // Cambia nombres de variables a _0xabc123
//     };

//     console.log('📦 Ofuscando lógica de negocio...');
//     const result = JavaScriptObfuscator.obfuscate(sourceCode, obfuscationOptions);
//     fs.writeFileSync(paths.distJs, result.getObfuscatedCode());
//     console.log('✅ JS ofuscado con éxito.');

// } catch (err) {
//     console.error('❌ Error en JS:', err);
// }

// // --- 3. PROCESAMIENTO DE HTML ---
// try {
//     let htmlContent = fs.readFileSync(paths.srcHtml, 'utf8');

//     console.log('🔗 Actualizando referencias en el HTML...');

//     // Usamos una Regex para encontrar la etiqueta script que apunte a app.js
//     // Esto busca src="./js/app.js" o src="js/app.js" y lo cambia por app.min.js
//     const scriptRegex = /src=["']\.\/js\/app\.js["']|src=["']js\/app\.js["']/g;

//     if (scriptRegex.test(htmlContent)) {
//         htmlContent = htmlContent.replace(scriptRegex, 'src="./js/app.min.js"');
//         console.log('✅ Referencia de JS actualizada a app.min.js');
//     } else {
//         console.warn('⚠️ No se encontró la etiqueta <script src="./js/app.js"> en el HTML original.');
//     }

//     fs.writeFileSync(paths.distHtml, htmlContent);
//     console.log('✅ Archivo /dist/index.html generado correctamente.');

// } catch (err) {
//     console.error('❌ Error procesando el HTML:', err);
// }

// console.log('✨ Build finalizado. La carpeta /dist está lista para el hosting.');