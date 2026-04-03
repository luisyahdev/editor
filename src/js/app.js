let menuTimeout;
const menuWrapper = document.getElementById('save-menu-wrapper');
const saveDropdown = document.getElementById('saveDropdown');
const dropZone = document.getElementById('editor-space');

// 1. Evitar comportamiento por defecto (prevenir que el navegador abra el archivo)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

// 2. Efectos visuales al arrastrar (Tailwind)
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('border-brand-green', 'bg-brand-green/10');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('border-brand-green', 'bg-brand-green/10');
    });
});

// 3. Manejar la caída del archivo
dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;

    if (files.length > 0) {
        Array.from(files).forEach(file => {
            const fileName = file.name;
            handleFiles(file, fileName); // Procesamos el primer archivo
        })
    }
});

function handleFiles(file, fileName) {
    const reader = new FileReader();

    reader.onload = (e) => {
        const content = e.target.result;

        if (!content) return;
        createTab(fileName, content, true);
    };

    reader.readAsText(file);
}


// 1. Cuando el mouse ENTRA al área del menú o del botón
menuWrapper.addEventListener('mouseenter', () => {
    // Si había un cierre programado, lo cancelamos porque el usuario regresó
    clearTimeout(menuTimeout);
});

// 2. Cuando el mouse SALE del área completa
menuWrapper.addEventListener('mouseleave', () => {
    // No cerramos inmediatamente, damos 300ms de gracia
    menuTimeout = setTimeout(() => {
        closeSaveMenu();
    }, 300);
});

function toggleSaveMenu(event) {
    // Evitamos que el clic se propague al window
    event.stopPropagation();
    // const menu = document.getElementById('saveDropdown');

    // 1. Antes de mostrar, validamos el estado de los botones
    // if (menu.classList.contains('hidden')) {
    //     updateSaveButtonsState(); // Solo actualizamos si el menú se va a ABRIR
    // }

    // Alternamos la clase hidden
    // menu.classList.toggle('hidden');

    if (saveDropdown.classList.contains('hidden')) {
        updateSaveButtonsState();
        saveDropdown.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    } else {
        closeSaveMenu();
    }

    // Si usas Lucide, refrescamos los iconos al mostrar el menú
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Cerrar el menú si se hace clic fuera de él
window.addEventListener('click', function (e) {
    const menu = document.getElementById('saveDropdown');
    const button = e.target.closest('button');

    // Si el clic no fue en el menú ni en el botón de abrir, lo ocultamos
    if (menu && !menu.contains(e.target) && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
    }
});
require.config({
    paths: { vs: 'https://unpkg.com/monaco-editor/min/vs' }
});

function updateSaveButtonsState() {
    const btnSave = document.getElementById('menu-save-cloud');
    const btnSaveAs = document.getElementById('menu-save-as-cloud');

    // 1. La regla de negocio: ¿Hay algún archivo cargado en el editor?
    const hasActiveFile = !!(currentModelName && models[currentModelName]);

    // 2. Regla de negocio: ¿Hay configuración de nube?
    const isCloudReady = CloudManager.config.url && CloudManager.config.key;

    const buttons = [btnSave, btnSaveAs];

    buttons.forEach(btn => {
        if (!btn) return;

        // Deshabilitamos si no hay archivo O si no hay configuración de nube
        if (!hasActiveFile || !isCloudReady) {
            // Aplicamos estado Deshabilitado (Visual y Funcional)
            btn.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
            // Removemos estilos de hover para que no brille al pasar el mouse
            btn.classList.remove('hover:bg-gray-100', 'dark:hover:bg-white/5');
            btn.title = !isCloudReady ? "Cloud not configured" : "No active file";
        } else {
            // Restauramos estado Activo
            btn.classList.remove('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
            btn.classList.add('hover:bg-gray-100', 'dark:hover:bg-white/5');
            btn.title = "Save";
        }
    });
}

function closeSaveMenu() {
    // const menu = document.getElementById('saveDropdown');
    // if (menu && !menu.classList.contains('hidden')) {
    //     menu.classList.add('hidden');
    //     // Importante: Limpiamos el listener del window para liberar memoria
    //     window.removeEventListener('click', closeMenuOutside);
    // }
    saveDropdown.classList.add('hidden');
    clearTimeout(menuTimeout); // Limpiamos por seguridad
}

async function downloadCurrentFile() {
    // 1. Verificación de seguridad
    if (!currentModelName || !models[currentModelName]) {
        showToast("No active file to download.", "error");
        return;
    }

    // 2. Obtener el contenido actualizado del editor de Monaco
    const content = models[currentModelName].instance.getValue();
    const fileName = currentModelName;

    try {
        // 1. Esto abre el cuadro de diálogo del Sistema Operativo y "ESPERA"
        const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
                description: 'Source File',
                accept: { 'text/plain': ['.src'] },
            }],
        });

        // 2. El código llega aquí SOLO cuando el usuario hace clic en "Guardar"
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();

        // 3. ÉXITO: Ahora sí el Toast es honesto
        showToast(`File "${fileName}" saved successfully to your computer.`);

        // Opcional: Cerrar el menú si se llamó desde el dropdown
        // closeSaveMenu();

    } catch (err) {
        // Si el usuario da a "Cancelar", entra aquí y NO mostramos el Toast
        if (err.name !== 'AbortError') {
            console.error(err);
            showToast("Failed to save file.", "error");
        }
    }
}

// function increaseFont() {
//     const current = editor.getOption(monaco.editor.EditorOption.fontSize);

//     editor.updateOptions({
//         fontSize: current + 1
//     });
// }

// function decreaseFont() {
//     const current = editor.getOption(monaco.editor.EditorOption.fontSize);

//     if (current <= 10) return;

//     editor.updateOptions({
//         fontSize: current - 1
//     });
// }

function changeFont(delta) {
    if (Object.keys(models).length <= 0) return;

    let current = editor.getOption(monaco.editor.EditorOption.fontSize);

    const MIN = 10;
    const MAX = 30;

    let next = Math.min(MAX, Math.max(MIN, current + delta));

    editor.updateOptions({ fontSize: next });
    // updateLabel(next);
}

/**
 * Muestra un modal de confirmación reutilizable
 * @param {Object} options - Configuración del modal
 */
function showDialog({ title, message, confirmText, type = 'danger', onConfirm }) {
    // 1. Eliminar cualquier diálogo previo para no duplicar IDs
    const oldDialog = document.getElementById('global-dialog-container');
    if (oldDialog) oldDialog.remove();

    // 2. Definir colores según el tipo (danger o info)
    const isDanger = type === 'danger';
    const iconBg = isDanger ? 'bg-red-500/10' : 'bg-blue-500/10';
    const iconColor = isDanger ? 'text-red-400' : 'text-blue-400';
    const btnBg = isDanger ? 'bg-red-500 hover:bg-red-400' : 'bg-brand-green hover:bg-brand-green/80';

    const modalHTML = `
    <div id="global-dialog-container">
        <el-dialog>
            <dialog id="dynamic-dialog" aria-labelledby="dialog-title"
                class="fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto bg-transparent backdrop:bg-transparent">
                <el-dialog-backdrop class="fixed inset-0 bg-black/50 transition-opacity data-closed:opacity-0"></el-dialog-backdrop>

                <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <el-dialog-panel class="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline outline-white/10 transition-all sm:my-8 sm:w-full sm:max-w-lg">
                        <div class="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div class="sm:flex sm:items-start">
                                <div class="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full ${iconBg} sm:mx-0 sm:size-10">
                                    <i data-lucide="${isDanger ? 'alert-triangle' : 'info'}" class="${iconColor}"></i>
                                </div>
                                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 id="dialog-title" class="text-base font-semibold text-white">${title}</h3>
                                    <div class="mt-2">
                                        <p class="text-sm text-gray-400">${message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                            <button type="button" id="dialog-confirm-btn"
                                class="inline-flex w-full justify-center rounded-md ${btnBg} px-3 py-2 text-sm font-semibold text-white sm:ml-3 sm:w-auto transition-colors">
                                ${confirmText}
                            </button>
                            <button type="button" id="dialog-cancel-btn"
                                class="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 sm:mt-0 sm:w-auto">
                                Cancel
                            </button>
                        </div>
                    </el-dialog-panel>
                </div>
            </dialog>
        </el-dialog>
    </div>`;

    // 3. Insertar en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    lucide.createIcons(); // Renderizar el icono dinámico

    const dialogEl = document.getElementById('dynamic-dialog');

    // 4. Mostrar usando la API nativa de <dialog>
    dialogEl.showModal();

    // 5. Manejar clics
    document.getElementById('dialog-confirm-btn').onclick = () => {
        if (onConfirm) onConfirm();
        dialogEl.close();
    };

    document.getElementById('dialog-cancel-btn').onclick = () => {
        dialogEl.close();
    };
}

var editor;
let tabCounter = 0;
let models = {};
let tabs = [];
let currentRefWidget = null;
let previewEditor = null;
let currentFileSymbols = [];
let currentModel = "";
let currentModelName = "";
const viewStates = new Map();

$Codes = [{
    code: "ABANDON",
    description: "In case of abort"
}, {
    code: "AB_CREATION",
    description: "When aborting a creation because of an error (after Rollback)"
}, {
    code: "AB_MODIF",
    description: "When aborting a modification because of an error (after Rollback)"
}, {
    code: "AFFMASK",
    description: "Upon first display of the screen"
}, {
    code: "ANNULE",
    description: "During record cancellation"
}, {
    code: "ANU_PIC",
    description: "After an element has been unselected in the picking list"
}, {
    code: "APRES_CHOI",
    description: "After choosing a button, menu or left list, etc."
}, {
    code: "APRES_CRE",
    description: "At the end of creation (transaction over)"
}, {
    code: "APRES_MOD",
    description: "At the end of creation (transaction over)"
}, {
    code: "APRES_MODIF",
    description: "After any field has been modified"
}, {
    code: "AP_ANNULE",
    description: "After record cancellation"
}, {
    code: "AP_CHANGE",
    description: "After the code change transaction"
}, {
    code: "AP_CHOIX",
    description: "As early as clicking on a button or menu"
}, {
    code: "AP_FILGAUCHE",
    description: "During the display of the list or picking"
}, {
    code: "AP_IMPRIME",
    description: "After printing the Crystal Reports document"
}, {
    code: "AP_LISTE",
    description: "After printing the Crystal Reports list"
}, {
    code: "AP_VERF_ANU",
    description: "Before cancelling a record (after controlling the dictionary links)"
}, {
    code: "AVANTBOUT",
    description: "Before executing a button or menu declared in the window"
}, {
    code: "AVANT_ACT",
    description: "Before the execution of a predefined button"
}, {
    code: "AVANT_BOUTON",
    description: "Before the execution of a button"
}, {
    code: "AVANT_CHOI",
    description: "After choosing a button, menu or left list, etc."
}, {
    code: "AVANT_DEVERROU",
    description: "Before unlocking a record (modification completed)"
}, {
    code: "AVANT_MEN",
    description: "Before the execution of a menu"
}, {
    code: "AVANT_MOD",
    description: "When switching to modification (after modification of a field)"
}, {
    code: "AVANT_MODFIC",
    description: "During modification of a record (transaction start)"
}, {
    code: "AVANT_OUVRE",
    description: "First action executed"
}, {
    code: "AVANT_SUITE",
    description: "Before the execution of an action declared following a first action (on button or menu) in the action dictionary."
}, {
    code: "AVANT_VERROU",
    description: "Before locking a record"
}, {
    code: "AVANT_XXX",
    description: "Before the execution of a predefined button XXX"
}, {
    code: "AV_ANNULE",
    description: "At the beginning of the cancellation transaction"
}, {
    code: "AV_CHOIX",
    description: "Before entering the window"
}, {
    code: "AV_IMPRIME",
    description: "Before printing the Crystal Reports document"
}, {
    code: "AV_LISTE",
    description: "Before printing the Crystal Reports list"
}, {
    code: "AV_VERF_ANU",
    description: "Before cancelling a record (before controlling the dictionary links)"
}, {
    code: "BOITE",
    description: "Before opening the window with its tabs and left lists"
}, {
    code: "BOUTON",
    description: "After the execution of a button"
}, {
    code: "CHANGE",
    description: "During the code change transaction"
}, {
    code: "CLE_GAUCHE",
    description: "To modify the sort key of a simple list or simple picking"
}, {
    code: "CREATION",
    description: "During the creation transaction"
}, {
    code: "CRE_PIC",
    description: "After an element has been selected in the picking list"
}, {
    code: "DEBUT",
    description: "After displaying the entry window"
}, {
    code: "DEBUT_CRE",
    description: "A the beginning of the creation transaction (combined OBJect)"
}, {
    code: "DEBUT_MOD",
    description: "A the beginning of the modification transaction (combined OBJect)"
}, {
    code: "DEB_PIC",
    description: "As early as an element is selected in the picking list"
}, {
    code: "DEB_PICK",
    description: "As early as an element is selected in the picking list"
}, {
    code: "DEFTRANS",
    description: "Start of the OBJect window analysis"
}, {
    code: "DEGRISE",
    description: "After ungraying the keys (after creation/modification)"
}, {
    code: "DEPICK",
    description: "After an element has been unselected in the picking list"
}, {
    code: "DEVERROU",
    description: "When a record has been unlocked (modification completed)"
}, {
    code: "DROIT",
    description: "Before loading the masks by the main table"
}, {
    code: "EFFMASK",
    description: "When erasing masks (creation abort, etc.)"
}, {
    code: "ENV",
    description: "For an environment change (for GEODE & LOAN)"
}, {
    code: "EXEACT",
    description: "After executing a predefined button, before the associated supervisor processing."
}, {
    code: "EXEBOUT",
    description: "After the execution of a button declared as a window"
}, {
    code: "End",
    description: 'Further to the "END" button, before the record is unlocked'
}, {
    code: "FERME",
    description: "Last executed action"
}, {
    code: "FILGAUCHE",
    description: "To filter the records of a list or picking"
}, {
    code: "FILTRE",
    description: "Definition of the criteria to be used as filter on the main table"
}, {
    code: "FINSAI",
    description: "At the very end of the template"
}, {
    code: "FIN_ACTION",
    description: "After executing a button, menu or left list, etc."
}, {
    code: "FIN_MOD",
    description: "At the end of modification (transaction over)"
}, {
    code: "FIN_PIC",
    description: "End of the selection process of an element in the picking list"
}, {
    code: "FIN_PICK",
    description: "End of the selection process of an element in the picking list"
}, {
    code: "GAUCHE",
    description: "In selection of an element from a simple or hierarchical left list"
}, {
    code: "GAUCHE9",
    description: "In selection of an element from the last read list"
}, {
    code: "GRISE",
    description: "When the key has just been grayed out (after switching to modification mode)"
}, {
    code: "HINT",
    description: "To specify a browsing key, for the list or picking"
}, {
    code: "ICONE",
    description: "As early as double click on an icon on the bottom right of the screen"
}, {
    code: "INICRE",
    description: "During the creation transaction, just before the write"
}, {
    code: "INIMOD",
    description: "During the modification transaction, just before the rewrite"
}, {
    code: "INT",
    description: "Before the display of a left list, except that of the last read, in order to specify a browsing key."
}, {
    code: "LIENS",
    description: "After reading a record"
}, {
    code: "LIENS0",
    description: "Before reading a group of records (grid and combined OBJect)"
}, {
    code: "LIENS2",
    description: "After reading a group of records (grid and combined OBJect)"
}, {
    code: "MEMO2",
    description: "Picking memo in the picking selection window (for GEODE)"
}, {
    code: "MEN",
    description: "After the execution of a menu"
}, {
    code: "MODIF",
    description: "During the modification transaction, just after the record rewrite"
}, {
    code: "OUVRE",
    description: "At the very beginning of the template"
}, {
    code: "OUVRE_BOITE",
    description: "Before displaying the entry window"
}, {
    code: "PICKE",
    description: "After an element has been selected in the picking list"
}, {
    code: "PRINT",
    description: "Before printing the Crystal Reports document (for GEODE)"
}, {
    code: "RAZCRE",
    description: "When a new record is about to be created"
}, {
    code: "RAZDUP",
    description: "When a new record is about to be copied"
}, {
    code: "REMP_DERLU",
    description: "Before displaying the last read list."
}, {
    code: "SETBOUT",
    description: "Before entering the window"
}, {
    code: "SETTRANS",
    description: "End of the OBJect window analysis"
}, {
    code: "STATUT",
    description: "After the execution of a menu declared as a window"
}, {
    code: "STYLE",
    description: "After reading and displaying a record"
}, {
    code: "SUI_GAUCHE",
    description: "Next page, when numbering the pages on the left list"
}, {
    code: "TIROIR",
    description: "Before any left list is displayed"
}, {
    code: "TITRE",
    description: "Before displaying the entry window"
}, {
    code: "VARIANTE",
    description: "Analysis of the OBJect windows (for each window)"
}, {
    code: "VERF_ANU",
    description: "Before the deletion transaction of a record"
}, {
    code: "VERF_CHG",
    description: "Before the code change transaction of a record"
}, {
    code: "VERIF_CRE",
    description: "Before the creation transaction of a record"
}, {
    code: "VERIF_MOD",
    description: "Before the modification transaction of a record"
}, {
    code: "VERROU",
    description: "When a record has been locked in modification or deletion mode"
}, {
    code: "SELGRAPH",
    description: "Test for a SELGRAPH"
}];

// EDITOR
require(['vs/editor/editor.main'], function () {
    monaco.languages.register({ id: 'l4g' });

    monaco.editor.defineTheme('l4gTheme', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '#008000' },
            { token: 'keyword', foreground: '#8A0C8B' },
            { token: 'string', foreground: '#0000FF' },
            { token: 'type.identifier', foreground: '4EC9B0' },
            { token: "number", foreground: "#000000" },
            { token: "number.float", foreground: "#000000" },
            { token: "operator", foreground: "#000000" },
            { token: "delimiter", foreground: "#000000" },
            { token: "delimiter.parenthesis", foreground: "#000000" },
            { token: "delimiter.square", foreground: "#000000" },
            { token: "delimiter.curly", foreground: "#000000" },
            { token: "white", foreground: "#000000" }
        ],
        colors: {
            "editor.foreground": "#000000",
            "editor.background": "#FFFFFF",
            "editor.findMatchHighlightBackground": "#ADD6FF80",
            "editorLink.activeForeground": "#0000EE",
            "editor.selectionHighlightBackground": "#ADD6FF80",
            "editorBracketHighlight.foreground1": "#0000EE", // nivel 1 → azul
            "editorBracketHighlight.foreground2": "#008000", // nivel 2 → verde
            "editorBracketHighlight.foreground3": "#000000", // nivel 3 → negro
        }
    });

    $0 = ["Infbox", "Function", "Procedure", "If", "Then", "Else", "Endif", "Elsif", "For", "While", "Do", "Endfor", "Endwhile", "Return", "Local", "Global", "Break", "Continue", "Gosub", "Call", "Funprog", "Subprog", "End", "Next", "When", "Case", "Default", "Switch", "Class", "New", "Null", "True", "False", "And", "Or", "Not", "Xor", "Is", "In", "Like", "Between", "Select", "From", "Where", "Group", "By", "Having", "Order", "Insert", "Update", "Delete", "Join", "Inner", "Outer", "Left", "Right", "Create", "Alter", "Drop", "Table", "View", "Index", "Sequence", "Grant", "Revoke", "Commit", "Rollback", "Transaction", "Exception", "Raise", "Handle", "Try", "Catch", "Finally", "Public", "Private", "Protected", "Static", "Final", "Abstract", "Import", "Include", "Module", "Package", "Library", "Print", "Input", "Output", "File", "Open", "Close", "Read", "Write", "Dim", "As", "Integer", "String", "Float", "Double", "Boolean", "Date", "Array", "List", "Map", "Set", "Queue", "Stack", "Tree", "Graph"];
    monaco.languages.setMonarchTokensProvider('l4g', {
        defaultToken: "identifier",
        ignoreCase: !0,
        tokenizer: {
            root: [
                [/#.*$/, "comment"],
                [/(\$)([a-zA-Z_]\w*)/, "identifier"],
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        "@keywords": "keyword",
                        "@default": "identifier"
                    }
                }],
                [/"(?:[^"\\]|\\.)*"/, "string"],
                [/'(?:[^'\\]|\\.)*'/, "string"],
                [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
                [/\d+/, "number"],
                [/[\(\)]/, "delimiter.parenthesis"],
                [/[\[\]]/, "delimiter.square"],
                [/[{}]/, "delimiter.curly"],
                [/[;,.]/, "delimiter"],
                [/[+\-*\/%=<>!&|]+/, "operator"],
                [/\s+/, "white"]
            ],
        },
        keywords: $0
    });

    monaco.languages.setLanguageConfiguration('l4g', {
        brackets: [
            ['(', ')'],
            ['[', ']'],
            ['{', '}']
        ],
        autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' }
        ]
    });

    window.editor = monaco.editor.create(
        document.getElementById('editor'),
        {
            language: 'l4g',
            automaticLayout: true,
            colorDecorators: false,
            gotoLocation: {
                multipleDefinitions: 'peek', // Si hay varias definiciones con el mismo nombre, abre el panel
                multipleReferences: 'peek',
            },

            bracketPairColorization: {
                enabled: true
            },

            guides: {
                bracketPairs: true
            }
        });

    window.editor.onDidChangeCursorPosition((e) => {
        setSymbols(e);
    });

    // window.editor.onMouseDown((e) => {
    //     if (e.event.leftButton && (e.event.ctrlKey || e.event.metaKey)) {
    //         const target = e.target;

    //         if (target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
    //             const model = window.editor.getModel();
    //             const lineContent = model.getLineContent(target.position.lineNumber);

    //             const regexFrom = /(Call|Gosub|Func)\s+([\w$]+)(\(.*\))?\s+From\s+([\w-]+)/i;
    //             const match = lineContent.match(regexFrom);

    //             if (match) {
    //                 // 1. IMPORTANTE: Detenemos a Monaco ANTES de que intente procesar el click
    //                 e.event.preventDefault();
    //                 e.event.stopPropagation();

    //                 const symbol = match[2];
    //                 const targetFile = match[4];
    //                 const type = match[1].toUpperCase();

    //                 // 2. Usamos un delay un poco más largo (50ms) para asegurar 
    //                 // que el "ciclo de vida" del click de Monaco haya muerto.
    //                 setTimeout(() => {
    //                     handleCrossFileNavigation(symbol, targetFile, type);
    //                 }, 50);
    //             }
    //         }
    //     }
    // });

    window.editor.onMouseDown((e) => {
        if (e.event.leftButton && (e.event.ctrlKey || e.event.metaKey)) {
            const target = e.target;
            if (target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
                const model = window.editor.getModel();
                const lineContent = model.getLineContent(target.position.lineNumber);

                // Regex actualizado: 
                // Captura el grupo 4 (el nombre o la expresión después del From)
                // permitiendo caracteres como =, +, " y espacios.
                const regexFrom = /(Call|Gosub|Func)\s+([\w$]+)(\(.*\))?\s+From\s+([^ \n\r]+)/i;
                const match = lineContent.match(regexFrom);

                if (match) {
                    const symbol = match[2];
                    const fromExpression = match[4]; // Lo que sigue al From
                    const type = match[1].toUpperCase();

                    // DETECCIÓN DE LLAMADA DINÁMICA
                    // Si contiene =, +, o comillas, asumimos que es dinámico
                    if (fromExpression.includes('=') || fromExpression.includes('+') || fromExpression.includes('"')) {
                        showToast("Definitions are unavailable for dynamic calls", "warning");

                        // Detenemos a Monaco para que no intente hacer nada más
                        e.event.preventDefault();
                        e.event.stopPropagation();
                        return;
                    }

                    // Si no es dinámico, procedemos con la navegación normal
                    e.event.preventDefault();
                    e.event.stopPropagation();

                    setTimeout(() => {
                        handleCrossFileNavigation(symbol, fromExpression, type);
                    }, 50);
                }
            }
        }
    });

    // Registramos el comando UNA SOLA VEZ al iniciar tu app
    monaco.editor.registerCommand('l4g.showReferences', (accessor, uri, lineNumber, references) => {
        // En lugar de usar el accessor que está fallando, 
        // usamos la instancia 'editor' que ya tienes creada en tu script
        if (editor) {
            editor.trigger('codelens', 'editor.action.showReferences', [
                uri,
                new monaco.Position(lineNumber, 1),
                references
            ]);
        }
    });

    monaco.editor.setTheme('l4gTheme');

    monaco.languages.registerCodeLensProvider('l4g', {
        provideCodeLenses: function (model) {
            const lenses = [];
            const lines = model.getLinesContent();

            lines.forEach((line, index) => {
                const trimmed = line.trim();
                let functionName = null;

                // Tus Regex se mantienen igual
                let matchSub = trimmed.match(/^Subprog\s+([A-Z0-9_]+)/i);
                let matchFun = trimmed.match(/^Funprog\s+([A-Z0-9_]+)/i);
                let matchRoutine = trimmed.match(/^\$([A-Z0-9_]+)/);

                if (matchSub) functionName = matchSub[1];
                else if (matchFun) functionName = matchFun[1];
                else if (matchRoutine) functionName = matchRoutine[1];

                if (functionName) {
                    const count = this.countReferences(model, functionName);

                    // Solo si el conteo es mayor a 0, creamos el CodeLens
                    if (count > 0) {
                        lenses.push({
                            range: new monaco.Range(index + 1, 1, index + 1, 1),
                            id: functionName // Usamos el ID para pasar el nombre a la resolución
                        });
                    }
                }
            });
            return { lenses, dispose: () => { } };
        },

        countReferences: function (model, functionName) {
            const lines = model.getLinesContent();
            let count = 0;
            lines.forEach(l => {
                if (l.trim().startsWith('#')) return;
                const callRegex = new RegExp(`\\bCall\\s+${functionName}\\b`, 'i');
                const gosubRegex = new RegExp(`\\bGosub\\s+${functionName}\\b`, 'i');
                const funcRegex = new RegExp(`\\bfunc\\s+${functionName}\\b`, 'i');
                if (l.match(callRegex) || l.match(gosubRegex) || l.match(funcRegex)) {
                    count++;
                }
            });
            return count;
        },

        resolveCodeLens: function (model, codeLens) {
            const functionName = codeLens.id;
            const lines = model.getLinesContent();
            const references = [];

            lines.forEach((l, i) => {
                if (l.trim().startsWith('#')) return;

                const callRegex = new RegExp(`\\bCall\\s+${functionName}\\b`, 'i');
                const gosubRegex = new RegExp(`\\bGosub\\s+${functionName}\\b`, 'i');
                const funcRegex = new RegExp(`\\bfunc\\s+${functionName}\\b`, 'i');
                const match = l.match(callRegex) || l.match(gosubRegex) || l.match(funcRegex);

                if (match) {
                    const fullMatchText = match[0];
                    const startColumn = l.toLowerCase().indexOf(fullMatchText.toLowerCase(), match.index) + 1;

                    // Forzamos la creación de un objeto Location nativo
                    references.push({
                        uri: model.uri,
                        range: new monaco.Range(
                            i + 1,
                            startColumn,
                            i + 1,
                            startColumn + fullMatchText.length
                        )
                    });
                }
            });

            if (references.length > 0) {
                // USAMOS EL ID NATIVO DIRECTAMENTE
                codeLens.command = {
                    id: 'editor.action.showReferences',
                    title: `${references.length} reference${references.length > 1 ? 's' : ''}`,
                    arguments: [
                        model.uri, // Argumento 1: Uri
                        new monaco.Position(codeLens.range.startLineNumber, 1), // Argumento 2: Position
                        references // Argumento 3: Location[]
                    ]
                };
            }

            return codeLens;
        }
    });

    monaco.languages.registerDefinitionProvider('l4g', {
        provideDefinition: async function (model, position) {
            const lineContent = model.getLineContent(position.lineNumber);

            // // Regex para capturar: [Accion] [Nombre] From [Archivo]
            // // Captura: 1: Accion, 2: NombreSimbolo, 4: NombreArchivo
            // const regexFrom = /(Call|Gosub|Func)\s+([\w$]+)(\(.*\))?\s+From\s+([\w-]+)/i;
            // const match = lineContent.match(regexFrom);

            // if (match) {
            //     const symbol = match[2];
            //     let targetFile = match[4];
            //     const type = match[1].toUpperCase();

            //     // Aseguramos la extensión .src
            //     const cleanFileName = targetFile.split('.')[0];

            //     // Ejecutamos la navegación
            //     await handleCrossFileNavigation(symbol, cleanFileName, type);

            //     return []; // Evita que Monaco busque localmente
            // }

            const word = model.getWordAtPosition(position);
            if (!word) return null;

            const lineUntilWord = lineContent.substring(0, word.startColumn - 1);

            // Cambiamos el regex para que sea flexible con el espacio y el comando
            if (!/(Gosub|Call|func)\s*$/i.test(lineUntilWord)) return [];

            const functionName = word.word.toUpperCase();
            const lines = model.getLinesContent();
            const results = [];
            const defRegex = new RegExp(`^(\\$|Subprog|Funprog)\\s*${functionName}\\b`, 'i');

            lines.forEach((line, i) => {
                if (defRegex.test(line.trim())) {
                    results.push({
                        uri: model.uri,
                        range: new monaco.Range(i + 1, 1, i + 1, line.length)
                    });
                }
            });

            return results;
        }
    });

    monaco.languages.registerHoverProvider('l4g', {
        provideHover: function (model, position) {
            const lineContent = model.getLineContent(position.lineNumber).trim();
            const word = model.getWordAtPosition(position);
            if (!word) return null;

            const functionName = word.word.toUpperCase();
            const lines = model.getLinesContent();

            // --- CASO A: ESTAMOS SOBRE LA DEFINICIÓN ($VERROU) ---
            if (lineContent.startsWith('$')) {
                // const description = $Codes[functionName];
                const d = $Codes.find(s => s.code.toLowerCase() === functionName.toLowerCase());

                if (d) {
                    return {
                        contents: [
                            { value: '```' + d.description + '  ```' }
                        ]
                    };
                }
                return null; // Si es definición pero no tiene doc, no mostramos nada
            }

            // --- CASO B: ESTAMOS SOBRE UNA LLAMADA (Gosub VERROU) ---
            // Filtramos para que no actúe en definiciones de Subprog/Funprog
            if (/^(Subprog|Funprog)/i.test(lineContent)) return null;

            // 🔍 VALIDACIÓN CRÍTICA: Extraemos el texto de la línea JUSTO ANTES de la palabra
            // para ver si hay un "Gosub" o "Call" precediéndola.
            const textBeforeWord = lineContent.substring(0, word.startColumn - 1);

            // console.log({ textBeforeWord })

            // Comprobamos si la palabra es precedida por Gosub o Call (ignorando mayúsculas/minúsculas)
            // const isExecutionCall = /(Call|Gosub|func)\s+$/i.test(textBeforeWord);
            const isExecutionCall = /\b(Call|Gosub|func)\s+.?/i.test(textBeforeWord);
            // console.log({ isExecutionCall })

            // Si NO es una llamada de ejecución, salimos. 
            // Esto ignora el "ACTION" del Case y el "SEL_LISTE" entre comillas.
            if (!isExecutionCall) return null;

            let definitionLine = null;

            const strictDefRegex = new RegExp(`^\\$${functionName}\\b`, 'i');
            const subFunRegex = new RegExp(`^(Subprog|Funprog)\\s+${functionName}\\b`, 'i');

            for (let i = 0; i < lines.length; i++) {
                const currentLine = lines[i].trim();
                if (strictDefRegex.test(currentLine) || subFunRegex.test(currentLine)) {
                    definitionLine = currentLine;
                    break;
                }
            }

            if (definitionLine) {
                return {
                    contents: [
                        { value: '*Ctrl + click to go to definition*' },
                        { value: '---' },
                        { value: '```text\n' + definitionLine + '\n```' }
                    ]
                };
            }

            return null;
        }
    });

    // editor.onDidChangeModelContent(() => {
    //     const currentContent = model.getValue();
    //     const isDirty = currentContent !== models[name].original;

    //     if (isDirty !== models[name].isDirty) {
    //         models[name].isDirty = isDirty;
    //         updateTabStatus(name, isDirty)
    //     }
    //     updateOutline();
    //     // updateReferenceCounters(editor);
    // });

    editor.onDidChangeModel(() => {
        updateOutline();
        // updateReferenceCounters(editor);
    });
});

// async function handleGlobalNavigation(symbol, targetFile, type) {
//     // Aseguramos que el nombre del archivo tenga la extensión .src si es necesario
//     const fullFileName = targetFile.endsWith('.src') ? targetFile : `${targetFile}.src`;

//     // ESCENARIO 1: ¿Está abierto ya?
//     if (tabs.some(t => t.name === fullFileName)) {
//         activateTab(fullFileName);
//         goToSymbolInActiveEditor(symbol, type);
//         return;
//     }

//     // ESCENARIO 2: No está abierto, buscar en Supabase
//     try {
//         showToast(`Buscando ${fullFileName} en el servidor...`);

//         // Aquí llamas a tu función existente de Supabase
//         const content = await fetchFileFromSupabase(fullFileName);

//         if (content) {
//             // Abrimos el archivo (esto debería crear el Tab y el Modelo)
//             await openFileFromExplorer(fullFileName, content);

//             // Una vez abierto, saltamos a la definición
//             setTimeout(() => {
//                 goToSymbolInActiveEditor(symbol, type);
//             }, 100); // Pequeño delay para que el modelo cargue
//         } else {
//             showToast("Archivo no encontrado en Supabase", "error");
//         }
//     } catch (err) {
//         console.error("Error en navegación global:", err);
//     }
// }

// async function handleCrossFileNavigation(symbol, fileName, type) {
//     // 1. Usamos tu función existente para abrir o activar el tab
//     const realFileName = findRealFileNameFromExplorer(fileName);

//     if (!realFileName) {
//         showToast(`No se encontró el archivo fuente para: ${fileName}`, "error");
//         return;
//     }

//     await openFileFromExplorer(realFileName);

//     // 2. Esperamos un instante a que el editor se estabilice con el nuevo modelo
//     setTimeout(() => {
//         const model = window.editor.getModel();
//         if (!model) return;

//         const lines = model.getLinesContent();
//         let targetLine = -1;

//         const searchSymbol = symbol.toUpperCase();

//         // Patrones de búsqueda según el tipo de llamado
//         let searchPattern = "";
//         if (type === "FUNC") searchPattern = "FUNPROG";
//         else if (type === "CALL") searchPattern = "SUBPROG";
//         else if (type === "GOSUB") searchPattern = "$";

//         for (let i = 0; i < lines.length; i++) {
//             const lineClean = lines[i].trim().toUpperCase();

//             // Verificamos si la línea empieza con el patrón y contiene el símbolo
//             // Ej: "SUBPROG MI_FUNCION" o "$MI_RUTINA"
//             if (lineClean.includes(searchPattern) && lineClean.includes(searchSymbol)) {
//                 targetLine = i + 1;
//                 break;
//             }
//         }

//         if (targetLine !== -1) {
//             window.editor.revealLineInCenter(targetLine);
//             window.editor.setPosition({ lineNumber: targetLine, column: 1 });
//             window.editor.focus();

//             // Pintar el outline si lo tienes disponible
//             if (typeof setSymbols === 'function') setSymbols(targetLine);
//         }
//     }, 300); // 300ms suele ser el "sweet spot" para que el modelo esté listo
// }

async function handleCrossFileNavigation(symbol, fileBaseName, type) {
    // 1. Normalizamos el nombre que buscamos (ej: de "GESECRAN" a "GESECRAN")
    const searchName = fileBaseName.split('.')[0].toUpperCase();

    // --- PASO 1: Buscar en Tabs Abiertos ---
    // 'tabs' es tu array de objetos { name: "archivo.txt", ... }
    const tabExistente = tabs.find(t => t.name.split('.')[0].toUpperCase() === searchName);

    let nombreCompletoFinal = "";

    if (tabExistente) {
        // Si ya está abierto, usamos su nombre real (ej: "GESECRAN.txt")
        nombreCompletoFinal = tabExistente.name;
    } else {
        // --- PASO 2: Buscar en el Explorer (DOM) ---
        nombreCompletoFinal = findRealFileNameFromExplorer(searchName);
    }

    // --- VALIDACIÓN FINAL ---
    if (!nombreCompletoFinal) {
        // console.error(`No se encontró nada para: ${searchName} en Tabs ni Explorer`);
        showToast(`No definition found for: ${searchName}`)
        // Opcional: alert(`El archivo ${searchName} no está disponible.`);
        return;
    }

    // 2. Abrir o Activar (Tu función ya maneja si está abierto o no)
    await openFileFromExplorer(nombreCompletoFinal);

    // 3. Salto a la definición
    setTimeout(() => {
        const model = window.editor.getModel();
        if (!model) return;

        const lines = model.getLinesContent();
        const searchSymbol = symbol.toUpperCase();
        let targetLine = -1;

        // Mapeo de prefijos según el tipo de llamado
        let prefix = "";
        if (type === "FUNC") prefix = "FUNPROG";
        else if (type === "CALL") prefix = "SUBPROG";
        else if (type === "GOSUB") prefix = "$";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim().toUpperCase();

            // Buscamos que la línea contenga el prefijo Y el símbolo
            // Ej: "SUBPROG TEMPON"
            if (line.includes(prefix) && line.includes(searchSymbol)) {
                targetLine = i + 1;
                break;
            }
        }

        if (targetLine !== -1) {
            window.editor.revealLineInCenter(targetLine);
            window.editor.setPosition({ lineNumber: targetLine, column: 1 });
            window.editor.focus();

            setTimeout(() => {
                const model = window.editor.getModel();
                if (!model) return;

                const lineContent = model.getLineContent(targetLine);
                const searchSymbol = symbol.toUpperCase();

                // Buscamos la posición ignorando mayúsculas/minúsculas
                const index = lineContent.toUpperCase().indexOf(searchSymbol);

                if (index !== -1) {
                    const startCol = index + 1;
                    const endCol = startCol + searchSymbol.length;

                    // Aplicamos la decoración
                    const decorations = window.editor.deltaDecorations([], [
                        {
                            // El rango puede ser solo el inicio de la línea, isWholeLine hará el resto
                            range: new monaco.Range(targetLine, 1, targetLine, 1),
                            options: {
                                isWholeLine: true, // ESTO es la clave para sombrear toda la franja
                                className: 'line-shadow-flash-class' // Usamos className para el fondo
                            }
                        }
                    ]);

                    // 3. Limpiar después de 1 segundo
                    setTimeout(() => {
                        window.editor.deltaDecorations(decorations, []);
                    }, 1200);
                }
            }, 100); // 100ms de respiro para el renderizado

            // if (typeof setSymbols === 'function') {
            //     setTimeout(() => {
            //         updateOutline();
            //     }, 200);
            //     setSymbols({ position: targetLine });
            // }
        }
    }, 350); // Aumentamos a 350ms para dar tiempo a la descarga si es necesario
}

function findRealFileNameFromExplorer(baseName) {
    // Buscamos todos los items del explorer
    const items = document.querySelectorAll('.explorer-item');
    const searchName = baseName.toUpperCase();

    for (let item of items) {
        const fullFileName = item.getAttribute('data-filename'); // Ej: "GESECRAN.src"
        if (fullFileName) {
            // Extraemos solo la parte antes del punto (GESECRAN)
            const nameWithoutExtension = fullFileName.split('.')[0].toUpperCase();

            if (nameWithoutExtension === searchName) {
                return fullFileName; // Retornamos el nombre completo encontrado
            }
        }
    }
    return null; // No se encontró
}

// async function fetchFileFromSupabase(fileName) {
//     // 1. Aseguramos que el nombre tenga la extensión si tu base de datos la incluye
//     // Si en Supabase guardas "GESECRAN" sin ".src", quita esta línea.
//     const nameToSearch = fileName.includes('.') ? fileName : `${fileName}.src`;

//     try {
//         const { data, error } = await supabase
//             .from('tus_archivos') // <--- Cambia por el nombre real de tu tabla
//             .select('content')    // <--- Cambia por el nombre de la columna del código
//             .eq('name', nameToSearch) // <--- Cambia 'name' por tu columna de nombre
//             .single(); // .single() porque solo esperamos un archivo con ese nombre

//         if (error) {
//             console.error("Error al buscar archivo:", error.message);
//             return null;
//         }

//         return data ? data.content : null;

//     } catch (err) {
//         console.error("Error de red o inesperado:", err);
//         return null;
//     }
// }

// function goToSymbolInActiveEditor(symbol, type) {
//     const model = window.editor.getModel();
//     const content = model.getValue();
//     const lines = content.split('\n');
//     let targetLine = -1;

//     // Mapeo de búsqueda según el tipo de llamado
//     let searchPattern = "";
//     if (type === "FUNC") searchPattern = `Funprog ${symbol}`;
//     if (type === "CALL") searchPattern = `Subprog ${symbol}`;
//     if (type === "GOSUB") searchPattern = `${symbol}`; // Para rutinas suele ser solo el nombre tras el $

//     for (let i = 0; i < lines.length; i++) {
//         // Buscamos la línea que contiene la definición
//         if (lines[i].includes(searchPattern)) {
//             targetLine = i + 1;
//             break;
//         }
//     }

//     if (targetLine !== -1) {
//         window.editor.revealLineInCenter(targetLine);
//         window.editor.setPosition({ lineNumber: targetLine, column: 1 });
//         window.editor.focus();
//     }
// }

async function setSymbols(e) {
    const currentLine = e.position.lineNumber;

    // Buscamos cuál símbolo contiene la línea actual del cursor
    const activeSymbol = currentFileSymbols.find(sym =>
        currentLine >= sym.lineStart && currentLine <= sym.lineEnd
    );

    // console.log(activeSymbol);

    // Quitamos el verde de todos
    document.querySelectorAll('.outline-item').forEach(el => {
        el.classList.remove('active-outline');
    });

    if (activeSymbol) {
        // Buscamos el div por la clase que creamos (usando lineStart como ID)
        const targetItem = document.querySelector(`.outline-item_${activeSymbol.lineStart}`);

        if (targetItem) {
            targetItem.classList.add('active-outline');
            // Hacemos que el panel de la derecha haga scroll si el item no se ve
            targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

async function handleQuickSave() {
    // const fileName = currentModelName;
    // const fileData = models[fileName];

    // console.log({ fileName });
    // console.log({ fileData });
    // if (!fileData) return;

    // // ESCENARIO A: Es un archivo local (isLocal: true)
    // if (fileData.isLocal) {
    //     console.log("Detectado archivo local, redirigiendo a 'Save As' para vinculación...");
    //     openSaveModal(); // Forzamos que elija nombre para la nube
    //     return;
    // }

    // // ESCENARIO B: Ya existe en la nube, guardado directo (Update)
    // await saveToSupabase(fileName);

    // closeSaveMenu();

    // 1. Obtener el modelo actual de forma segura
    const fileName = currentModelName;
    const fileData = models[fileName];

    if (!fileData) {
        console.warn("No hay ningún archivo activo para guardar.");
        return;
    }

    // 2. ESCENARIO A: Es un archivo que no está en la nube
    // (Ya sea porque se llama 'Untitled' o porque tiene el flag isLocal: true)
    if (fileData.isLocal || fileName.startsWith("Untitled")) {
        console.log("Detectado archivo local/nuevo, abriendo modal de guardado...");

        // Llamamos al modal de "Guardar como" porque necesita nombre/vinculación
        // Le pasamos true para que el confirmSave sepa que es un "Save As" forzado
        openSaveModal(true);
        return;
    }

    // 3. ESCENARIO B: Ya existe en la nube (Actualización rápida)
    console.log('Guardando cambios directamente en la nube para:', fileName);

    // Aquí usamos la función que ya actualiza la UI (iconos, dirty, etc.)
    // Pero como ya es de la nube y NO es un "Save As", no pedirá confirmación
    // await executeFinalSave();
    await saveToSupabase(fileName);

    // Opcional: Feedback visual de que se guardó
    // showConfirmationToast("File saved to cloud");
}

// document.getElementById("btnSave").onclick = async () => {
//     // // 1. Buscamos en nuestro array de tabs cuál es el que está activo en el DOM
//     // const activeTabData = tabs.find(t => t.tab.classList.contains('active'));

//     // if (activeTabData) {
//     //     const fileName = activeTabData.name;

//     //     // 2. Opcional: Feedback visual inmediato (cambiar color del icono mientras guarda)
//     //     const btn = document.getElementById("btnSave");
//     //     btn.style.opacity = "0.5";
//     //     btn.style.pointerEvents = "none"; // Evita múltiples clics

//     //     // 3. Llamamos a la función que sube a Supabase
//     //     await saveToSupabase(fileName);

//     //     // 4. Restauramos el botón
//     //     btn.style.opacity = "1";
//     //     btn.style.pointerEvents = "auto";
//     // } else {
//     //     showToast("Nothing to save.");
//     // }

//     const indicator = document.getElementById('active-tab-indicator');
//     const activeTab = tabs.find(t => indicator && t.tab.contains(indicator));

//     if (activeTab) {
//         console.log("Guardando archivo actual:", activeTab.name);
//         if (currentModelName.startsWith("Untitled")) {
//             openSaveModal();
//         } else {
//             console.log('saveToSupabase');
//             saveToSupabase(activeTab.name);
//         }
//     } else {
//         showToast("Nothing to save.")
//     }
// };

function updateTabStatus(name, isDirty) {
    const tabElement = document.querySelector(`[data-name="${name}"]`);
    if (!tabElement) return;

    if (tabElement) {
        if (isDirty) {
            tabElement.classList.add('tab-dirty');
        } else {
            tabElement.classList.remove('tab-dirty');
        }
    }
}

function getIcon(type) {
    const icon = document.createElement("i");

    switch (type) {
        case 'subprog':
            icon.setAttribute("data-lucide", "box");
            icon.classList.add("flex-shrink-0", "text-gray-500", "min-w-[16px]");
            break;

        case 'funprog':
            icon.setAttribute("data-lucide", "variable");
            icon.classList.add("flex-shrink-0", "text-gray-500", "min-w-[16px]");
            break;

        case 'routine':
            icon.setAttribute("data-lucide", "dollar-sign");
            icon.classList.add("flex-shrink-0", "text-gray-500", "min-w-[16px]");
            break;

        case 'file':
            icon.setAttribute("data-lucide", "file");
            break;

        case 'close':
            icon.setAttribute("data-lucide", "x");
            break;

        default:
            icon.setAttribute("data-lucide", "dot");
    }

    icon.classList.add("size-4");

    return icon;
}

function getReferences(model, functionName) {
    const lines = model.getLinesContent();
    const refs = [];

    //const regex = new RegExp(`\\bCall\\w*\\s+${functionName}\\b`, 'gi');
    const regex = new RegExp(`\\b(Call|Gosub)\\s+${functionName}\\b`, 'i');
    lines.forEach((line, index) => {
        if (line.trim().startsWith('#')) return;

        if (regex.test(line)) {
            refs.push({
                line: index + 1,
                text: line.trim()
            });
        }
    });

    return refs;
}

// CREAR TAB
// function createTab(fileName, content) {
//     tabCounter++;
//     let name = fileName === ""
//         ? "Untitled-" + String(tabCounter).padStart(2, '0') + ".src"
//         : fileName;

//     /* mostrar editor */
//     document.getElementById("editor").style.display = "block";

//     /* crear modelo de Monaco */
//     // Es mejor crear el modelo solo si no existe en el objeto 'models'
//     let model = models[name];
//     if (!model) {
//         model = monaco.editor.createModel(content, "l4g");
//         // models[name] = model;

//         models[name] = {
//             instance: model,
//             original: content,
//             isDirty: false
//         };
//     }

//     /* Estructura del DOM */
//     let tabheadercont = document.createElement("div");
//     tabheadercont.className = "tab-header-container";

//     let tab = document.createElement("div");
//     tab.className = "tab";

//     // Agregamos un atributo de datos para facilitar búsquedas por CSS si fuera necesario
//     tab.setAttribute('data-name', name);

//     let title = document.createElement("span");
//     title.className = "title-tab";
//     title.innerText = name;

//     let btnClose = document.createElement("button");
//     btnClose.className = "btnCloseTab";
//     btnClose.appendChild(getIcon("close"));

//     /* EVENTO CERRAR */
//     btnClose.onclick = (e) => {
//         e.stopPropagation();
//         closeTab(name, tabheadercont); // Pasamos el container para eliminarlo todo
//         updateOutline();
//     };

//     /* EVENTO ACTIVAR */
//     tab.onclick = () => {
//         activateTab(name, tab);
//     };

//     tab.appendChild(title);
//     tab.appendChild(btnClose);
//     tabheadercont.appendChild(tab);

//     document.getElementById("tabs").appendChild(tabheadercont);

//     // Guardamos en el array global (asegúrate de que sea el mismo que usas para el find)
//     tabs.push({ name, tab });

//     /* Activar automáticamente al crear */
//     activateTab(name, tab);

//     // Refrescar iconos si usas Lucide
//     if (window.lucide) lucide.createIcons();
// }

function createTab(fileName, content, isLocal = false) {
    console.log({ isLocal });
    tabCounter++;
    let name = fileName === ""
        ? "Untitled-" + String(tabCounter).padStart(2, '0') + ".src"
        : fileName;

    // 1. Manejo del modelo y el estado "Dirty"
    if (!models[name]) {
        const modelInstance = monaco.editor.createModel(content, "l4g");
        modelInstance.fileName = name;
        models[name] = {
            instance: modelInstance,
            original: content,
            isDirty: false,
            isLocal: isLocal
        };

        // Escuchar cambios para el círculo verde
        modelInstance.onDidChangeContent(() => {
            const name = modelInstance.fileName;

            if (!models[name]) return;

            const currentContent = modelInstance.getValue();
            const isDirty = currentContent !== models[name].original;

            if (isDirty !== models[name].isDirty) {
                models[name].isDirty = isDirty;
                updateTabStatus(name, isDirty); // Llama a la función que pone la clase .dirty
            }

            updateOutline();
        });

        showEditor();
    }

    /* Estructura del DOM */
    // let tabheadercont = document.createElement("div");
    // tabheadercont.className = "inline-flex overflow-x-auto flex-1";

    let tabsContainer = document.getElementById("tabs-container");
    let tab = document.createElement("div");
    tab.className = "flex items-center px-4 py-2 cursor-pointer border-r border-gray-200 min-w-[150px] bg-white relative text-gray-700";
    tab.setAttribute('data-name', name);
    tab.setAttribute('title', name);

    // tab.innerHTML = `
    // <div class="flex items-center gap-2">
    //     ${isLocal ? '<i data-lucide="monitor" class="local-icon size-3 text-yellow-500"></i>' : '<i data-lucide="cloud" class="local-icon size-3 text-blue-400"></i>'}
    //     <span></span>
    // </div>`;

    // lucide.createIcons();

    let statusIconContainer = document.createElement("div");
    statusIconContainer.className = "flex items-center status-icon-container"; // Clase clave para buscarlo luego
    statusIconContainer.innerHTML = isLocal
        ? '<i data-lucide="monitor" class="size-3 text-yellow-500 mr-2"></i>'
        : '<i data-lucide="cloud" class="size-3 text-blue-400 mr-2"></i>';

    let title = document.createElement("span");
    title.className = "truncate flex-1 tab-name";
    title.innerText = name;

    let btnClose = document.createElement("button");
    btnClose.className = "btnCloseTab ml-2 p-1 rounded hover:bg-gray-200 text-gray-500 grid place-items-center size-6 relative";

    let indicator = document.getElementById('active-tab-indicator');

    if (!indicator) {
        // console.log("no existe");
        indicator = document.createElement("div");
        indicator.id = "active-tab-indicator";
        indicator.className = "absolute bottom-0 left-0 right-0 h-0.5 bg-[#07B43C]";
    }

    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "x");
    // icon.classList.add("icon-closeTab", "size-3", "transition-opacity");
    icon.className = "icon-closeTab size-3 transition-opacity col-start-1 row-start-1";
    btnClose.appendChild(icon);

    let dirtyCircle = document.createElement("div");
    dirtyCircle.className = "dirty-circle size-2 rounded-full bg-[#07B43C] opacity-0 transition-opacity col-start-1 row-start-1";
    btnClose.appendChild(dirtyCircle);

    btnClose.onclick = (e) => {
        e.stopPropagation();
        const actualName = tab.getAttribute('data-name');
        closeTab(actualName, tab);
        updateOutline();
    };

    tab.onclick = () => {
        const actualName = tab.getAttribute('data-name');
        activateTab(actualName, tab);
    };

    tab.appendChild(statusIconContainer);
    tab.appendChild(title);
    tab.appendChild(btnClose);
    tab.appendChild(indicator);
    tabsContainer.appendChild(tab);

    tabs.push({ name, tab });

    // 2. Activar pasándole el nombre y el elemento
    activateTab(name, tab);

    if (window.lucide) lucide.createIcons();
}

// BOTON NUEVO
document.getElementById("btnNew").onclick = async () => {
    createTab("", "", true);
};

// BOTON PEGAR
document.getElementById("btnPaste").onclick = async () => {
    let text = "";
    try {
        text = await navigator.clipboard.readText();
    } catch {
        text = "";
    }

    createTab("", text, true);
};

function triggerLocalOpen() {
    const picker = document.getElementById('localFilePicker');
    picker.value = '';
    picker.click();
}

document.getElementById('localFilePicker').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        const fileName = file.name;

        // 1. Verificar si ya está abierto
        if (models[fileName]) {
            showToast("Este archivo ya está abierto.");
            return;
        }

        // 2. Crear el modelo y la pestaña (Usando tu lógica existente)
        // Pasamos 'true' o algo que indique que es un archivo local si quieres
        createTab(fileName, content, true);

        // Limpiar el input para poder abrir el mismo archivo después si se cierra
        e.target.value = '';
    };
    reader.readAsText(file);
});

// ACTIVAR TAB
// function activateTab(name, tab) {
//     console.log('Intentado acrtivar: ', name);
//     console.log('Estado actual de models: ', Object.keys(models));

//     if (!models[name]) {
//         console.error(`Error: El archivo "${name}" no existe en el objeto models.`);
//         return;
//     }

//     if (!editor) return;

//     // A. ANTES de cambiar: Guardar el estado del tab que estamos dejando
//     currentModel = window.editor.getModel();
//     currentModelName = name;

//     if (currentModel) {
//         // Buscamos el nombre del archivo del modelo actual para guardarlo en el mapa
//         const currentFileName = currentModel.fileName; // Asegúrate de tener guardado el nombre en el modelo
//         viewStates.set(currentFileName, window.editor.saveViewState());
//     }

//     // B. CAMBIAR al nuevo modelo
//     const targetModel = models[name].instance;
//     window.editor.setModel(targetModel);

//     // Guardamos el nombre en el modelo para la siguiente vez que cambiemos
//     targetModel.fileName = name;

//     // C. DESPUÉS de cambiar: Restaurar si ya teníamos un estado guardado
//     if (viewStates.has(name)) {
//         window.editor.restoreViewState(viewStates.get(name));
//     }

//     // D. IMPORTANTE: Devolverle el foco al editor para que puedas escribir de inmediato
//     window.editor.focus();

//     // tabs.forEach(t => t.tab.classList.remove("active"));
//     // tab.classList.add("active");

//     let indicator = document.getElementById('active-tab-indicator');

//     if (!indicator) {
//         console.log("no existe indicator");
//         indicator = document.createElement("div");
//         indicator.id = "active-tab-indicator";
//         indicator.className = "absolute bottom-0 left-0 right-0 h-0.5 bg-[#07B43C]";
//     }

//     // 3. Mover el indicador a la pestaña clickeada
//     tab.appendChild(indicator);

//     const modelData = models[name];

//     if (modelData && modelData.instance) {
//         console.log('if modelData && modelData.instance')
//         // Le pasamos a Monaco solo la instancia de texto
//         editor.setModel(modelData.instance);

//         updateOutline();
//         const currentPos = window.editor.getPosition();
//         setSymbols({ position: currentPos });
//         syncExplorer(name);
//     }
// }

function activateTab(name, tab) {
    console.log('Intentando activar:', name);

    // 1. VALIDACIÓN CRÍTICA
    if (!models[name] || !models[name].instance) {
        console.error(`ERROR: El archivo "${name}" no está en memoria. Keys disponibles:`, Object.keys(models));
        return;
    }

    if (!window.editor) return;

    // 2. GUARDAR ESTADO DEL ARCHIVO QUE ESTAMOS DEJANDO
    // Usamos el 'currentModelName' antiguo antes de actualizarlo
    const previousModel = window.editor.getModel();
    if (previousModel && currentModelName) {
        console.log(`Guardando estado de vista para: ${currentModelName}`);
        viewStates.set(currentModelName, window.editor.saveViewState());
    }

    // 3. ACTUALIZAR VARIABLES GLOBALES
    currentModelName = name;
    const modelData = models[name];

    // 4. CAMBIAR EL MODELO EN EL EDITOR
    window.editor.setModel(modelData.instance);

    // 5. RESTAURAR ESTADO DE VISTA (Si existe)
    if (viewStates.has(name)) {
        console.log(`Restaurando estado de vista para: ${name}`);
        window.editor.restoreViewState(viewStates.get(name));
    }

    // 6. FOCO Y UI
    window.editor.focus();

    // Gestión del indicador visual (Subrayado verde)
    let indicator = document.getElementById('active-tab-indicator');
    if (!indicator) {
        indicator = document.createElement("div");
        indicator.id = "active-tab-indicator";
        indicator.className = "absolute bottom-0 left-0 right-0 h-0.5 bg-[#07B43C]";
    }

    tab.appendChild(indicator);

    // 7. ACTUALIZAR COMPONENTES EXTRA
    if (typeof updateOutline === 'function') updateOutline();

    const currentPos = window.editor.getPosition();
    if (typeof setSymbols === 'function') setSymbols({ position: currentPos });

    if (typeof updateSaveButtonsState === 'function') {
        updateSaveButtonsState();
    }

    // Sincronizar el sombreado en el explorador
    syncExplorer(name);
}

async function syncExplorer(fileName) {
    console.log(fileName);
    // 1. Quitamos el sombreado previo de todos los archivos
    document.querySelectorAll('.explorer-item').forEach(item => {
        item.classList.remove('active-explorer'); // Cambia por tu clase de CSS
    });

    // 2. [LÓGICA CRÍTICA]: Si el archivo actual es LOCAL, NO sombreamos nada en el explorer
    // porque ese archivo físicamente no existe en la lista de Supabase aún.
    if (models[fileName] && models[fileName].isLocal) {
        console.log("Archivo local detectado: omitiendo sombreado en explorer.");
        return;
    }

    // 3. Si no es local, procedemos a sombrear el archivo en la nube
    const explorerItem = document.querySelector(`.explorer-item[data-filename="${fileName}"]`);

    if (explorerItem) {
        explorerItem.classList.add('active-explorer');

        // 3. Opcional: Hacer scroll en el explorer si el archivo está muy abajo
        explorerItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// function closeTab(name, tab) {
//     delete models[name];
//     tab.remove();

//     tabs = tabs.filter(t => t.name !== name);

//     if (tabs.length > 0) {
//         activateTab(tabs[0].name, tabs[0].tab);
//     } else {
//         document.getElementById("editor").style.display = "none";
//     }
// }

function closeTab(name, tabElementContainer) {
    // 1. Verificar si hay cambios sin guardar
    if (models[name] && models[name].isDirty) {
        // const confirmar = confirm(`El archivo "${name}" tiene cambios sin guardar. ¿Deseas cerrarlo de todos modos?`);
        // if (!confirmar) return; // Cancelar el cierre
        showDialog({
            title: 'Unsaved Changes',
            message: `File "${name}" has unsaved changes. Do you want to close it anyway?`,
            confirmText: 'Close Anyway',
            type: 'danger',
            onConfirm: () => {
                // TRUCO SENIOR: Marcamos como no sucio y volvemos a llamar a la función.
                // Esta vez saltará el IF y ejecutará la limpieza.
                models[name].isDirty = false;
                closeTab(name, tabElementContainer);
            }
        });

        // Salimos de la función para esperar la respuesta del modal
        return;
    }

    // 2. Limpiar Monaco y Memoria
    if (models[name]) {
        console.log(name);
        // Importante: dispose libera la memoria del modelo en Monaco
        models[name].instance.dispose();
        delete models[name];
    }

    if (viewStates.has(name)) {
        viewStates.delete(name);
        console.log(`Posición de vista eliminada para: ${name}`);
    }

    console.log(Object.keys(models));
    // 3. Eliminar del array de seguimiento 'tabs'
    console.log("tabs antes", tabs)
    tabs = tabs.filter(t => t.name !== name);
    console.log("tabs despues", tabs)

    // 4. Eliminar del DOM
    tabElementContainer.remove();

    // 5. Manejo del foco (¿Qué mostrar ahora?)
    if (tabs.length > 0) {
        console.log('quedan tabs: ', tabs.length);
        // Si quedan tabs, activamos el último de la lista
        const lastTab = tabs[tabs.length - 1];
        activateTab(lastTab.name, lastTab.tab);
        //currentModelName = lastTab.name;
    } else {
        console.log('no quedan tabs');
        // Si no quedan tabs, limpiamos el editor
        editor.setModel(null);
        currentModelName = null;
        // document.getElementById("editor-placeholder").style.display = "none";
        document.getElementById('editor-space').style.display = 'flex';
        // Limpiar el outline también
        renderOutlineTree([]);
    }

    // Sincronizar el explorer (quitar el resaltado si ya no hay archivos abiertos)
    syncExplorer(tabs.length > 0 ? tabs[tabs.length - 1].name : null);
}

// LISTEN KEY EVENTS
// document.addEventListener("keydown", async function (e) {
//     if (e.ctrlKey && e.key.toLowerCase() === "v") {
//         e.preventDefault();

//         let text = "";

//         try {
//             text = await navigator.clipboard.readText();
//         } catch {
//             text = "";
//         }
//         createTab("", text);
//     }
// });

// window.addEventListener('keydown', (e) => {
//     // Detecta Ctrl + S (o Cmd + S en Mac)
//     if ((e.ctrlKey || e.metaKey) && e.key === 's') {
//         e.preventDefault(); // Evita que el navegador intente guardar la página HTML

//         // Buscamos cuál es el tab que tiene la clase 'active' actualmente
//         const activeTab = tabs.find(t => t.tab.classList.contains('active'));

//         if (activeTab) {
//             console.log("Guardando archivo actual:", activeTab.name);
//             saveToSupabase(activeTab.name);
//         } else {
//             console.warn("No hay ningún archivo activo para guardar.");
//         }
//     }
// });

// CTRL + S
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();

        if (CloudManager.checkConnection(() => handleQuickSave())) {
            handleQuickSave();
        }

        // const indicator = document.getElementById('active-tab-indicator');
        // const activeTab = tabs.find(t => indicator && t.tab.contains(indicator));

        // if (activeTab) {
        //     console.log("Guardando archivo actual:", activeTab.name);
        //     if (currentModelName.startsWith("Untitled")) {
        //         openSaveModal();
        //     } else {
        //         console.log('saveToSupabase');
        //         saveToSupabase(activeTab.name);
        //     }
        // } else {
        //     console.warn("No hay ningún archivo activo para guardar.");
        // }
    }
});

function openSaveModal(IsSaveAs = false) {
    closeSaveMenu();

    const modal = document.getElementById('saveModal');
    modal.setAttribute('data-is-save-as', IsSaveAs);
    const input = document.getElementById('newFileName');
    input.value = currentModelName; // Sugerimos el actual
    modal.classList.add('flex', 'absolute');
    modal.classList.remove('hidden');

    input.focus();
}

// function confirmSave() {
//     console.log('entra');
//     let newName = document.getElementById('newFileName').value.trim();
//     console.log(newName);
//     console.log(currentModelName);
//     return;
//     // Validación simple: asegurar extensión .src
//     if (!newName.endsWith('.src')) newName += '.src';

//     if (newName && newName !== currentModelName) {
//         console.log('entra 2');
//         // 1. Actualizar el objeto models
//         models[newName] = models[currentModelName];
//         delete models[currentModelName];

//         // 2. Actualizar la pestaña en el DOM
//         const tabElement = document.querySelector(`[data-name="${currentModelName}"]`);
//         tabElement.setAttribute('data-name', newName);
//         tabElement.querySelector('span').innerText = newName;

//         // 3. Actualizar variables globales
//         currentModelName = newName;

//         // 4. Guardar y cerrar
//         saveToSupabase(newName);
//         closeSaveModal();
//     }
// }

// function confirmSave() {
//     let newName = document.getElementById('newFileName').value.trim();
//     if (!newName.endsWith('.src')) newName += '.src';

//     if (newName && models[currentModelName]) {
//         // 1. Trasladamos los datos al nuevo nombre en nuestro objeto de modelos
//         models[newName] = {
//             ...models[currentModelName],
//             isDirty: false // Lo reseteamos porque se va a guardar justo ahora
//         };

//         // 2. IMPORTANTE: Si el nombre cambió, eliminamos el "Untitled" viejo
//         if (newName !== currentModelName) {
//             delete models[currentModelName];

//             // Actualizamos el DOM de la pestaña
//             const tabElement = document.querySelector(`[data-name="${currentModelName}"]`);
//             if (tabElement) {
//                 tabElement.setAttribute('data-name', newName);
//                 tabElement.querySelector('span').innerText = newName;
//                 tabElement.classList.remove('tab-dirty'); // Quitamos el círculo verde visualmente
//             }
//         }

//         // 3. Actualizamos la variable global
//         const oldName = currentModelName;
//         currentModelName = newName;

//         // 4. Disparamos el guardado pasando un flag de "forzar" o simplemente llamando a la función
//         // Ya que saveToSupabase usará el contenido actual del modelo.
//         saveToSupabase(newName, true);

//         closeSaveModal();
//     }
// }

// ULTIMO FUNCIONAL
// async function confirmSave() {
//     const input = document.getElementById('newFileName');
//     let newName = input.value.trim();

//     // 1. Validaciones básicas
//     if (!newName) {
//         showToast("The file name cannot be empty.");
//         input.focus();
//         return;
//     }

//     if (newName.toLowerCase().startsWith("untitled")) {
//         showToast("Please, enter a valid file name.");
//         input.select();
//         return;
//     }

//     if (!newName.endsWith('.src')) newName += '.src';

//     // Evitar duplicados (no sobrescribir otros archivos abiertos)
//     if (models[newName] && newName !== currentModelName) {
//         alert("Ya existe un archivo abierto con ese nombre.");
//         return;
//     }

//     if (models[currentModelName]) {
//         const oldName = currentModelName;
//         const modelData = models[oldName];

//         // const modelInstance = models[currentModelName].instance;

//         // modelInstance.fileName = newName; // <<<<---------------- Revisar

//         // 1 Clonar datos al nuevo nombre
//         models[newName] = {
//             ...modelData,
//             isDirty: false,
//             isLocal: false
//         };

//         // 2 Sincronizar el modelo de Monaco
//         models[newName].instance.fileName = newName;

//         const tabIndex = tabs.findIndex(t => t.name === oldName);
//         if (tabIndex !== -1) {
//             tabs[tabIndex].name = newName; // Sincronizamos el nombre en el array
//             console.log(`Array 'tabs' actualizado: ${oldName} -> ${newName}`);
//         }

//         // 3 Actualizar la pestaña (Tab)
//         if (newName !== oldName) {
//             // Actualizamos el DOM de la pestaña ANTES de borrar el nombre viejo del estado
//             const tabElement = document.querySelector(`[data-name="${oldName}"]`);

//             if (tabElement) {
//                 tabElement.setAttribute('data-name', newName);
//                 tabElement.querySelector('span').innerText = newName;
//                 tabElement.classList.remove('tab-dirty'); // Limpieza visual inmediata

//                 tabElement.onclick = () => activateTab(newName, tabElement);
//             }

//             // Ahora sí, borramos la referencia vieja
//             delete models[oldName];
//         }

//         // 4. Actualizamos la variable global para que todo el sistema sepa 
//         // que el archivo activo ahora tiene un nuevo nombre
//         currentModelName = newName;

//         // 5. LLAMADA CLAVE: Guardado Forzado
//         // Pasamos 'true' como segundo parámetro para que saveToSupabase ignore 
//         // que el archivo está "limpio" (isDirty: false)
//         await saveToSupabase(newName, true);

//         // 6. Cerramos y devolvemos el foco al editor
//         closeSaveModal();

//         await refreshFileList();

//         await syncExplorer(newName);
//         // setTimeout(() => { syncExplorer(newName), 1000 });
//     }
// }

async function confirmSave() {
    const modal = document.getElementById('saveModal');
    // Recuperamos el valor del atributo (viene como string, lo pasamos a boolean)
    const isSaveAs = modal.getAttribute('data-is-save-as') === 'true';
    const input = document.getElementById('newFileName');
    let newName = input.value.trim();

    // 1. Validaciones básicas
    if (!newName) {
        showToast("The file name cannot be empty.");
        input.focus();
        return;
    }

    if (newName.toLowerCase().startsWith("untitled")) {
        showToast("Please, enter a valid file name.");
        input.select();
        return;
    }

    if (!newName.endsWith('.src')) newName += '.src';

    // Evitar colisiones con otras pestañas abiertas

    if (models[newName] && newName !== currentModelName) {
        alert("Ya existe un archivo abierto con ese nombre.");
        return;
    }

    // 1. Obtener datos del archivo actual ANTES de cambiar nada
    const modelData = models[currentModelName];
    const isLocal = modelData ? modelData.isLocal : false;

    const executeFinalSave = async () => {
        const oldName = currentModelName;

        if (models[oldName]) {
            const modelData = models[oldName];

            // 1. Clonar datos y forzar estado de "Nube"
            // [IMPORTANTE]: Mantenemos la instancia de Monaco pero reseteamos flags
            // Actualización de Memoria (Independiente del nombre)
            models[newName] = {
                ...modelData,
                isDirty: false,  // Se considerará limpio tras el saveToSupabase
                isLocal: false   // <--- Aquí ocurre la PROMOCIÓN a la nube
            };

            // Si el nombre cambió, borramos el viejo. Si es el mismo, no hacemos nada.
            if (newName !== oldName) {
                delete models[oldName];
            }

            // 2. Sincronizar metadatos del modelo
            models[newName].instance.fileName = newName;

            // 3. Actualizar el array de pestañas (lógica de negocio siempre necesaria)
            const tabIndex = tabs.findIndex(t => t.name === oldName);
            if (tabIndex !== -1) {
                tabs[tabIndex].name = newName;
            }

            // 4. Transformación de la UI (El Relevo)
            const tabElement = document.querySelector(`[data-name="${oldName}"]`);

            if (tabElement) {
                // Actualizamos atributos siempre, por si el nombre cambió
                tabElement.setAttribute('data-name', newName);
                tabElement.querySelector('span').innerText = newName;
                tabElement.classList.remove('tab-dirty'); // Limpieza visual

                // const titleSpan = tabElement.querySelector('.tab-name');
                // if (titleSpan) titleSpan.innerText = newName;

                // ACTUALIZACIÓN DE ICONO: Esto debe pasar SIEMPRE en un save exitoso
                const iconContainer = tabElement.querySelector('.status-icon-container');
                if (iconContainer) {
                    // Reemplazamos monitor por nube
                    iconContainer.innerHTML = '<i data-lucide="cloud" class="size-3 text-blue-400 mr-2"></i>';
                    if (window.lucide) lucide.createIcons();
                }

                // Actualizamos el clic para que ahora gestione el nuevo nombre
                tabElement.onclick = () => activateTab(newName, tabElement);
            }

            // 5. Actualizar puntero global
            currentModelName = newName;

            // 6. Persistencia Real en Supabase
            // Usamos await para asegurar que se guarde antes de cerrar el modal
            await saveToSupabase(newName, true);

            // 7. Finalización de flujo
            closeSaveModal();

            // Refrescamos lista lateral y sincronizamos sombreado
            await refreshFileList();

            // Pequeño delay para que el Explorer termine de renderizar antes de sombrear
            await syncExplorer(newName);
        }
    };

    // 2. Verificar existencia en Storage
    const bucket = CloudManager.config.bucket;
    const { data: files, error } = await window.cloudClient
        .storage
        .from(bucket)
        .list('', { search: newName });

    const existingFile = files?.find(f => f.name === newName);
    const nameChanged = newName !== currentModelName;

    // 3. LÓGICA DE CONFIRMACIÓN CORREGIDA
    // Caso A: El nombre es diferente (un "Save As" o renombre)
    // Caso B: El nombre es igual pero el archivo es LOCAL (está intentando subir a un sitio ocupado)
    //if (existingFile && (newName !== currentModelName || isLocal)) {
    if (existingFile && (nameChanged || isLocal || isSaveAs)) {
        console.log('Conflicto de nombre detectado en Supabase');
        // const overwrite = confirm(`El archivo "${newName}" ya existe en la nube. ¿Deseas sobrescribirlo?`);
        // if (!overwrite) return;

        showDialog({
            title: 'File Name Conflict',
            message: `The file '${newName}' already exists in the cloud. Do you want to overwrite it?`,
            confirmText: 'Overwrite',
            type: 'danger',
            onConfirm: () => {
                executeFinalSave();
            }
        });

        return;
    }

    executeFinalSave();
}

function closeSaveModal() {
    const modal = document.getElementById('saveModal');
    modal.setAttribute('data-is-save-as', 'false');

    const input = document.getElementById('newFileName');

    // 1. Ocultamos el modal añadiendo la clase de Tailwind
    modal.classList.add('hidden');

    // 2. Limpiamos el input para que no se quede el nombre anterior 
    // la próxima vez que alguien intente guardar un "Untitled"
    if (input) {
        input.value = "";
    }

    // 3. Devolvemos el foco al editor de Monaco para que el usuario
    // pueda seguir escribiendo inmediatamente
    if (window.editor) {
        window.editor.focus();
    }
}

// OUTLINE
function renderOutlineTree(symbols) {
    const container = document.getElementById('outline');
    container.innerHTML = '';

    if (!symbols.length) {
        // container.innerHTML = '<div style="padding:10px;color:#888;">Sin contenido</div>';
        return;
    }

    symbols.forEach(sym => {
        container.appendChild(createNode(sym));
    });

    lucide.createIcons();
}

function createNode(node) {
    /* ITEM */
    let item = document.createElement("div");
    item.className = "outline-item outline-item_" + node.lineStart + " flex items-center py-1 px-2 cursor-pointer hover:bg-gray-50";

    let iconWrapper = document.createElement("div");
    iconWrapper.className = "w-6 flex items-center justify-center mr-2 flex-shrink-0";

    /* ICONO */
    let icon = getIcon(node.type);
    iconWrapper.appendChild(icon);

    // let divIcon = document.createElement("div");

    /* NOMBRE */
    let name = document.createElement("span");
    name.className = "text-xs text-gray-700 truncate";
    name.innerText = node.name;

    /* EVENTO CLICK */
    item.onclick = (e) => {
        e.stopPropagation();

        if (node.lineStart) { // 🔥 CAMBIO (antes range)
            const hadOccurrences = editor.getOption(monaco.editor.EditorOption.occurrencesHighlight);
            editor.updateOptions({ occurrencesHighlight: 'off' });

            const position = { lineNumber: node.lineStart, column: 1 };
            editor.setPosition(position);
            editor.revealPositionInCenter(position, monaco.editor.ScrollType.Smooth);

            editor.setSelection(new monaco.Selection(node.lineStart, 1, node.lineStart, 1));
            editor.focus();

            setTimeout(() => {
                editor.updateOptions({ occurrencesHighlight: hadOccurrences });
            }, 100);

            // Opcional: Resaltar visualmente el item seleccionado
            // document.querySelectorAll('.outline-item').forEach(el => el.classList.remove('active-outline'));
            // item.classList.add('active-outline');
        }
    };

    item.appendChild(iconWrapper);
    item.appendChild(name);

    return item;
}

async function updateOutline() {
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const symbols = parseL4G(model);

    currentFileSymbols = symbols;

    renderOutlineTree(symbols);
}

function parseL4G(model) {
    const text = model.getValue();
    const lines = text.split('\n');
    const symbols = [];
    let currentSymbol = null; //N

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        const lineNum = index + 1; //N

        const isComment = trimmed.startsWith('#');

        const subMatch = trimmed.match(/^Subprog\s+([A-Z0-9_]+)/i);
        const funMatch = trimmed.match(/^Funprog\s+([A-Z0-9_]+)/i);
        const routineMatch = trimmed.match(/^\$([A-Z0-9_]+)/);

        if (subMatch || funMatch || routineMatch) {
            // Si ya teníamos un símbolo abierto, su final es la línea anterior a esta
            if (currentSymbol) {
                currentSymbol.lineEnd = lineNum - 1;
            }

            const match = subMatch || funMatch || routineMatch;
            currentSymbol = {
                name: match[1],
                lineStart: lineNum,
                lineEnd: lines.length, // Por defecto hasta el final del archivo
                type: subMatch ? 'subprog' : (funMatch ? 'funprog' : 'routine')
            };
            symbols.push(currentSymbol);
        }

        const isEndOfBlock = !isComment && (trimmed.match(/^(Endsub|Endfun)$/i) || trimmed.toLowerCase() === 'end');

        if (isEndOfBlock && currentSymbol) {
            currentSymbol.lineEnd = lineNum;
            currentSymbol = null; // Liberamos para que lo que siga no pertenezca a nadie
        }
    });

    return symbols;
}

// async function saveCloudSettings() {
//     const provider = document.getElementById('cloud-provider').value;
//     const url = document.getElementById('cloud-url').value.trim();
//     const key = document.getElementById('cloud-key').value.trim();
//     const bucket = document.getElementById('cloud-bucket').value.trim();

//     // Validación básica antes de guardar
//     if (!url || !key || !bucket) {
//         showToast("Please fill all fields before saving.", "error");
//         return;
//     }

//     // Guardamos en localStorage a través del Manager
//     CloudManager.save({ provider, url, key, bucket });

//     showToast("Cloud configuration saved and applied.");

//     // Cerramos el modal de configuración
//     closeCloudModal();

//     // ¡IMPORTANTE! Refrescamos el explorador de archivos con las nuevas credenciales
//     if (typeof loadFileListFromSupabase === 'function') {
//         loadFileListFromSupabase();
//     }
// }

async function handleSaveConfig() {
    const selectedProvider = document.getElementById('cloud-provider').value; // 'supabase', 'firebase', etc.

    const newConfig = {
        provider: selectedProvider,
        url: document.getElementById('cloud-url').value.trim(),
        key: document.getElementById('cloud-key').value.trim(),
        bucket: document.getElementById('cloud-bucket').value.trim()
    };

    CloudManager.save(newConfig);

    // Al guardar, el CloudManager ya ejecutó .init() internamente
    // Ahora solo refrescamos la UI
    closeCloudModal();
    refreshFileList();
    CloudManager.resumePendingAction();
}

async function testCloudConnection() {
    const url = document.getElementById('cloud-url').value.trim();
    const key = document.getElementById('cloud-key').value.trim();
    const bucket = document.getElementById('cloud-bucket').value.trim();

    if (!url || !key || !bucket) return showToast("Fill fields to test", "warning");

    try {
        // Creamos un cliente temporal solo para la prueba
        const tempClient = supabase.createClient(url, key);
        const { data, error } = await tempClient.storage.from(bucket).list('', { limit: 1 });

        if (error) throw error;

        showToast("Connection successful! ✅", "success");
        // Aquí podrías habilitar el botón de "Save" si lo tenías deshabilitado
    } catch (err) {
        showToast(`Connection failed: ${err.message}`, "error");
    }
}

/**
 * Abre el modal de configuración de Cloud y carga los valores persistidos.
 */
function openCloudModal() {
    // 1. Referencias a los elementos del DOM
    const modal = document.getElementById('cloud-config-modal');
    const selectProvider = document.getElementById('cloud-provider');
    const inputUrl = document.getElementById('cloud-url');
    const inputKey = document.getElementById('cloud-key');
    const inputBucket = document.getElementById('cloud-bucket');

    if (!modal) {
        console.error("❌ Error: No se encontró el modal 'cloud-config-modal' en el DOM.");
        return;
    }

    // 2. Cargar valores desde el CloudManager (lo que está en localStorage)
    // Usamos el objeto CloudManager que definimos antes
    const currentConfig = CloudManager.config;

    if (currentConfig) {
        if (selectProvider) selectProvider.value = currentConfig.provider || 'supabase';
        if (inputUrl) inputUrl.value = currentConfig.url || '';
        if (inputKey) inputKey.value = currentConfig.key || '';
        if (inputBucket) inputBucket.value = currentConfig.bucket || '';
    }

    // 3. Mostrar el Modal
    // Si usas Tailwind con un layout centrado:
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // 4. UX: Poner el foco en el primer campo útil (la URL)
    if (inputUrl) {
        setTimeout(() => inputUrl.focus(), 100);
    }

    // 5. Opcional: Refrescar iconos de Lucide dentro del modal
    if (window.lucide) {
        lucide.createIcons();
    }

    console.log("☁️ Cloud Config Modal opened and synced with LocalStorage.");
}

// function openCloudModal() {
//     // Abrir el modal en la UI...

//     // Llenar con lo que ya tenemos en memoria
//     document.getElementById('cloud-url').value = CloudManager.config.url;
//     document.getElementById('cloud-key').value = CloudManager.config.key;
//     document.getElementById('cloud-bucket').value = CloudManager.config.bucket;
//     document.getElementById('cloud-provider').value = CloudManager.config.provider;
// }

/**
 * Cierra el modal de configuración de Cloud y limpia el estado.
 */
function closeCloudModal() {
    const modal = document.getElementById('cloud-config-modal'); // Ajusta al ID de tu HTML
    const form = document.getElementById('cloud-config-form'); // Opcional, si usas un <form>

    if (!modal) return;

    // 1. Efecto Visual: Ocultar el modal
    // Si usas clases de Tailwind, solemos usar 'hidden' o 'flex/hidden'
    modal.classList.add('hidden');
    modal.classList.remove('flex'); // En caso de que uses flex para centrarlo

    // 2. Limpieza de datos temporales
    // Si el usuario escribió algo pero no guardó, lo ideal es que al reabrir
    // aparezca lo que está realmente guardado en el CloudManager.
    if (form) {
        form.reset();
    }

    // 3. Resetear el estado de "Intención" (Data Attributes)
    // Como hicimos con el Save As, es buena práctica limpiar atributos de estado
    modal.removeAttribute('data-is-testing');

    // 4. Feedback visual (Opcional)
    // Si tienes un overlay oscuro de fondo, asegúrate de quitarlo también
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');

    console.log("☁️ Cloud Config Modal closed.");
}

// const SUPABASE_URL = 'https://eoovrkbjpfrlfuyymxjv.supabase.co';
// const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvb3Zya2JqcGZybGZ1eXlteGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzYxMTYsImV4cCI6MjA4OTYxMjExNn0.UMCjpnTB2aV_Mb3ofe1wwlHbbl4o6OHR0qoxG9j1Js4';
// // La declaramos a nivel global (window) para que esté disponible en todas tus funciones
// window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// async function guardarArchivo() {
//     // 2. Verificamos que el cliente exista antes de usarlo
//     if (!window.supabaseClient) {
//         alert("Error: El cliente de Supabase no se ha inicializado.");
//         return;
//     }

//     const nombreArchivo = prompt("Nombre del archivo:", "nuevo_script.src");
//     if (!nombreArchivo) return;

//     const contenido = window.editor.getValue();
//     const blob = new Blob([contenido], { type: 'text/plain' });

//     try {
//         // CAMBIO AQUÍ: Usamos window.supabaseClient.storage.from(...)
//         const { data, error } = await window.supabaseClient
//             .storage
//             .from('scripts')
//             .upload(nombreArchivo, blob, {
//                 cacheControl: '3600',
//                 upsert: true
//             });

//         if (error) throw error;
//         alert("¡Archivo guardado en Supabase!");
//     } catch (err) {
//         alert("Error al guardar: " + err.message);
//     }
// }

// async function saveToSupabase(name) {
//     const modelData = models[name];

//     if (!modelData || !modelData.isDirty) {
//         console.log("No hay cambios para guardar.");
//         return;
//     }

//     // 1. Obtener el contenido actual del editor
//     const currentContent = modelData.instance.getValue();

//     try {
//         console.log(`Guardando ${name} en Supabase...`);

//         // 2. Subir a Supabase (usamos upsert para sobrescribir)
//         const { data, error } = await window.supabaseClient
//             .storage
//             .from('scripts')
//             .upload(name, currentContent, {
//                 upsert: true, // Crucial: permite sobrescribir el archivo existente
//                 contentType: 'text/plain'
//             });

//         if (error) throw error;

//         // 3. ÉXITO: Sincronizar el estado local
//         // Ahora el contenido "original" es el que acabamos de subir
//         modelData.original = currentContent;
//         modelData.isDirty = false;

//         // 4. Actualizar visualmente el Tab (quitar círculo verde)
//         updateTabStatus(name, false);

//         showToast(`File saved successfully: ${name}`);
//     } catch (error) {
//         console.error("Error al guardar en Supabase:", error.message);
//         alert("Error al guardar: " + error.message);
//     }
// }

async function saveToSupabase(name, forceSave = false) {
    console.log(models);
    const modelData = models[name];
    if (!modelData) return;

    const content = modelData.instance.getValue();

    // VALIDACIÓN: 
    // Guardamos si: (Está sucio) O (Estamos forzando el guardado por ser nuevo)
    if (!modelData.isDirty && !forceSave) {
        console.log("Nada que guardar.");
        return;
    }

    try {
        const bucket = CloudManager.config.bucket;
        const { data, error } = await window.cloudClient
            .storage
            .from(bucket)
            .upload(name, content, {
                upsert: true,
                cacheControl: '0',
                contentType: 'text/plain'
            });

        if (error) throw error;

        // Una vez guardado con éxito:
        modelData.isLocal = false;
        modelData.original = content; // Actualizamos el punto de comparación
        modelData.isDirty = false;    // Ya no está sucio

        updateTabStatus(name, false); // Quitamos el círculo verde

        showToast(`File saved successfully: ${name}`);

        // const { data: freshData } = await window.supabaseClient
        //     .storage
        //     .from('scripts')
        //     .download(`${name}?t=${Date.now()}`);

        // const freshText = await freshData.text();
        // console.log('Contenido real en storage:', freshText);
    } catch (error) {
        console.error("Error al guardar en Supabase:", error);
    }
}

async function loadFileListFromSupabase() {
    if (!window.cloudClient) {
        // console.warn("Intento de carga sin cliente configurado.");
        // const contenedor = document.getElementById('explorer-files');
        // contenedor.innerHTML = '<div class="p-4 text-gray-400 text-xs text-center italic">Cloud connection required.</div>';
        return;
    }

    const contenedor = document.getElementById('explorer-files');
    if (!contenedor) return;

    contenedor.innerHTML = '<div style="padding: 15px; color: #999; font-size: 14px;">Refreshing...</div>';

    try {
        const bucket = CloudManager.config.bucket;
        const { data, error } = await window.cloudClient
            .storage
            .from(bucket)
            .list('', { sortBy: { column: 'name', order: 'asc' } });

        if (error) throw error;

        contenedor.innerHTML = ''; // Limpiar

        data.forEach(archivo => {
            let explorerItem = document.createElement('div');
            explorerItem.className = "explorer-item flex items-center py-1 px-2 cursor-pointer hover:bg-gray-50"
            explorerItem.setAttribute("data-filename", archivo.name);

            // const item = document.createElement('div');
            // item.className = 'file-item';

            let iconWrapper = document.createElement("div");
            iconWrapper.className = "w-6 flex items-center justify-center mr-2 flex-shrink-0";

            // /* ICONO */
            let icon = getIcon("file");
            iconWrapper.appendChild(icon);

            let name = document.createElement("span");
            name.className = "explorer-filename text-xs text-gray-700 truncate";
            name.innerText = archivo.name;

            // Usamos un icono de Lucide si lo tienes disponible, o un emoji
            // item.innerHTML = `<span>📄</span> <span>${archivo.name}</span>`;

            explorerItem.onclick = async () => {
                const fileName = archivo.name
                const existingModel = models[fileName];

                if (existingModel) {
                    // CASO CRÍTICO: El archivo abierto es LOCAL y se llama igual al de la NUBE
                    if (existingModel.isLocal) {
                        console.log('Conflicto detectado: Local vs Cloud');

                        // showConfirmationToast({
                        //     title: "File Conflict",
                        //     message: `You have an unsaved local version of "${fileName}". Do you want to discard your local changes and load the cloud version?`,
                        //     icon: "cloud-alert",
                        //     onAccept: async () => {
                        //         // El usuario aceptó: Cerramos el local y abrimos el de la nube
                        //         closeTab(fileName, document.querySelector(`[data-name="${fileName}"]`));
                        //         await openFileFromExplorer(fileName);
                        //         showToast(`Cloud version of ${fileName} loaded.`);
                        //     },
                        //     onDecline: () => {
                        //         // El usuario declinó: Simplemente avisamos o no hacemos nada
                        //         showToast("Action cancelled. Keeping local version.");
                        //     }
                        // });

                        showDialog({
                            title: 'File Conflict',
                            // message: `You have an unsaved local version of "${fileName}". Do you want to discard your local changes and load the cloud version?`,
                            message: `A local file named "${fileName}" is already open. Loading the cloud version will replace your local session. Proceed?`,
                            confirmText: 'Replace local',
                            type: 'danger',
                            onConfirm: async () => {
                                // 1. Cerramos la pestaña local
                                const tabElement = document.querySelector(`[data-name="${fileName}"]`);
                                if (tabElement) {
                                    // Forzamos isDirty a false para que closeTab no vuelva a preguntar
                                    models[fileName].isDirty = false;
                                    closeTab(fileName, tabElement);
                                }

                                // 2. Abrimos la versión fresca de la nube
                                await openFileFromExplorer(fileName);

                                if (typeof showToast === 'function') {
                                    showToast(`Cloud version of ${fileName} loaded.`);
                                }
                            }
                        });

                        return;
                    }

                    // Si ya existe y NO es local, simplemente activamos la pestaña (comportamiento actual)
                    // const existingTab = tabs.find(t => t.name === fileName);
                    const tabElement = document.querySelector(`[data-name="${fileName}"]`);
                    if (tabElement) {
                        activateTab(fileName, tabElement);
                    }
                    return;
                }

                // Si no existe en memoria, se abre normal
                await openFileFromExplorer(fileName);
                // openFileFromExplorer(archivo.name);
            };

            explorerItem.appendChild(iconWrapper);
            explorerItem.appendChild(name);
            contenedor.appendChild(explorerItem);

            if (window.lucide) lucide.createIcons();
        });

        showToast("File list updated");
    } catch (err) {
        contenedor.innerHTML = `<div style="padding: 15px; color: red; font-size: 14px;">Error: ${err.message}</div>`;
    }
}

async function openFileFromExplorer(fileName) {
    console.log(fileName);

    // // 1. ¿Ya tenemos este modelo cargado en el editor?
    // if (models[fileName]) {
    //     // Si ya existe, NO descargamos nada. 
    //     // Solo pasamos el foco al tab existente.
    //     const existingTab = tabs.find(t => t.name === fileName);
    //     if (existingTab) {
    //         console.log('Existe, solo se activa el tab');
    //         activateTab(fileName, existingTab.tab);
    //     }
    //     return; // Salimos de la función aquí
    // }

    // 2. Si no existe, entonces SÍ vamos a Supabase
    try {
        console.log(`Abriendo: ${fileName}...`);
        const bucket = CloudManager.config.bucket;
        const { data, error } = await window.cloudClient
            .storage
            .from(bucket)
            .download(fileName, {
                cacheControl: '0',
            });

        if (error) throw error;

        const content = await data.text();

        createTab(fileName, content);
        // showEditor();

        // console.log("Archivo cargado correctamente.");
    } catch (error) {
        console.error("Error al descargar:", error);
    }
}


function showToast(message) {
    const container = document.getElementById('toast-container');

    if (!container) {
        console.error("No se encontró el contenedor #toast-container");
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;

    container.appendChild(toast);

    // Lo eliminamos del DOM después de que termine la animación
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// Ejecutar al cargar la página para que la lista aparezca de inicio
// setTimeout(loadFileListFromSupabase, 2000);

// --- Lógica de Colapsar ---
const btnCollapse = document.getElementById('btnCollapseSidebar');
const sidebar = document.getElementById('main-explorer');
const explorerContent = document.getElementById('explorer-content');
const iconContainer = document.getElementById('sidebarIconContainer'); // Nuevo target

btnCollapse.onclick = function () {
    const isExpanded = sidebar.classList.contains('w-64');

    if (isExpanded) {
        // COLAPSAR
        sidebar.classList.replace('w-64', 'w-10');
        explorerContent.classList.add('hidden');
        iconContainer.classList.add('rotate-180'); // Gira el contenedor
        btnCollapse.title = "Expand";
    } else {
        // EXPANDIR
        sidebar.classList.replace('w-10', 'w-64');
        explorerContent.classList.remove('hidden');
        iconContainer.classList.remove('rotate-180'); // Regresa a su posición
        btnCollapse.title = "Collapse";
    }

    // Ajustar Monaco Editor si existe
    if (window.editor) {
        setTimeout(() => { window.editor.layout(); }, 310);
    }
};

// document.getElementById('btnCollapseSidebar').onclick = function () {
//     const explorer = document.getElementById('main-explorer');
//     explorer.classList.toggle('collapsed');

//     // Cambiar icono del botón
//     const icon = this.querySelector('svg, i');

//     if (explorer.classList.contains('collapsed')) {
//         icon.setAttribute('data-lucide', 'chevron-right');
//     } else {
//         icon.setAttribute('data-lucide', 'chevron-left');
//     }

//     lucide.createIcons();

//     setTimeout(() => {
//         if (window.editor) window.editor.layout();
//     }, 310);
// };

// --- Lógica de Refresh ---

async function refreshFileList() {
    console.log('Refreshing...')
    const btn = document.getElementById('btnRefresh');
    if (!btn) return; // Seguridad por si el botón no existe aún

    const btnIcon = btn.querySelector('svg, i');
    btnIcon.classList.add('spinning');
    // btn.style.pointerEvents = 'none';

    try {
        await loadFileListFromSupabase();
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
        showToast("Error fetching files");
    } finally {
        const activeIcon = btn.querySelector('svg, i');
        activeIcon.classList.remove('spinning');
        // btn.style.pointerEvents = 'auto';
    }
}

// document.getElementById('btnRefresh').onclick = async function () {

// };

document.getElementById('btnRefresh').onclick = async function () {
    await refreshFileList();
};

function showEditor() {
    document.getElementById('editor-space').style.display = 'none';
    document.getElementById('editor-placeholder').style.display = 'flex';
    // document.getElementById('editor-container').style.display = 'block';

    if (window.editor) {
        window.editor.layout();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Al cargar la página, ejecutamos el refresco con animación
    const contenedor = document.getElementById('explorer-files');

    // Si no está configurado, mostramos el botón de configuración
    if (!CloudManager.isReady()) {
        contenedor.innerHTML = `
            <div class="p-4 text-center">
                <p class="text-xs text-gray-400 mb-2">Cloud not configured</p>
                <button onclick="openCloudModal()" class="text-[10px] text-white px-2 py-1 rounded bg-[#01D639] hover:bg-[#01D639]/90">
                    Setup Connection
                </button>
            </div>
        `;
        return;
    }

    // Si está listo, procedemos según el proveedor guardado
    if (CloudManager.config.provider === 'supabase') {
        // loadFileListFromSupabase();
        refreshFileList();
    }
});

function openProfileModal() {
    document.getElementById('userProfileModal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('userProfileModal').style.display = 'none';
}

async function saveProfile() {
    const data = {
        username: document.getElementById('prof-username').value,
        firstName: document.getElementById('prof-firstname').value,
        lastName: document.getElementById('prof-lastname').value,
        email: document.getElementById('prof-email').value,
        apiKey: document.getElementById('prof-apikey').value
    };

    console.log("Saving user data:", data);

    // Aquí podrías guardar en localStorage o en una tabla de Supabase
    showToast("Profile updated successfully");
    closeProfileModal();
}

function showConfirmationToast({ title, message, icon = "cloud-alert", onAccept, onDecline }) {
    const container = document.getElementById('toast-container'); // Asegúrate de tener este div en tu HTML

    const toast = document.createElement('div');
    // Estilos basados en tu imagen: Fondo oscuro, bordes redondeados, sombra pronunciada
    toast.className = "toast flex flex-col gap-4 p-4 bg-[#1e2533] border-3 border-gray-700 rounded-xl shadow-xl min-w-[350px] max-w-[400px] animate-slide-in pointer-events-auto mb-4";

    toast.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex gap-3">
                <div class="flex items-center justify-center size-12 rounded-full bg-indigo-500/10">
                    <i data-lucide="${icon}" class="size-6 text-indigo-400"></i>
                </div>
                <div class="flex-1">
                    <h4 class="text-sm font-bold text-white">${title}</h4>
                    <p class="mt-1 text-xs leading-relaxed text-gray-400">${message}</p>
                </div>
            </div>
            <button class="text-gray-500 transition-colors hover:text-white btn-close">
                <i data-lucide="x" class="size-4"></i>
            </button>
        </div>
        <div class="flex justify-end gap-3">
            <button type="button" class="btn-decline px-4 py-2 bg-gray-700 text-xs font-semibold text-gray-300 transition-colors rounded-md hover:bg-gray-600">
                Decline
            </button>
            <button class="btn-accept px-4 py-2 text-xs font-semibold text-black transition-colors bg-[#01D639] rounded-md hover:bg-[#01D639]/90">
                Accept
            </button>
        </div>
    `;

    // --- MANEJO DE EVENTOS ---
    const removeToast = () => {
        toast.classList.add('animate-slide-outToast');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.btn-accept').onclick = () => {
        if (onAccept) onAccept();
        removeToast();
    };

    toast.querySelector('.btn-decline').onclick = () => {
        if (onDecline) onDecline();
        removeToast();
    };

    toast.querySelector('.btn-close').onclick = removeToast;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
}

lucide.createIcons();